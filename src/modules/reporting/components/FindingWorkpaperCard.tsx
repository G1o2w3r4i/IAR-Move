import React, { useState, useRef, useEffect, useMemo } from 'react';
import type { Issue, CriticalityLevel, IssueStatus } from '../../../types/dataverse.types';
import {
  SharedAccordion,
  AccordionGroup,
  SharedButton,
  SharedSelectButton,
  SharedTextInput,
  SharedTextArea,
  SharedSelect,
  SharedFieldLabel,
  SharedListBoxFilter,
  AIInput,
} from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';
import {
  Sparkles,
  GitBranch,
  History,
  MessageSquare,
  Lock,
  Unlock,
  RotateCcw,
  Ban,
  MoreVertical,
  CheckCircle2,
  AlertOctagon,
  AlertTriangle,
  Clock,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
} from 'lucide-react';
import { synthesizeAiDraft } from '../utils/aiSynthesisHelper';
import { AiVersionCompareDialog, type AiCompareFieldData } from './AiVersionCompareDialog';

interface FindingWorkpaperCardProps {
  issue: Issue;
  onUpdateIssue: (updated: Issue) => void;
  onOpenAiCompare?: () => void;
  onOpenLogs: () => void;
  onOpenComments: (fieldKey: string, fieldLabel: string) => void;
  commentCounts: Record<string, number>;
  isAiSynthesizing?: boolean;
  onTriggerAiSynthesis?: () => void;
  canEdit: boolean;
  editRestrictionReason?: string | null;
  onExcludeIssue?: (issueId: string) => void;
  onIncludeIssue?: (issueId: string) => void;
  onToggleLock?: (issueId: string) => void;
  onOpenCallback?: (issueId: string) => void;
  onMarkNotAnIssue?: (issueId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  currentUser?: { name?: string; role?: string; avatar?: string };
  onAdvanceWorkflow?: (targetStatus: IssueStatus) => void;
  userRole?: string;
  hasCriticalFinding?: boolean;
}

const getCriticalityColor = (crit?: string): string => {
  const c = (crit || '').trim().toLowerCase();
  if (c === 'critical') return '#D8001D';
  if (c === 'major') return '#EA580C';
  if (c === 'moderate') return '#D97706';
  if (c === 'minor') return '#16A34A';
  return '#334155';
};

const CRITICALITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'Major', label: 'Major' },
  { value: 'Moderate', label: 'Moderate' },
  { value: 'Minor', label: 'Minor' },
];

const PROCESS_AREA_OPTIONS = [
  { value: 'Access Control & IAM', label: 'Access Control & IAM' },
  { value: 'Cybersecurity', label: 'Cybersecurity' },
  { value: 'Training', label: 'Training' },
  { value: 'Third Party Technology', label: 'Third Party Technology' },
  { value: 'Change Management', label: 'Change Management' },
  { value: 'Supply Chain & Operations', label: 'Supply Chain & Operations' },
  { value: 'System Configuration', label: 'System Configuration' },
];

const TEST_PROCEDURE_OPTIONS = [
  { value: 'TP-101', label: 'TP-101: User Access & Authentication Review' },
  { value: 'TP-102', label: 'TP-102: Privileged Access Management Verification' },
  { value: 'TP-103', label: 'TP-103: Automated Telemetry & Calibration Logging Review' },
  { value: 'TP-104', label: 'TP-104: Segregation of Duties & Authorization Matrix' },
  { value: 'TP-105', label: 'TP-105: Third-Party Vendor Network Access Deprovisioning' },
  { value: 'TP-110', label: 'TP-110: GxP Software Validation & Data Integrity Audit' },
];

const YES_NO_OPTIONS = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const ROOT_CAUSE_TYPE_OPTIONS = [
  { value: 'Process Gap', label: 'Process Gap' },
  { value: 'System Configuration', label: 'System Configuration' },
  { value: 'Human Oversight', label: 'Human Oversight' },
  { value: 'Third-Party Dependency', label: 'Third-Party Dependency' },
  { value: 'Resource Constraint', label: 'Resource Constraint' },
];

export type SectionTab = 'all' | 'basic' | 'ai' | 'taxonomies' | 'biz';

const SECTION_TAB_OPTIONS: ListBoxFilterOption<SectionTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'basic', label: 'Basic' },
  { value: 'ai', label: 'AI Fields' },
  { value: 'taxonomies', label: 'Taxonomies' },
  { value: 'biz', label: 'Biz Response' },
];

export const FindingWorkpaperCard: React.FC<FindingWorkpaperCardProps> = ({
  issue,
  onUpdateIssue,
  onOpenAiCompare,
  onOpenLogs,
  onOpenComments,
  commentCounts,
  isAiSynthesizing,
  onTriggerAiSynthesis,
  canEdit,
  editRestrictionReason,
  onExcludeIssue,
  onIncludeIssue,
  onToggleLock,
  onOpenCallback,
  onMarkNotAnIssue,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  onAdvanceWorkflow,
  userRole = 'Manager',
  hasCriticalFinding = false,
}) => {
  const [, setSelectedViolation] = useState<string | null>(null);
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('all');
  const roleStr = (userRole || '').toLowerCase();
  const isAuditor = roleStr.includes('auditor');
  const isTC = roleStr.includes('coordinator') || roleStr.includes('tc');
  const isDirector = roleStr.includes('director');
  const isVP = roleStr.includes('vp');
  const isBusiness = roleStr.includes('business') || roleStr.includes('contact');
  const isManager = roleStr.includes('manager') && !isDirector;

  // Compute read-only state
  const isExcluded = !!issue.isExcluded;
  const isLocked = !!issue.isLocked;

  // Check if locked and whether the current user is the one working on it
  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const lockedByName = (
    issue.lockedBy?.name ||
    (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '')
  ).trim().toLowerCase();

  const isLockedByCurrentUser = Boolean(
    isLocked &&
    currentUserName &&
    lockedByName &&
    currentUserName === lockedByName
  );

  // If issue is locked, only the person working on it can edit
  const isFieldDisabled = !canEdit || isExcluded || (isLocked && !isLockedByCurrentUser);

  // For excluded issues, read-only issues, or locked issues (unless current user is the worker), action buttons are not applicable
  const canShowIssueButtons = !isExcluded && canEdit && (!isLocked || isLockedByCurrentUser);

  // Determine if function is IT or FinOps
  const isIT = (() => {
    const clean = (issue.function || (issue as any).functionType || issue.testProcedureCode || '')
      .toString()
      .trim()
      .toLowerCase();
    return (
      clean.includes('it') ||
      clean.includes('tp-101') ||
      clean.includes('tp-102') ||
      clean.includes('tp-103') ||
      clean.includes('tp-105') ||
      clean.includes('tp-110')
    );
  })();

  // AI regeneration tracking and comparison state
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    originalIssue: string;
    function: 'IT' | 'FinOps';
    testProcedureCode: string;
  } | null>(null);

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isAiLoadingLocal, setIsAiLoadingLocal] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [previousAiData, setPreviousAiData] = useState<AiCompareFieldData | null>(null);
  const [candidateAiData, setCandidateAiData] = useState<AiCompareFieldData | null>(null);
  const [fieldRemarks, setFieldRemarks] = useState({
    title: '',
    issueNarrative: '',
    rootCause: '',
    impact: '',
    recommendation: '',
  });

  // Initialize or reset tracking params when issue ID changes
  useEffect(() => {
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
    setLastGeneratedParams({
      originalIssue: (issue.originalIssue || issue.description || issue.title || '').trim(),
      function: isIT ? 'IT' : 'FinOps',
      testProcedureCode: issue.testProcedureCode || '',
    });
    setFieldRemarks({
      title: '',
      issueNarrative: '',
      rootCause: '',
      impact: '',
      recommendation: '',
    });
  }, [issue.id]);

  const currentOriginalIssue = (issue.originalIssue || issue.description || issue.title || '').trim();
  const currentFunction: 'IT' | 'FinOps' = isIT ? 'IT' : 'FinOps';
  const currentTestProc = issue.testProcedureCode || '';

  const hasParamsChanged = Boolean(
    lastGeneratedParams && (
      lastGeneratedParams.originalIssue !== currentOriginalIssue ||
      lastGeneratedParams.function !== currentFunction ||
      lastGeneratedParams.testProcedureCode !== currentTestProc
    )
  );

  const showRegenerateBanner = !isExcluded && canEdit && hasParamsChanged && !isBannerDismissed;

  const handleFieldRemarkChange = (field: keyof typeof fieldRemarks, remark: string) => {
    setFieldRemarks((prev) => ({
      ...prev,
      [field]: remark,
    }));
  };

  const handleRegenerateAi = async () => {
    if (isFieldDisabled) return;
    setIsAiLoadingLocal(true);

    const prev: AiCompareFieldData = {
      title: issue.title || '',
      description: issue.issueNarrative || issue.description || issue.issue || '',
      rootCause: issue.rootCause || '',
      impact: issue.impact || '',
      recommendation: issue.recommendation || '',
    };
    setPreviousAiData(prev);

    // Realistic synthesis delay
    await new Promise((res) => setTimeout(res, 800));

    const nextVer = (issue.activeAiVersionNumber || 1) + 1;
    const synthesized = synthesizeAiDraft(
      issue.testProcedureCode || 'TP-101',
      currentOriginalIssue,
      currentFunction,
      {
        updatedIssueHeader: fieldRemarks.title,
        description: fieldRemarks.issueNarrative,
        rootCause: fieldRemarks.rootCause,
        impact: fieldRemarks.impact,
        recommendation: fieldRemarks.recommendation,
      },
      nextVer
    );

    const candidate: AiCompareFieldData = {
      title: synthesized.updatedIssueHeader,
      description: synthesized.description,
      rootCause: synthesized.rootCause,
      impact: synthesized.impact,
      recommendation: synthesized.recommendation,
    };
    setCandidateAiData(candidate);

    setIsAiLoadingLocal(false);
    setIsCompareOpen(true);
  };

  const handleApplyAiMerge = (merged: AiCompareFieldData) => {
    onUpdateIssue({
      ...issue,
      title: merged.title,
      issueNarrative: merged.description,
      description: merged.description,
      rootCause: merged.rootCause,
      impact: merged.impact,
      recommendation: merged.recommendation,
      activeAiVersionNumber: (issue.activeAiVersionNumber || 1) + 1,
    });
    setLastGeneratedParams({
      originalIssue: currentOriginalIssue,
      function: currentFunction,
      testProcedureCode: currentTestProc,
    });
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
  };

  const handleKeepPrevious = () => {
    setLastGeneratedParams({
      originalIssue: currentOriginalIssue,
      function: currentFunction,
      testProcedureCode: currentTestProc,
    });
    setIsBannerDismissed(true);
    setIsCompareOpen(false);
  };

  const handleFieldChange = (field: keyof Issue, value: any) => {
    if (isFieldDisabled) return;
    if (field === 'function' || field === 'originalIssue' || field === 'testProcedureCode') {
      setIsBannerDismissed(false);
    }
    onUpdateIssue({
      ...issue,
      [field]: value,
    });
  };

  const handleInlineAiRefine = (field: 'rootCause' | 'impact' | 'recommendation') => {
    if (isFieldDisabled) return;
    let refinedText = '';
    if (field === 'rootCause') {
      refinedText = `[AI Synthesized v2]: Systematic process breakdown in automated feed synchronization between HR identity management and Active Directory security groups.`;
    } else if (field === 'impact') {
      refinedText = `[AI Synthesized v2]: Unauthorized access exposure across privileged database instances, increasing risk of non-compliance under SOX Section 404 and GxP data integrity standards.`;
    } else if (field === 'recommendation') {
      refinedText = `[AI Synthesized v2]: 1. Enforce automated daily de-provisioning cron jobs for accounts dormant >60 days.\n2. Implement quarterly supervisory re-certification with digital signatures.`;
    }

    onUpdateIssue({
      ...issue,
      [field]: refinedText,
      activeAiVersionNumber: (issue.activeAiVersionNumber || 1) + 1,
    });
  };

  const getCommentBadge = (fieldKey: string) => {
    const count = commentCounts[fieldKey] || 0;
    return count > 0 ? (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#eb1700',
          color: '#ffffff',
          fontSize: '10px',
          fontWeight: 800,
          borderRadius: '50%',
          width: '16px',
          height: '16px',
          marginLeft: '4px',
        }}
      >
        {count}
      </span>
    ) : null;
  };

  // If collapsed, render 36px vertical rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#ffffff',
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
          onClick={() => onToggleCollapse?.(false)}
          title="Expand Form Editor"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
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
          FORM EDITOR
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Pane 2 Top Header Section: Title, Info Container, Action Buttons */}
      <div
        style={{
          backgroundColor: '#FAFAFA',
          borderBottom: 'none',
          boxShadow: '0 3px 8px rgba(0, 0, 0, 0.08)',
          position: 'relative',
          zIndex: 2,
          padding: '18px 20px 18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          flexShrink: 0,
        }}
      >
        {/* Row 1: Left collapse button + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => onToggleCollapse(true)}
              title="Collapse Form Editor Pane"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                borderRadius: '4px',
                transition: 'color 0.15s ease, background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#000099';
                e.currentTarget.style.backgroundColor = '#F1F5F9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748B';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <PanelLeftClose style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          {/* Criticality indicator circle */}
          <span
            title={`${issue.criticality || 'Normal'} Severity`}
            style={{
              width: '8.5px',
              height: '8.5px',
              borderRadius: '50%',
              backgroundColor: getCriticalityColor(issue.criticality),
              flexShrink: 0,
              display: 'inline-block',
            }}
          />

          <span
            style={{
              fontSize: '15px',
              fontWeight: 500,
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              color: '#334155',
              lineHeight: '1.3',
            }}
          >
            {issue.title}
          </span>
        </div>

        {/* Row 2: One-liner Locked Alert Container (if locked) */}
        {!isExcluded && isLocked && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <span className="lock-icon-blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Lock style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
              <strong>Issue Locked:</strong>
            </span>
            <span>
              {issue.lockedBy?.name ||
                (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '') ||
                'Another auditor'}{' '}
              is currently working on the issue, so it&apos;s available only in read mode.
            </span>
          </div>
        )}

        {/* Row 2: One-liner Domain Restricted / Read-Only Alert Container */}
        {!isExcluded && !isLocked && !canEdit && editRestrictionReason && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
              <Lock style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
              <strong>Read Only:</strong>
            </span>
            <span>
              {editRestrictionReason}
            </span>
          </div>
        )}

        {/* Row 2: One-liner Excluded Alert Container (if excluded) */}
        {isExcluded && (
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              fontSize: '12px',
              color: '#92400E',
              lineHeight: '1.4',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span className="lock-icon-blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
                <Ban style={{ width: '13px', height: '13px', color: '#D97706', flexShrink: 0 }} />
                <strong>Issue Excluded:</strong>
              </span>
              <span style={{ color: '#92400E' }}>
                Issue excluded from report.
              </span>
            </div>

            <button
              type="button"
              onClick={() => onIncludeIssue?.(issue.id)}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 700,
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                color: '#ffffff',
                backgroundColor: '#059669',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                height: '24px',
                boxSizing: 'border-box',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#047857')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#059669')}
            >
              <RotateCcw style={{ width: '11px', height: '11px' }} />
              Include Issue
            </button>
          </div>
        )}

        {/* Row 3: Action Buttons Toolbar & Section Tab Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
            paddingBottom: '2px',
            minHeight: '28px',
          }}
        >
          {/* Left Side: Section Filter Tabs (Always visible by default) */}
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
            <SharedListBoxFilter<SectionTab>
              options={SECTION_TAB_OPTIONS}
              value={activeSectionTab}
              onChange={(tab) => setActiveSectionTab(tab)}
              size="small"
              ariaLabel="Filter sections by tab"
            />
          </div>

          {/* Right Side: Action Buttons (Only shown if not locked or if current user is the person working) */}
          {canShowIssueButtons && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexWrap: 'wrap',
              }}
            >
              {/* Workflow Advance Action Buttons (Role-based: Send to Business, Submit to Director, etc.) */}
              {onAdvanceWorkflow && (
                <>
                  {isAuditor && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending TC')}
                      style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                    >
                      Submit to TC
                    </SharedButton>
                  )}

                  {isTC && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Manager')}
                      style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                    >
                      Submit to Manager
                    </SharedButton>
                  )}

                  {isManager && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Director')}
                      style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                    >
                      Submit to Director
                    </SharedButton>
                  )}

                  {isBusiness && (
                    <SharedButton
                      variant="primary"
                      size="small"
                      startIcon={<Send size={12} />}
                      onClick={() => onAdvanceWorkflow('Pending Director')}
                      style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                    >
                      Submit Response to Director
                    </SharedButton>
                  )}

                  {isDirector && (
                    hasCriticalFinding ? (
                      <SharedButton
                        variant="primary"
                        size="small"
                        startIcon={<Send size={12} />}
                        onClick={() => onAdvanceWorkflow('Pending VP')}
                        style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                        title="Mandatory VP Sign-Off Rule (contains Critical issue)"
                      >
                        Submit to VP
                      </SharedButton>
                    ) : (
                      <SharedButton
                        variant="success"
                        size="small"
                        startIcon={<CheckCircle2 size={12} />}
                        onClick={() => onAdvanceWorkflow('Signed Off')}
                        style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                      >
                        Executive Sign-Off
                      </SharedButton>
                    )
                  )}

                  {isVP && (
                    <SharedButton
                      variant="success"
                      size="small"
                      startIcon={<CheckCircle2 size={12} />}
                      onClick={() => onAdvanceWorkflow('Signed Off')}
                      style={{ height: '28px', fontSize: '11px', padding: '0 10px' }}
                    >
                      Executive Sign-Off &amp; Seal
                    </SharedButton>
                  )}
                </>
              )}

              {/* Issue Actions Dropdown */}
              <SharedSelectButton
                label="Issue Actions"
                size="small"
                menuWidth={240}
                title="Issue actions (Call Back, Lock/Unlock, Track Changes, Functional Scope, Exclusion)"
                items={[
                  ...(onAdvanceWorkflow && isManager
                    ? [
                      {
                        key: 'send-to-business',
                        label: 'Send to Business',
                        icon: <Send style={{ width: '13px', height: '13px', color: '#000099' }} />,
                        onClick: () => onAdvanceWorkflow('Pending with Business'),
                      },
                    ]
                    : []),
                  ...(onOpenCallback
                    ? [
                      {
                        key: 'call-back',
                        label: 'Call Back Issue',
                        icon: <RotateCcw style={{ width: '13px', height: '13px', color: '#7C3AED' }} />,
                        onClick: () => onOpenCallback(issue.id),
                      },
                    ]
                    : []),
                  ...(onToggleLock
                    ? [
                      {
                        key: 'lock-unlock',
                        label: isLocked ? 'Unlock Issue' : 'Lock Issue',
                        icon: isLocked ? (
                          <Unlock style={{ width: '13px', height: '13px', color: '#047857' }} />
                        ) : (
                          <Lock style={{ width: '13px', height: '13px', color: '#D97706' }} />
                        ),
                        onClick: () => onToggleLock(issue.id),
                        dividerAfter: true,
                      },
                    ]
                    : []),
                  {
                    key: 'track-changes',
                    label: 'Track Changes',
                    icon: <History style={{ width: '13px', height: '13px', color: '#eb1700' }} />,
                    onClick: () => onOpenLogs(),
                    dividerAfter: true,
                  },
                  {
                    key: 'not-my-function',
                    label: 'Mark Not my Function Issue',
                    icon: (
                      <CheckCircle2
                        style={{
                          width: '13px',
                          height: '13px',
                          color: isFieldDisabled ? '#94A3B8' : '#047857',
                        }}
                      />
                    ),
                    disabled: isFieldDisabled,
                    onClick: () => onMarkNotAnIssue?.(issue.id),
                  },
                  {
                    key: 'exclude-include',
                    label: isExcluded ? 'Include Issue in Report' : 'Mark Exclude Issue',
                    icon: isExcluded ? (
                      <RotateCcw style={{ width: '13px', height: '13px', color: '#059669' }} />
                    ) : (
                      <AlertOctagon style={{ width: '13px', height: '13px', color: '#991B1B' }} />
                    ),
                    danger: !isExcluded,
                    onClick: () => {
                      if (isExcluded) {
                        onIncludeIssue?.(issue.id);
                      } else {
                        onExcludeIssue?.(issue.id);
                      }
                    },
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Pane 2 Main Body */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: '#ffffff',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >





        {/* ------------------------------------------------------------- */}
        {/* 1. PRIMARY INPUTS SECTION                                     */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'basic') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flexShrink: 0,
            }}
          >

            {/* Row 1: Test Procedure */}
            <div>
              <SharedSelect
                label="Test Procedure"
                value={issue.testProcedureCode || 'TP-101'}
                onChange={(val) => handleFieldChange('testProcedureCode', val)}
                options={TEST_PROCEDURE_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
            </div>

            {/* Row 2: Original Issue / Initial Observation */}
            <div>
              <SharedTextArea
                label="Original Issue / Auditor Observation"
                value={issue.originalIssue || issue.description || issue.title || ''}
                onChange={(val) => handleFieldChange('originalIssue', val)}
                placeholder="Detail initial audit observations, test sample exceptions, and discovered control gaps..."
                rows={4}
                minHeight="95px"
                required
                disabled={isFieldDisabled}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. AI GENERATED FIELDS SECTION (With Regenerate & Compare)     */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'ai') && (
          <div
            style={{
              backgroundColor: '#FAFAFA',
              borderRadius: '8px',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              padding: '20px',
              gap: '16px',
            }}
          >
            {/* Conditional Regeneration Notice (only shown when original issue or function changed) */}
            {showRegenerateBanner && (
              <div
                style={{
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: '0 1px 3px rgba(0, 0, 153, 0.08)',
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: '#DBEAFE',
                      border: '1px solid #93C5FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#000099',
                      flexShrink: 0,
                    }}
                  >
                    <AlertTriangle size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12.5px', color: '#1E3A8A', lineHeight: 1.45, fontWeight: 500 }}>
                      Changed the issue or function, so generated AI might not be valid, please click on Regenerate AI if needed.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsBannerDismissed(true)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '5px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#475569',
                    }}
                  >
                    Cancel
                  </button>

                  <SharedButton
                    variant="primary"
                    size="small"
                    startIcon={<RotateCcw size={12} />}
                    onClick={handleRegenerateAi}
                    disabled={isAiLoadingLocal || isFieldDisabled}
                    loading={isAiLoadingLocal}
                  >
                    {isAiLoadingLocal ? 'Regenerating...' : 'Regenerate AI'}
                  </SharedButton>
                </div>
              </div>
            )}

            {/* Standard AI Fields (Always visible in edit mode) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* 1. Issue Title */}
              <AIInput
                label="Issue Title"
                value={issue.title}
                onChange={(val) => handleFieldChange('title', val)}
                remark={fieldRemarks.title}
                onRemarkChange={(r) => handleFieldRemarkChange('title', r)}
                rows={2}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="AI generated finding title..."
                inputBackgroundColor="#FFFFFF"
              />

              {/* 2. Condition Narrative & Observed Exceptions */}
              <AIInput
                label="Condition Narrative & Observed Exceptions"
                value={issue.issueNarrative || issue.description || issue.issue || ''}
                onChange={(val) => handleFieldChange('issueNarrative', val)}
                remark={fieldRemarks.issueNarrative}
                onRemarkChange={(r) => handleFieldRemarkChange('issueNarrative', r)}
                rows={5}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="AI synthesized condition narrative & standard citations..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('issueNarrative', 'Condition Narrative')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '16px',
                      lineHeight: '16px',
                    }}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('issueNarrative')}
                  </button>
                }
              />

              {/* 3. Root Cause */}
              <AIInput
                label="Root Cause Analysis"
                value={issue.rootCause || ''}
                onChange={(val) => handleFieldChange('rootCause', val)}
                remark={fieldRemarks.rootCause}
                onRemarkChange={(r) => handleFieldRemarkChange('rootCause', r)}
                rows={3}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Underlying operational or technical root cause gap..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('rootCause', 'Root Cause')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '16px',
                      lineHeight: '16px',
                    }}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('rootCause')}
                  </button>
                }
              />

              {/* 4. Impact */}
              <AIInput
                label="Impact & Business Risk Exposure"
                value={issue.impact || ''}
                onChange={(val) => handleFieldChange('impact', val)}
                remark={fieldRemarks.impact}
                onRemarkChange={(r) => handleFieldRemarkChange('impact', r)}
                rows={3}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Compliance, financial, or data integrity impact..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('impact', 'Impact')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '16px',
                      lineHeight: '16px',
                    }}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('impact')}
                  </button>
                }
              />

              {/* 5. Recommendations */}
              <AIInput
                label="Recommendations & Remediation Criteria"
                value={issue.recommendation || ''}
                onChange={(val) => handleFieldChange('recommendation', val)}
                remark={fieldRemarks.recommendation}
                onRemarkChange={(r) => handleFieldRemarkChange('recommendation', r)}
                rows={4}
                required
                disabled={isFieldDisabled}
                isAiLoading={isAiLoadingLocal}
                placeholder="Numbered corrective actions and recommendations..."
                inputBackgroundColor="#FFFFFF"
                extraHeaderActions={
                  <button
                    type="button"
                    onClick={() => onOpenComments('recommendation', 'Recommendation')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748B',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '0 4px',
                      height: '16px',
                      lineHeight: '16px',
                    }}
                  >
                    <MessageSquare size={12} />
                    <span>Comments</span>
                    {getCommentBadge('recommendation')}
                  </button>
                }
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. ADDITIONAL CLASSIFICATION FIELDS (Expanded / Not Collapsed) */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'taxonomies') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flexShrink: 0,
            }}
          >

            {/* Row 1: Criticality & Process Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <SharedSelect
                label="Criticality Severity"
                value={issue.criticality}
                onChange={(val) => handleFieldChange('criticality', val as CriticalityLevel)}
                options={CRITICALITY_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Process Area"
                value={issue.processArea || issue.accountableProcessArea || 'Access Control & IAM'}
                onChange={(val) => handleFieldChange('processArea', val)}
                options={PROCESS_AREA_OPTIONS}
                required
                disabled={isFieldDisabled}
              />
            </div>

            {/* Row 2: Repeat Finding, SOX Reportable, Root Cause Type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '18px' }}>
              <SharedSelect
                label="Repeat Finding"
                value={issue.repeatFinding || 'No'}
                onChange={(val) => handleFieldChange('repeatFinding', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="SOX Reportable"
                value={issue.soxReportable || (issue.criticality === 'Critical' ? 'Yes' : 'No')}
                onChange={(val) => handleFieldChange('soxReportable', val)}
                options={YES_NO_OPTIONS}
                disabled={isFieldDisabled}
              />
              <SharedSelect
                label="Root Cause Type"
                value={issue.rootCauseType || (issue as any).rootCauseCategory || 'Process Gap'}
                onChange={(val) => handleFieldChange('rootCauseType', val)}
                options={ROOT_CAUSE_TYPE_OPTIONS}
                disabled={isFieldDisabled}
              />
            </div>

            {/* Row 3: Accountable Contact & Function */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <SharedTextInput
                label="Accountable Contact"
                value={issue.accountableContact || issue.businessContactName || 'Narasimha, Vinay'}
                onChange={(val) => handleFieldChange('accountableContact', val)}
                disabled={isFieldDisabled}
              />
              <SharedTextInput
                label="Accountable Function"
                value={issue.accountableFunction || issue.function || 'Global Assurance & IT Compliance'}
                onChange={(val) => handleFieldChange('accountableFunction', val)}
                disabled={isFieldDisabled}
              />
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 4. MANAGEMENT RESPONSE & REMEDIATION AGREEMENT                 */}
        {/* ------------------------------------------------------------- */}
        {(activeSectionTab === 'all' || activeSectionTab === 'biz') && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flexShrink: 0,
            }}
          >

            <SharedTextArea
              label="Official Management Response"
              value={issue.managementResponse || issue.managementActionPlan || ''}
              onChange={(val) => handleFieldChange('managementResponse', val)}
              placeholder="Enter management concurrence, mitigation plan, and operational commitments."
              minHeight="90px"
              disabled={isFieldDisabled}
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <SharedTextInput
                label="Agreed Target Remediation Date"
                type="date"
                value={issue.agreedRemediationDate || issue.remediationTargetDate || '2026-11-30'}
                onChange={(val) => handleFieldChange('agreedRemediationDate', val)}
                disabled={isFieldDisabled}
              />
              <SharedTextInput
                label="Designated Remediation Owner"
                value={issue.accountableContact || issue.businessContactName || 'Narasimha, Vinay'}
                onChange={(val) => handleFieldChange('accountableContact', val)}
                disabled={isFieldDisabled}
              />
            </div>
          </div>
        )}
      </div>

      {/* AI Version Comparison & Merge Dialog */}
      <AiVersionCompareDialog
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        previousData={previousAiData || undefined}
        candidateData={candidateAiData || undefined}
        currentIssue={issue}
        onApplyMerge={handleApplyAiMerge}
        onKeepPrevious={handleKeepPrevious}
      />
    </div>
  );
};
