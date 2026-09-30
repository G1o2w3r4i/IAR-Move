import React, { useState } from 'react';
import {
  X,
  Cpu,
  TrendingUp,
  GitBranch,
  AlertCircle,
  Layers,
  Users
} from 'lucide-react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Box from '@mui/material/Box';
import { SharedTabs } from '../../../components/shared';
import { getIssuesByEngagement, getUsersByEngagementAndRole } from '../utils/reportingWorkflowEngine';

export interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any;
  title?: string;
  type?: 'audit' | 'executive';
}

/**
 * Dynamically resolves an individual issue's progression status across each workflow stage
 */
export const resolveIssueStageStatuses = (issue: any) => {
  const s = (issue.status || '').toLowerCase();
  const currentLvl = (issue.currentLevel || '').toLowerCase();
  const isExcluded = !!issue.isExcluded;

  let staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
  let tc = { label: 'Pending', color: '#94A3B8', bg: '#F8FAFC' };
  let manager = { label: 'Pending', color: '#94A3B8', bg: '#F8FAFC' };
  let director = { label: 'Pending', color: '#94A3B8', bg: '#F8FAFC' };
  let vp = { label: 'Pending', color: '#94A3B8', bg: '#F8FAFC' };
  let business = { label: 'Not Required', color: '#94A3B8', bg: '#F8FAFC' };

  if (s.includes('staff') || s === 'draft' || currentLvl.includes('staff') || currentLvl.includes('drafting')) {
    staff = { label: '⏳ In Progress', color: '#000099', bg: '#EFF6FF' };
  } else if (s.includes('tc') || s.includes('coordinator') || currentLvl.includes('tc')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '⏳ In Progress', color: '#B45309', bg: '#FEF3C7' };
  } else if (s.includes('business') || currentLvl.includes('business')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '⏳ Biz Response', color: '#0284C7', bg: '#F0F9FF' };
    business = { label: '⏳ In Progress', color: '#0284C7', bg: '#F0F9FF' };
  } else if (s.includes('manager') || currentLvl.includes('manager')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '⏳ In Progress', color: '#000099', bg: '#EFF6FF' };
  } else if (s.includes('director') || currentLvl.includes('director')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '⏳ In Progress', color: '#6D28D9', bg: '#F5F3FF' };
  } else if (s.includes('vp') || currentLvl.includes('vp')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    vp = { label: '⏳ In Review', color: '#eb1700', bg: '#FFF1F0' };
  } else if (s === 'signed off' || s === 'completed' || currentLvl.includes('signed off') || currentLvl.includes('completed')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    vp = { label: '✓ Signed Off', color: '#087D0D', bg: '#F0FDF4' };
  }

  return { staff, tc, manager, director, vp, business, isExcluded };
};

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  onClose,
  job,
  title,
  type = 'audit'
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'findings' | 'team'>('pipeline');

  if (!isOpen) return null;

  const currentJob = job || {};
  const jobId = currentJob.jobId || currentJob.id || 'REP-2026-001';
  const displayTitle = title || (type === 'executive' ? 'Executive Summary Workflow Pipeline' : 'Audit Report Workflow Pipeline');

  const realIssues: any[] = currentJob.issuesList && currentJob.issuesList.length > 0
    ? currentJob.issuesList
    : getIssuesByEngagement(jobId);

  const itIssues = realIssues.filter((i: any) => {
    const f = (i.function || i.functionType || i.tech || 'IT').toLowerCase();
    return f.includes('it') || f.includes('tech');
  });

  const finOpsIssues = realIssues.filter((i: any) => {
    const f = (i.function || i.functionType || i.tech || '').toLowerCase();
    return f.includes('finops') || f.includes('fin');
  });

  // Team members
  const tcUsers = getUsersByEngagementAndRole(jobId, 'it-team-coordinator').concat(getUsersByEngagementAndRole(jobId, 'finops-team-coordinator'));
  const mgrUsers = getUsersByEngagementAndRole(jobId, 'it-manager').concat(getUsersByEngagementAndRole(jobId, 'finops-manager'));
  const dirUsers = getUsersByEngagementAndRole(jobId, 'it-director').concat(getUsersByEngagementAndRole(jobId, 'finops-director'));
  const vpUsers = getUsersByEngagementAndRole(jobId, 'it-vp').concat(getUsersByEngagementAndRole(jobId, 'finops-vp'));

  const leadTC = tcUsers[0]?.name || 'Kevin Zhang';
  const leadMgr = mgrUsers[0]?.name || 'Amanda Palmer';
  const leadDir = dirUsers[0]?.name || 'Brian Cox';
  const leadVP = vpUsers[0]?.name || 'Robert Chen';

  const computeDomainMetrics = (issueArray: any[]) => {
    const total = issueArray.length;
    if (total === 0) return { total: 0, tcCompleted: 0, tcActive: 0, mgrCompleted: 0, mgrActive: 0, bizActive: 0, dirActive: 0, vpActive: 0 };
    let tcCompleted = 0, tcActive = 0, mgrCompleted = 0, mgrActive = 0, bizActive = 0, dirActive = 0, vpActive = 0;

    issueArray.forEach(iss => {
      const stage = resolveIssueStageStatuses(iss);
      if (stage.tc.label.includes('Completed')) tcCompleted++;
      if (stage.tc.label.includes('In Progress')) tcActive++;
      if (stage.manager.label.includes('Completed')) mgrCompleted++;
      if (stage.manager.label.includes('In Progress')) mgrActive++;
      if (stage.business.label.includes('In Progress')) bizActive++;
      if (stage.director.label.includes('In Progress')) dirActive++;
      if (stage.vp.label.includes('In Review') || stage.vp.label.includes('Signed Off')) vpActive++;
    });

    return { total, tcCompleted, tcActive, mgrCompleted, mgrActive, bizActive, dirActive, vpActive };
  };

  const itMetrics = computeDomainMetrics(itIssues);
  const finOpsMetrics = computeDomainMetrics(finOpsIssues);

  const getCritDot = (crit?: string) => {
    const c = (crit || 'Minor').toLowerCase();
    let bg = '#087D0D';
    if (c === 'critical') bg = '#eb1700';
    else if (c === 'major') bg = '#ff8200';
    return (
      <span
        style={{
          display: 'inline-block',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: bg,
          marginRight: '6px'
        }}
      />
    );
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      slotProps={{
        paper: {
          style: {
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#ffffff'
          }
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: '18px 24px',
          borderBottom: '1px solid #d8d8d8',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: '#f1f4ff',
              border: '1px solid #c5dbfc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <GitBranch size={20} color="#000099" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#212121', margin: 0 }}>
              {displayTitle}
            </h2>
            <div style={{ fontSize: '11.5px', color: '#63666a', marginTop: '2px' }}>
              Engagement: <strong>{currentJob.fileName || currentJob.engagement || jobId}</strong>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            padding: '6px',
            color: '#63666a',
            borderRadius: '6px'
          }}
        >
          <X size={20} />
        </button>
      </DialogTitle>

      {/* Navigation Sub-Tabs */}
      <Box sx={{ px: '24px', backgroundColor: '#f8fafc' }}>
        <SharedTabs<'pipeline' | 'findings' | 'team'>
          items={[
            { id: 'pipeline', label: 'Workflow Pipeline Canvas', icon: <Layers size={14} /> },
            { id: 'findings', label: `Findings Status Matrix (${realIssues.length})`, icon: <AlertCircle size={14} /> },
            { id: 'team', label: 'Audit Review Team', icon: <Users size={14} /> }
          ]}
          value={activeTab}
          onChange={(tab) => setActiveTab(tab)}
          size="small"
          borderColor="#e2e8f0"
          ariaLabel="Workflow Modal sub-tabs"
        />
      </Box>

      <DialogContent sx={{ p: '24px', backgroundColor: '#f8fafc', maxHeight: '70vh', overflowY: 'auto' }}>
        {/* TAB 1: VISUAL PIPELINE */}
        {activeTab === 'pipeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 5-Tier Overview Bar */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d8d8d8',
                borderRadius: '10px',
                padding: '18px 22px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ fontSize: '12.5px', fontWeight: 800, color: '#000099', textTransform: 'uppercase', marginBottom: '16px' }}>
                Standard 5-Tier Audit Review Lifecycle
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                {[
                  { step: '1', title: 'Auditor Drafting', role: 'Staff Auditor', desc: 'Initial observations & evidence' },
                  { step: '2', title: 'TC Review', role: leadTC, desc: 'Technical & procedural audit' },
                  { step: '3', title: 'Manager Review', role: leadMgr, desc: 'Risk rating & management response' },
                  { step: '4', title: 'Director Review', role: leadDir, desc: 'Quality assurance & reporting' },
                  { step: '5', title: 'VP Sign-Off', role: leadVP, desc: 'Final executive endorsement' }
                ].map((s, idx) => (
                  <div key={s.step} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', minWidth: '130px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          backgroundColor: '#000099',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 800,
                          fontSize: '13px',
                          marginBottom: '8px'
                        }}
                      >
                        {s.step}
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#212121' }}>{s.title}</div>
                      <div style={{ fontSize: '10.5px', color: '#000099', fontWeight: 600 }}>{s.role}</div>
                      <div style={{ fontSize: '9.5px', color: '#63666a', marginTop: '2px' }}>{s.desc}</div>
                    </div>
                    {idx < 4 && (
                      <div style={{ flex: 1, height: '2px', backgroundColor: '#d8d8d8', margin: '0 8px', alignSelf: 'flex-start', marginTop: '16px' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* IT Domain Pipeline */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d8d8d8',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={18} color="#000099" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#212121' }}>
                    IT Audit Stream ({itIssues.length} Findings)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#EFF6FF',
                    color: '#000099',
                    border: '1px solid #BFDBFE'
                  }}
                >
                  TC: {itMetrics.tcCompleted}/{itIssues.length} | Mgr: {itMetrics.mgrCompleted}/{itIssues.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TC Review Stage</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#212121', marginTop: '4px' }}>
                    {itMetrics.tcCompleted === itIssues.length ? 'Completed' : `${itMetrics.tcCompleted} / ${itIssues.length} Done`}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Manager Stage</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#212121', marginTop: '4px' }}>
                    {itMetrics.mgrCompleted === itIssues.length ? 'Completed' : `${itMetrics.mgrCompleted} / ${itIssues.length} Done`}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Business Response</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>
                    {itMetrics.bizActive > 0 ? `${itMetrics.bizActive} Pending` : 'All Cleared'}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Executive Submission</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#eb1700', marginTop: '4px' }}>
                    Ready for Director
                  </div>
                </div>
              </div>
            </div>

            {/* FinOps Domain Pipeline */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #d8d8d8',
                borderRadius: '10px',
                padding: '20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={18} color="#087D0D" />
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#212121' }}>
                    FinOps Audit Stream ({finOpsIssues.length} Findings)
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '3px 10px',
                    borderRadius: '12px',
                    backgroundColor: '#F0FDF4',
                    color: '#087D0D',
                    border: '1px solid #BBF2D0'
                  }}
                >
                  TC: {finOpsMetrics.tcCompleted}/{finOpsIssues.length} | Mgr: {finOpsMetrics.mgrCompleted}/{finOpsIssues.length}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>TC Review Stage</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#212121', marginTop: '4px' }}>
                    {finOpsMetrics.tcCompleted === finOpsIssues.length ? 'Completed' : `${finOpsMetrics.tcCompleted} / ${finOpsIssues.length} Done`}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Manager Stage</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#212121', marginTop: '4px' }}>
                    {finOpsMetrics.mgrCompleted === finOpsIssues.length ? 'Completed' : `${finOpsMetrics.mgrCompleted} / ${finOpsIssues.length} Done`}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Business Response</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284C7', marginTop: '4px' }}>
                    {finOpsMetrics.bizActive > 0 ? `${finOpsMetrics.bizActive} Pending` : 'All Cleared'}
                  </div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>Executive Submission</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#eb1700', marginTop: '4px' }}>
                    Ready for Director
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FINDINGS STATUS MATRIX */}
        {activeTab === 'findings' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #d8d8d8',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#f4f4f4', borderBottom: '1px solid #d8d8d8', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Finding # &amp; Title</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Stream</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Severity</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Staff</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>TC Review</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Manager</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700, color: '#212121' }}>Director / VP</th>
                </tr>
              </thead>
              <tbody>
                {realIssues.map((iss, index) => {
                  const stage = resolveIssueStageStatuses(iss);
                  const isIT = (iss.tech || iss.function || '').toUpperCase().includes('IT');

                  return (
                    <tr
                      key={iss.id || index}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafc'
                      }}
                    >
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#212121' }}>{iss.id}</div>
                        <div style={{ fontSize: '11.5px', color: '#63666a', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {iss.title || iss.header}
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            backgroundColor: isIT ? '#EFF6FF' : '#F0FDF4',
                            color: isIT ? '#000099' : '#087D0D'
                          }}
                        >
                          {isIT ? 'IT' : 'FinOps'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {getCritDot(iss.criticality || iss.severity)}
                          <span style={{ fontWeight: 700 }}>{iss.criticality || iss.severity || 'Minor'}</span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: stage.staff.color, backgroundColor: stage.staff.bg, padding: '2px 6px', borderRadius: '4px' }}>
                          {stage.staff.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: stage.tc.color, backgroundColor: stage.tc.bg, padding: '2px 6px', borderRadius: '4px' }}>
                          {stage.tc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: stage.manager.color, backgroundColor: stage.manager.bg, padding: '2px 6px', borderRadius: '4px' }}>
                          {stage.manager.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: stage.director.color, backgroundColor: stage.director.bg, padding: '2px 6px', borderRadius: '4px' }}>
                          {stage.director.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: REVIEW TEAM ROSTER */}
        {activeTab === 'team' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {[
              { role: 'Lead Team Coordinator', name: leadTC, title: 'Senior Auditor / IT TC', email: 'kzhang@its.jnj.com' },
              { role: 'Audit Manager', name: leadMgr, title: 'Global Audit Manager', email: 'apalmer@its.jnj.com' },
              { role: 'Audit Director', name: leadDir, title: 'Senior Director, Internal Audit', email: 'bcox@its.jnj.com' },
              { role: 'Vice President (VP)', name: leadVP, title: 'VP, Corporate Internal Audit', email: 'rchen@its.jnj.com' }
            ].map(m => (
              <div
                key={m.role}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #d8d8d8',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px'
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#000099',
                    color: '#ffffff',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '15px'
                  }}
                >
                  {m.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#eb1700', textTransform: 'uppercase' }}>{m.role}</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#212121', marginTop: '2px' }}>{m.name}</div>
                  <div style={{ fontSize: '11.5px', color: '#63666a' }}>{m.title}</div>
                  <div style={{ fontSize: '11px', color: '#000099', marginTop: '2px' }}>{m.email}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
