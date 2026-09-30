import React, { useState, useRef, useEffect } from 'react';
import Drawer from '@mui/material/Drawer';
import {
  ArrowLeft,
  MessageSquare,
  FileText,
  PlayCircle,
  ChevronDown,
  Download,
  GitBranch,
  History,
  Users,
  Layers,
  Plus
} from 'lucide-react';
import { getEngagementWorkflowState, formatUSDateTime } from '../utils/reportingWorkflowEngine';

interface ReportingDetailDrawerProps {
  isOpen: boolean;
  job: any;
  userRole?: string;
  onClose: () => void;
  onWorkOnReport: (job: any, type: 'audit' | 'executive') => void;
  onOpenCreateIssue: (job: any) => void;
  onOpenDiscussionPoints?: (job: any) => void;
  onOpenHistory?: (job: any) => void;
}

export const ReportingDetailDrawer: React.FC<ReportingDetailDrawerProps> = ({
  isOpen,
  job,
  onClose,
  onWorkOnReport,
  onOpenCreateIssue,
  onOpenHistory,
}) => {
  const [isAuditMenuOpen, setIsAuditMenuOpen] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'All' | 'Auditors' | 'Reviewers'>('All');
  const auditMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (auditMenuRef.current && !auditMenuRef.current.contains(event.target as Node)) {
        setIsAuditMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!job) return null;

  const wf = getEngagementWorkflowState(job);
  const { auditReport, executiveSummaryReport, discussionPoints, roster = [] } = job;

  const filteredRoster = roster.filter((m: any) => {
    if (assignmentFilter === 'All') return true;
    if (assignmentFilter === 'Auditors') return (m.role || '').toLowerCase().includes('auditor');
    if (assignmentFilter === 'Reviewers') return !(m.role || '').toLowerCase().includes('auditor');
    return true;
  });

  return (
    <Drawer
      anchor="right"
      open={isOpen}
      onClose={onClose}
      slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' }
        },
        paper: {
          style: {
            width: '520px',
            maxWidth: '92vw',
            backgroundColor: '#f8fafc',
            boxShadow: '-6px 0 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }
        }
      }}
    >
      {/* Full-Width Dark Header Bar */}
      <div
        style={{
          backgroundColor: '#000099',
          color: '#ffffff',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 153, 0.25)',
          flexShrink: 0
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '7px',
            borderRadius: '6px',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)')}
          title="Back to Reporting Queue"
        >
          <ArrowLeft size={18} />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#ffffff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {job.fileName || job.engagement}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#c5dbfc',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                padding: '2px 8px',
                borderRadius: '10px',
                border: '1px solid rgba(197, 219, 252, 0.3)'
              }}
            >
              {job.assessmentName || '2026 Internal Audit Assessments'}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: job.assessmentStatus === 'Closed' ? '#CBD5E1' : '#6EE7B7',
                backgroundColor: 'rgba(0, 0, 0, 0.25)',
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              ● {job.assessmentStatus || 'Open'}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#ffffff',
                backgroundColor: wf.status === 'Completed' ? '#087d0d' : '#eb1700',
                padding: '2px 8px',
                borderRadius: '8px'
              }}
            >
              {wf.status}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#FEF08A',
                backgroundColor: 'rgba(254, 240, 138, 0.15)',
                padding: '2px 8px',
                borderRadius: '8px',
                border: '1px solid rgba(254, 240, 138, 0.3)'
              }}
            >
              Queue: {wf.queue}
            </span>
          </div>
        </div>
      </div>

      {/* Scrollable Body Content */}
      <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* SECTION 1: ISSUES */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={17} color="#eb1700" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#212121', margin: 0 }}>
                Issues & Findings ({job.issuesList?.length || 0})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onOpenCreateIssue(job)}
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#eb1700',
                  backgroundColor: '#fff1f0',
                  border: '1px solid #ffd0cc',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Plus size={13} />
                <span>Add Issue</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Started On</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(discussionPoints?.startDateTime) || '2026-08-01, 8:30 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Last Updated On</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(discussionPoints?.endDateTime) || '2026-08-04, 2:30 PM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Current Lead Auditor</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#000099' }}>
                {job.leadOwner || 'Amanda Palmer'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 2: AUDIT REPORT */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={17} color="#000099" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#212121', margin: 0 }}>
                Audit Report
              </h3>
            </div>

            <div ref={auditMenuRef} style={{ position: 'relative', display: 'flex' }}>
              <button
                onClick={() => onWorkOnReport(job, 'audit')}
                style={{
                  padding: '6px 12px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#000099',
                  border: '1px solid #000099',
                  borderRight: 'none',
                  borderTopLeftRadius: '6px',
                  borderBottomLeftRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <PlayCircle size={14} />
                <span>Work On Report</span>
              </button>

              <button
                onClick={() => setIsAuditMenuOpen(!isAuditMenuOpen)}
                style={{
                  padding: '6px 8px',
                  backgroundColor: '#000077',
                  border: '1px solid #000077',
                  borderLeft: 'none',
                  borderTopRightRadius: '6px',
                  borderBottomRightRadius: '6px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: '#ffffff'
                }}
              >
                <ChevronDown size={14} style={{ transform: isAuditMenuOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {isAuditMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    zIndex: 100,
                    minWidth: '180px',
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <button
                    onClick={() => {
                      alert(`Exporting Audit Report for ${job.id}`);
                      setIsAuditMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#212121',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <Download size={14} color="#000099" />
                    <span>Download Report</span>
                  </button>
                  <button
                    onClick={() => {
                      onWorkOnReport(job, 'audit');
                      setIsAuditMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#212121',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <GitBranch size={14} color="#000099" />
                    <span>View Workflow</span>
                  </button>
                  <button
                    onClick={() => {
                      onOpenHistory && onOpenHistory(job);
                      setIsAuditMenuOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#212121',
                      background: 'none',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <History size={14} color="#63666a" />
                    <span>View Audit Trail</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Validation Status</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: auditReport?.validationStatus === 'Approved' ? '#ecfdf5' : '#eff6ff',
                  color: auditReport?.validationStatus === 'Approved' ? '#087d0d' : '#000099'
                }}
              >
                {auditReport?.validationStatus || 'In Progress'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Validation Started</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(auditReport?.validationStartDateTime) || '2026-08-01, 10:00 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Validation Ended</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(auditReport?.validationEndDateTime) || '2026-08-04, 2:00 PM'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 3: EXECUTIVE SUMMARY REPORT */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={17} color="#4338CA" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#212121', margin: 0 }}>
                Executive Summary Report
              </h3>
            </div>

            <button
              onClick={() => onWorkOnReport(job, 'executive')}
              style={{
                padding: '6px 14px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#4338CA',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <PlayCircle size={14} />
              <span>Executive Report</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Status</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: executiveSummaryReport?.validationStatus === 'Approved' ? '#ecfdf5' : '#f8fafc',
                  color: executiveSummaryReport?.validationStatus === 'Approved' ? '#087d0d' : '#63666a'
                }}
              >
                {executiveSummaryReport?.validationStatus || 'Pending'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Validation Started</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(executiveSummaryReport?.validationStartDateTime) || '2026-08-01, 10:30 AM'}
              </strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#63666a' }}>Validation Ended</span>
              <strong style={{ fontSize: '11.5px', fontWeight: 700, color: '#212121' }}>
                {formatUSDateTime(executiveSummaryReport?.validationEndDateTime) || '2026-08-04, 2:15 PM'}
              </strong>
            </div>
          </div>
        </div>

        {/* SECTION 4: ENGAGEMENT TEAM ASSIGNMENTS */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            padding: '16px 18px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={17} color="#000099" />
              <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#212121', margin: 0 }}>
                Team Roster ({roster.length})
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '4px', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
              {(['All', 'Auditors', 'Reviewers'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setAssignmentFilter(tab)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    fontWeight: assignmentFilter === tab ? 700 : 500,
                    backgroundColor: assignmentFilter === tab ? '#ffffff' : 'transparent',
                    color: assignmentFilter === tab ? '#000099' : '#64748b',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: assignmentFilter === tab ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
            {filteredRoster.length === 0 ? (
              <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>
                No team assignments matching filter.
              </div>
            ) : (
              filteredRoster.map((m: any, idx: number) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #f1f5f9'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: '#f1f4ff',
                        color: '#000099',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: '1px solid #c5dbfc'
                      }}
                    >
                      {m.avatar}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#212121' }}>{m.name}</div>
                      <div style={{ fontSize: '10.5px', color: '#63666a' }}>{m.role}</div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      backgroundColor: m.status === 'Assigned' ? '#eff6ff' : '#f1f5f9',
                      color: m.status === 'Assigned' ? '#000099' : '#475569'
                    }}
                  >
                    {m.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};
