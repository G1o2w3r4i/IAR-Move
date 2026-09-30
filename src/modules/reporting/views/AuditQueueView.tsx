import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Filter,
  ArrowUpDown,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import {
  assessments,
  getInitialReportingJobs,
  getEngagementWorkflowState,
  isAuditNeedingAction,
  getRoleDetails,
} from '../utils/reportingWorkflowEngine';
import { ReportingDetailDrawer } from '../components/ReportingDetailDrawer';
import { CreateIssueDialog } from '../components/CreateIssueDialog';
import { AuditQueueCardRow } from '../components/AuditQueueCardRow';
import {
  SharedTabs,
  type SharedTabItem,
  SharedFilterSelect,
  type FilterOption,
  SharedSearchInput,
  SharedTooltip
} from '../../../components/shared';

const STATUS_OPTIONS = [
  { id: 'Not Started', label: 'Not Started', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  { id: 'Audit Report Inprogress', label: 'Audit Report Inprogress', color: '#000099', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'Executive Report Inprogress', label: 'Executive Report Inprogress', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  { id: 'Completed', label: 'Completed', color: '#087D0D', bg: '#F0FDF4', border: '#BBF2D0' }
];

export const AuditQueueView: React.FC = () => {
  const { setSelectedEngagementId, setActiveReportingView, setActiveEngagement } = useEngagement();
  const { activeRole } = useUserSession();
  const userRole = activeRole?.id || 'it-manager';

  const [jobs, setJobs] = useState<any[]>(getInitialReportingJobs);
  const [auditTab, setAuditTab] = useState<'my-actions' | 'all-associated'>('my-actions');

  // Filter Toolbar States (Driven by Shared Components)
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Memoized filter options for SharedFilterSelect (Loads only years: 2024, 2025, 2026, 2027)
  const assessmentOptions: FilterOption[] = useMemo(() => {
    return assessments.map((asm: any) => {
      const asmCount = jobs.filter(
        (j) => (j.assessmentId || (j.id.startsWith('2025') ? 'ASM-2025' : j.id.startsWith('2027') ? 'ASM-2027' : 'ASM-2026')) === asm.id
      ).length;
      const isClosed = asm.status === 'Closed';
      return {
        value: asm.id,
        label: String(asm.year || (asm.name.match(/\d{4}/)?.[0]) || asm.name),
        count: asmCount,
        tag: asm.status,
        tagColor: isClosed
          ? { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }
          : { bg: '#ECFDF5', text: '#087D0D', border: '#A7F3D0' }
      };
    });
  }, [jobs]);

  const statusOptions: FilterOption[] = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => {
      const optCount = jobs.filter((j) => getEngagementWorkflowState(j).status === opt.id).length;
      return {
        value: opt.id,
        label: opt.label,
        count: optCount,
        tagColor: { bg: opt.bg, text: opt.color, border: opt.border }
      };
    });
  }, [jobs]);

  // Workbench & Expansion States
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedInnerTabs, setExpandedInnerTabs] = useState<Record<string, string>>({});

  // Sorting State
  const [sortField, setSortField] = useState<string>('lastUpdated');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Drawer & Dialog States
  const [selectedReportingJobId, setSelectedReportingJobId] = useState<string | null>(null);
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedJobForIssue, setSelectedJobForIssue] = useState<any | null>(null);
  const [sendToDropdownIssueId, setSendToDropdownIssueId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ title: string; description: string } | null>(null);

  // Close custom issue action dropdown on click outside
  useEffect(() => {
    function handleClickOutside() {
      setSendToDropdownIssueId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Toast Auto-Dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const userRoleDetails = useMemo(() => getRoleDetails(userRole), [userRole]);
  const isBusinessRole = userRoleDetails.baseRole === 'primary-business-contact';

  // Navigation handlers
  const handleWorkOnReport = (job: any, type: 'audit' | 'executive') => {
    setSelectedEngagementId(job.id);
    setActiveEngagement(job);
    setActiveReportingView(type === 'audit' ? 'audit-studio' : 'executive-studio');
  };

  const handleOpenCreateForJob = (job: any) => {
    setSelectedJobForIssue(job);
    setIsCreateDrawerOpen(true);
  };

  const handleSaveNewIssue = (newIssueData: any) => {
    if (selectedJobForIssue) {
      const newIssue = {
        id: `ISSUE-${Date.now().toString().slice(-4)}`,
        title: newIssueData.title || 'New Finding',
        header: newIssueData.title || 'New Finding',
        criticality: newIssueData.criticality || 'Major',
        status: 'Drafting',
        currentLevel: 'Auditor Drafting',
        createdBy: activeRole?.label || 'Marcus Vance',
        lastEditedBy: activeRole?.label || 'Marcus Vance',
        lastUpdated: new Date().toISOString().split('T')[0],
        tech: activeRole?.domain || 'IT',
        ...newIssueData
      };

      setJobs(prev =>
        prev.map(j => {
          if (j.id === selectedJobForIssue.id) {
            const updatedIssues = [...(j.issuesList || []), newIssue];
            return {
              ...j,
              status: j.status === 'Not Started' ? 'In Progress' : j.status,
              subStatus: 'Audit Report In Progress',
              issuesList: updatedIssues
            };
          }
          return j;
        })
      );

      setToastMessage({
        title: 'Issue Created Successfully',
        description: `New issue "${newIssue.title}" added to ${selectedJobForIssue.id}.`
      });
    }
    setIsCreateDrawerOpen(false);
    setSelectedJobForIssue(null);
  };

  const handleSendToRole = (jobId: string, issueId: string, targetStageObj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'In Progress',
            issuesList: (j.issuesList || []).map((iss: any) =>
              iss.id === issueId
                ? {
                    ...iss,
                    currentLevel: targetStageObj.id,
                    status: targetStageObj.id === 'VP Sign-Off' ? 'Completed' : 'In Review'
                  }
                : iss
            )
          };
        }
        return j;
      })
    );
    setToastMessage({
      title: `Issue Sent to ${targetStageObj.role}`,
      description: `Issue current stage updated to ${targetStageObj.label}.`
    });
    setSendToDropdownIssueId(null);
  };

  // Badges counts for Primary Tabs
  const myActionAuditsCount = useMemo(() => {
    return jobs.filter(j => {
      if (isBusinessRole) {
        return (
          (j.issuesList || []).some((iss: any) => (iss.status || '').toLowerCase().includes('business')) ||
          (j.status || '').toLowerCase().includes('business') ||
          (j.subStatus || '').toLowerCase().includes('business')
        );
      }
      return isAuditNeedingAction(j, userRole);
    }).length;
  }, [jobs, isBusinessRole, userRole]);

  const allAssociatedAuditsCount = useMemo(() => {
    return jobs.filter(j => {
      if (isBusinessRole) {
        return (
          (j.issuesList || []).some((iss: any) => (iss.status || '').toLowerCase().includes('business')) ||
          (j.status || '').toLowerCase().includes('business') ||
          (j.subStatus || '').toLowerCase().includes('business')
        );
      }
      return true;
    }).length;
  }, [jobs, isBusinessRole]);

  const primaryTabItems: SharedTabItem<'my-actions' | 'all-associated'>[] = useMemo(() => [
    {
      id: 'my-actions',
      label: 'My Action Audits',
      count: myActionAuditsCount
    },
    {
      id: 'all-associated',
      label: 'All Associated',
      count: allAssociatedAuditsCount
    }
  ], [myActionAuditsCount, allAssociatedAuditsCount]);

  // Filtering Logic
  const filteredJobs = useMemo(() => {
    return jobs
      .filter(job => {
        if (isBusinessRole) {
          const hasBusinessIssue = (job.issuesList || []).some((iss: any) =>
            (iss.status || '').toLowerCase().includes('business')
          );
          const isJobBusiness =
            (job.status || '').toLowerCase().includes('business') ||
            (job.subStatus || '').toLowerCase().includes('business');
          if (!hasBusinessIssue && !isJobBusiness) return false;
        }

        // Assessment Filter (Multi-Select)
        if (selectedAssessments.length > 0) {
          const jobAsm =
            job.assessmentId ||
            (job.id.startsWith('2025') ? 'ASM-2025' : job.id.startsWith('2027') ? 'ASM-2027' : 'ASM-2026');
          if (!selectedAssessments.includes(jobAsm)) return false;
        }

        // Primary Category Tab Filter
        if (auditTab === 'my-actions' && !isBusinessRole) {
          if (!isAuditNeedingAction(job, userRole)) return false;
        }

        // Status Filter
        if (selectedStatuses.length > 0) {
          const wfState = getEngagementWorkflowState(job);
          if (!selectedStatuses.includes(wfState.status)) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const wfState = getEngagementWorkflowState(job);
          const match =
            job.id.toLowerCase().includes(q) ||
            (job.engagement && job.engagement.toLowerCase().includes(q)) ||
            (job.fileName && job.fileName.toLowerCase().includes(q)) ||
            wfState.status.toLowerCase().includes(q) ||
            wfState.queue.toLowerCase().includes(q) ||
            wfState.ownerText.toLowerCase().includes(q) ||
            (job.assessmentName && job.assessmentName.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'lastUpdated') {
          const dateA = new Date((a.lastUpdated || '').replace(' ', 'T')).getTime() || 0;
          const dateB = new Date((b.lastUpdated || '').replace(' ', 'T')).getTime() || 0;
          return sortAsc ? dateA - dateB : dateB - dateA;
        }
        let valA: string, valB: string;
        if (sortField === 'engagement') {
          valA = a.fileName || a.engagement || '';
          valB = b.fileName || b.engagement || '';
        } else if (sortField === 'status' || sortField === 'subStatus') {
          valA = getEngagementWorkflowState(a).status;
          valB = getEngagementWorkflowState(b).status;
        } else if (sortField === 'currentQueue') {
          valA = getEngagementWorkflowState(a).queue;
          valB = getEngagementWorkflowState(b).queue;
        } else if (sortField === 'currentOwner') {
          valA = getEngagementWorkflowState(a).ownerText;
          valB = getEngagementWorkflowState(b).ownerText;
        } else {
          valA = (a[sortField] || '').toString();
          valB = (b[sortField] || '').toString();
        }
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    jobs,
    isBusinessRole,
    selectedAssessments,
    auditTab,
    userRole,
    selectedStatuses,
    searchQuery,
    sortField,
    sortAsc
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSelectedAssessments([]);
    setSearchQuery('');
  };

  const isFilterActive =
    selectedStatuses.length > 0 || searchQuery.trim() !== '' || selectedAssessments.length > 0;

  const selectedReportingJob = useMemo(() => {
    return jobs.find(j => j.id === selectedReportingJobId) || null;
  }, [jobs, selectedReportingJobId]);

  return (
    <div className="full-width-queue" style={{ position: 'relative', width: '100%', padding: '16px 20px' }}>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            backgroundColor: '#000099',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0, 0, 153, 0.3)',
            animation: 'fadeInScale 0.2s ease-out',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            maxWidth: '380px'
          }}
        >
          <CheckCircle2 size={20} color="#6EE7B7" />
          <div>
            <div style={{ fontWeight: 800, fontSize: '13px' }}>{toastMessage.title}</div>
            <div style={{ fontSize: '11.5px', opacity: 0.9 }}>{toastMessage.description}</div>
          </div>
        </div>
      )}

      {/* Primary Category Tab Filter Navigation: 'My Action Audits' vs 'All Associated' (MUI SharedTabs) */}
      <SharedTabs<'my-actions' | 'all-associated'>
        items={primaryTabItems}
        value={auditTab}
        onChange={(newTab) => setAuditTab(newTab)}
        ariaLabel="Audit Queue primary tabs"
      />

      {/* Single-Row Filter Toolbar (Using Shared Components - Spanning Full Width) */}
      <div
        className="single-row-filter-panel"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', marginBottom: '24px' }}
      >
          {/* 1. Search Engagements Input (Expands to occupy remaining width) */}
          <div style={{ flex: '1 1 auto', minWidth: '280px' }}>
            <SharedSearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search Job ID, engagement..."
              size="small"
              clearable
              showDropdownArrow={false}
              fullWidth
            />
          </div>

          {/* 2. Status Multi-Select Filter (minWidth set to stably fit 'Executive Report Inprogress' without expanding) */}
          <SharedFilterSelect
            label="Status"
            placeholder="All Statuses"
            allOptionLabel="All Statuses"
            startIcon={<Filter size={13} />}
            options={statusOptions}
            value={selectedStatuses}
            onChange={(newVal) => setSelectedStatuses(newVal)}
            totalCount={jobs.length}
            minWidth={275}
            menuWidth={290}
          />

          {/* 3. Assessment Multi-Select Filter (Loads only years: 2024, 2025, 2026, 2027) */}
          <SharedFilterSelect
            label="Assessment"
            placeholder="All Assessments"
            allOptionLabel="All Assessments"
            startIcon={<Calendar size={13} />}
            options={assessmentOptions}
            value={selectedAssessments}
            onChange={(newVal) => setSelectedAssessments(newVal)}
            totalCount={jobs.length}
            minWidth={170}
            menuWidth={240}
          />

          {/* Always-present Clear Filters Icon Button with Componentized Tooltip */}
          <SharedTooltip
            title={isFilterActive ? 'Clear filters' : 'Clear filters'}
            placement="top"
          >
            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!isFilterActive}
              aria-label="Clear filters"
              style={{
                width: '36px',
                height: '36px',
                minWidth: '36px',
                minHeight: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFilterActive ? '#EFF6FF' : '#F8FAFC',
                border: isFilterActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                borderRadius: '4px',
                cursor: isFilterActive ? 'pointer' : 'not-allowed',
                transition: 'all 0.15s ease',
                flexShrink: 0,
                padding: 0,
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onMouseEnter={(e) => {
                if (isFilterActive) {
                  e.currentTarget.style.backgroundColor = '#DBEAFE';
                  e.currentTarget.style.borderColor = '#93C5FD';
                }
              }}
              onMouseLeave={(e) => {
                if (isFilterActive) {
                  e.currentTarget.style.backgroundColor = '#EFF6FF';
                  e.currentTarget.style.borderColor = '#BFDBFE';
                }
              }}
            >
              <RotateCcw
                size={15}
                color={isFilterActive ? '#000099' : '#94A3B8'}
                strokeWidth={2.2}
              />
            </button>
          </SharedTooltip>
        </div>

      {/* Queue Table Layout with Header Grid & Expandable Cards */}
      <div className="audit-queue-scroll-container">
        <div className="audit-queue-table-layout">
          {/* Header Grid (Aligned with Card Summaries - Transparent background, no heavy borders) */}
          <div className={`audit-queue-header-grid ${auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout'}`}>
            {/* Column 1: Expand Spacer */}
            <div style={{ width: '44px', textAlign: 'center' }}></div>

            {/* Column 2: Engagement */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('engagement')}
            >
              <span>Engagement</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* Column 3: Engagement Status */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('status')}
            >
              <span>Status</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* When My Action Audits: Action Issues is placed right next to Status (clean text, no tooltip) */}
            {auditTab === 'my-actions' && (
              <div className="audit-queue-header-col center">
                <span>Action Issues</span>
              </div>
            )}

            {/* Current Queue */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('currentQueue')}
            >
              <span>Current Queue</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* Current Owner */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('currentOwner')}
            >
              <span>Current Owner</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* When All Associated Audits: Total Issues is placed here */}
            {auditTab === 'all-associated' && (
              <div className="audit-queue-header-col center">
                <span>Total Issues</span>
              </div>
            )}

            {/* Columns: In-Progress & Completed (Only for All Associated Audits per user specification) */}
            {auditTab === 'all-associated' && (
              <>
                <div className="audit-queue-header-col center">
                  <span>In-Progress</span>
                </div>
                <div className="audit-queue-header-col center">
                  <span>Completed</span>
                </div>
              </>
            )}

            {/* Column: Actions */}
            <div className="audit-queue-header-col right">
              <span>Actions</span>
            </div>
          </div>

          {/* Cards List or Empty State */}
          {filteredJobs.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #d8d8d8',
                color: '#64748B'
              }}
            >
              <Filter size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontWeight: 700, color: '#334155' }}>
                {auditTab === 'my-actions' ? 'No audits currently requiring your action' : 'No reporting jobs matched your filters'}
              </p>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
                {auditTab === 'my-actions'
                  ? 'You are all caught up! Switch to "All Associated" to view all audits across the team.'
                  : 'Try clearing your search query or status filters.'}
              </p>
              {auditTab === 'my-actions' && (
                <button
                  type="button"
                  onClick={() => setAuditTab('all-associated')}
                  style={{
                    marginTop: '12px',
                    padding: '6px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#000099',
                    cursor: 'pointer'
                  }}
                >
                  Switch to All Associated Audits
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <AuditQueueCardRow
                key={job.id}
                job={job}
                userRole={userRole}
                isBusinessRole={isBusinessRole}
                auditTab={auditTab}
                isExpanded={expandedRowId === job.id}
                onToggleExpand={() => setExpandedRowId((prev) => (prev === job.id ? null : job.id))}
                expandedInnerTab={expandedInnerTabs[job.id] || 'all'}
                onChangeInnerTab={(tabId) => setExpandedInnerTabs((prev) => ({ ...prev, [job.id]: tabId }))}
                sendToDropdownIssueId={sendToDropdownIssueId}
                setSendToDropdownIssueId={setSendToDropdownIssueId}
                onWorkOnReport={handleWorkOnReport}
                onOpenCreateForJob={handleOpenCreateForJob}
                onSelectReportingJob={(jobId) => setSelectedReportingJobId(jobId)}
                onSendToRole={handleSendToRole}
              />
            ))
          )}
        </div>
      </div>

      {/* Right Reporting Detail Drawer Panel */}
      {selectedReportingJob && (
        <ReportingDetailDrawer
          isOpen={!!selectedReportingJob}
          job={selectedReportingJob}
          userRole={userRole}
          onClose={() => setSelectedReportingJobId(null)}
          onWorkOnReport={handleWorkOnReport}
          onOpenCreateIssue={handleOpenCreateForJob}
        />
      )}

      {/* Create Issue Dialog */}
      {isCreateDrawerOpen && selectedJobForIssue && (
        <CreateIssueDialog
          open={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          engagementId={selectedJobForIssue.id}
          job={selectedJobForIssue}
          engagementName={selectedJobForIssue.title || selectedJobForIssue.engagementName || selectedJobForIssue.name}
          onSave={handleSaveNewIssue}
        />
      )}
    </div>
  );
};
