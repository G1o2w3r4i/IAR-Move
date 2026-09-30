import React from 'react';
import type { IssueStatus } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { Send, CheckCircle2, ShieldAlert, Save } from 'lucide-react';

interface WorkflowActionDockProps {
  currentStatus: IssueStatus;
  userRole: string;
  hasCriticalFinding: boolean;
  onAdvanceWorkflow: (targetStatus: IssueStatus) => void;
  onSaveDraft: () => void;
  isSaving?: boolean;
}

export const WorkflowActionDock: React.FC<WorkflowActionDockProps> = ({
  currentStatus,
  userRole,
  hasCriticalFinding,
  onAdvanceWorkflow,
  onSaveDraft,
  isSaving = false,
}) => {
  const roleStr = (userRole || '').toLowerCase();
  const isAuditor = roleStr.includes('auditor');
  const isTC = roleStr.includes('coordinator') || roleStr.includes('tc');
  const isDirector = roleStr.includes('director');
  const isVP = roleStr.includes('vp');
  const isBusiness = roleStr.includes('business') || roleStr.includes('contact');
  const isManager = roleStr.includes('manager') && !isDirector;

  // Determine stage index (0 to 5)
  const getStageIndex = (st: IssueStatus): number => {
    switch (st) {
      case 'Pending Staff': return 0;
      case 'Pending TC': return 1;
      case 'Pending Manager': return 2;
      case 'Pending with Business': return 3;
      case 'Manager Completed':
      case 'Ready for Director Submission':
      case 'Pending Director': return 4;
      case 'Pending VP':
      case 'Signed Off':
      case 'Completed': return 5;
      default: return 1;
    }
  };

  const currentStageIdx = getStageIndex(currentStatus);
  const stages = [
    'Staff Draft',
    'TC Review',
    'Manager Review',
    'Business Response',
    'Director Review',
    'VP Sign-Off',
  ];

  return (
    <footer
      style={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#ffffff',
        borderTop: '1px solid #d8d8d8',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        padding: '12px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        zIndex: 50,
      }}
    >
      {/* 5-Tier Review Workflow Stepper Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#63666a', textTransform: 'uppercase', marginRight: '4px' }}>
          Workflow Stage:
        </span>

        {stages.map((stageName, idx) => {
          const isPassed = idx < currentStageIdx;
          const isCurrent = idx === currentStageIdx;

          return (
            <React.Fragment key={stageName}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: isCurrent ? 800 : 600,
                  backgroundColor: isCurrent ? '#f1f4ff' : isPassed ? '#ebf9ee' : '#f8fafc',
                  color: isCurrent ? '#000099' : isPassed ? '#0f8f4d' : '#94a3b8',
                  border: isCurrent
                    ? '1.5px solid #000099'
                    : isPassed
                    ? '1px solid #bfe8c8'
                    : '1px solid #e2e8f0',
                }}
              >
                {isPassed && <CheckCircle2 size={12} color="#0f8f4d" />}
                <span>{stageName}</span>
              </div>
              {idx < stages.length - 1 && (
                <span style={{ color: '#cbd5e1', fontSize: '10px' }}>&rsaquo;</span>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Critical Finding Gate Alert */}
      {hasCriticalFinding && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            padding: '6px 12px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#eb1700',
          }}
        >
          <ShieldAlert size={14} />
          <span>Mandatory VP Sign-Off Rule Active (Contains Critical Issue)</span>
        </div>
      )}

      {/* Right Side: Role Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <SharedButton
          variant="outline"
          size="medium"
          startIcon={<Save size={15} />}
          onClick={onSaveDraft}
          loading={isSaving}
        >
          Save Draft
        </SharedButton>

        {/* Dynamic Action Buttons based on User Persona & Current Status */}
        {isAuditor && (
          <SharedButton
            variant="primary"
            size="medium"
            startIcon={<Send size={15} />}
            onClick={() => onAdvanceWorkflow('Pending TC')}
          >
            Submit to TC
          </SharedButton>
        )}

        {isTC && (
          <SharedButton
            variant="primary"
            size="medium"
            startIcon={<Send size={15} />}
            onClick={() => onAdvanceWorkflow('Pending Manager')}
          >
            Submit to Manager
          </SharedButton>
        )}

        {isManager && (
          <>
            <SharedButton
              variant="outline"
              size="medium"
              onClick={() => onAdvanceWorkflow('Pending with Business')}
            >
              Send to Business
            </SharedButton>
            <SharedButton
              variant="primary"
              size="medium"
              startIcon={<Send size={15} />}
              onClick={() => onAdvanceWorkflow('Pending Director')}
            >
              Submit to Director
            </SharedButton>
          </>
        )}

        {isBusiness && (
          <SharedButton
            variant="primary"
            size="medium"
            startIcon={<Send size={15} />}
            onClick={() => onAdvanceWorkflow('Pending Director')}
          >
            Submit Response to Director
          </SharedButton>
        )}

        {isDirector && (
          hasCriticalFinding ? (
            <SharedButton
              variant="primary"
              size="medium"
              startIcon={<Send size={15} />}
              onClick={() => onAdvanceWorkflow('Pending VP')}
            >
              Submit to VP
            </SharedButton>
          ) : (
            <SharedButton
              variant="success"
              size="medium"
              startIcon={<CheckCircle2 size={15} />}
              onClick={() => onAdvanceWorkflow('Signed Off')}
            >
              Executive Sign-Off
            </SharedButton>
          )
        )}

        {isVP && (
          <SharedButton
            variant="success"
            size="medium"
            startIcon={<CheckCircle2 size={15} />}
            onClick={() => onAdvanceWorkflow('Signed Off')}
          >
            Executive Sign-Off &amp; Seal
          </SharedButton>
        )}
      </div>
    </footer>
  );
};
