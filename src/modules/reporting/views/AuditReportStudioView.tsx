import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { dataverseService } from '../../../services/dataverseService';
import type { Issue, IssueStatus, IssueComment, AuditTrailLog } from '../../../types/dataverse.types';
import { getIssuesByEngagement } from '../utils/reportingWorkflowEngine';
import { FindingNavigator } from '../components/FindingNavigator';
import { FindingWorkpaperCard } from '../components/FindingWorkpaperCard';
import { AuditReportPreviewPane } from '../components/AuditReportPreviewPane';
import { AiVersionCompareDialog } from '../components/AiVersionCompareDialog';
import { CreateIssueDialog } from '../components/CreateIssueDialog';
import { IssueLogsDialog } from '../components/IssueLogsDialog';
import { FieldCommentDialog } from '../components/FieldCommentDialog';
import { WorkflowModal } from '../components/WorkflowModal';
import { CallbackModal } from '../components/CallbackModal';
import { BackButton, SharedSelectButton } from '../../../components/shared';
import {
  FileText,
  Download,
  Send,
  GitBranch,
  History,
  CheckCircle2,
} from 'lucide-react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const AuditReportStudioView: React.FC = () => {
  const { selectedEngagementId, setActiveReportingView, activeEngagement } = useEngagement();
  const { currentUser, activeRole } = useUserSession();
  const currentRole = activeRole?.id || 'it-manager';

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>([]);

  // 3-Pane Widths & Collapse States
  // Pane 1 is fixed at 24% (collapsible to 36px) with no resizing.
  // Pane 2 defaults to 40% (resizing min: 20%, max: 60%).
  // Pane 3 defaults to 36% (consuming remaining space with min: 20%, max: 50%).
  const pane1WidthPct = 24;
  const [pane2Width, setPane2Width] = useState(40); // percentage (20% to 60%)

  const [isPane1Collapsed, setIsPane1Collapsed] = useState(false);
  const [isPane2Collapsed, setIsPane2Collapsed] = useState(false);
  const [isPane3Collapsed, setIsPane3Collapsed] = useState(false);

  const [isDraggingSplitter2, setIsDraggingSplitter2] = useState(false);
  const [hoveredSplitter, setHoveredSplitter] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dialog & Modal States
  const [isAiCompareOpen, setIsAiCompareOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [callbackIssueId, setCallbackIssueId] = useState<string | null>(null);
  const [activeCommentField, setActiveCommentField] = useState<{ key: string; label: string } | null>(null);

  // Async States
  const [isAiSynthesizing, setIsAiSynthesizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    title?: string;
  } | null>(null);

  // Splitter 2 drag event listeners (resizing between Pane 2 and Pane 3)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isDraggingSplitter2) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const mouseX = e.clientX - containerRect.left;
      const pane1Px = isPane1Collapsed ? 36 : containerWidth * (pane1WidthPct / 100);
      const availablePx = mouseX - pane1Px;
      const pane2Pct = (availablePx / containerWidth) * 100;

      // Available percentage space for Pane 2 + Pane 3
      const remainingPct = 100 - (isPane1Collapsed ? (36 / containerWidth) * 100 : pane1WidthPct);
      // Constraints:
      // Pane 2: min 20%, max 60%
      // Pane 3: min 20%, max 50% => Pane 2 cannot exceed remainingPct - 20, nor fall below remainingPct - 50
      const minPane2 = Math.max(20, remainingPct - 50);
      const maxPane2 = Math.min(60, remainingPct - 20);
      const newPct = Math.min(Math.max(pane2Pct, minPane2), maxPane2);
      setPane2Width(Math.round(newPct));
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter2(false);
    };

    if (isDraggingSplitter2) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter2, isPane1Collapsed]);

  // Load issues seamlessly from active engagement or fallback dataset
  useEffect(() => {
    const engId = selectedEngagementId || activeEngagement?.id || 'REP-2026-001';

    // 1. If activeEngagement has issuesList in memory, seed immediately
    const engAny = activeEngagement as any;
    if (engAny?.issuesList && engAny.issuesList.length > 0) {
      const sequenced = engAny.issuesList.map((item: Issue, idx: number) => ({
        ...item,
        reportRef: item.reportRef || idx + 1,
      }));
      setIssues(sequenced);
      setSelectedIssueId(sequenced[0].id);
      return;
    }

    // 2. Otherwise load from local JSON engine first for immediate rendering
    const localIssues = getIssuesByEngagement(engId);
    if (localIssues && localIssues.length > 0) {
      const sequenced = localIssues.map((item: Issue, idx: number) => ({
        ...item,
        reportRef: item.reportRef || idx + 1,
      }));
      setIssues(sequenced);
      setSelectedIssueId(sequenced[0].id);
    }

    // 3. And fetch from Dataverse Service
    dataverseService.getIssuesByEngagementId(engId).then((data) => {
      if (data && data.length > 0) {
        const sequenced = data.map((item: Issue, idx: number) => ({
          ...item,
          reportRef: item.reportRef || idx + 1,
        }));
        setIssues(sequenced);
        if (!selectedIssueId) {
          setSelectedIssueId(sequenced[0].id);
        }
      }
    });
  }, [selectedEngagementId, activeEngagement]);

  // Load comments & audit logs for active issue
  useEffect(() => {
    if (selectedIssueId) {
      dataverseService.getCommentsByIssueId(selectedIssueId).then((comms) => {
        setComments(comms);
      });
      dataverseService.getAuditTrailLogs('cr_issue', selectedIssueId).then((logs) => {
        setAuditLogs(logs);
      });
    }
  }, [selectedIssueId]);

  const selectedIssue = issues.find((i) => i.id === selectedIssueId) || issues[0] || null;

  // Check if engagement has any Critical finding
  const hasCriticalFinding = issues.some((i) => (i.criticality || (i as any).severity) === 'Critical');


  // Role-based Issue Editability Check
  const checkIssueEditability = useCallback(
    (item: Issue | null) => {
      if (!item) return { canEdit: true, reason: null };
      const roleStr = (currentRole || '').toLowerCase();

      // VPs and Heads have cross-domain executive sign-off authority
      if (roleStr.includes('vp') || roleStr.includes('head')) {
        return { canEdit: true, reason: null };
      }

      const fn = (item.function || (item as any).functionType || '').toUpperCase();
      let isIT = false;
      if (fn.includes('FINOPS') || fn.includes('FIN')) {
        isIT = false;
      } else if (fn.includes('IT')) {
        isIT = true;
      } else {
        const testProc = (item.testProcedureCode || (item as any).testProcedure || '').toUpperCase();
        const acct = (item.accountableFunction || '').toUpperCase();
        if (acct.includes('FINOPS') || acct.includes('FINANCE')) {
          isIT = false;
        } else if (acct.includes('IT')) {
          isIT = true;
        } else {
          isIT = testProc.includes('TP-101') || testProc.includes('TP-102') || testProc.includes('TP-110');
        }
      }

      const isITRole = roleStr.includes('it');
      const isFinOpsRole = roleStr.includes('finops') || roleStr.includes('fin');

      if (isITRole && !isIT) {
        return {
          canEdit: false,
          reason: `As an IT reviewer, you can only modify IT findings. This finding belongs to FinOps.`,
        };
      }

      if (isFinOpsRole && isIT) {
        return {
          canEdit: false,
          reason: `As a FinOps reviewer, you can only modify FinOps findings. This finding belongs to IT.`,
        };
      }

      return { canEdit: true, reason: null };
    },
    [currentRole]
  );

  const { canEdit, reason: editRestrictionReason } = checkIssueEditability(selectedIssue);

  // Synchronize issues and sequential numbering
  const updateIssuesAndSync = (newIssues: Issue[]) => {
    const sequenced = newIssues.map((item, idx) => ({
      ...item,
      reportRef: idx + 1,
    }));
    setIssues(sequenced);
  };

  const handleUpdateIssue = (updated: Issue) => {
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  // Reorder Handler with priority change detection
  const handleReorderIssues = (
    newIssues: Issue[],
    isCrossPriority?: boolean,
    fromCrit?: string,
    toCrit?: string
  ) => {
    updateIssuesAndSync(newIssues);

    if (isCrossPriority && fromCrit && toCrit) {
      setToastMessage({
        title: 'Priority Alignment Notice',
        message: `You are moving an issue across priority levels (${fromCrit} ➔ ${toCrit}). Report reference numbers have been realigned.`,
        severity: 'warning',
      });
    }
  };

  // Exclude Issue Handler
  const handleMarkExcludeIssue = (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const updatedTarget: Issue = {
      ...target,
      isExcluded: true,
      previousStatus: target.status !== 'Excluded' ? target.status : target.previousStatus || 'In progress TC',
      status: 'Excluded',
      excludedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Soft delete: move excluded issue to the end of the list
    const remaining = issues.filter((i) => i.id !== issueId);
    const newIssues = [...remaining, updatedTarget];
    setSelectedIssueId(issueId);
    updateIssuesAndSync(newIssues);

    setToastMessage({
      message: `Finding #${issueId} excluded from final audit report.`,
      severity: 'info',
    });
  };

  // Include Issue Handler
  const handleIncludeIssue = (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const restoredTarget: Issue = {
      ...target,
      isExcluded: false,
      status: (target.previousStatus as IssueStatus) || 'Pending TC',
      excludedAt: null,
    };

    // Re-insert into active issues before any other excluded issues
    const active = issues.filter((i) => i.id !== issueId && !i.isExcluded);
    const excluded = issues.filter((i) => i.id !== issueId && i.isExcluded);
    const newIssues = [...active, restoredTarget, ...excluded];
    setSelectedIssueId(issueId);
    updateIssuesAndSync(newIssues);

    setToastMessage({
      message: `Finding #${issueId} restored and included in report.`,
      severity: 'success',
    });
  };

  // Lock / Unlock Toggle Handler
  const handleToggleLock = (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const newLockState = !target.isLocked;
    const updatedTarget: Issue = {
      ...target,
      isLocked: newLockState,
      lockedBy: newLockState
        ? {
          userId: currentUser?.userId || 'USR-001',
          name: currentUser?.name || 'Current Auditor',
          role: currentRole,
          avatar: currentUser?.name?.slice(0, 2).toUpperCase() || 'CA',
          avatarBg: '#000099',
          timestamp: 'just now',
          activity: 'Reviewing finding workpaper',
        }
        : null,
      lockedAt: newLockState ? new Date().toISOString() : null,
    };

    handleUpdateIssue(updatedTarget);
    setToastMessage({
      message: newLockState
        ? `Issue #${issueId} is now locked for editing.`
        : `Issue #${issueId} has been unlocked.`,
      severity: 'info',
    });
  };

  // Mark Not My Function Issue Handler
  const handleMarkNotAnIssue = (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;

    const updatedTarget: Issue = {
      ...target,
      status: 'Not My Function Issue',
    };
    handleUpdateIssue(updatedTarget);

    setToastMessage({
      message: `Issue #${issueId} flagged as 'Not My Function Issue'.`,
      severity: 'warning',
    });
  };

  // Call Back Handlers
  const handleOpenCallback = (issueId: string) => {
    setCallbackIssueId(issueId);
    setIsCallbackModalOpen(true);
  };

  const handleConfirmCallback = (issueId: string, reason: string) => {
    const updated = issues.map((item) => {
      if (item.id === issueId) {
        return {
          ...item,
          status: 'Called Back' as IssueStatus,
          callbackReason: reason,
          callbackTimestamp: new Date().toISOString(),
        };
      }
      return item;
    });

    setIssues(updated);
    setToastMessage({
      message: `Issue #${issueId} called back to prior stage: "${reason}"`,
      severity: 'info',
    });
  };


  const handleAdvanceWorkflow = async (targetStatus: IssueStatus) => {
    if (!selectedIssue) return;
    try {
      const updated = await dataverseService.updateIssueStatus(
        selectedIssue.id,
        targetStatus,
        `Advanced by ${currentUser?.name || 'Current User'} (${currentRole})`
      );
      handleUpdateIssue(updated);
      setToastMessage({ message: `Workflow status advanced to ${targetStatus}`, severity: 'success' });
    } catch {
      const updatedLocal = { ...selectedIssue, status: targetStatus };
      handleUpdateIssue(updatedLocal);
      setToastMessage({ message: `Workflow status advanced to ${targetStatus}`, severity: 'success' });
    }
  };

  const handleTriggerAiSynthesis = () => {
    if (!selectedIssue) return;
    setIsAiSynthesizing(true);
    setTimeout(() => {
      setIsAiSynthesizing(false);
      setIsAiCompareOpen(true);
    }, 1200);
  };

  const handleApplyAiMerge = (mergedFields: Partial<Issue>) => {
    if (!selectedIssue) return;
    const updated = {
      ...selectedIssue,
      ...mergedFields,
      activeAiVersionNumber: (selectedIssue.activeAiVersionNumber || 1) + 1,
    };
    handleUpdateIssue(updated);
    setToastMessage({ message: `Adopted AI synthesis (v${updated.activeAiVersionNumber})`, severity: 'success' });
  };

  const handleCreateNewIssue = async (newIssueData: Partial<Issue>) => {
    const newId = `ISSUE-${Date.now().toString().slice(-4)}`;
    const created: any = {
      id: newId,
      engagementId: selectedEngagementId || 'REP-2026-001',
      title: newIssueData.title || 'New Audit Finding',
      testProcedureCode: newIssueData.testProcedureCode || 'TP-101',
      criticality: newIssueData.criticality || 'Major',
      status: 'Pending Staff',
      issueNarrative:
        (newIssueData as any).issueNarrative || 'Initial observations documented during field testing.',
      rootCause: (newIssueData as any).rootCause || 'Under investigation.',
      impact: (newIssueData as any).impact || 'Under assessment.',
      recommendation: (newIssueData as any).recommendation || 'Standardize monitoring controls.',
      accountableContact: (newIssueData as any).accountableContact || 'Business Owner',
      agreedRemediationDate:
        (newIssueData as any).agreedRemediationDate ||
        new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      activeAiVersionNumber: 1,
      reportRef: issues.length + 1,
      ...newIssueData,
    };

    const newIssues = [...issues, created];
    updateIssuesAndSync(newIssues);
    setSelectedIssueId(created.id);
    setToastMessage({ message: `Finding #${created.id} created successfully`, severity: 'success' });
  };

  const handleAddComment = async (content: string, taggedUserId?: string, taggedUserName?: string) => {
    if (!selectedIssue || !activeCommentField) return;

    const newComment = await dataverseService.addComment({
      issueId: selectedIssue.id,
      fieldKey: activeCommentField.key,
      content,
      authorId: currentUser?.userId || 'USR-001',
      authorName: currentUser?.name || 'Current Auditor',
      taggedUserId,
      taggedUserName,
    });

    setComments((prev) => [...prev, newComment]);
    setToastMessage({ message: 'Comment posted', severity: 'info' });
  };

  const handleResolveComment = async (commentId: string) => {
    const resolved = await dataverseService.resolveComment(commentId, currentUser?.userId || 'USR-001');
    setComments((prev) => prev.map((c) => (c.commentId === commentId ? resolved : c)));
    setToastMessage({ message: 'Comment thread resolved', severity: 'info' });
  };

  // Submit Report Handler
  const handleSubmitReport = () => {
    const roleString = (currentRole || '').toLowerCase();
    const isVP = roleString.includes('vp');
    const isDirector = roleString.includes('director');

    setToastMessage({
      message: isVP
        ? 'Audit Report officially signed off and archived to permanent regulatory repository.'
        : isDirector
          ? 'Audit Report submitted to Vice President for final sign-off.'
          : 'Audit Report submitted to leadership for review.',
      severity: 'success',
    });
  };

  // Calculate field comment counts for the selected issue
  const commentCounts = comments.reduce<Record<string, number>>((acc, c) => {
    if (!c.isResolved) {
      acc[c.fieldKey] = (acc[c.fieldKey] || 0) + 1;
    }
    return acc;
  }, {});

  const roleStr = (currentRole || '').toLowerCase();
  const submitButtonLabel = roleStr.includes('vp')
    ? 'Sign Off Report'
    : roleStr.includes('director')
      ? 'Submit to VP'
      : roleStr.includes('manager')
        ? 'Submit to Director'
        : roleStr.includes('tc')
          ? 'Submit to Manager'
          : 'Submit to TC';

  const callbackTargetIssue = issues.find((i) => i.id === callbackIssueId) || null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 77px)',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Studio Header Toolbar */}
      <header
        style={{
          minHeight: '58px',
          padding: '12px 20px',
          borderBottom: 'none',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          zIndex: 15,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          boxSizing: 'border-box',
        }}
      >
        {/* Left Section: Back Button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <BackButton
            onClick={() => setActiveReportingView('queue')}
            title="Back to Reporting Queue"
            ariaLabel="Back to Reporting Queue"
          />

          <h1
            style={{
              fontSize: '15px',
              fontWeight: 500,
              color: '#334155',
              lineHeight: '1.3',
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              margin: 0,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Audit Report —{' '}
            {(activeEngagement as any)?.fileName ||
              (activeEngagement as any)?.engagement ||
              selectedEngagementId ||
              'Audit Report'}
          </h1>

        </div>

        {/* Right Section: Action Buttons clubbed into Report Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedSelectButton
            label="Report Actions"
            size="small"
            menuWidth={230}
            title="Audit Report Actions"
            items={[
              {
                key: 'submit-report',
                label: submitButtonLabel,
                icon: roleStr.includes('vp') ? (
                  <CheckCircle2 style={{ width: '14px', height: '14px', color: '#000099' }} />
                ) : (
                  <Send style={{ width: '14px', height: '14px', color: '#000099' }} />
                ),
                onClick: handleSubmitReport,
                dividerAfter: true,
              },
              {
                key: 'download-report',
                label: 'Download Report',
                icon: <Download style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => window.print(),
              },
              {
                key: 'executive-report',
                label: 'Executive Report',
                icon: <FileText style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => setActiveReportingView('executive-studio'),
              },
              {
                key: 'workflow-stages',
                label: 'Workflow',
                icon: <GitBranch style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => setIsWorkflowModalOpen(true),
              },
              {
                key: 'audit-trail-logs',
                label: 'Audit Trail',
                icon: <History style={{ width: '14px', height: '14px', color: '#eb1700' }} />,
                onClick: () => setIsLogsOpen(true),
              },
            ]}
          />
        </div>
      </header>

      {/* Main Studio Body: 3-Pane Layout */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDraggingSplitter2 ? 'none' : 'auto',
          backgroundColor: '#F4F6F8',
        }}
      >
        {/* ============================================================== */}
        {/* PANE 1: Master Issue Cards List (Fixed 24%, Collapsible to 36px) */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane2Collapsed && isPane3Collapsed ? 1 : 0,
            flexShrink: 0,
            flexBasis: isPane1Collapsed
              ? '36px'
              : isPane2Collapsed && isPane3Collapsed
                ? 'auto'
                : `${pane1WidthPct}%`,
            width: isPane1Collapsed
              ? '36px'
              : isPane2Collapsed && isPane3Collapsed
                ? 'auto'
                : `${pane1WidthPct}%`,
            minWidth: isPane1Collapsed ? '36px' : '180px',
            maxWidth: isPane2Collapsed && isPane3Collapsed ? 'none' : `${pane1WidthPct}%`,
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#F4F6F8',
            boxShadow: '3px 0 10px rgba(0, 0, 0, 0.10)',
            zIndex: 10,
            position: 'relative',
          }}
        >
          <FindingNavigator
            issues={issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            onReorderIssues={handleReorderIssues}
            onOpenCreateDialog={() => setIsCreateOpen(true)}
            onIncludeIssue={handleIncludeIssue}
            userRole={currentRole}
            isCollapsed={isPane1Collapsed}
            onToggleCollapse={setIsPane1Collapsed}
          />
        </div>

        {/* ============================================================== */}
        {/* PANE 2: Form Editor / Finding Workpaper Card                   */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane3Collapsed ? 1 : 0,
            flexShrink: isPane3Collapsed ? 1 : 0,
            flexBasis: isPane2Collapsed
              ? '36px'
              : isPane3Collapsed
                ? 'auto'
                : `${pane2Width}%`,
            width: isPane2Collapsed
              ? '36px'
              : isPane3Collapsed
                ? 'auto'
                : `${pane2Width}%`,
            minWidth: isPane2Collapsed ? '36px' : '220px',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
            zIndex: 5,
            position: 'relative',
          }}
        >
          {selectedIssue ? (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <FindingWorkpaperCard
                issue={selectedIssue}
                onUpdateIssue={handleUpdateIssue}
                onOpenAiCompare={() => setIsAiCompareOpen(true)}
                onOpenLogs={() => setIsLogsOpen(true)}
                onOpenComments={(key, label) => setActiveCommentField({ key, label })}
                commentCounts={commentCounts}
                isAiSynthesizing={isAiSynthesizing}
                onTriggerAiSynthesis={handleTriggerAiSynthesis}
                canEdit={canEdit}
                editRestrictionReason={editRestrictionReason}
                onExcludeIssue={handleMarkExcludeIssue}
                onIncludeIssue={handleIncludeIssue}
                onToggleLock={handleToggleLock}
                onOpenCallback={handleOpenCallback}
                onMarkNotAnIssue={handleMarkNotAnIssue}
                isCollapsed={isPane2Collapsed}
                onToggleCollapse={setIsPane2Collapsed}
                currentUser={currentUser || undefined}
                onAdvanceWorkflow={handleAdvanceWorkflow}
                userRole={currentRole}
                hasCriticalFinding={hasCriticalFinding}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              No findings available in this engagement. Click &ldquo;Add Finding&rdquo; to create one.
            </div>
          )}
        </div>

        {/* SPLITTER 2 (between Pane 2 and Pane 3) */}
        {!isPane2Collapsed && !isPane3Collapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplitter2(true);
            }}
            onMouseEnter={() => setHoveredSplitter(2)}
            onMouseLeave={() => setHoveredSplitter(null)}
            title="Click and drag to adjust width"
            style={{
              width: '6px',
              marginLeft: '-3px',
              marginRight: '-3px',
              backgroundColor: 'transparent',
              position: 'relative',
              cursor: 'col-resize',
              zIndex: 20,
              flexShrink: 0,
              height: '100%',
            }}
          >
            {/* Interactive Adjust-Width Separator (visible on hover or drag) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '2px',
                width: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  isDraggingSplitter2 || hoveredSplitter === 2 ? '#000099' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '2px',
                  height: '24px',
                  borderRadius: '1px',
                  backgroundColor: '#ffffff',
                  opacity: isDraggingSplitter2 || hoveredSplitter === 2 ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PANE 3: Live HTML PDF-Style Report Preview                      */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane3Collapsed ? 0 : 1,
            flexShrink: isPane3Collapsed ? 0 : 1,
            flexBasis: isPane3Collapsed ? '36px' : 'auto',
            width: isPane3Collapsed ? '36px' : 'auto',
            minWidth: isPane3Collapsed ? '36px' : '280px',
            maxWidth: isPane3Collapsed ? '36px' : 'none',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#E8EDF2',
          }}
        >
          <AuditReportPreviewPane
            issues={issues}
            selectedIssue={selectedIssue}
            isCollapsed={isPane3Collapsed}
            onToggleCollapse={setIsPane3Collapsed}
            onIncludeIssue={handleIncludeIssue}
            engagementFileName={
              (activeEngagement as any)?.fileName ||
              (activeEngagement as any)?.engagement ||
              'MedTech Suzhou - Orthopedics Plant_AuditReport'
            }
            auditableEntityName={
              (activeEngagement as any)?.auditableEntity ||
              (activeEngagement as any)?.plantLocation ||
              'MRC-004341-GFS SSC Philippines'
            }
          />
        </div>
      </div>

      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        job={activeEngagement}
        title="Audit Report Workflow Pipeline"
        type="audit"
      />

      {/* AI Version Comparison & Merge Dialog */}
      {selectedIssue && (
        <AiVersionCompareDialog
          open={isAiCompareOpen}
          onClose={() => setIsAiCompareOpen(false)}
          currentIssue={selectedIssue}
          onApplyMerge={handleApplyAiMerge}
        />
      )}

      {/* Add New Finding Dialog */}
      <CreateIssueDialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        engagementId={selectedEngagementId || 'REP-2026-001'}
        engagementName={
          (activeEngagement as any)?.engagementName ||
          (activeEngagement as any)?.title ||
          (activeEngagement as any)?.engagement ||
          (activeEngagement as any)?.fileName
        }
        job={activeEngagement}
        onSave={handleCreateNewIssue}
      />

      {/* Event History & Audit Trail Log Dialog */}
      {selectedIssue && (
        <IssueLogsDialog
          open={isLogsOpen}
          onClose={() => setIsLogsOpen(false)}
          issueId={selectedIssue.id}
          issueTitle={selectedIssue.title}
          logs={auditLogs}
        />
      )}

      {/* Call Back Modal */}
      <CallbackModal
        isOpen={isCallbackModalOpen}
        onClose={() => setIsCallbackModalOpen(false)}
        issue={callbackTargetIssue}
        onConfirmCallback={handleConfirmCallback}
      />

      {/* Field-level Comments Dialog */}
      {selectedIssue && activeCommentField && (
        <FieldCommentDialog
          open={!!activeCommentField}
          onClose={() => setActiveCommentField(null)}
          fieldKey={activeCommentField.key}
          fieldLabel={activeCommentField.label}
          comments={comments}
          currentUserId={currentUser?.userId || 'USR-001'}
          currentUserName={currentUser?.name || 'Current Auditor'}
          onAddComment={handleAddComment}
          onResolveComment={handleResolveComment}
        />
      )}

      {/* Toast Feedback Notification */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toastMessage ? (
          <Alert
            severity={toastMessage.severity}
            onClose={() => setToastMessage(null)}
            sx={{ width: '100%', fontWeight: 600 }}
          >
            {toastMessage.title && <strong>{toastMessage.title}: </strong>}
            {toastMessage.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </div>
  );
};
