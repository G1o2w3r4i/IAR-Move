import React from 'react';

export interface SharedFieldErrorProps {
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  id?: string;
  className?: string;
}

/**
 * Reusable helper and error text component for enterprise inputs.
 * Strictly prop-driven with accessible aria live support for error states.
 */
export const SharedFieldError: React.FC<SharedFieldErrorProps> = ({
  error = false,
  errorMessage,
  helperText,
  id,
  className = '',
}) => {
  if (error && errorMessage) {
    return (
      <div
        id={id}
        role="alert"
        aria-live="polite"
        className={`mt-1 text-xs text-red-600 font-medium flex items-center gap-1 ${className}`}
      >
        <svg
          className="w-3.5 h-3.5 shrink-0 inline-block text-red-600"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span>{errorMessage}</span>
      </div>
    );
  }

  if (helperText) {
    return (
      <div id={id} className={`mt-1 text-xs text-slate-500 font-normal ${className}`}>
        {helperText}
      </div>
    );
  }

  return null;
};

export default SharedFieldError;
