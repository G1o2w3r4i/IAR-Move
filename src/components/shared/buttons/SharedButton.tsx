import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

export type SharedButtonVariant = 'primary' | 'secondary' | 'outline' | 'text' | 'danger' | 'success' | 'edit';
export type SharedButtonSize = 'small' | 'medium' | 'large';

export interface SharedButtonProps {
  /** Visual style variant */
  variant?: SharedButtonVariant;
  /** Size tier */
  size?: SharedButtonSize;
  /** HTML button type attribute */
  type?: 'button' | 'submit' | 'reset';
  /** Disabled state — prevents interaction */
  disabled?: boolean;
  /** Loading state — shows spinner and prevents clicks */
  loading?: boolean;
  /** Stretch to fill container width */
  fullWidth?: boolean;
  /** Icon placed before the label text */
  startIcon?: React.ReactNode;
  /** Icon placed after the label text */
  endIcon?: React.ReactNode;
  /** Click handler */
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  /** Label content */
  children?: React.ReactNode;
  /** Additional Tailwind / layout classes from parent */
  className?: string;
  /** Accessible label override when icon-only */
  'aria-label'?: string;
  /** Tooltip text */
  title?: string;
  /** Forwarded ref */
  buttonRef?: React.Ref<HTMLButtonElement>;
  /** Optional inline styles */
  style?: React.CSSProperties;
}

// ──────────────────────────────────────────────────────────────────────────────
// Variant styling maps — Tailwind utility strings
// These mirror the colour language already used in SharedTextInput / previews
// (slate-900 primary, red-600 danger, slate-700 borders, etc.)
// ──────────────────────────────────────────────────────────────────────────────

const VARIANT_BASE: Record<SharedButtonVariant, string> = {
  primary:
    'btn-primary bg-[#000099] text-white border border-[#000099] ' +
    'hover:bg-[#000080] hover:border-[#000080] ' +
    'active:bg-[#000066] active:border-[#000066] ' +
    'focus-visible:ring-2 focus-visible:ring-[#000099] focus-visible:ring-offset-1',
  secondary:
    'bg-slate-100 text-slate-800 border border-slate-200 ' +
    'hover:bg-slate-200 hover:border-slate-300 ' +
    'active:bg-slate-300 ' +
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1',
  outline:
    'bg-white text-slate-700 border border-slate-300 ' +
    'hover:bg-slate-50 hover:border-slate-400 hover:text-slate-900 ' +
    'active:bg-slate-100 ' +
    'focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
  text:
    'bg-transparent text-slate-600 border border-transparent ' +
    'hover:text-slate-900 hover:bg-slate-100 ' +
    'active:bg-slate-200 ' +
    'focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1',
  danger:
    'bg-white text-red-600 border border-red-500 ' +
    'hover:bg-red-50 hover:border-red-600 ' +
    'active:bg-red-100 ' +
    'focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1',
  success:
    'bg-[#5CB85C] text-white border border-[#5CB85C] ' +
    'hover:bg-[#4CAF50] hover:border-[#4CAF50] ' +
    'active:bg-[#449944] ' +
    'focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-1',
  edit:
    'bg-white text-[#FF6B35] border border-[#FF6B35] ' +
    'hover:bg-[#FFF5F2] hover:border-[#FF5722] ' +
    'active:bg-[#FFE8E0] ' +
    'focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1',
};

const VARIANT_DISABLED: Record<SharedButtonVariant, string> = {
  primary:   'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed',
  secondary: 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed',
  outline:   'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed',
  text:      'text-slate-400 cursor-not-allowed',
  danger:    'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed',
  success:   'bg-slate-200 text-slate-400 border border-slate-200 cursor-not-allowed',
  edit:      'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed',
};

const SIZE_CLASSES: Record<SharedButtonSize, string> = {
  small:  'h-7 px-3 text-xs gap-1.5',
  medium: 'h-9 px-5 text-sm gap-2',
  large:  'h-11 px-7 text-base gap-2.5',
};

const ICON_SIZE: Record<SharedButtonSize, string> = {
  small:  '!w-3.5 !h-3.5',
  medium: '!w-4 !h-4',
  large:  '!w-5 !h-5',
};

const SPINNER_SIZE: Record<SharedButtonSize, number> = {
  small: 12,
  medium: 14,
  large: 16,
};

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Reusable controlled Button component for the enterprise shared component library.
 * Combines MUI ButtonBase for accessible keyboard/focus behaviour with Tailwind CSS
 * for visual styling — matching the design language of the existing shared inputs.
 */
export const SharedButton: React.FC<SharedButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  startIcon,
  endIcon,
  onClick,
  children,
  className = '',
  'aria-label': ariaLabel,
  title,
  buttonRef,
  style,
}) => {
  const isDisabled = disabled || loading;

  const variantClass = isDisabled ? VARIANT_DISABLED[variant] : VARIANT_BASE[variant];
  const sizeClass = SIZE_CLASSES[size];
  const spinnerSizePx = SPINNER_SIZE[size];
  const iconClass = ICON_SIZE[size];
  const widthClass = fullWidth ? 'w-full' : 'inline-flex';

  const primaryStyle: React.CSSProperties =
    variant === 'primary' && !isDisabled
      ? { backgroundColor: '#000099', borderColor: '#000099', color: '#ffffff', ...style }
      : { ...style };

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      ref={buttonRef}
      aria-label={ariaLabel}
      aria-busy={loading || undefined}
      title={title}
      style={primaryStyle}
      className={[
        // Layout
        widthClass,
        'inline-flex items-center justify-center',
        // Typography
        'font-semibold tracking-wide leading-none whitespace-nowrap',
        // Shape
        'rounded',
        // Transition
        'transition-all duration-150',
        // Native appearance reset for clean Tailwind rendering
        'appearance-none border-0 outline-none',
        isDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
        // Variant + disabled
        variantClass,
        // Size (height, padding, text-size, gap)
        sizeClass,
        // Caller customisation
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Leading spinner replaces startIcon when loading */}
      {loading ? (
        <CircularProgress
          size={spinnerSizePx}
          color="inherit"
          className="shrink-0"
          aria-hidden="true"
        />
      ) : (
        startIcon && (
          <span className={`shrink-0 flex items-center ${iconClass}`} aria-hidden="true">
            {startIcon}
          </span>
        )
      )}

      {/* Label */}
      {children && <span className="truncate">{children}</span>}

      {/* Trailing icon — hidden when loading to keep width stable */}
      {!loading && endIcon && (
        <span className={`shrink-0 flex items-center ${iconClass}`} aria-hidden="true">
          {endIcon}
        </span>
      )}
    </button>
  );
};

export default SharedButton;
