import React from 'react';

export interface SharedFieldLabelProps {
  label?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Reusable field label component for enterprise forms.
 * Enforces uppercase, compact typography with consistent red required asterisk.
 */
export const SharedFieldLabel: React.FC<SharedFieldLabelProps> = ({
  label,
  required = false,
  error = false,
  disabled = false,
  htmlFor,
  id,
  className = '',
  children,
  style,
}) => {
  if (!label && !children) return null;

  const colorClass = error
    ? 'text-red-600'
    : 'text-slate-700';

  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className={`block text-[11px] font-bold uppercase tracking-wider mb-1.5 transition-colors select-none ${colorClass} ${className}`}
      style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        marginBottom: '6px',
        color: error ? '#dc2626' : '#334155',
        fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
        userSelect: 'none',
        ...style
      }}
    >
      {label || children}
      {required && (
        <span
          style={{
            color: '#eb1700',
            fontWeight: 700,
            marginLeft: '2px',
            fontSize: '12px',
            display: 'inline-block'
          }}
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );
};

export default SharedFieldLabel;
