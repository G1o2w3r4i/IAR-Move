import React from 'react';

export interface ListBoxFilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

export interface SharedListBoxFilterProps<T = string> {
  options: ListBoxFilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'small' | 'medium';
  ariaLabel?: string;
  style?: React.CSSProperties;
  className?: string;
  containerBg?: string;
  selectedBg?: string;
}

/**
 * Standardized Shared List Box Filter Component
 * Horizontal segmented filter displaying options side-by-side with counts
 */
export function SharedListBoxFilter<T extends string = string>({
  options,
  value,
  onChange,
  size = 'small',
  ariaLabel = 'Filter options',
  style,
  className,
  containerBg = '#ffffff',
  selectedBg = '#F1F5F9',
}: SharedListBoxFilterProps<T>) {
  const isSmall = size === 'small';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: containerBg,
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        padding: '2px',
        gap: '2px',
        boxSizing: 'border-box',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        ...style,
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              height: isSmall ? '24px' : '28px',
              padding: isSmall ? '0 8px' : '0 12px',
              fontSize: isSmall ? '11px' : '12px',
              fontWeight: isSelected ? 700 : 500,
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              color: isSelected ? '#000099' : '#475569',
              backgroundColor: isSelected ? selectedBg : 'transparent',
              border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
              borderRadius: '4px',
              cursor: 'pointer',
              boxShadow: isSelected ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
              transition: 'all 0.12s ease',
              whiteSpace: 'nowrap',
              lineHeight: 1,
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.color = '#0F172A';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#475569';
              }
            }}
          >
            {option.icon && (
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {option.icon}
              </span>
            )}
            <span>{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? '#ffffff' : '#E2E8F0',
                  color: isSelected ? '#000099' : '#64748B',
                  border: isSelected ? '1px solid #CBD5E1' : '1px solid transparent',
                  lineHeight: 1,
                  minWidth: '14px',
                  textAlign: 'center',
                }}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
