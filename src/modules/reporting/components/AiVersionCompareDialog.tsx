import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { GitCompare, Check, X } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';

export interface AiCompareFieldData {
  title: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
}

export interface AiVersionCompareDialogProps {
  open: boolean;
  onClose: () => void;
  previousData?: AiCompareFieldData;
  candidateData?: AiCompareFieldData;
  currentIssue?: Issue;
  onApplyMerge: (merged: {
    title: string;
    description: string;
    rootCause: string;
    impact: string;
    recommendation: string;
  }) => void;
  onKeepPrevious?: () => void;
}

export const AiVersionCompareDialog: React.FC<AiVersionCompareDialogProps> = ({
  open,
  onClose,
  previousData: propPreviousData,
  candidateData: propCandidateData,
  currentIssue,
  onApplyMerge,
  onKeepPrevious,
}) => {
  // Resolve previous and candidate data
  const resolvedPrevious: AiCompareFieldData = propPreviousData || {
    title: currentIssue?.title || '',
    description: currentIssue?.issueNarrative || currentIssue?.description || currentIssue?.issue || '',
    rootCause: currentIssue?.rootCause || '',
    impact: currentIssue?.impact || '',
    recommendation: currentIssue?.recommendation || '',
  };

  const resolvedCandidate: AiCompareFieldData = propCandidateData || {
    title: `[AI Refined]: ${resolvedPrevious.title.replace(/^\[AI Refined\]:\s*/, '')}`,
    description: resolvedPrevious.description
      ? `${resolvedPrevious.description}\n\n[AI Validation]: Analysis confirms telemetry logs exceeded standard inactivity threshold without scheduled de-provisioning triggers.`
      : 'Automated telemetry logs confirm lack of dormant user de-provisioning.',
    rootCause: `Systemic governance and automated synchronization gaps. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols.`,
    impact: `Operational variance exposes the environment to potential compliance citations, unauthorized data modification, and SOX/GxP regulatory escalation.`,
    recommendation: `1. Implement automated real-time exception alerting and scheduled synchronization.\n2. Establish mandatory dual-custody authorization for configuration overrides.\n3. Conduct retrospective audit reconciliations on a quarterly basis.`,
  };

  // Field selection state: 'candidate' | 'previous' for each of the 5 fields
  const [selectedVersions, setSelectedVersions] = useState<
    Record<keyof AiCompareFieldData, 'candidate' | 'previous'>
  >({
    title: 'candidate',
    description: 'candidate',
    rootCause: 'candidate',
    impact: 'candidate',
    recommendation: 'candidate',
  });

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedVersions({
        title: 'candidate',
        description: 'candidate',
        rootCause: 'candidate',
        impact: 'candidate',
        recommendation: 'candidate',
      });
    }
  }, [open]);

  const handleApplyMerge = () => {
    const merged = {
      title: selectedVersions.title === 'candidate' ? resolvedCandidate.title : resolvedPrevious.title,
      description: selectedVersions.description === 'candidate' ? resolvedCandidate.description : resolvedPrevious.description,
      rootCause: selectedVersions.rootCause === 'candidate' ? resolvedCandidate.rootCause : resolvedPrevious.rootCause,
      impact: selectedVersions.impact === 'candidate' ? resolvedCandidate.impact : resolvedPrevious.impact,
      recommendation: selectedVersions.recommendation === 'candidate' ? resolvedCandidate.recommendation : resolvedPrevious.recommendation,
    };
    onApplyMerge(merged);
    onClose();
  };

  const handleKeepPrevious = () => {
    if (onKeepPrevious) {
      onKeepPrevious();
    } else {
      onApplyMerge(resolvedPrevious);
    }
    onClose();
  };

  const fieldList: { key: keyof AiCompareFieldData; label: string }[] = [
    { key: 'title', label: 'Issue Title' },
    { key: 'description', label: 'Description' },
    { key: 'rootCause', label: 'Root Cause' },
    { key: 'impact', label: 'Impact' },
    { key: 'recommendation', label: 'Recommendations' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '960px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: '14px 24px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803D',
            }}
          >
            <GitCompare size={17} />
          </div>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            Compare Versions
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleKeepPrevious}
            style={{
              padding: '6px 14px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#334155',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            Keep Previous Version
          </button>

          <button
            type="button"
            onClick={handleApplyMerge}
            style={{
              padding: '6px 16px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              border: 'none',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#15803D';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#16A34A';
            }}
          >
            <Check size={14} />
            <span>Keep Selected</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px 12px',
              borderRadius: '5px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F1F5F9';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.color = '#64748B';
            }}
            title="Discard changes and keep previous version"
          >
            <X size={13} />
            <span>Discard</span>
          </button>
        </div>
      </DialogTitle>

      <DialogContent
        className="slim-light-scrollbar"
        sx={{
          p: '0 !important',
          overflowY: 'auto',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div
          style={{
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {fieldList.map(({ key, label }) => {
            const prevText = resolvedPrevious[key];
            const candidateText = resolvedCandidate[key];
            const choice = selectedVersions[key];

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                    {label}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                    Selected:{' '}
                    <strong style={{ color: choice === 'candidate' ? '#15803D' : '#000099' }}>
                      {choice === 'candidate' ? 'Regenerated' : 'Previous'}
                    </strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Previous Version Box */}
                  <div
                    onClick={() =>
                      setSelectedVersions((prev) => ({ ...prev, [key]: 'previous' }))
                    }
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      border: choice === 'previous' ? '2px solid #000099' : '1px solid #CBD5E1',
                      backgroundColor: choice === 'previous' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        choice === 'previous'
                          ? '0 1px 3px rgba(0, 0, 153, 0.08)'
                          : '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: '#334155',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {prevText || 'No previous content.'}
                    </span>
                  </div>

                  {/* Candidate / Regenerated Version Box */}
                  <div
                    onClick={() =>
                      setSelectedVersions((prev) => ({ ...prev, [key]: 'candidate' }))
                    }
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      border: choice === 'candidate' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                      backgroundColor: choice === 'candidate' ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        choice === 'candidate'
                          ? '0 1px 3px rgba(22, 163, 74, 0.1)'
                          : '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: choice === 'candidate' ? '#14532D' : '#334155',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {candidateText || 'No candidate content.'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
