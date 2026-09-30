import React, { useState } from 'react';
import Collapse from '@mui/material/Collapse';
import {
  Plus,
  Minus,
  PlayCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  SharedTabs,
  type SharedTabItem,
  SharedTable,
  type TableColumn,
  SharedTooltip,
  QueueRolePillGroup,
  UserTablePill
} from '../../../components/shared';
import {
  getEngagementWorkflowState,
  getIssueBreakdown,
  getCategoryFilteredIssues,
  isITIssue,
  getRoleDetails
} from '../utils/reportingWorkflowEngine';
import { WorkflowModal } from './WorkflowModal';
import { IssueLogsDialog } from './IssueLogsDialog';

export interface AuditQueueCardRowProps {
  job: any;
  userRole: string;
  isBusinessRole: boolean;
  auditTab: 'my-actions' | 'all-associated';
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedInnerTab: string;
  onChangeInnerTab: (tabId: string) => void;
  sendToDropdownIssueId: string | null;
  setSendToDropdownIssueId: (id: string | null) => void;
  onWorkOnReport: (job: any, type: 'audit' | 'executive') => void;
  onOpenCreateForJob: (job: any) => void;
  onSelectReportingJob: (jobId: string) => void;
  onSendToRole: (jobId: string, issueId: string, targetStageObj: any, e: React.MouseEvent) => void;
}

export const AuditQueueCardRow: React.FC<AuditQueueCardRowProps> = ({
  job,
  userRole,
  isBusinessRole: _isBusinessRole,
  auditTab,
  isExpanded,
  onToggleExpand,
  expandedInnerTab,
  onChangeInnerTab,
  sendToDropdownIssueId: _sendToDropdownIssueId,
  setSendToDropdownIssueId: _setSendToDropdownIssueId,
  onWorkOnReport,
  onOpenCreateForJob,
  onSelectReportingJob,
  onSendToRole: _onSendToRole
}) => {
  const [workflowModalIssue, setWorkflowModalIssue] = useState<any | null>(null);
  const [trackChangesIssue, setTrackChangesIssue] = useState<any | null>(null);

  const userRoleDetails = getRoleDetails(userRole);
  const userDomain = userRoleDetails.domain;
  const userBaseRole = userRoleDetails.baseRole;

  // Action button permissions:
  // - Director, VP, and Business Contact can edit all issues
  // - For IT person: IT issues are editable, FinOps issues are view-only
  // - For FinOps person: FinOps issues are editable, IT issues are view-only
  const canEditIssue = (iss: any): boolean => {
    if (userBaseRole === 'director' || userBaseRole === 'vp' || userDomain === 'All') {
      return true;
    }
    const isIT = isITIssue(iss);
    if (userDomain === 'IT') {
      return isIT;
    }
    if (userDomain === 'FinOps') {
      return !isIT;
    }
    return true;
  };

  const getIssueOwner = (iss: any, currentJob: any): string => {
    if (iss.owner && typeof iss.owner === 'string') return iss.owner;
    const s = (iss.status || '').toLowerCase();
    const lvl = (iss.currentLevel || '').toLowerCase();

    if (s === 'completed' || lvl.includes('signed off') || lvl.includes('completed')) {
      return 'QA Archive';
    }
    if (s.includes('vp') || lvl.includes('vp')) {
      return 'Robert Chen';
    }
    if (s.includes('director') || lvl.includes('director')) {
      return 'Brian Cox';
    }
    if (s.includes('business') || lvl.includes('business')) {
      return iss.accountableContact || iss.primaryContact || currentJob?.leadOwner || 'Vinay Narasimha';
    }
    if (s.includes('manager') || lvl.includes('manager')) {
      return iss.lastEditedBy || 'Amanda Palmer';
    }
    if (s.includes('tc') || lvl.includes('tc') || lvl.includes('coordinator')) {
      return 'Kevin Zhang';
    }
    return iss.createdBy || 'Marcus Vance';
  };

  const wf = getEngagementWorkflowState(job);
  const isNotStarted = wf.status === 'Not Started';
  const bd = getIssueBreakdown(job, userRole, auditTab === 'my-actions');

  // Status / Strength Indication Dot Renderer (Harmonized with AccordionGroup: 13px font-medium text-slate-700)
  const renderEngagementStatusPill = (statusText: string) => {
    const s = statusText || 'Not Started';
    let dotColor = '#94A3B8';
    let isDash = false;

    if (s === 'Completed') {
      dotColor = '#087D0D';
    } else if (s === 'Audit Report Inprogress' || s.includes('Audit')) {
      dotColor = '#000099';
    } else if (s === 'Executive Report Inprogress' || s.includes('Executive')) {
      dotColor = '#E67300';
    } else if (s === 'Not Started') {
      isDash = true;
    }

    if (isDash) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8' }}>—</span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#64748B' }}>Not Started</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0
          }}
        />
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
          {s}
        </span>
      </div>
    );
  };

  // Issues Breakdown Cell (Used for Action Issues on My Actions or Total Issues on All Associated)
  const renderIssuesBreakdownCell = () => (
    <div style={{ textAlign: 'center' }}>
      {isNotStarted ? (
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#94A3B8' }}>-</span>
      ) : (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: '#334155' }}>
            {bd.total} {bd.total === 1 ? 'Issue' : 'Issues'}
          </span>
          {/* On My Action Audits: no split of IT and FinOps per user specification; show only on All Associated */}
          {auditTab === 'all-associated' && (
            <div style={{ display: 'flex', gap: '3px' }}>
              {bd.totalIT > 0 && (
                <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                  {bd.totalIT} IT
                </span>
              )}
              {bd.totalFin > 0 && (
                <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                  {bd.totalFin} FinOps
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const currentTabKey = expandedInnerTab || 'all';
  const displayedIssues = getCategoryFilteredIssues(
    job,
    auditTab === 'my-actions' ? 'all' : currentTabKey,
    userRole,
    auditTab === 'my-actions'
  );

  const categoryTabs: SharedTabItem<string>[] = [
    { id: 'all', label: 'ALL', count: bd.total },
    { id: 'it', label: 'IT', count: bd.totalIT },
    { id: 'finops', label: 'FINOPS', count: bd.totalFin },
    { id: 'completed', label: 'COMPLETED', count: bd.completed }
  ];

  // Table columns definition for SharedTable: Issue Title, Function (IT/FinOps), Criticality, Stage, Owner, Action Buttons
  const issueColumns: TableColumn<any>[] = [
    {
      id: 'title',
      label: 'ISSUE TITLE',
      align: 'left',
      width: '280px',
      render: (iss: any) => (
        <span
          style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#1E293B',
            lineHeight: '1.4',
            display: 'block'
          }}
        >
          {iss.title || iss.header || iss.id}
        </span>
      )
    },
    {
      id: 'function',
      label: 'FUNCTION',
      align: 'center',
      width: '85px',
      render: (iss: any) => {
        const isIT = isITIssue(iss);
        return (
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#1E293B'
            }}
          >
            {isIT ? 'IT' : 'FinOps'}
          </span>
        );
      }
    },
    {
      id: 'criticality',
      label: 'CRITICALITY',
      align: 'center',
      width: '105px',
      render: (iss: any) => {
        const crit = (iss.criticality || 'Minor').trim();
        const critLower = crit.toLowerCase();
        let color = '#087D0D'; // Minor green
        if (critLower.includes('crit')) {
          color = '#eb1700'; // Critical red
        } else if (critLower.includes('maj') || critLower.includes('med') || critLower.includes('amb')) {
          color = '#ff8200'; // Major amber
        }

        return (
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 700,
              color: color
            }}
          >
            {crit}
          </span>
        );
      }
    },
    {
      id: 'stage',
      label: 'STAGE',
      align: 'left',
      width: '160px',
      render: (iss: any) => {
        const s = (iss.status || '').toLowerCase();
        const lvl = (iss.currentLevel || '').toLowerCase();

        let label = 'Pending Staff';
        if (s === 'completed' || lvl.includes('signed off') || lvl.includes('completed')) {
          label = 'Completed';
        } else if (s.includes('vp') || lvl.includes('vp')) {
          label = 'Pending VP';
        } else if (s.includes('director') || lvl.includes('director')) {
          label = 'Pending Director';
        } else if (s.includes('business') || lvl.includes('business')) {
          label = 'Pending with Business';
        } else if (s.includes('manager') || lvl.includes('manager')) {
          label = 'Pending Manager';
        } else if (s.includes('tc') || lvl.includes('tc') || lvl.includes('coordinator')) {
          label = 'Pending TC';
        } else if (s.includes('draft') || lvl.includes('draft') || lvl.includes('auditor') || s.includes('staff')) {
          label = 'Pending Staff';
        } else if (iss.status) {
          label = iss.status;
        }

        return (
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#1E293B',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </span>
        );
      }
    },
    {
      id: 'owner',
      label: 'OWNER',
      align: 'left',
      width: '140px',
      render: (iss: any) => {
        const ownerName = getIssueOwner(iss, job);
        return (
          <span
            style={{
              fontSize: '12.5px',
              fontWeight: 600,
              color: '#1E293B',
              whiteSpace: 'nowrap'
            }}
          >
            {ownerName}
          </span>
        );
      }
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      align: 'right',
      width: '230px',
      render: (iss: any) => {
        const editable = canEditIssue(iss);

        return (
          <div
            className="inner-row-action-buttons"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}
          >
            {!editable ? (
              /* View Only for different function */
              <SharedTooltip title="View Issue (Read-Only)" placement="top">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWorkOnReport(job, 'audit');
                  }}
                  className="shared-table-action-btn"
                  aria-label="View Issue (Read-Only)"
                >
                  View
                </button>
              </SharedTooltip>
            ) : (
              /* Same Function: Order = Edit, Workflow, Track Changes */
              <>
                {/* 1. Edit */}
                <SharedTooltip title="Edit Issue in Studio" placement="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkOnReport(job, 'audit');
                    }}
                    className="shared-table-action-btn"
                    aria-label="Edit Issue in Studio"
                  >
                    Edit
                  </button>
                </SharedTooltip>

                {/* 2. Workflow */}
                <SharedTooltip title="View Workflow Pipeline" placement="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkflowModalIssue(iss);
                    }}
                    className="shared-table-action-btn"
                    aria-label="View Workflow Pipeline"
                  >
                    Workflow
                  </button>
                </SharedTooltip>

                {/* 3. Track Changes */}
                <SharedTooltip title="Track Changes & Event History" placement="top">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrackChangesIssue(iss);
                    }}
                    className="shared-table-action-btn"
                    aria-label="Track Changes & Event History"
                  >
                    Track Changes
                  </button>
                </SharedTooltip>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Action Buttons Group (Shared between Collapsed hover actions and Expanded permanent header actions)
  const renderActionButtons = (isExpandedMode: boolean) => (
    <div
      className={isExpandedMode ? 'audit-queue-row-actions-expanded' : 'audit-queue-row-actions'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'flex-end',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...(isExpandedMode ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'none' } : {})
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SharedTooltip title="Create New Issue" placement="top">
        <button
          className="audit-queue-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreateForJob(job);
          }}
          style={{
            padding: '5px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#000099',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="Create New Issue"
        >
          <Plus size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />
          <span>Issue</span>
        </button>
      </SharedTooltip>

      {!isNotStarted && (
        <SharedTooltip title="Open Audit Report" placement="top">
          <button
            className="audit-queue-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onWorkOnReport(job, 'audit');
            }}
            style={{
              padding: '5px 11px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#000099',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '5px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
            aria-label="Open Audit Report"
          >
            <PlayCircle size={13} style={{ flexShrink: 0 }} />
            <span className="audit-queue-btn-label-full">Audit Report</span>
            <span className="audit-queue-btn-label-compact">Audit</span>
          </button>
        </SharedTooltip>
      )}

      <SharedTooltip title="Open Executive Report" placement="top">
        <button
          className="audit-queue-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onWorkOnReport(job, 'executive');
          }}
          style={{
            padding: '5px 10px',
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#000099',
            backgroundColor: '#EFF6FF',
            border: '1px solid #BFDBFE',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="Open Executive Report"
        >
          <ExternalLink size={12} style={{ flexShrink: 0 }} />
          <span className="audit-queue-btn-label-full">Executive Report</span>
          <span className="audit-queue-btn-label-compact">Executive</span>
        </button>
      </SharedTooltip>

      <SharedTooltip title="View Details Drawer" placement="top">
        <button
          className="audit-queue-action-btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelectReportingJob(job.id);
          }}
          style={{
            padding: '5px 8px',
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '5px',
            cursor: 'pointer',
            color: '#64748B',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="View Details Drawer"
        >
          <Info size={13} style={{ flexShrink: 0 }} />
        </button>
      </SharedTooltip>

    </div>
  );

  return (
    <div className={`audit-queue-card-group ${isExpanded ? 'is-expanded' : ''}`}>
      {/* 
        Unified Header / Primary Row Card:
        Keeps its own closed border at the exact same position, whether collapsed or expanded.
      */}
      <div
        className={`audit-queue-card audit-queue-card-summary ${auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout'} ${isExpanded ? 'is-expanded expanded' : ''}`}
        onClick={() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          onToggleExpand();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        style={{
          marginBottom: isExpanded ? '10px' : '12px'
        }}
      >
        {/* 1. Red Plus / Minus Toggle Button (Column 1: 44px) - Clean button without tooltip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onToggleExpand();
            }}
            aria-label={isExpanded ? 'Collapse findings workbench' : 'Expand findings workbench'}
          >
            {isExpanded ? (
              <Minus size={20} color="#eb1700" strokeWidth={2.8} />
            ) : (
              <Plus size={20} color="#eb1700" strokeWidth={2.8} />
            )}
          </button>
        </div>

          {/* 2. Engagement Title (Matching AccordionGroup with Parent Header: 15px font-medium text-slate-700, truncated with ellipsis + SharedTooltip on hover) */}
          <div style={{ paddingRight: '12px', minWidth: 0, overflow: 'hidden' }}>
            <SharedTooltip
              title={job.fileName || job.engagement}
              placement="top"
              wrapperStyle={{ display: 'block', minWidth: 0, width: '100%', overflow: 'hidden' }}
            >
              <div
                style={{
                  fontWeight: 500,
                  color: '#334155',
                  fontSize: '15px',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  minWidth: 0,
                }}
              >
                {job.fileName || job.engagement}
              </div>
            </SharedTooltip>
          </div>

          {/* 3. Strength Indication (Matching AccordionGroup with Parent Header: 13px font-medium text-slate-700) */}
          <div style={{ paddingRight: '8px' }}>
            {renderEngagementStatusPill(wf.status)}
          </div>

        {/* 
          Remaining Columns:
          - When Collapsed (!isExpanded): Render regular columns (Issues, Queue, Owner, In-Progress, Completed, Hover Actions).
          - When Expanded (isExpanded): Hide action issues, queue, owner, and show action buttons (+ Issue, Audit Report, Executive Report, Info, Full Screen) ALWAYS visible.
        */}
        {!isExpanded ? (
          <>
            {/* When My Action Audits: Action Issues is placed right next to Status */}
            {auditTab === 'my-actions' && renderIssuesBreakdownCell()}

          {/* Current Queue (Componentized QueueRolePillGroup with short abbreviations) */}
          <div style={{ paddingRight: '8px' }}>
            <QueueRolePillGroup roles={wf.queueList} />
          </div>

          {/* Current Owner (Componentized UserTablePill with 1st user + +N hover) */}
          <div style={{ paddingRight: '8px' }}>
            <UserTablePill owners={wf.owners} queue={wf.queue} />
          </div>

          {/* When All Associated Audits: Total Issues is placed here */}
          {auditTab === 'all-associated' && renderIssuesBreakdownCell()}

          {/* 7. In-Progress & 8. Completed Breakdown (Only for All Associated Audits per user specification) */}
          {auditTab === 'all-associated' && (
            <>
              {/* In-Progress Issues Breakdown */}
              <div style={{ textAlign: 'center' }}>
                {isNotStarted ? (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>-</span>
                ) : (
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#212121' }}>
                      {bd.inProgress}
                    </span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {bd.inProgressIT > 0 && (
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                          {bd.inProgressIT} IT
                        </span>
                      )}
                      {bd.inProgressFin > 0 && (
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                          {bd.inProgressFin} FinOps
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Completed Issues Breakdown */}
              <div style={{ textAlign: 'center' }}>
                {isNotStarted ? (
                  <span style={{ fontSize: '11px', color: '#94A3B8' }}>-</span>
                ) : (
                  <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#212121' }}>
                      {bd.completed}
                    </span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {bd.completedIT > 0 && (
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#087d0d', border: '1px solid #a7f3d0' }}>
                          {bd.completedIT} IT
                        </span>
                      )}
                      {bd.completedFin > 0 && (
                        <span style={{ padding: '1px 4px', borderRadius: '3px', fontSize: '9px', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#087d0d', border: '1px solid #a7f3d0' }}>
                          {bd.completedFin} FinOps
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
            {/* Actions: Visible on Hover in Collapsed Mode */}
            {renderActionButtons(false)}
          </>
        ) : (
          /* Expanded Mode: Spans from grid line 4 to the end (-1) with Actions ALWAYS visible */
          <div
            style={{
              gridColumn: '4 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {renderActionButtons(true)}
          </div>
        )}
      </div>

      {/* 
        Expanded Content Area (Animated with Accordion Slide):
        Rendered underneath the closed primary row, Category Tabs & Issues Sub-Table smoothly expand/collapse.
      */}
      <Collapse in={isExpanded} timeout={300} unmountOnExit={false}>
        <div
          style={{
            paddingLeft: '58px',
            paddingRight: '0',
            marginBottom: '16px'
          }}
        >
          {/* Category Tabs: ALL, IT, FINOPS, COMPLETED (Only on All Associated Audits per user specification) */}
          {auditTab === 'all-associated' && (
            <div style={{ marginBottom: '10px' }}>
              <SharedTabs
                items={categoryTabs}
                value={currentTabKey}
                onChange={onChangeInnerTab}
                variant="workbench"
                size="small"
                ariaLabel="Finding category filter tabs"
              />
            </div>
          )}

          {/* Issues Sub-Table rendered with SharedTable (Harmonized with Dashboards - Embedded Table) */}
          <div className="overflow-x-auto">
            <SharedTable
              columns={issueColumns}
              rows={displayedIssues}
              rowKey={(row: any) => row.id}
              showPagination={false}
              noBorder={false}
              emptyMessage="No issues match this category filter."
            />
          </div>
        </div>
      </Collapse>

      {/* Issue Workflow Pipeline Modal */}
      {workflowModalIssue && (
        <WorkflowModal
          isOpen={!!workflowModalIssue}
          onClose={() => setWorkflowModalIssue(null)}
          job={job}
          title={`Workflow Pipeline — ${workflowModalIssue.title || workflowModalIssue.header || job.fileName}`}
          type="audit"
        />
      )}

      {/* Issue Track Changes Log Modal */}
      {trackChangesIssue && (
        <IssueLogsDialog
          open={!!trackChangesIssue}
          onClose={() => setTrackChangesIssue(null)}
          issueId={trackChangesIssue.id || 'ISSUE-001'}
          issueTitle={trackChangesIssue.title || trackChangesIssue.header || 'Finding'}
          logs={[]}
        />
      )}
    </div>
  );
};

export default AuditQueueCardRow;
