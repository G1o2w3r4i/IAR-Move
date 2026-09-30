import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft,
  Plus,
  Minus,
  Download,
  Send,
  GitBranch,
  History,
  Sparkles,
  CheckCircle2,
  FileText,
  ZoomIn,
  ZoomOut,
  Printer,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
} from 'lucide-react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { generateExecutiveSummaryData, type ExecutiveSummaryData } from '../utils/execReportData';
import { BackButton } from '../../../components/shared';
import { WorkflowModal } from '../components/WorkflowModal';
import { IssueLogsDialog } from '../components/IssueLogsDialog';
import { FieldCommentPopover, type CommentUser } from '../components/FieldCommentPopover';
import { RichTextEditor } from '../../../components/ui/RichTextEditor';
import type { IssueComment, AuditTrailLog } from '../../../types/dataverse.types';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

export const ExecutiveStudioView: React.FC = () => {
  const { selectedEngagementId, setActiveReportingView, activeEngagement } = useEngagement();
  const { activeRole, currentUser } = useUserSession();
  const userRole = activeRole?.id || 'it-manager';

  const [execData, setExecData] = useState<ExecutiveSummaryData>(() =>
    generateExecutiveSummaryData(activeEngagement || { id: selectedEngagementId || 'REP-2026-881' })
  );

  useEffect(() => {
    if (activeEngagement) {
      setExecData(generateExecutiveSummaryData(activeEngagement));
    }
  }, [activeEngagement?.id]);

  // Section Accordion State
  const [expandedSection, setExpandedSection] = useState<'scope' | 'insights' | 'issues' | null>('scope');

  // Resizable Splitter State
  const [leftWidth, setLeftWidth] = useState<number>(45); // percentage (25% to 70%)
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const [isHoveredSplitter, setIsHoveredSplitter] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Preview State
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Dialog States
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Field Level & Row Level Comments State
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<'up' | 'down'>('down');
  const [comments, setComments] = useState<IssueComment[]>([
    {
      commentId: 'COMM-EXEC-01',
      issueId: 'EXEC-2026-881',
      fieldKey: 'scope_assessmentPeriod',
      content: 'Please verify if the Suzhou plant review period includes Q2 financial close.',
      authorId: 'USR-002',
      authorName: 'Sarah Jenkins',
      isResolved: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      taggedUserName: currentUser?.name || 'Current Auditor',
      taggedUserId: currentUser?.userId || 'USR-001',
    },
    {
      commentId: 'COMM-EXEC-02',
      issueId: 'EXEC-2026-881',
      fieldKey: 'processMatrix_row_0',
      content: 'Confirmed Costar lease discrepancies with regional finance controller.',
      authorId: 'USR-003',
      authorName: 'Brian Cox',
      isResolved: true,
      resolvedByName: currentUser?.name || 'Current Auditor',
      resolvedById: currentUser?.userId || 'USR-001',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>([]);

  // Push to Teammate Hover Tooltip
  const [showPushTooltip, setShowPushTooltip] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    title?: string;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Available users for tagging in comments
  const availableUsers: CommentUser[] = useMemo(
    () => [
      { userId: 'USR-001', name: currentUser?.name || 'Current Auditor', role: activeRole?.label || 'Auditor', avatar: 'CA', avatarBg: '#000099' },
      { userId: 'USR-002', name: 'Sarah Jenkins', role: 'IT Audit Manager', avatar: 'SJ', avatarBg: '#eb1700' },
      { userId: 'USR-003', name: 'Brian Cox', role: 'IT Audit Director', avatar: 'BC', avatarBg: '#059669' },
      { userId: 'USR-004', name: 'Elena Rostova', role: 'VP Global Audit', avatar: 'ER', avatarBg: '#0D9488' },
      { userId: 'USR-005', name: 'Chen Wei', role: 'Suzhou Plant Controller', avatar: 'CW', avatarBg: '#D97706' },
    ],
    [currentUser, activeRole]
  );

  const currentCommentUser: CommentUser = useMemo(
    () => ({
      userId: currentUser?.userId || 'USR-001',
      name: currentUser?.name || 'Current Auditor',
      role: activeRole?.label || 'Internal Audit',
      avatar: (currentUser?.name || 'CA').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      avatarBg: '#000099',
    }),
    [currentUser, activeRole]
  );

  // Role Detection: Director & VP
  const roleLower = (userRole || '').toLowerCase();
  const isDirector = roleLower.includes('director');
  const isVP = roleLower.includes('vp');
  const isDirectorOrVP = isDirector || isVP;

  // Check if report has even one critical issue
  const hasCriticalIssues = useMemo(() => {
    const engAny = activeEngagement as any;
    if (engAny?.issuesList && engAny.issuesList.length > 0) {
      return engAny.issuesList.some(
        (iss: any) => (iss.criticality || iss.severity || '').toLowerCase() === 'critical'
      );
    }
    if (execData?.scopeSummary?.processMatrix) {
      return execData.scopeSummary.processMatrix.some((r) => (r.critical || 0) > 0);
    }
    return false;
  }, [activeEngagement, execData]);

  const isPushDisabled = isDirector && !isVP && hasCriticalIssues;
  const pushTooltipText = 'Report contains critical issues, VP signoff is mandatory';

  // Submission Role Config
  const roleConfig = useMemo(() => {
    const r = roleLower;
    if (r.includes('auditor') || r.includes('coordinator') || r.includes('business')) {
      return { hasReportSubmission: false, reportSubmitLabel: '' };
    }
    if (r.includes('vp')) {
      return { hasReportSubmission: true, reportSubmitLabel: 'Sign-Off' };
    }
    if (r.includes('director')) {
      return { hasReportSubmission: true, reportSubmitLabel: 'Submit to VP' };
    }
    return { hasReportSubmission: true, reportSubmitLabel: 'Submit to Director' };
  }, [roleLower]);

  // Derive Current Pending Stage for Header Pill
  const pendingStage = useMemo(() => {
    const engAny = activeEngagement as any;
    const queue = (engAny?.currentQueue || engAny?.queue || '').toLowerCase();
    const status = (engAny?.status || '').toLowerCase();

    if (queue.includes('tc') || status.includes('tc')) {
      return { label: 'Pending with TC', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A', dot: '#D97706' };
    }
    if (queue.includes('director') || status.includes('director')) {
      return { label: 'Pending with Director', bg: '#F5F3FF', color: '#6D28D9', border: '#DDD6FE', dot: '#7C3AED' };
    }
    if (queue.includes('vp') || status.includes('vp')) {
      return { label: 'Pending with VP', bg: '#FFF1F2', color: '#BE123C', border: '#FECDD3', dot: '#eb1700' };
    }
    return { label: 'Pending with Manager', bg: '#EFF6FF', color: '#000099', border: '#BFDBFE', dot: '#000099' };
  }, [activeEngagement]);

  // Splitter mouse move & mouse up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const newPct = Math.min(Math.max((mouseX / containerRect.width) * 100, 25), 70);
      setLeftWidth(Math.round(newPct));
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  // Close active comment popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-field-comment-container]')) {
        setActiveCommentField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Field change log recorder
  const recordFieldChange = (fieldName: string, oldVal: any, newVal: any) => {
    const newLog: AuditTrailLog = {
      logId: `EXEC-LIVE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityName: 'cr_executive_report',
      recordId: execData.id,
      action: 'FIELD_EDIT',
      previousState: String(oldVal ?? '-'),
      newState: String(newVal ?? '-'),
      performedByUserId: currentUser?.userId || 'USR-001',
      performedByUserName: currentUser?.name || 'Current Auditor',
      userRole: activeRole?.label || 'Internal Auditor',
      timestamp: new Date().toISOString(),
      remarks: `Modified ${fieldName}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Field change handlers
  const handleScopeChange = (field: string, val: string) => {
    const oldVal = (execData.scopeSummary as any)[field];
    if (oldVal !== val) {
      recordFieldChange(`Scope Summary — ${field}`, oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      scopeSummary: {
        ...prev.scopeSummary,
        [field]: val,
      },
    }));
  };

  // Process Matrix Row Update with automatic total and grand total recalculation
  const handleProcessMatrixChange = (index: number, field: string, val: any) => {
    setExecData((prev) => {
      const newMatrix = [...prev.scopeSummary.processMatrix];
      const targetRow = { ...newMatrix[index] };

      if (['critical', 'major', 'minor'].includes(field)) {
        const numVal = Math.max(0, parseInt(val, 10) || 0);
        (targetRow as any)[field] = numVal;
        targetRow.total = (targetRow.critical || 0) + (targetRow.major || 0) + (targetRow.minor || 0);
      } else {
        (targetRow as any)[field] = val;
      }
      newMatrix[index] = targetRow;

      const oldVal = (prev.scopeSummary.processMatrix[index] as any)?.[field];
      if (oldVal !== val) {
        recordFieldChange(`Process Matrix — ${targetRow.processTitle || 'Process'} (${field})`, oldVal, val);
      }

      // Recalculate Grand Total row (last row) if editing regular rows
      if (index < newMatrix.length - 1) {
        const grandTotalRow = { ...newMatrix[newMatrix.length - 1] };
        let grandCrit = 0;
        let grandMaj = 0;
        let grandMin = 0;
        let grandAll = 0;
        for (let i = 0; i < newMatrix.length - 1; i++) {
          grandCrit += newMatrix[i].critical || 0;
          grandMaj += newMatrix[i].major || 0;
          grandMin += newMatrix[i].minor || 0;
          grandAll += newMatrix[i].total || 0;
        }
        grandTotalRow.critical = grandCrit;
        grandTotalRow.major = grandMaj;
        grandTotalRow.minor = grandMin;
        grandTotalRow.total = grandAll;
        newMatrix[newMatrix.length - 1] = grandTotalRow;
      }

      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  const handleAddProcessRow = () => {
    setExecData((prev) => {
      const newMatrix = [...prev.scopeSummary.processMatrix];
      const grandTotalRow = newMatrix.pop() || {
        processTitle: 'Grand Total',
        critical: 0,
        major: 0,
        minor: 0,
        total: 0,
      };
      newMatrix.push({
        processTitle: 'New Operational Process',
        critical: 0,
        major: 0,
        minor: 0,
        total: 0,
      });
      newMatrix.push(grandTotalRow);
      recordFieldChange('Process Matrix', 'Added Row', 'New Operational Process');
      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  const handleRemoveProcessRow = (idx: number) => {
    setExecData((prev) => {
      if (prev.scopeSummary.processMatrix.length <= 2) return prev;
      const removedRow = prev.scopeSummary.processMatrix[idx];
      const newMatrix = prev.scopeSummary.processMatrix.filter((_, i) => i !== idx);

      // Recalculate Grand Total row
      const grandTotalRow = { ...newMatrix[newMatrix.length - 1] };
      let grandCrit = 0;
      let grandMaj = 0;
      let grandMin = 0;
      let grandAll = 0;
      for (let i = 0; i < newMatrix.length - 1; i++) {
        grandCrit += newMatrix[i].critical || 0;
        grandMaj += newMatrix[i].major || 0;
        grandMin += newMatrix[i].minor || 0;
        grandAll += newMatrix[i].total || 0;
      }
      grandTotalRow.critical = grandCrit;
      grandTotalRow.major = grandMaj;
      grandTotalRow.minor = grandMin;
      grandTotalRow.total = grandAll;
      newMatrix[newMatrix.length - 1] = grandTotalRow;

      recordFieldChange('Process Matrix', `Removed ${removedRow?.processTitle || 'Row'}`, 'Row Deleted');

      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  // Section 2 Handlers
  const handleInsightsOverallChange = (val: string) => {
    const oldVal = execData.auditInsights.overallText;
    if (oldVal !== val) {
      recordFieldChange('Audit Insights Summary', oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      auditInsights: {
        ...prev.auditInsights,
        overallText: val,
      },
    }));
  };

  const handleInsightsNarrativeChange = (html: string) => {
    const oldVal = execData.auditInsights.narrativeHtml;
    if (oldVal !== html) {
      recordFieldChange('Audit Insights Narrative', oldVal, html);
    }
    setExecData((prev) => ({
      ...prev,
      auditInsights: {
        ...prev.auditInsights,
        narrativeHtml: html,
      },
    }));
  };

  // Section 3 Handlers
  const handleIssueChange = (issueType: 'criticalIssue' | 'majorIssue', field: 'title' | 'description', val: string) => {
    const oldVal = (execData.criticalMajorSection[issueType] as any)?.[field];
    if (oldVal !== val) {
      recordFieldChange(`${issueType === 'criticalIssue' ? 'Critical Issue' : 'Major Issue'} — ${field}`, oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      criticalMajorSection: {
        ...prev.criticalMajorSection,
        [issueType]: {
          ...prev.criticalMajorSection[issueType],
          [field]: val,
        },
      },
    }));
  };

  // Generate Executive Summary AI Synthesis
  const handleGenerateExecSummary = () => {
    setToastMessage({
      title: 'AI Synthesis In Progress',
      message: 'Synthesizing executive summary insights from completed audit workpapers...',
      severity: 'info',
    });

    setTimeout(() => {
      setExecData((prev) => ({
        ...prev,
        auditInsights: {
          ...prev.auditInsights,
          overallText: `for the processes reviewed, ${
            hasCriticalIssues ? '1 critical, 1 major and 6 minor' : '0 critical, 2 major and 4 minor'
          } findings were identified, 0 of which were repeated`,
          narrativeHtml: `<p>The audit findings highlight significant deficiencies in the accuracy and management of lease-related data and user access reviews within the organization's systems. Inaccurate documentation of lease modification and renewal dates has led to financial misstatements, including an understatement of lease liabilities by USD 1.28M, which could impact financial reporting integrity and compliance.</p><p>Furthermore, the incomplete user access review process, which excludes dormant users with active access, poses a risk to system security and access control. This gap in oversight increases the likelihood of unauthorized access and compromises the organization's ability to maintain robust access governance.</p><p>These issues collectively underscore broader risks to operational efficiency, financial accuracy, and security governance, which may adversely affect the organization's ability to achieve strategic objectives and maintain stakeholder trust.</p>`,
        },
      }));
      setToastMessage({
        title: 'Executive Summary Generated',
        message: 'Intelligent executive summary synthesis applied successfully to all sections.',
        severity: 'success',
      });
    }, 1000);
  };

  // Submit Handler
  const handleSubmit = () => {
    const isVPUser = roleLower.includes('vp');
    const isDirectorUser = roleLower.includes('director');

    setToastMessage({
      title: isVPUser ? 'Executive Sign-Off Executed' : 'Executive Report Submitted',
      message: isVPUser
        ? 'Executive Summary officially signed off and archived to permanent regulatory repository.'
        : isDirectorUser
        ? 'Executive Summary submitted to Vice President for final sign-off.'
        : 'Executive Summary submitted to Director for review.',
      severity: 'success',
    });
  };

  // Helper to format matrix values: if 0, return '-'
  const formatMatrixVal = (val: number | string | undefined | null) => {
    if (val === 0 || val === '0' || val === null || val === undefined || val === '') return '-';
    return val;
  };

  // Field Level & Row Level Comments Trigger Renderer
  const renderFieldCommentTrigger = (fieldKey: string, fieldLabel: string, isRowLevel = false) => {
    const commentsList = comments.filter((c) => c.fieldKey === fieldKey);
    const isOpen = activeCommentField === fieldKey;
    const unresolvedCount = commentsList.filter((c) => !c.isResolved).length;
    const isAllResolved = commentsList.length > 0 && unresolvedCount === 0;
    const latestComment = commentsList.length > 0 ? commentsList[commentsList.length - 1] : null;

    const handleToggleComment = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        setActiveCommentField(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setPopoverPlacement(spaceBelow < 330 ? 'up' : 'down');
        setActiveCommentField(fieldKey);
      }
    };

    return (
      <div data-field-comment-container="true" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {commentsList.length > 0 ? (
          <button
            type="button"
            onClick={handleToggleComment}
            title={`Comments on ${fieldLabel}\n${commentsList.length} comment(s) (${unresolvedCount} open). Click to view thread & reply.`}
            style={{
              padding: isRowLevel ? '2px 6px' : '2px 8px',
              fontSize: isRowLevel ? '9.5px' : '10px',
              fontWeight: 700,
              borderRadius: '12px',
              border: isAllResolved
                ? isOpen
                  ? '1.5px solid #16A34A'
                  : '1px solid #BBF7D0'
                : isOpen
                ? '1.5px solid #000099'
                : '1px solid #BFDBFE',
              backgroundColor: isAllResolved
                ? isOpen
                  ? '#DCFCE7'
                  : '#F0FDF4'
                : isOpen
                ? '#DBEAFE'
                : '#EFF6FF',
              color: isAllResolved ? '#166534' : '#000099',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: isAllResolved ? '0 1px 2px rgba(22,163,74,0.08)' : '0 1px 2px rgba(0,0,153,0.08)',
              transition: 'all 0.15s ease',
              maxWidth: isRowLevel ? '70px' : '220px',
            }}
          >
            {isAllResolved ? (
              <>
                <CheckCircle2 style={{ width: '11px', height: '11px', color: '#16A34A' }} />
                <span style={{ fontSize: '9.5px', fontWeight: 800 }}>
                  ✓ {isRowLevel ? commentsList.length : `Resolved (${commentsList.length})`}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#000099',
                    color: '#ffffff',
                    fontSize: '8px',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {latestComment?.authorName ? latestComment.authorName.charAt(0).toUpperCase() : 'U'}
                </span>

                {!isRowLevel && (
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '110px',
                      fontSize: '9.5px',
                      color: '#1E3A8A',
                    }}
                  >
                    <strong>{latestComment?.authorName ? latestComment.authorName.split(' ')[0] : 'Note'}:</strong> "{latestComment?.content || ''}"
                  </span>
                )}

                <span
                  style={{
                    backgroundColor: unresolvedCount > 0 ? '#000099' : '#16A34A',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0 4px',
                    fontSize: '9px',
                    fontWeight: 800,
                    lineHeight: '12px',
                  }}
                >
                  {unresolvedCount}
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleComment}
            title={`Add a comment on ${fieldLabel}`}
            style={{
              padding: isRowLevel ? '2px 5px' : '1px 6px',
              fontSize: '9.5px',
              fontWeight: 600,
              borderRadius: '10px',
              border: isOpen ? '1px solid #000099' : '1px dashed #CBD5E1',
              backgroundColor: isOpen ? '#EFF6FF' : '#F8FAFC',
              color: isOpen ? '#000099' : '#64748B',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease',
            }}
          >
            <MessageSquare style={{ width: '9px', height: '9px', color: isOpen ? '#000099' : '#94A3B8' }} />
            <span>{isRowLevel ? '' : '+ Comment'}</span>
          </button>
        )}

        <FieldCommentPopover
          isOpen={isOpen}
          onClose={() => setActiveCommentField(null)}
          engagementId={execData.id}
          fieldKey={fieldKey}
          fieldLabel={fieldLabel}
          comments={commentsList}
          currentUser={currentCommentUser}
          availableUsers={availableUsers}
          placement={popoverPlacement}
          onAddComment={(text, taggedUser) => {
            const newComment: IssueComment = {
              commentId: `COMM-${Date.now()}`,
              issueId: execData.id,
              fieldKey,
              content: text,
              authorId: currentUser?.userId || 'USR-001',
              authorName: currentUser?.name || 'Current Auditor',
              isResolved: false,
              createdAt: new Date().toISOString(),
              taggedUserId: taggedUser?.userId,
              taggedUserName: taggedUser?.name,
            };
            setComments((prev) => [...prev, newComment]);
            setToastMessage({ message: `Comment posted on ${fieldLabel}`, severity: 'info' });
          }}
          onResolveComment={(commentId) => {
            setComments((prev) =>
              prev.map((c) =>
                c.commentId === commentId
                  ? {
                      ...c,
                      isResolved: true,
                      resolvedById: currentUser?.userId || 'USR-001',
                      resolvedByName: currentUser?.name || 'Current Auditor',
                      resolvedAt: new Date().toISOString(),
                    }
                  : c
              )
            );
            setToastMessage({ message: 'Comment resolved', severity: 'success' });
          }}
        />
      </div>
    );
  };

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
          borderBottom: '1px solid #d8d8d8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          backgroundColor: '#ffffff',
          flexShrink: 0,
          boxSizing: 'border-box',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        }}
      >
        {/* Left Side: Back Button, Title & Pending Stage Badge */}
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
            Executive Summary — {(activeEngagement as any)?.fileName || execData.fileName}
          </h1>

          {/* Current Pending Stage Pill */}
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 800,
              color: pendingStage.color,
              backgroundColor: pendingStage.bg,
              border: `1px solid ${pendingStage.border}`,
              padding: '3px 10px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: pendingStage.dot,
              }}
            />
            {pendingStage.label}
          </span>
        </div>

        {/* Top Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* 1. Dynamic Role-Based Submit Button */}
          {roleConfig.hasReportSubmission && (
            <button
              onClick={handleSubmit}
              style={{
                padding: '6px 16px',
                fontSize: '11.5px',
                fontWeight: 800,
                color: '#ffffff',
                backgroundColor: '#eb1700',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 1px 3px rgba(235, 23, 0, 0.28)',
                transition: 'all 0.15s ease',
              }}
              title={`${roleConfig.reportSubmitLabel} for Leadership Approval`}
            >
              {roleLower.includes('vp') ? <CheckCircle2 size={13} /> : <Send size={13} />}
              <span>{roleConfig.reportSubmitLabel}</span>
            </button>
          )}

          {/* 2. Generate Executive Summary Button */}
          <button
            onClick={handleGenerateExecSummary}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#eb1700',
              backgroundColor: '#FFF1F2',
              border: '1.5px solid #FCA5A5',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sparkles style={{ width: '14px', height: '14px', color: '#eb1700' }} />
            <span>Generate Executive Summary</span>
          </button>

          {/* 3. Download PDF Button */}
          <button
            onClick={() => window.print()}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#1E40AF',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            title="Download / Print PDF"
          >
            <Download style={{ width: '13px', height: '13px', color: '#1E40AF' }} />
            <span>Download PDF</span>
          </button>

          {/* 3b. Push to Teammate Button (For Director & VP only with Critical Escalation Gate) */}
          {isDirectorOrVP && (
            <div
              style={{ position: 'relative', display: 'inline-flex' }}
              onMouseEnter={() => {
                if (isPushDisabled) setShowPushTooltip(true);
              }}
              onMouseLeave={() => setShowPushTooltip(false)}
            >
              <button
                disabled={isPushDisabled}
                onClick={() => {
                  if (!isPushDisabled) {
                    setToastMessage({
                      title: 'Push to Teammate Initiated',
                      message: `Executive summary review for ${(activeEngagement as any)?.fileName || execData.fileName} has been initiated and pushed to teammate.`,
                      severity: 'success',
                    });
                  }
                }}
                style={{
                  padding: '6px 14px',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  color: isPushDisabled ? '#64748B' : '#6D28D9',
                  backgroundColor: isPushDisabled ? '#F1F5F9' : '#F5F3FF',
                  border: isPushDisabled ? '1.5px solid #CBD5E1' : '1.5px solid #DDD6FE',
                  borderRadius: '6px',
                  cursor: isPushDisabled ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isPushDisabled ? 'none' : '0 1px 2px rgba(0,0,0,0.04)',
                  transition: 'all 0.15s ease',
                  opacity: isPushDisabled ? 0.75 : 1,
                }}
                title={isPushDisabled ? pushTooltipText : 'Push to Teammate'}
              >
                <Send style={{ width: '13px', height: '13px', color: isPushDisabled ? '#94A3B8' : '#7C3AED' }} />
                <span>Push to Teammate</span>
              </button>

              {/* Disabled Tooltip on Hover */}
              {isPushDisabled && showPushTooltip && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#0F172A',
                    color: '#ffffff',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 600,
                    lineHeight: '1.35',
                    whiteSpace: 'nowrap',
                    zIndex: 9999,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: '-5px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: 0,
                      height: 0,
                      borderLeft: '5px solid transparent',
                      borderRight: '5px solid transparent',
                      borderBottom: '5px solid #0F172A',
                    }}
                  />
                  <span>Report contains critical issues, VP signoff is mandatory</span>
                </div>
              )}
            </div>
          )}

          {/* 4. Switch to Detailed Audit Report Studio */}
          <button
            onClick={() => setActiveReportingView('audit-studio')}
            style={{
              padding: '6px 12px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#475569',
              backgroundColor: '#F1F5F9',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title="Switch to Audit Report Studio"
          >
            <FileText style={{ width: '13px', height: '13px', color: '#64748B' }} />
            <span>Audit Report</span>
          </button>

          {/* 5. Workflow Button */}
          <button
            onClick={() => setIsWorkflowModalOpen(true)}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#000099',
              backgroundColor: '#ffffff',
              border: '1.5px solid #000099',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            title="View Workflow Stages & Status"
          >
            <GitBranch style={{ width: '13px', height: '13px', color: '#000099' }} />
            <span>Workflow</span>
          </button>

          {/* 6. Track Changes Button */}
          <button
            onClick={() => setIsLogsModalOpen(true)}
            style={{
              padding: '6px 14px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#eb1700',
              backgroundColor: '#ffffff',
              border: '1.5px solid #eb1700',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
              transition: 'all 0.15s ease',
            }}
            title="View Executive Report Field Changes & Audit History"
          >
            <History style={{ width: '13px', height: '13px', color: '#eb1700' }} />
            <span>Track Changes</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body: Left Form Panel | Resizable Splitter | Right Live HTML PDF Preview */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDraggingSplitter ? 'none' : 'auto',
        }}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EDITABLE ACCORDION SECTIONS                                  */}
        {/* ========================================================================= */}
        {isLeftCollapsed ? (
          <div
            style={{
              width: '36px',
              minWidth: '36px',
              backgroundColor: '#F8FAFC',
              borderRight: '1px solid #CBD5E1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '10px',
              gap: '16px',
              userSelect: 'none',
              flexShrink: 0,
              height: '100%',
            }}
          >
            <button
              onClick={() => setIsLeftCollapsed(false)}
              title="Expand Executive Form Editor"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#ffffff',
                color: '#000099',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PanelLeftOpen style={{ width: '14px', height: '14px' }} />
            </button>
            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              EXECUTIVE FORM
            </div>
          </div>
        ) : (
          <div
            style={{
              width: isRightCollapsed ? '100%' : `${leftWidth}%`,
              minWidth: '300px',
              height: '100%',
              borderRight: isRightCollapsed ? 'none' : '1px solid #CBD5E1',
              backgroundColor: '#F8FAFC',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Left Header */}
            <div
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#0F172A' }}>
                Executive Form Editor
              </span>
              <button
                onClick={() => setIsLeftCollapsed(true)}
                title="Collapse Form Editor"
                style={{
                  padding: '4px',
                  borderRadius: '4px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#F8FAFC',
                  color: '#64748B',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PanelLeftClose style={{ width: '14px', height: '14px' }} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              {/* SECTION 1 ACCORDION: Scope Summary & Process Matrix (Page 1) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'scope' ? 'visible' : 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === 'scope' ? null : 'scope')}
                  style={{
                    border: 'none',
                    background: expandedSection === 'scope' ? '#FFF5F5' : '#ffffff',
                    color: expandedSection === 'scope' ? '#eb1700' : '#1E293B',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderBottom: expandedSection === 'scope' ? '1px solid #FCA5A5' : 'none',
                  }}
                >
                  <span>Scope Summary &amp; Process Matrix</span>
                  {expandedSection === 'scope' ? <Minus size={16} /> : <Plus size={16} />}
                </button>

                {expandedSection === 'scope' && (
                  <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Assessment Period */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Assessment Period:
                        </label>
                        {renderFieldCommentTrigger('scope_assessmentPeriod', 'Assessment Period')}
                      </div>
                      <input
                        type="text"
                        value={execData.scopeSummary.assessmentPeriod}
                        onChange={(e) => handleScopeChange('assessmentPeriod', e.target.value)}
                        placeholder="e.g. Q1 2026 – Q2 2026 (Jan 1, 2026 – Jun 30, 2026)"
                        style={{
                          width: '100%',
                          height: '28px',
                          padding: '0 8px',
                          fontSize: '11.5px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Entity Sector & Entity Location */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                            Entity Sector:
                          </label>
                          {renderFieldCommentTrigger('scope_entitySector', 'Entity Sector')}
                        </div>
                        <input
                          type="text"
                          value={execData.scopeSummary.entitySector}
                          onChange={(e) => handleScopeChange('entitySector', e.target.value)}
                          placeholder="e.g. MedTech / Supply Chain & Operations"
                          style={{
                            width: '100%',
                            height: '28px',
                            padding: '0 8px',
                            fontSize: '11.5px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                            Entity Location:
                          </label>
                          {renderFieldCommentTrigger('scope_entityLocation', 'Entity Location')}
                        </div>
                        <input
                          type="text"
                          value={execData.scopeSummary.entityLocation}
                          onChange={(e) => handleScopeChange('entityLocation', e.target.value)}
                          placeholder="e.g. Suzhou Plant & Regional Operations Hub"
                          style={{
                            width: '100%',
                            height: '28px',
                            padding: '0 8px',
                            fontSize: '11.5px',
                            borderRadius: '4px',
                            border: '1px solid #CBD5E1',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Metric */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Metric:
                        </label>
                        {renderFieldCommentTrigger('scope_metric', 'Metric')}
                      </div>
                      <input
                        type="text"
                        value={execData.scopeSummary.metric}
                        onChange={(e) => handleScopeChange('metric', e.target.value)}
                        placeholder="e.g. GxP Compliance, SOX 404 Controls & IT Access Security"
                        style={{
                          width: '100%',
                          height: '28px',
                          padding: '0 8px',
                          fontSize: '11.5px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Objective Rich Text Editor */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Objective:
                        </label>
                        {renderFieldCommentTrigger('scope_objective', 'Objective')}
                      </div>
                      <RichTextEditor
                        value={
                          execData.scopeSummary.objectiveHtml ??
                          (execData.scopeSummary.objectiveBullets
                            ? `<ul>${execData.scopeSummary.objectiveBullets.map((b) => `<li>${b}</li>`).join('')}</ul>`
                            : '')
                        }
                        onChange={(html) => handleScopeChange('objectiveHtml', html)}
                        placeholder="Enter objective notes and bullet points..."
                        minHeight="75px"
                      />
                    </div>

                    {/* Process Breakdown Matrix Table Editor with Add/Delete, Row Comments & Grand Total */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Process Breakdown Matrix:
                        </label>
                        <button
                          type="button"
                          onClick={handleAddProcessRow}
                          style={{
                            padding: '2px 8px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: '#eb1700',
                            backgroundColor: '#FFF1F2',
                            border: '1px solid #FCA5A5',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Plus style={{ width: '11px', height: '11px' }} />
                          <span>Add Row</span>
                        </button>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', border: '1px solid #CBD5E1' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#F1F5F9', color: '#334155' }}>
                            <th style={{ padding: '6px 8px', textAlign: 'left', fontWeight: 800 }}>Process Title</th>
                            <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, width: '42px', color: '#D8001D' }}>Crit</th>
                            <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, width: '42px', color: '#D97706' }}>Maj</th>
                            <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, width: '42px', color: '#047857' }}>Min</th>
                            <th style={{ padding: '6px 6px', textAlign: 'center', fontWeight: 800, width: '38px' }}>ALL</th>
                            <th style={{ padding: '6px 4px', textAlign: 'center', fontWeight: 800, width: '52px', color: '#475569' }} title="Row Level Comments">💬 Note</th>
                            <th style={{ width: '22px' }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {execData.scopeSummary.processMatrix.map((row, idx) => {
                            const isGrandTotal = idx === execData.scopeSummary.processMatrix.length - 1;
                            return (
                              <tr
                                key={idx}
                                style={{
                                  borderBottom: '1px solid #E2E8F0',
                                  backgroundColor: isGrandTotal ? '#F8FAFC' : '#ffffff',
                                  fontWeight: isGrandTotal ? 800 : 'normal',
                                }}
                              >
                                <td style={{ padding: '4px 8px' }}>
                                  {isGrandTotal ? (
                                    <span style={{ fontWeight: 800, color: '#0F172A' }}>{row.processTitle}</span>
                                  ) : (
                                    <input
                                      type="text"
                                      value={row.processTitle}
                                      onChange={(e) => handleProcessMatrixChange(idx, 'processTitle', e.target.value)}
                                      style={{ width: '100%', padding: '3px 4px', fontSize: '11px', border: '1px solid #E2E8F0', borderRadius: '3px' }}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>
                                  {isGrandTotal ? (
                                    <span style={{ fontWeight: 800 }}>{row.critical}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.critical}
                                      onChange={(e) => handleProcessMatrixChange(idx, 'critical', e.target.value)}
                                      style={{ width: '36px', padding: '2px', fontSize: '11px', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '3px' }}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>
                                  {isGrandTotal ? (
                                    <span style={{ fontWeight: 800 }}>{row.major}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.major}
                                      onChange={(e) => handleProcessMatrixChange(idx, 'major', e.target.value)}
                                      style={{ width: '36px', padding: '2px', fontSize: '11px', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '3px' }}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>
                                  {isGrandTotal ? (
                                    <span style={{ fontWeight: 800 }}>{row.minor}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      min={0}
                                      value={row.minor}
                                      onChange={(e) => handleProcessMatrixChange(idx, 'minor', e.target.value)}
                                      style={{ width: '36px', padding: '2px', fontSize: '11px', textAlign: 'center', border: '1px solid #CBD5E1', borderRadius: '3px' }}
                                    />
                                  )}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: isGrandTotal ? '#0F172A' : '#475569' }}>
                                  {row.total}
                                </td>
                                {/* Row-Level Comment Trigger */}
                                <td style={{ padding: '4px', textAlign: 'center' }}>
                                  {!isGrandTotal && renderFieldCommentTrigger(`processMatrix_row_${idx}`, row.processTitle || `Row ${idx + 1}`, true)}
                                </td>
                                <td style={{ padding: '2px', textAlign: 'center' }}>
                                  {!isGrandTotal && execData.scopeSummary.processMatrix.length > 2 && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveProcessRow(idx)}
                                      style={{ border: 'none', background: 'transparent', color: '#94A3B8', cursor: 'pointer', padding: '2px' }}
                                      title="Delete process row"
                                    >
                                      <X style={{ width: '12px', height: '12px' }} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Background Rich Text Editor */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Background:
                        </label>
                        {renderFieldCommentTrigger('scope_background', 'Background')}
                      </div>
                      <RichTextEditor
                        value={execData.scopeSummary.background || ''}
                        onChange={(html) => handleScopeChange('background', html)}
                        placeholder="Enter background section narrative..."
                        minHeight="85px"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2 ACCORDION: Audit Insights (Page 2) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'insights' ? 'visible' : 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === 'insights' ? null : 'insights')}
                  style={{
                    border: 'none',
                    background: expandedSection === 'insights' ? '#FFF5F5' : '#ffffff',
                    color: expandedSection === 'insights' ? '#eb1700' : '#1E293B',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderBottom: expandedSection === 'insights' ? '1px solid #FCA5A5' : 'none',
                  }}
                >
                  <span>Audit Insights</span>
                  {expandedSection === 'insights' ? <Minus size={16} /> : <Plus size={16} />}
                </button>

                {expandedSection === 'insights' && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Overall Summary Line */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 700, textDecoration: 'underline', color: '#0F172A' }}>
                          Overall
                        </span>
                        {renderFieldCommentTrigger('insights_overall', 'Overall Line')}
                      </div>
                      <input
                        type="text"
                        value={execData.auditInsights.overallText}
                        onChange={(e) => handleInsightsOverallChange(e.target.value)}
                        placeholder="for the processes reviewed, 1 critical, 1 major and 6 minor findings were identified..."
                        style={{
                          width: '100%',
                          height: '32px',
                          padding: '0 8px',
                          fontSize: '11.5px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Audit Insights Narrative Rich Text Editor */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 800, color: '#1E293B' }}>
                          Audit Insights:
                        </label>
                        {renderFieldCommentTrigger('insights_narrative', 'Audit Insights')}
                      </div>
                      <RichTextEditor
                        value={
                          execData.auditInsights.narrativeHtml ??
                          (execData.auditInsights.paragraphs
                            ? execData.auditInsights.paragraphs.map((p) => `<p>${p}</p>`).join('')
                            : '')
                        }
                        onChange={(html) => handleInsightsNarrativeChange(html)}
                        placeholder="Enter audit insights narrative paragraphs..."
                        minHeight="120px"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3 ACCORDION: Critical Issues / Major Issues (Page 2) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'issues' ? 'visible' : 'hidden',
                }}
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === 'issues' ? null : 'issues')}
                  style={{
                    border: 'none',
                    background: expandedSection === 'issues' ? '#FFF5F5' : '#ffffff',
                    color: expandedSection === 'issues' ? '#eb1700' : '#1E293B',
                    cursor: 'pointer',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderBottom: expandedSection === 'issues' ? '1px solid #FCA5A5' : 'none',
                  }}
                >
                  <span>Critical Issues / Major Issues</span>
                  {expandedSection === 'issues' ? <Minus size={16} /> : <Plus size={16} />}
                </button>

                {expandedSection === 'issues' && (
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Critical Issue */}
                    {execData.criticalMajorSection.criticalIssue && (
                      <div style={{ backgroundColor: '#FEF2F2', padding: '12px', borderRadius: '6px', border: '1px solid #FCA5A5' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#991B1B', marginBottom: '8px' }}>
                          Critical Issue:
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#7F1D1D' }}>
                              Title:
                            </label>
                            {renderFieldCommentTrigger('criticalIssue_title', 'Critical Issue Title')}
                          </div>
                          <input
                            type="text"
                            value={execData.criticalMajorSection.criticalIssue.title}
                            onChange={(e) => handleIssueChange('criticalIssue', 'title', e.target.value)}
                            style={{
                              width: '100%',
                              height: '30px',
                              padding: '0 8px',
                              fontSize: '11.5px',
                              borderRadius: '4px',
                              border: '1px solid #FCA5A5',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#7F1D1D' }}>
                              Description:
                            </label>
                            {renderFieldCommentTrigger('criticalIssue_description', 'Critical Issue Description')}
                          </div>
                          <textarea
                            rows={3}
                            value={execData.criticalMajorSection.criticalIssue.description}
                            onChange={(e) => handleIssueChange('criticalIssue', 'description', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              fontSize: '11.5px',
                              borderRadius: '4px',
                              border: '1px solid #FCA5A5',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Major Issue */}
                    {execData.criticalMajorSection.majorIssue && (
                      <div style={{ backgroundColor: '#FFFBEB', padding: '12px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: '12px', fontWeight: 900, color: '#92400E', marginBottom: '8px' }}>
                          Major Issue:
                        </div>
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#78350F' }}>
                              Title:
                            </label>
                            {renderFieldCommentTrigger('majorIssue_title', 'Major Issue Title')}
                          </div>
                          <input
                            type="text"
                            value={execData.criticalMajorSection.majorIssue.title}
                            onChange={(e) => handleIssueChange('majorIssue', 'title', e.target.value)}
                            style={{
                              width: '100%',
                              height: '30px',
                              padding: '0 8px',
                              fontSize: '11.5px',
                              borderRadius: '4px',
                              border: '1px solid #FDE68A',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#78350F' }}>
                              Description:
                            </label>
                            {renderFieldCommentTrigger('majorIssue_description', 'Major Issue Description')}
                          </div>
                          <textarea
                            rows={3}
                            value={execData.criticalMajorSection.majorIssue.description}
                            onChange={(e) => handleIssueChange('majorIssue', 'description', e.target.value)}
                            style={{
                              width: '100%',
                              padding: '6px 8px',
                              fontSize: '11.5px',
                              borderRadius: '4px',
                              border: '1px solid #FDE68A',
                              fontFamily: 'inherit',
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SPLITTER HANDLE */}
        {!isLeftCollapsed && !isRightCollapsed && (
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplitter(true);
            }}
            onMouseEnter={() => setIsHoveredSplitter(true)}
            onMouseLeave={() => setIsHoveredSplitter(false)}
            title="Click and drag to resize panes"
            style={{
              width: '6px',
              backgroundColor: isDraggingSplitter || isHoveredSplitter ? '#000099' : '#CBD5E1',
              cursor: 'col-resize',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease',
              zIndex: 20,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: '2px',
                height: '24px',
                borderRadius: '1px',
                backgroundColor: isDraggingSplitter || isHoveredSplitter ? '#ffffff' : '#94A3B8',
              }}
            />
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE HTML PDF PREVIEW (MATCHING BACKUP_JNJ_IAR VERBATIM)     */}
        {/* ========================================================================= */}
        {isRightCollapsed ? (
          <div
            style={{
              width: '36px',
              minWidth: '36px',
              backgroundColor: '#27272A',
              borderLeft: '1px solid #52525B',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '10px',
              gap: '16px',
              userSelect: 'none',
              flexShrink: 0,
              height: '100%',
            }}
          >
            <button
              onClick={() => setIsRightCollapsed(false)}
              title="Expand Report Preview"
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                border: '1px solid #52525B',
                backgroundColor: '#3F3F46',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PanelLeftOpen style={{ width: '14px', height: '14px' }} />
            </button>
            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: '10.5px',
                fontWeight: 800,
                color: '#A1A1AA',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              REPORT PREVIEW
            </div>
          </div>
        ) : (
          <div
            style={{
              flex: 1,
              height: '100%',
              backgroundColor: '#52525B', // Professional dark grey PDF viewer backdrop
              padding: '24px 20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box',
              minWidth: '320px',
            }}
          >
            {/* Top Toolbar: Zoom & Collapse */}
            <div
              style={{
                width: '100%',
                maxWidth: '794px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              {/* Floating Zoom Bar */}
              <div
                style={{
                  backgroundColor: '#1E293B',
                  color: '#ffffff',
                  borderRadius: '20px',
                  padding: '4px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700 }}>Zoom:</span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.max(70, z - 10))}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                  title="Zoom Out"
                >
                  <ZoomOut size={13} />
                </button>
                <span style={{ fontSize: '11px', fontWeight: 800, width: '36px', textAlign: 'center' }}>
                  {previewZoom}%
                </span>
                <button
                  onClick={() => setPreviewZoom((z) => Math.min(130, z + 10))}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: 0 }}
                  title="Zoom In"
                >
                  <ZoomIn size={13} />
                </button>
                <button
                  onClick={() => window.print()}
                  style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', marginLeft: '4px', padding: 0 }}
                  title="Print Report"
                >
                  <Printer size={13} />
                </button>
              </div>

              {/* Collapse Preview Button */}
              <button
                onClick={() => setIsRightCollapsed(true)}
                title="Collapse Report Preview"
                style={{
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #71717A',
                  backgroundColor: '#3F3F46',
                  color: '#ffffff',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Collapse Preview</span>
                <PanelLeftClose style={{ width: '13px', height: '13px' }} />
              </button>
            </div>

            {/* Wrapper for PDF Pages */}
            <div
              style={{
                width: '100%',
                maxWidth: `${(794 * previewZoom) / 100}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
              }}
            >
              {/* ################################################################# */}
              {/* PAGE 1: EXACT MATCH TO BACKUP_JNJ_IAR                             */}
              {/* ################################################################# */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  padding: `${(36 * previewZoom) / 100}px ${(36 * previewZoom) / 100}px ${(28 * previewZoom) / 100}px`,
                  boxSizing: 'border-box',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  color: '#000000',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: `${(1000 * previewZoom) / 100}px`,
                  position: 'relative',
                }}
              >
                {/* Document Title */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#000000',
                      textAlign: 'left',
                      lineHeight: '1.2',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {execData.fileName}
                  </div>
                </div>

                {/* 1. SCOPE SUMMARY BOX */}
                <div style={{ marginBottom: '16px' }}>
                  {/* Scope Summary Banner Header */}
                  <div
                    style={{
                      backgroundColor: '#8F8F8F',
                      border: '1px solid #000000',
                      borderBottom: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '5px 10px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Scope Summary
                  </div>

                  {/* Scope Summary Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11px',
                      border: '1px solid #000000',
                      tableLayout: 'fixed',
                    }}
                  >
                    <tbody>
                      <tr>
                        <td style={{ width: '160px', padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Assessment Period:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.assessmentPeriod}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Entity Sector:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.entitySector}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Entity Location:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.entityLocation}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Metric:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.metric}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Objective:
                        </td>
                        <td style={{ padding: '6px 8px', color: '#000000', border: '1px solid #000000', lineHeight: '1.4' }}>
                          <div style={{ marginBottom: '3px', fontWeight: 500 }}>Examples:</div>
                          {execData.scopeSummary.objectiveHtml ? (
                            <div
                              className="rich-text-preview"
                              dangerouslySetInnerHTML={{ __html: execData.scopeSummary.objectiveHtml }}
                            />
                          ) : (
                            <ul style={{ margin: 0, paddingLeft: '18px' }}>
                              {(execData.scopeSummary.objectiveBullets || []).map((bullet, bIdx) => (
                                <li key={bIdx} style={{ marginBottom: bIdx === execData.scopeSummary.objectiveBullets.length - 1 ? 0 : '4px' }}>
                                  {bullet}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. PROCESS TITLE BREAKDOWN MATRIX (COLOR CODED HEADERS) */}
                <div style={{ marginBottom: '16px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: '11.5px',
                      border: '1px solid #000000',
                    }}
                  >
                    <thead>
                      <tr>
                        {/* Process Title: Grey #8F8F8F */}
                        <th
                          style={{
                            backgroundColor: '#8F8F8F',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            fontSize: '12px',
                          }}
                        >
                          Process Title
                        </th>

                        {/* Critical: Red #D8001D */}
                        <th
                          style={{
                            backgroundColor: '#D8001D',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: '12px',
                          }}
                        >
                          Critical
                        </th>

                        {/* Major: Yellow #F1B500 */}
                        <th
                          style={{
                            backgroundColor: '#F1B500',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: '12px',
                          }}
                        >
                          Major
                        </th>

                        {/* Minor: Green #008000 */}
                        <th
                          style={{
                            backgroundColor: '#008000',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: '12px',
                          }}
                        >
                          Minor
                        </th>

                        {/* ALL: Grey #8F8F8F */}
                        <th
                          style={{
                            backgroundColor: '#8F8F8F',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: '12px',
                          }}
                        >
                          ALL
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {execData.scopeSummary.processMatrix.map((row, idx) => {
                        const isGrandTotal = idx === execData.scopeSummary.processMatrix.length - 1;
                        return (
                          <tr key={idx}>
                            <td
                              style={{
                                padding: '6px 10px',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isGrandTotal ? 700 : 'normal',
                                wordBreak: 'break-word',
                              }}
                            >
                              {row.processTitle}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isGrandTotal ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.critical)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isGrandTotal ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.major)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isGrandTotal ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.minor)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isGrandTotal ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.total)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3. BACKGROUND BOX */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                  <div
                    style={{
                      backgroundColor: '#8F8F8F',
                      border: '1px solid #000000',
                      borderBottom: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '5px 10px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Background
                  </div>

                  <div
                    style={{
                      border: '1px solid #000000',
                      backgroundColor: '#ffffff',
                      padding: '14px',
                      minHeight: '200px',
                      flex: 1,
                      fontSize: '11px',
                      lineHeight: '1.45',
                      color: '#000000',
                      boxSizing: 'border-box',
                    }}
                  >
                    {execData.scopeSummary.background ? (
                      <div
                        className="rich-text-preview"
                        dangerouslySetInnerHTML={{ __html: execData.scopeSummary.background }}
                      />
                    ) : (
                      <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                        (Background notes and operational context)
                      </div>
                    )}
                  </div>
                </div>

                {/* PAGE 1 FOOTER: Red Johnson & Johnson script logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      color: '#D8001D',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      fontSize: '15px',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Johnson &amp; Johnson
                  </div>

                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Page 1 of 2</div>
                </div>
              </div>

              {/* ################################################################# */}
              {/* PAGE 2: EXACT MATCH TO BACKUP_JNJ_IAR                             */}
              {/* ################################################################# */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
                  padding: `${(36 * previewZoom) / 100}px ${(36 * previewZoom) / 100}px ${(28 * previewZoom) / 100}px`,
                  boxSizing: 'border-box',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  color: '#000000',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: `${(1000 * previewZoom) / 100}px`,
                  position: 'relative',
                }}
              >
                {/* Header line on Page 2 */}
                <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748B' }}>
                    {execData.fileName}
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#94A3B8' }}>Section 2: Insights &amp; Findings</div>
                </div>

                {/* 1. AUDIT INSIGHTS BOX */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    style={{
                      backgroundColor: '#8F8F8F',
                      border: '1px solid #000000',
                      borderBottom: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '5px 10px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Audit Insights
                  </div>

                  <div
                    style={{
                      border: '1px solid #000000',
                      backgroundColor: '#ffffff',
                      padding: '12px 14px',
                      fontSize: '11px',
                      lineHeight: '1.45',
                      color: '#000000',
                    }}
                  >
                    {/* First line: Overall underlined */}
                    <div style={{ marginBottom: '10px' }}>
                      <span style={{ textDecoration: 'underline', fontWeight: 700 }}>Overall</span>{' '}
                      <span>{execData.auditInsights.overallText}</span>
                    </div>

                    {/* Narrative paragraphs with rich text support */}
                    {execData.auditInsights.narrativeHtml ? (
                      <div
                        className="rich-text-preview"
                        dangerouslySetInnerHTML={{ __html: execData.auditInsights.narrativeHtml }}
                      />
                    ) : (
                      (execData.auditInsights.paragraphs || []).map((para, pIdx) => (
                        <p key={pIdx} style={{ margin: '0 0 10px 0', lineHeight: 1.45 }}>
                          {para}
                        </p>
                      ))
                    )}
                  </div>
                </div>

                {/* 2. CRITICAL ISSUES / MAJOR ISSUES BOX */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                  <div
                    style={{
                      backgroundColor: '#8F8F8F',
                      border: '1px solid #000000',
                      borderBottom: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '13px',
                      textAlign: 'center',
                      padding: '5px 10px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Critical Issues /Major Issues
                  </div>

                  <div
                    style={{
                      border: '1px solid #000000',
                      backgroundColor: '#ffffff',
                      padding: '12px 14px',
                      fontSize: '11px',
                      lineHeight: '1.45',
                      color: '#000000',
                      flex: 1,
                    }}
                  >
                    {/* Critical Issues Subheading & Details */}
                    {execData.criticalMajorSection.criticalIssue && (
                      <div style={{ marginBottom: '14px' }}>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#000000', marginBottom: '4px' }}>
                          Critical Issues
                        </div>
                        <div style={{ fontWeight: 400, color: '#000000', marginBottom: '3px' }}>
                          {execData.criticalMajorSection.criticalIssue.title}
                        </div>
                        <div style={{ color: '#000000', lineHeight: 1.45 }}>
                          {execData.criticalMajorSection.criticalIssue.description}
                        </div>
                      </div>
                    )}

                    {/* Major Issues Subheading & Details */}
                    {execData.criticalMajorSection.majorIssue && (
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '12px', color: '#000000', marginBottom: '4px' }}>
                          Major Issues
                        </div>
                        <div style={{ fontWeight: 400, color: '#000000', marginBottom: '3px' }}>
                          {execData.criticalMajorSection.majorIssue.title}
                        </div>
                        <div style={{ color: '#000000', lineHeight: 1.45 }}>
                          {execData.criticalMajorSection.majorIssue.description}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* PAGE 2 FOOTER: Red Johnson & Johnson script logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      color: '#D8001D',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      fontSize: '15px',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Johnson &amp; Johnson
                  </div>

                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Page 2 of 2</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        job={activeEngagement}
        title="Executive Summary Workflow Pipeline"
        type="executive"
      />

      {/* Track Changes Logs Dialog */}
      <IssueLogsDialog
        open={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        issueId={execData.id}
        issueTitle={(activeEngagement as any)?.fileName || execData.fileName}
        logs={auditLogs}
      />

      {/* Toast Feedback Notification */}
      <Snackbar
        open={!!toastMessage}
        autoHideDuration={4000}
        onClose={() => setToastMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        {toastMessage ? (
          <Alert severity={toastMessage.severity} onClose={() => setToastMessage(null)} sx={{ width: '100%', fontWeight: 600 }}>
            {toastMessage.title && <strong>{toastMessage.title}: </strong>}
            {toastMessage.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </div>
  );
};
