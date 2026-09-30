import React, { useId } from 'react';
import Checkbox from '@mui/material/Checkbox';
import type { CheckboxProps } from '@mui/material/Checkbox';

export interface SharedCheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  count?: number;
  disabled?: boolean;
  variant?: 'button' | 'standard';
  size?: 'small' | 'medium';
  className?: string;
  slotProps?: {
    checkbox?: Partial<CheckboxProps>;
  };
}

/**
 * Reusable Enterprise Checkbox Component.
 * Supports both filter-toolbar button mode (variant="button") and standard form mode (variant="standard").
 * Adheres to Primary Blue (#000099) theme and J&J design standards.
 */
export const SharedCheckbox: React.FC<SharedCheckboxProps> = ({
  id: externalId,
  checked,
  onChange,
  label,
  count,
  disabled = false,
  variant = 'button',
  size = 'small',
  className = '',
  slotProps
}) => {
  const generatedId = useId();
  const inputId = externalId || `shared-checkbox-${generatedId}`;

  const height = size === 'small' ? '36px' : '40px';
  const fontSize = size === 'small' ? '12.5px' : '13.5px';

  if (variant === 'button') {
    return (
      <div
        id={inputId}
        role="checkbox"
        aria-checked={checked}
        tabIndex={disabled ? -1 : 0}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === ' ' || e.key === 'Enter')) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`inline-flex items-center ${className}`}
        style={{
          height,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '0 12px',
          backgroundColor: checked ? '#eff6ff' : '#ffffff',
          border: checked ? '1px solid #000099' : '1px solid #CBD5E1',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          userSelect: 'none',
          opacity: disabled ? 0.6 : 1,
          fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
          fontSize,
          fontWeight: checked ? 700 : 500,
          color: checked ? '#000099' : '#475569',
          boxShadow: checked
            ? '0 0 0 2px rgba(0, 0, 153, 0.12)'
            : '0 1px 2px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.15s ease',
          outline: 'none'
        }}
      >
        <Checkbox
          checked={checked}
          disabled={disabled}
          size="small"
          disableRipple
          tabIndex={-1}
          sx={{
            p: 0,
            color: '#CBD5E1',
            '&.Mui-checked': {
              color: '#000099'
            }
          }}
          {...slotProps?.checkbox}
        />
        <span>{label}</span>
        {count !== undefined && (
          <span
            style={{
              fontSize: '10.5px',
              fontWeight: 800,
              color: checked ? '#ffffff' : '#64748B',
              backgroundColor: checked ? '#000099' : '#F1F5F9',
              padding: '1px 7px',
              borderRadius: '10px',
              transition: 'all 0.15s ease'
            }}
          >
            {count}
          </span>
        )}
      </div>
    );
  }

  // Standard inline checkbox
  return (
    <label
      htmlFor={inputId}
      className={`inline-flex items-center gap-2 cursor-pointer ${
        disabled ? 'cursor-not-allowed opacity-60' : ''
      } ${className}`}
      style={{
        fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
        fontSize,
        color: '#334155'
      }}
    >
      <Checkbox
        id={inputId}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        size="small"
        disableRipple
        sx={{
          p: 0,
          color: '#CBD5E1',
          '&.Mui-checked': {
            color: '#000099'
          }
        }}
        {...slotProps?.checkbox}
      />
      <span>{label}</span>
      {count !== undefined && (
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#64748B',
            backgroundColor: '#F1F5F9',
            padding: '1px 6px',
            borderRadius: '10px'
          }}
        >
          {count}
        </span>
      )}
    </label>
  );
};

export default SharedCheckbox;
