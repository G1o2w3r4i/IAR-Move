import React, { useId } from 'react';
import InputBase from '@mui/material/InputBase';
import type { InputBaseProps } from '@mui/material/InputBase';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface SharedTextInputProps {
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
  size?: 'small' | 'medium';
  type?: string;
  name?: string;
  id?: string;
  maxLength?: number;
  minLength?: number;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
  autoComplete?: string;
  inputRef?: React.Ref<HTMLInputElement>;
  slotProps?: {
    inputBase?: Partial<InputBaseProps>;
  };
}

/**
 * Reusable controlled TextInput component.
 * Combines MUI InputBase for accessible input primitives with Tailwind CSS for enterprise styling.
 */
export const SharedTextInput: React.FC<SharedTextInputProps> = ({
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
  size = 'small',
  type = 'text',
  name,
  id: externalId,
  maxLength,
  minLength,
  startAdornment,
  endAdornment,
  onBlur,
  onFocus,
  onKeyDown,
  className = '',
  inputClassName = '',
  autoComplete,
  inputRef,
  slotProps,
}) => {
  const generatedId = useId();
  const inputId = externalId || `input-${generatedId}`;
  const helperId = `${inputId}-helper`;

  const heightClass = size === 'small' ? 'h-9 text-sm' : 'h-10 text-base';

  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
        {startAdornment && (
          <div className="mr-2 flex items-center text-slate-400 shrink-0">
            {startAdornment}
          </div>
        )}

        <InputBase
          id={inputId}
          name={name}
          type={type}
          value={value ?? ''}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          fullWidth
          inputRef={inputRef}
          inputProps={{
            maxLength,
            minLength,
            autoComplete,
            'aria-invalid': error,
            'aria-describedby': errorMessage || helperText ? helperId : undefined,
            'aria-required': required,
          }}
          className={`w-full text-slate-800 placeholder:text-slate-400 font-normal ${inputClassName}`}
          sx={{
            fontSize: 'inherit',
            color: 'inherit',
            '&.Mui-disabled': {
              color: '#1E293B !important',
              WebkitTextFillColor: '#1E293B !important',
            },
            '& input': {
              padding: 0,
              height: 'auto',
              cursor: disabled ? 'default' : undefined,
              '&.Mui-disabled': {
                color: '#1E293B !important',
                WebkitTextFillColor: '#1E293B !important',
              },
              '&::placeholder': {
                opacity: 1,
                color: '#94a3b8',
              },
            },
          }}
          {...slotProps?.inputBase}
        />

        {endAdornment && (
          <div className="ml-2 flex items-center text-slate-400 shrink-0">
            {endAdornment}
          </div>
        )}
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

export default SharedTextInput;
