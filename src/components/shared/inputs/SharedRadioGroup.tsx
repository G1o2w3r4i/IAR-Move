import React, { useId } from 'react';
import RadioGroup from '@mui/material/RadioGroup';
import type { RadioGroupProps } from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface RadioOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SharedRadioGroupProps<T = string> {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  required?: boolean;
  disabled?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  direction?: 'row' | 'column';
  name?: string;
  id?: string;
  className?: string;
  size?: 'small' | 'medium';
  slotProps?: {
    radioGroup?: Partial<RadioGroupProps>;
  };
}

/**
 * Reusable controlled RadioGroup component for enterprise forms.
 * Supports row/column layouts with accessible keyboard navigation and Tailwind styling.
 */
export function SharedRadioGroup<T extends string | number>({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
  error = false,
  errorMessage,
  helperText,
  direction = 'row',
  name: externalName,
  id: externalId,
  className = '',
  size = 'small',
  slotProps,
}: SharedRadioGroupProps<T>) {
  const generatedId = useId();
  const groupName = externalName || `radiogroup-${generatedId}`;
  const groupId = externalId || groupName;
  const helperId = `${groupId}-helper`;

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value as unknown as T);
  };

  return (
    <FormControl
      component="fieldset"
      error={error}
      disabled={disabled}
      className={`block ${className}`}
    >
      {label && (
        <SharedFieldLabel
          label={label}
          required={required}
          error={error}
          disabled={disabled}
          id={`${groupId}-label`}
        />
      )}

      <RadioGroup
        aria-labelledby={label ? `${groupId}-label` : undefined}
        name={groupName}
        value={value ?? ''}
        onChange={handleChange}
        row={direction === 'row'}
        className={`flex ${
          direction === 'row' ? 'flex-row flex-wrap items-center gap-6 pt-1' : 'flex-col gap-2 pt-1'
        }`}
        {...slotProps?.radioGroup}
      >
        {options.map((option) => {
          const isChecked = String(value) === String(option.value);
          const isOptionDisabled = disabled || option.disabled;

          return (
            <FormControlLabel
              key={String(option.value)}
              value={option.value}
              disabled={isOptionDisabled}
              label={
                <span
                  className={`text-sm font-medium transition-colors select-none ${
                    isOptionDisabled
                      ? 'text-slate-400'
                      : isChecked
                      ? 'text-slate-900 font-semibold'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </span>
              }
              control={
                <Radio
                  size={size}
                  className="!p-1 text-slate-400 [&.Mui-checked]:!text-blue-600 [&.Mui-disabled]:!text-slate-300"
                  sx={{
                    '& .MuiSvgIcon-root': {
                      fontSize: size === 'small' ? 18 : 22,
                    },
                  }}
                  slotProps={{
                    input: {
                      'aria-describedby': errorMessage || helperText ? helperId : undefined,
                      'aria-required': required,
                    } as React.InputHTMLAttributes<HTMLInputElement>,
                  }}
                />
              }
              className="!m-0 flex items-center gap-1.5 cursor-pointer"
            />
          );
        })}
      </RadioGroup>

      <SharedFieldError
        id={helperId}
        error={error}
        errorMessage={errorMessage}
        helperText={helperText}
      />
    </FormControl>
  );
}

export default SharedRadioGroup;
