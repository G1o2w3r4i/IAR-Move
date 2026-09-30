import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { AlertTriangle, X } from 'lucide-react';
import { SharedButton } from '../buttons/SharedButton';

export interface SharedConfirmDialogProps {
  /** Controls open/close state */
  open: boolean;
  /** Dialog heading */
  title?: string;
  /** Detailed confirmation message */
  message?: string;
  /** Text for the confirm/action button (e.g. 'Back', 'Confirm', 'Discard') */
  confirmLabel?: string;
  /** Text for the cancel/abort button (e.g. 'Cancel', 'Stay') */
  cancelLabel?: string;
  /** Callback when user confirms action */
  onConfirm: () => void;
  /** Callback when user cancels or dismisses */
  onCancel: () => void;
  /** Visual severity variant for the confirm action */
  variant?: 'warning' | 'danger' | 'primary';
}

export const SharedConfirmDialog: React.FC<SharedConfirmDialogProps> = ({
  open,
  title = 'Unsaved Changes',
  message = 'Changes have been unsaved. Leaving will discard the generated draft and any modifications. Are you sure you want to go back?',
  confirmLabel = 'Back',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'warning'
}) => {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      maxWidth="sm"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '520px',
          maxWidth: '92vw',
          minHeight: '215px',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle
        sx={{
          p: '20px 24px 0 24px',
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#FFFFFF',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: variant === 'danger' ? '#FEE2E2' : '#FEF3C7',
              border: `1px solid ${variant === 'danger' ? '#FCA5A5' : '#FCD34D'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: variant === 'danger' ? '#DC2626' : '#D97706',
              flexShrink: 0
            }}
          >
            <AlertTriangle size={17} />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '15px',
              fontWeight: 800,
              color: '#0F172A',
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
            }}
          >
            {title}
          </h3>
        </div>

        <button
          type="button"
          onClick={onCancel}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            color: '#64748B',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Close"
        >
          <X size={16} />
        </button>
      </DialogTitle>

      <DialogContent
        sx={{
          px: '24px',
          py: '12px',
          backgroundColor: '#FFFFFF',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '13.5px',
            lineHeight: 1.55,
            color: '#475569',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
          }}
        >
          {message}
        </p>
      </DialogContent>

      <DialogActions
        sx={{
          p: '14px 24px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          flexShrink: 0
        }}
      >
        <SharedButton variant="outline" onClick={onCancel}>
          {cancelLabel}
        </SharedButton>

        <SharedButton
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </SharedButton>
      </DialogActions>
    </Dialog>
  );
};

export default SharedConfirmDialog;
