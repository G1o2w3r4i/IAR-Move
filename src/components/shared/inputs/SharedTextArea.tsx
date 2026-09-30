import React, { useId } from 'react';
import InputBase from '@mui/material/InputBase';
import type { InputBaseProps } from '@mui/material/InputBase';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface SharedTextAreaProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  readOnly?: boolean;
  fullWidth?: boolean;
  rows?: number;
  minRows?: number;
  maxRows?: number;
  maxLength?: number;
  name?: string;
  id?: string;
  onBlur?: React.FocusEventHandler<HTMLTextAreaElement>;
  onFocus?: React.FocusEventHandler<HTMLTextAreaElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLTextAreaElement>;
  className?: string;
  textareaClassName?: string;
  showCharCount?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  inputRef?: React.Ref<HTMLTextAreaElement>;
  slotProps?: {
    inputBase?: Partial<InputBaseProps>;
  };
}

/**
 * Reusable controlled TextArea component.
 * Follows the same visual language and API conventions as SharedTextInput.
 * Combines MUI InputBase (multiline) for accessible textarea behavior with Tailwind CSS for enterprise styling.
 */
export const SharedTextArea: React.FC<SharedTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  readOnly = false,
  fullWidth = true,
  rows = 3,
  minRows,
  maxRows,
  maxLength,
  name,
  id: externalId,
  onBlur,
  onFocus,
  onKeyDown,
  className = '',
  textareaClassName = '',
  showCharCount = false,
  resize = 'vertical',
  inputRef,
  slotProps,
}) => {
  const generatedId = useId();
  const inputId = externalId || `textarea-${generatedId}`;
  const helperId = `${inputId}-helper`;

  // Mirror exact border/bg logic from SharedTextInput
  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  const resizeClass: Record<string, string> = {
    none: 'resize-none',
    vertical: 'resize-y',
    horizontal: 'resize-x',
    both: 'resize',
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const charCount = value?.length ?? 0;

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
        className={`shared-textarea-wrapper rounded border transition-all duration-150 ${borderClass}`}
        style={{
          backgroundColor: disabled ? '#FAFAFA' : readOnly ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
        }}
      >
        <InputBase
          id={inputId}
          name={name}
          multiline
          minRows={minRows || rows || 3}
          maxRows={maxRows}
          value={value ?? ''}
          onChange={handleChange as React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>}
          onBlur={onBlur as React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>}
          onFocus={onFocus as React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>}
          onKeyDown={onKeyDown as React.KeyboardEventHandler<HTMLInputElement | HTMLTextAreaElement>}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          fullWidth
          inputRef={inputRef}
          inputProps={{
            maxLength,
            'aria-invalid': error,
            'aria-describedby': errorMessage || helperText || showCharCount ? helperId : undefined,
            'aria-required': required,
            className: `${resizeClass[resize]} ${textareaClassName}`,
          }}
          className="w-full font-normal"
          sx={{
            fontSize: '14px',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            fontWeight: 400,
            color: '#1E293B',
            lineHeight: 1.5,
            width: '100%',
            '&:hover textarea, &:focus-within textarea': {
              scrollbarColor: '#CBD5E1 transparent !important',
            },
            '&:hover textarea::-webkit-scrollbar-thumb, &:focus-within textarea::-webkit-scrollbar-thumb': {
              backgroundColor: '#CBD5E1 !important',
            },
            '&.Mui-disabled': {
              color: '#1E293B !important',
              WebkitTextFillColor: '#1E293B !important',
            },
            '& textarea': {
              padding: '8px 12px',
              cursor: disabled ? 'default' : undefined,
              fontSize: '14px',
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              fontWeight: 400,
              color: '#1E293B !important',
              lineHeight: 1.5,
              resize: 'none',
              scrollbarWidth: 'thin',
              scrollbarColor: 'transparent transparent',
              transition: 'scrollbar-color 0.15s ease',
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'transparent',
                borderRadius: '4px',
                transition: 'background-color 0.15s ease',
              },
              '&:hover, &:focus, &:active': {
                scrollbarColor: '#CBD5E1 transparent',
              },
              '&:hover::-webkit-scrollbar-thumb, &:focus::-webkit-scrollbar-thumb, &:active::-webkit-scrollbar-thumb': {
                backgroundColor: '#CBD5E1',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#94A3B8',
              },
              '&.Mui-disabled': {
                color: '#1E293B !important',
                WebkitTextFillColor: '#1E293B !important',
              },
              '&::placeholder': {
                opacity: 1,
                color: '#94a3b8',
                fontSize: '14px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                fontWeight: 400,
              },
            },
          }}
          {...slotProps?.inputBase}
        />
      </div>

      {/* Character count row — rendered above the helper/error so they stack naturally */}
      {showCharCount && (
        <div className="mt-1 flex items-center justify-end">
          <span
            className={`text-[11px] font-medium tabular-nums ${
              maxLength && charCount >= maxLength
                ? 'text-red-500'
                : 'text-slate-400'
            }`}
          >
            {charCount}
            {maxLength ? ` / ${maxLength}` : ''}
          </span>
        </div>
      )}

      <SharedFieldError
        id={helperId}
        error={error}
        errorMessage={errorMessage}
        helperText={helperText}
      />
    </div>
  );
};

export default SharedTextArea;
