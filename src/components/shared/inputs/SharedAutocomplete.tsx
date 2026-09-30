import React, { useId } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import type {
  AutocompleteProps,
  AutocompleteRenderInputParams,
} from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface SharedAutocompleteProps<T> {
  label?: string;
  value: T | null;
  onChange: (value: T | null) => void;
  options: readonly T[];
  placeholder?: string;
  inputValue?: string;
  onInputChange?: (inputValue: string) => void;
  getOptionLabel?: (option: T) => string;
  isOptionEqualToValue?: (option: T, value: T) => boolean;
  renderOption?: AutocompleteProps<T, false, boolean, false>['renderOption'];
  filterOptions?: AutocompleteProps<T, false, boolean, false>['filterOptions'];
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
  accentArrow?: boolean;
  noOptionsText?: React.ReactNode;
  loadingText?: React.ReactNode;
  slotProps?: {
    autocomplete?: Partial<AutocompleteProps<T, false, boolean, false>>;
  };
}

/**
 * Reusable generic Autocomplete component for enterprise forms.
 * Supports dual controlled state (selected value + text inputValue) with Tailwind styling.
 */
export function SharedAutocomplete<T>({
  label,
  value,
  onChange,
  options,
  placeholder,
  inputValue,
  onInputChange,
  getOptionLabel = (option: T) => (typeof option === 'string' ? option : String(option ?? '')),
  isOptionEqualToValue,
  renderOption,
  filterOptions,
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
  accentArrow = true, // Red arrow indicator matching reference screenshot
  noOptionsText = 'No options found',
  loadingText = 'Loading options...',
  slotProps,
}: SharedAutocompleteProps<T>) {
  const generatedId = useId();
  const inputId = externalId || `autocomplete-${generatedId}`;
  const helperId = `${inputId}-helper`;

  const heightClass = size === 'small' ? 'h-9 text-sm' : 'h-10 text-base';

  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

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
        className={`relative flex items-center rounded border transition-all duration-150 ${heightClass} ${borderClass}`}
        style={{
          height,
          minHeight: height,
          backgroundColor: disabled ? '#FAFAFA' : readOnly ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
        }}
      >
        <Autocomplete<T, false, boolean, false>
          id={inputId}
          options={options}
          value={value}
          onChange={(_event, newValue) => {
            onChange(newValue);
          }}
          inputValue={inputValue}
          onInputChange={(_event, newInputValue) => {
            if (onInputChange) {
              onInputChange(newInputValue);
            }
          }}
          getOptionLabel={getOptionLabel}
          isOptionEqualToValue={isOptionEqualToValue}
          disabled={disabled || loading}
          readOnly={readOnly}
          loading={loading}
          disableClearable={!clearable}
          filterOptions={filterOptions}
          noOptionsText={noOptionsText}
          loadingText={loadingText}
          popupIcon={
            <KeyboardArrowDownIcon
              className={`!w-4 !h-4 transition-colors ${
                accentArrow ? 'text-red-500 hover:text-red-600' : 'text-slate-500 hover:text-slate-700'
              }`}
            />
          }
          clearIcon={<CloseIcon className="!w-3.5 !h-3.5 text-slate-400 hover:text-slate-600" />}
          renderOption={
            renderOption ||
            ((props, option, { selected }) => {
              const { key, ...liProps } = props;
              return (
                <li
                  key={key}
                  {...liProps}
                  className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                    selected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {getOptionLabel(option)}
                </li>
              );
            })
          }
          renderInput={(params: AutocompleteRenderInputParams) => {
            const { ref, startAdornment, endAdornment } = params.slotProps.input;
            const htmlInputProps = params.slotProps.htmlInput;

            return (
              <div ref={ref} className="w-full flex items-center px-3 h-full">
                {startAdornment}
                <input
                  {...htmlInputProps}
                  name={name}
                  placeholder={placeholder}
                  className="grow bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-normal w-full"
                  aria-invalid={error}
                  aria-describedby={errorMessage || helperText ? helperId : undefined}
                  aria-required={required}
                />
                {loading && <CircularProgress size={16} className="text-slate-400 shrink-0 mr-1" />}
                {endAdornment}
              </div>
            );
          }}
          className="w-full h-full"
          sx={{
            height: '100%',
            '& .MuiAutocomplete-endAdornment': {
              position: 'relative',
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              paddingRight: '4px',
            },
          }}
          slotProps={{
            paper: {
              className: 'mt-1 rounded-md border border-slate-200 shadow-lg overflow-hidden py-1 max-h-60',
            },
          }}
          {...slotProps?.autocomplete}
        />
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

export default SharedAutocomplete;
