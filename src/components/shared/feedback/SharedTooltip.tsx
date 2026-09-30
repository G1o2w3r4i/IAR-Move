import React from 'react';
import Tooltip, { tooltipClasses, type TooltipProps } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

export interface SharedTooltipProps {
  /** Content to display inside the tooltip */
  title: React.ReactNode;
  /** Element that triggers the tooltip */
  children: React.ReactElement;
  /** Placement of the tooltip */
  placement?: TooltipProps['placement'];
  /** Whether to show the arrow */
  arrow?: boolean;
  /** Delay before entering in ms */
  enterDelay?: number;
  /** Delay before leaving in ms */
  leaveDelay?: number;
  /** Custom className */
  className?: string;
  /** Light variant or standard dark */
  variant?: 'dark' | 'light';
  /** Custom style for the trigger wrapper element */
  wrapperStyle?: React.CSSProperties;
  /** Custom className for the trigger wrapper element */
  wrapperClassName?: string;
}

const StyledDarkTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#0F172A',
    color: '#FFFFFF',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.18)',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '5px 10px',
    fontSize: '11.5px',
    fontWeight: 600,
    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
    lineHeight: 1.3,
    maxWidth: '420px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#0F172A',
    '&::before': {
      border: '1px solid #334155'
    }
  }
}));

const StyledLightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#FFFFFF',
    color: '#1E293B',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 6px rgba(0, 0, 0, 0.04)',
    border: '1px solid #CBD5E1',
    borderRadius: '4px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
    lineHeight: 1.3,
    maxWidth: '420px',
    wordBreak: 'break-word',
    overflowWrap: 'break-word'
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#FFFFFF',
    '&::before': {
      border: '1px solid #CBD5E1'
    }
  }
}));

/**
 * Enterprise Componentized SharedTooltip.
 * Adheres to J&J brand aesthetics, supports disabled child elements by wrapping them
 * in an inline span so tooltips trigger even when controls are disabled.
 */
export const SharedTooltip: React.FC<SharedTooltipProps> = ({
  title,
  children,
  placement = 'top',
  arrow = true,
  enterDelay = 200,
  leaveDelay = 0,
  variant = 'dark',
  className,
  wrapperStyle,
  wrapperClassName
}) => {
  // If child is disabled, wrap in an inline span so pointer events reach the tooltip
  const isChildDisabled = Boolean(
    React.isValidElement(children) && (children.props as any)?.disabled
  );

  const TooltipComponent = variant === 'light' ? StyledLightTooltip : StyledDarkTooltip;

  // Always use a stable inline wrapper so the Tooltip's event listeners remain mounted
  // and trigger reliably on both enabled and disabled elements
  const trigger = (
    <span
      className={wrapperClassName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isChildDisabled ? 'not-allowed' : 'inherit',
        lineHeight: 'inherit',
        maxWidth: '100%',
        ...wrapperStyle
      }}
    >
      {isChildDisabled
        ? React.cloneElement(children as React.ReactElement<any>, {
            style: {
              ...((children as React.ReactElement<any>).props?.style || {}),
              pointerEvents: 'none'
            }
          })
        : children}
    </span>
  );

  return (
    <TooltipComponent
      title={title}
      placement={placement}
      arrow={arrow}
      enterDelay={enterDelay}
      leaveDelay={leaveDelay}
      className={className}
    >
      {trigger}
    </TooltipComponent>
  );
};

export default SharedTooltip;
