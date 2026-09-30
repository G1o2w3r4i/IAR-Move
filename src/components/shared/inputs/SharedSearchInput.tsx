import React, { useId, useEffect } from 'react';
import InputBase from '@mui/material/InputBase';
import type { InputBaseProps } from '@mui/material/InputBase';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface SharedSearchInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  loading?: boolean;
  clearable?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  name?: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  showDropdownArrow?: boolean;
  accentArrow?: boolean;
  debounceMs?: number;
  inputRef?: React.Ref<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  slotProps?: {
    inputBase?: Partial<InputBaseProps>;
  };
}

/**
 * Reusable controlled SearchInput component for enterprise search fields.
 * Includes search icon adornment, debounced or Enter-key search triggers,
 * clear button, and matches the enterprise compact styling.
 */
export const SharedSearchInput: React.FC<SharedSearchInputProps> = ({
  label,
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  required = false,
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  readOnly = false,
  loading = false,
  clearable = true,
  fullWidth = true,
  size = 'small',
  name,
  id: externalId,
  className = '',
  inputClassName = '',
  startIcon,
  endIcon,
  showDropdownArrow = true,
  accentArrow = true, // Red indicator matching reference screenshot
  debounceMs,
  inputRef,
  onBlur,
  onFocus,
  slotProps,
}) => {
  const generatedId = useId();
  const inputId = externalId || `search-${generatedId}`;
  const helperId = `${inputId}-helper`;

  const heightClass = size === 'small' ? 'h-9 text-sm' : 'h-10 text-base';

  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  // Optional debounce triggering onSearch when user stops typing
  useEffect(() => {
    if (debounceMs && debounceMs > 0 && onSearch) {
      const handler = setTimeout(() => {
        onSearch(value);
      }, debounceMs);
      return () => clearTimeout(handler);
    }
  }, [value, debounceMs, onSearch]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault();
      onSearch(value);
    }
  };

  const handleClear = () => {
    onChange('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <SharedFieldLabel
          htmlFor={inputId}
          label={label}
          required={required}
          error={error}
          disabled={disabled}
        />
      )}

      <div
        className={`flex items-center px-3 rounded border transition-all duration-150 ${heightClass} ${borderClass}`}
        style={{
          backgroundColor: disabled ? '#FAFAFA' : readOnly ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
        }}
      >
        <div className="mr-2 flex items-center text-slate-400 shrink-0">
          {startIcon ?? <SearchIcon className="!w-4 !h-4 text-slate-400" />}
        </div>

        <InputBase
          id={inputId}
          name={name}
          type="search"
          value={value ?? ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          fullWidth
          inputRef={inputRef}
          inputProps={{
            'aria-invalid': error,
            'aria-describedby': errorMessage || helperText ? helperId : undefined,
            'aria-required': required,
          }}
          className={`w-full text-slate-800 placeholder:text-slate-400 font-normal ${inputClassName}`}
          sx={{
            fontSize: 'inherit',
            color: 'inherit',
            '& input': {
              padding: 0,
              height: 'auto',
              cursor: disabled ? 'not-allowed' : undefined,
              '&::-webkit-search-decoration, &::-webkit-search-cancel-button, &::-webkit-search-results-button, &::-webkit-search-results-decoration':
                {
                  display: 'none',
                },
            },
          }}
          {...slotProps?.inputBase}
        />

        <div className="ml-1 flex items-center gap-1.5 shrink-0">
          {loading && <CircularProgress size={16} className="text-slate-400 mr-1" />}

          {clearable && !disabled && !readOnly && value && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search input"
              className="p-0.5 text-slate-400 hover:text-slate-600 rounded transition-colors"
            >
              <CloseIcon className="!w-3.5 !h-3.5" />
            </button>
          )}

          {endIcon}

          {showDropdownArrow && (
            <KeyboardArrowDownIcon
              className={`!w-4 !h-4 transition-colors ${
                accentArrow ? 'text-red-500' : 'text-slate-400'
              }`}
            />
          )}
        </div>
      </div>

      <SharedFieldError
        id={helperId}
        error={error}
        errorMessage={errorMessage}
        helperText={helperText}
      />
    </div>
  );
};

export default SharedSearchInput;
