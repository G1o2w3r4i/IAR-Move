import { useId } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import type { AutocompleteProps, AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseIcon from '@mui/icons-material/Close';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';
import type { SelectOption } from './SharedSelect';

export interface SharedMultiSelectProps<T = string> {
  label?: string;
  value: T[];
  onChange: (value: T[]) => void;
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
  limitTags?: number;
  showCheckbox?: boolean;
  accentArrow?: boolean;
  noOptionsText?: string;
  slotProps?: {
    autocomplete?: Partial<
      AutocompleteProps<SelectOption<T>, true, false, false>
    >;
  };
}

/**
 * Reusable controlled MultiSelect component for enterprise forms.
 * Built on MUI Autocomplete (multiple) for searchable, accessible multi-selection
 * with compact enterprise Tailwind styling.
 */
export function SharedMultiSelect<T extends string | number>({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select items',
  required = false,
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  readOnly = false,
  loading = false,
  fullWidth = true,
  size = 'small',
  id: externalId,
  className = '',
  limitTags = 2,
  showCheckbox = true,
  accentArrow = false,
  noOptionsText = 'No options available',
  slotProps,
}: SharedMultiSelectProps<T>) {
  const generatedId = useId();
  const selectId = externalId || `multiselect-${generatedId}`;
  const helperId = `${selectId}-helper`;

  const selectedOptions = options.filter((opt) => value?.includes(opt.value));

  const borderClass = error
    ? 'border-red-500 focus-within:border-red-600 focus-within:ring-2 focus-within:ring-red-100'
    : disabled
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-800'
    : readOnly
    ? 'border-slate-200 bg-[#FAFAFA] text-slate-700'
    : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100';

  const minHeightClass = size === 'small' ? 'min-h-[36px]' : 'min-h-[40px]';

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
        className={`relative flex items-center rounded border transition-all duration-150 ${minHeightClass} ${borderClass}`}
        style={{
          backgroundColor: disabled ? '#FAFAFA' : readOnly ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
        }}
      >
        <Autocomplete<SelectOption<T>, true, false, false>
          multiple
          id={selectId}
          options={options}
          value={selectedOptions}
          disabled={disabled || loading}
          readOnly={readOnly}
          loading={loading}
          limitTags={limitTags}
          noOptionsText={noOptionsText}
          disableCloseOnSelect
          getOptionLabel={(option) => option?.label ?? ''}
          isOptionEqualToValue={(option, val) => option.value === val.value}
          getOptionDisabled={(option) => !!option.disabled}
          onChange={(_event, newValue) => {
            onChange(newValue.map((item) => item.value));
          }}
          popupIcon={
            <KeyboardArrowDownIcon
              className={`!w-4 !h-4 transition-colors ${
                accentArrow ? 'text-red-500' : 'text-slate-500'
              }`}
            />
          }
          clearIcon={<CloseIcon className="!w-3.5 !h-3.5 text-slate-400 hover:text-slate-600" />}
          slotProps={{
            chip: {
              className: '!h-5 !text-[11px] !bg-slate-100 !text-slate-700 !font-medium !rounded !border !border-slate-200',
              size: 'small',
            },
            paper: {
              className: 'mt-1 rounded-md border border-slate-200 shadow-lg overflow-hidden py-1 max-h-60',
            },
          }}
          renderOption={(props, option, { selected }) => {
            const { key, ...optionProps } = props;
            return (
              <li
                key={key}
                {...optionProps}
                className="flex items-center px-3 py-1.5 hover:bg-slate-100 cursor-pointer text-sm text-slate-700 transition-colors"
              >
                {showCheckbox && (
                  <Checkbox
                    checked={selected}
                    size="small"
                    className="!p-0 !mr-2.5 !text-slate-400 [&.Mui-checked]:!text-blue-600"
                  />
                )}
                <span className={selected ? 'font-medium text-blue-700' : ''}>
                  {option.label}
                </span>
              </li>
            );
          }}
          renderInput={(params: AutocompleteRenderInputParams) => {
            const { ref, startAdornment, endAdornment } = params.slotProps.input;
            const htmlInputProps = params.slotProps.htmlInput;

            return (
              <div ref={ref} className="w-full flex items-center flex-wrap gap-1 px-2.5 py-1">
                {startAdornment}
                <input
                  {...htmlInputProps}
                  placeholder={selectedOptions.length === 0 ? placeholder : ''}
                  className="grow bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none font-normal min-w-[60px]"
                  aria-invalid={error}
                  aria-describedby={errorMessage || helperText ? helperId : undefined}
                  aria-required={required}
                />
                {loading && <CircularProgress size={16} className="text-slate-400 shrink-0 mr-1" />}
                {endAdornment}
              </div>
            );
          }}
          className="w-full"
          sx={{
            '& .MuiAutocomplete-endAdornment': {
              position: 'relative',
              right: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '2px',
              paddingRight: '6px',
            },
            '& .MuiAutocomplete-tag': {
              margin: '2px',
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

export default SharedMultiSelect;
