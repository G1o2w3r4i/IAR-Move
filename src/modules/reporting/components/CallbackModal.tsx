import React, { useState, useEffect } from 'react';
import { RotateCcw, X, AlertOctagon } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onConfirmCallback: (issueId: string, reason: string) => void;
}

export const CallbackModal: React.FC<CallbackModalProps> = ({
  isOpen,
  onClose,
  issue,
  onConfirmCallback,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for calling back this issue.');
      return;
    }
    onConfirmCallback(issue.id, reason.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#EDE9FE',
                border: '1px solid #DDD6FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7C3AED',
                flexShrink: 0,
              }}
            >
              <RotateCcw style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Call Back Issue
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: '#EDE9FE',
                    color: '#6D28D9',
                  }}
                >
                  {issue.testProcedureCode || issue.id}
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748B' }}>
                {issue.title || 'Specify the reason for calling back this audit issue.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 22px' }}>
          <label
            htmlFor="callback-reason-input"
            style={{
              display: 'block',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#1E293B',
              marginBottom: '6px',
            }}
          >
            Reason for Call Back <span style={{ color: '#EF4444' }}>*</span>
          </label>
          <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748B', lineHeight: '1.4' }}>
            Please provide details explaining why this issue is being recalled or returned to the previous review stage.
          </p>
          <textarea
            id="callback-reason-input"
            autoFocus
            rows={4}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter reason for callback..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              fontSize: '13px',
              color: '#0F172A',
              backgroundColor: '#FFFFFF',
              border: error ? '1.5px solid #EF4444' : '1px solid #CBD5E1',
              borderRadius: '8px',
              fontFamily: 'inherit',
              resize: 'vertical',
              minHeight: '90px',
              outline: 'none',
              boxShadow: error ? '0 0 0 3px rgba(239, 68, 68, 0.15)' : 'none',
              transition: 'border-color 0.15s ease',
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginTop: '6px',
                color: '#DC2626',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <AlertOctagon style={{ width: '13px', height: '13px' }} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 18px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#475569',
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            style={{
              padding: '8px 20px',
              fontSize: '12.5px',
              fontWeight: 800,
              color: '#FFFFFF',
              backgroundColor: '#7C3AED',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 4px rgba(124, 58, 237, 0.25)',
              transition: 'background-color 0.15s ease',
            }}
          >
            <RotateCcw style={{ width: '13px', height: '13px' }} />
            <span>Confirm Call Back</span>
          </button>
        </div>
      </div>
    </div>
  );
};
