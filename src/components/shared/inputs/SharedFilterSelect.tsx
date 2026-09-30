import React, { useState, useRef, useId } from 'react';
import Popover from '@mui/material/Popover';
import Checkbox from '@mui/material/Checkbox';
import Box from '@mui/material/Box';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export interface FilterOption<T = string> {
  value: T;
  label: string;
  count?: number;
  tag?: string;
  tagColor?: { bg: string; text: string; border: string };
  disabled?: boolean;
}

export interface SharedFilterSelectProps<T = string> {
  id?: string;
  label: string;
  placeholder?: string;
  options: FilterOption<T>[];
  value: T[];
  onChange: (value: T[]) => void;
  startIcon?: React.ReactNode;
  size?: 'small' | 'medium';
  allOptionLabel?: string;
  totalCount?: number;
  showCount?: boolean;
  minWidth?: number | string;
  menuWidth?: number | string;
  disabled?: boolean;
  className?: string;
  accentArrow?: boolean;
  /** Custom render function for trigger button text */
  renderTriggerText?: (selected: T[], options: FilterOption<T>[]) => string;
}

/**
 * Reusable Enterprise Multi-Select Filter Component.
 * Styled to harmonize with SharedSelect with interactive popover menu,
 * hover highlights, checkbox indicators, count badges, and Primary Blue (#000099) active state.
 */
export const SharedFilterSelect = <T extends string = string>({
  id: externalId,
  label,
  placeholder,
  options,
  value,
  onChange,
  startIcon,
  size = 'small',
  allOptionLabel,
  totalCount,
  showCount = true,
  minWidth = 'auto',
  menuWidth = 300,
  disabled = false,
  className = '',
  accentArrow = false,
  renderTriggerText
}: SharedFilterSelectProps<T>): React.ReactElement => {
  const generatedId = useId();
  const filterId = externalId || `filter-select-${generatedId}`;
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const isOpen = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleToggleOption = (optValue: T) => {
    const exists = value.includes(optValue);
    if (exists) {
      onChange(value.filter((v) => v !== optValue));
    } else {
      onChange([...value, optValue]);
    }
  };

  const handleSelectAll = () => {
    onChange([]);
  };

  const hasActiveFilters = value.length > 0;
  const isAllSelected = value.length === 0;

  // Resolve trigger button label
  const resolvedTriggerText = (): string => {
    if (renderTriggerText) {
      return renderTriggerText(value, options);
    }
    if (isAllSelected) {
      return placeholder || allOptionLabel || `All ${label}s`;
    }
    if (value.length === 1) {
      const match = options.find((opt) => opt.value === value[0]);
      return match ? match.label : String(value[0]);
    }
    return `${label}: ${value.length} Selected`;
  };

  const height = size === 'small' ? '36px' : '40px';
  const fontSize = size === 'small' ? '14px' : '15px';

  return (
    <div className={`inline-block ${className}`} style={{ minWidth }}>
      {/* Trigger Button */}
      <button
        id={filterId}
        ref={buttonRef}
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
          minWidth: minWidth ?? undefined,
          boxSizing: 'border-box',
          height,
          padding: '0 12px',
          backgroundColor: '#ffffff',
          border: '1px solid #CBD5E1',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
          fontSize,
          fontWeight: 400,
          color: hasActiveFilters ? '#1E293B' : '#64748B',
          transition: 'all 0.15s ease',
          outline: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {startIcon && (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                color: hasActiveFilters ? '#000099' : '#64748B',
                transition: 'color 0.15s ease'
              }}
            >
              {startIcon}
            </span>
          )}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize,
              fontWeight: 400,
              color: hasActiveFilters ? '#1E293B' : '#64748B'
            }}
          >
            {resolvedTriggerText()}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {hasActiveFilters && (
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 800,
                borderRadius: '10px',
                padding: '1px 6px',
                backgroundColor: '#000099',
                color: '#ffffff',
                lineHeight: 1.3
              }}
            >
              {value.length}
            </span>
          )}
          <KeyboardArrowDownIcon
            sx={{
              width: '16px',
              height: '16px',
              color: accentArrow ? '#eb1700' : '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </button>

      {/* Popover Dropdown Menu */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        slotProps={{
          paper: {
            sx: {
              mt: '4px',
              width: menuWidth,
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
              overflow: 'hidden',
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
            }
          }
        }}
      >
        {/* Options List */}
        <Box sx={{ maxHeight: '300px', overflowY: 'auto', p: '4px' }}>
          {/* 'All' Option */}
          <Box
            onClick={handleSelectAll}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: '12px',
              py: '6px',
              borderRadius: '4px',
              cursor: 'pointer',
              backgroundColor: isAllSelected ? '#eff6ff' : 'transparent',
              transition: 'background-color 0.15s ease',
              '&:hover': {
                backgroundColor: isAllSelected ? '#dbeafe' : '#f1f5f9'
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Checkbox
                checked={isAllSelected}
                size="small"
                tabIndex={-1}
                disableRipple
                sx={{
                  p: 0,
                  color: '#CBD5E1',
                  '&.Mui-checked': {
                    color: '#000099'
                  }
                }}
              />
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: isAllSelected ? 500 : 400,
                  color: isAllSelected ? '#1d4ed8' : '#334155'
                }}
              >
                {allOptionLabel || `All ${label}s`}
              </span>
            </Box>
            {totalCount !== undefined && showCount && (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isAllSelected ? '#000099' : '#64748B',
                  backgroundColor: isAllSelected ? '#EFF6FF' : '#F1F5F9',
                  padding: '1px 7px',
                  borderRadius: '10px'
                }}
              >
                {totalCount}
              </span>
            )}
          </Box>

          <Box sx={{ borderBottom: '1px solid #F1F5F9', my: '4px' }} />

          {/* Individual Multi-Select Options */}
          {options.map((opt) => {
            const isChecked = value.includes(opt.value);

            return (
              <Box
                key={String(opt.value)}
                onClick={() => handleToggleOption(opt.value)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  px: '12px',
                  py: '6px',
                  borderRadius: '4px',
                  cursor: opt.disabled ? 'not-allowed' : 'pointer',
                  opacity: opt.disabled ? 0.5 : 1,
                  backgroundColor: isChecked ? '#eff6ff' : 'transparent',
                  transition: 'background-color 0.15s ease',
                  '&:hover': {
                    backgroundColor: opt.disabled
                      ? 'transparent'
                      : isChecked
                      ? '#dbeafe'
                      : '#f1f5f9'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, mr: 1 }}>
                  <Checkbox
                    checked={isChecked}
                    disabled={opt.disabled}
                    size="small"
                    tabIndex={-1}
                    disableRipple
                    sx={{
                      p: 0,
                      color: '#CBD5E1',
                      '&.Mui-checked': {
                        color: '#000099'
                      }
                    }}
                  />
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isChecked ? 500 : 400,
                      color: isChecked ? '#1d4ed8' : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {opt.label}
                  </span>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {opt.tag && (
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        backgroundColor: opt.tagColor?.bg || '#F1F5F9',
                        color: opt.tagColor?.text || '#475569',
                        border: `1px solid ${opt.tagColor?.border || '#CBD5E1'}`
                      }}
                    >
                      {opt.tag}
                    </span>
                  )}
                  {opt.count !== undefined && showCount && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: isChecked ? '#000099' : '#64748B',
                        backgroundColor: isChecked ? '#EFF6FF' : '#F1F5F9',
                        padding: '1px 7px',
                        borderRadius: '10px'
                      }}
                    >
                      {opt.count}
                    </span>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Popover>
    </div>
  );
};

export default SharedFilterSelect;
