import { useId } from 'react';
import Select from '@mui/material/Select';
import type { SelectChangeEvent, SelectProps } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SharedSelectProps<T = string> {
  label?: string;
  value: T | '';
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  name?: string;
  id?: string;
  className?: string;
  slotProps?: {
    select?: Partial<SelectProps<T>>;
  };
}

/**
 * Reusable controlled Select component for enterprise forms.
 * Combines MUI Select for accessible keyboard/popover behaviors with Tailwind styling.
 */
export function SharedSelect<T extends string | number>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select One',
  required = false,
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  readOnly = false,
  loading = false,
  fullWidth = true,
  size = 'small',
  name,
  id: externalId,
  className = '',
  slotProps,
}: SharedSelectProps<T>) {
  const generatedId = useId();
  const selectId = externalId || `select-${generatedId}`;
  const helperId = `${selectId}-helper`;

  const height = size === 'small' ? '36px' : '40px';
  const fontSize = size === 'small' ? '14px' : '15px';
  const heightClass = size === 'small' ? 'h-9 text-sm' : 'h-10 text-base';

  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  const handleChange = (event: SelectChangeEvent<T>) => {
    onChange(event.target.value as T);
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <SharedFieldLabel
          htmlFor={selectId}
          label={label}
          required={required}
          error={error}
          disabled={disabled}
        />
      )}

      <div
        className={`relative flex items-center rounded border transition-all duration-150 ${heightClass} ${borderClass}`}
        style={{
          height,
          minHeight: height,
          backgroundColor: disabled ? '#FAFAFA' : readOnly ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
        }}
      >
        <Select<T>
          id={selectId}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled || loading}
          readOnly={readOnly}
          displayEmpty
          fullWidth
          IconComponent={(iconProps) =>
            loading ? (
              <div className="mr-2.5 flex items-center">
                <CircularProgress size={16} className="text-slate-400" />
              </div>
            ) : (
              <KeyboardArrowDownIcon
                {...iconProps}
                className={`text-slate-500 mr-1.5 transition-transform duration-150 !w-4 !h-4 ${iconProps.className || ''}`}
              />
            )
          }
          renderValue={(selectedVal) => {
            if (selectedVal === '' || selectedVal === undefined || selectedVal === null) {
              return (
                <span
                  style={{
                    color: '#64748B',
                    fontWeight: 400,
                    fontSize,
                    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
                  }}
                >
                  {placeholder}
                </span>
              );
            }
            const match = (options || []).find((opt) => opt.value === selectedVal);
            return (
              <span
                style={{
                  color: '#1E293B',
                  fontWeight: 400,
                  fontSize,
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
                }}
              >
                {match ? match.label : String(selectedVal)}
              </span>
            );
          }}
          inputProps={{
            'aria-invalid': error,
            'aria-describedby': errorMessage || helperText ? helperId : undefined,
            'aria-required': required,
            id: selectId,
          }}
          sx={{
            height: '100%',
            width: '100%',
            outline: 'none',
            fontSize,
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            color: '#1E293B',
            '&.Mui-disabled': {
              color: '#1E293B !important',
              WebkitTextFillColor: '#1E293B !important',
            },
            '& .MuiSelect-select': {
              paddingLeft: '12px',
              paddingRight: '32px !important',
              paddingTop: 0,
              paddingBottom: 0,
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              cursor: disabled ? 'default' : 'pointer',
              fontSize,
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              fontWeight: 400,
              color: '#1E293B !important',
              '&.Mui-disabled': {
                color: '#1E293B !important',
                WebkitTextFillColor: '#1E293B !important',
              },
            },
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
          }}
          MenuProps={{
            slotProps: {
              paper: {
                className: 'mt-1 rounded-md border border-slate-200 shadow-lg overflow-hidden py-1 max-h-60',
                sx: {
                  '& .MuiMenuItem-root': {
                    fontSize: '14px',
                    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                    paddingY: '6px',
                    paddingX: '12px',
                    color: '#334155',
                    fontWeight: 400,
                    '&.Mui-selected': {
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: '#dbeafe',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#f1f5f9',
                    },
                  },
                },
              },
            },
          }}
          {...slotProps?.select}
        >
          {placeholder && (
            <MenuItem
              value=""
              disabled
              className="text-slate-400 italic"
              style={{
                fontSize: '13px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
              }}
            >
              {placeholder}
            </MenuItem>
          )}

          {options.map((opt) => (
            <MenuItem
              key={String(opt.value)}
              value={opt.value}
              disabled={opt.disabled}
              className="text-slate-700"
              style={{
                fontSize: '14px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
              }}
            >
              {opt.label}
            </MenuItem>
          ))}

          {options.length === 0 && (
            <MenuItem
              disabled
              value=""
              className="text-slate-400"
              style={{
                fontSize: '13px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
              }}
            >
              No options available
            </MenuItem>
          )}
        </Select>
      </div>

      <SharedFieldError
        id={helperId}
        error={error}
        errorMessage={errorMessage}
        helperText={helperText}
      />
    </div>
  );
}

export default SharedSelect;
