import React from 'react';
import Popover from '@mui/material/Popover';
import type { PopoverProps } from '@mui/material/Popover';
import Box from '@mui/material/Box';

export interface SharedPopoverProps extends Omit<PopoverProps, 'classes'> {
  /** Optional custom menu width */
  menuWidth?: string | number;
}

export interface SharedPopoverItemProps {
  onClick?: () => void;
  icon?: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  label: string;
  selected?: boolean;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Enterprise Componentized SharedPopover.
 * Standardized with select menu properties (border, scale animations, hover color, typography).
 */
export const SharedPopover: React.FC<SharedPopoverProps> = ({
  open,
  anchorEl,
  onClose,
  children,
  menuWidth = '220px',
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' },
  transformOrigin = { vertical: 'top', horizontal: 'left' },
  slotProps,
  ...props
}) => {
  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      transitionDuration={150}
      slotProps={{
        paper: {
          sx: {
            mt: '4px',
            width: menuWidth,
            borderRadius: '6px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 4px 6px -2px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            padding: '4px',
            backgroundColor: '#FFFFFF',
            ...slotProps?.paper?.sx
          }
        },
        ...slotProps
      }}
      {...props}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
        {children}
      </Box>
    </Popover>
  );
};

export const SharedPopoverItem: React.FC<SharedPopoverItemProps> = ({
  onClick,
  icon: Icon,
  label,
  selected = false,
  disabled = false,
  className = '',
  style
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Box
      onClick={!disabled ? onClick : undefined}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        px: '12px',
        py: '6px',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
        fontWeight: selected ? 500 : 400,
        color: disabled ? '#94A3B8' : selected ? '#1D4ED8' : isHovered ? '#1E293B' : '#334155',
        backgroundColor: disabled
          ? 'transparent'
          : selected
          ? '#EFF6FF'
          : isHovered
          ? '#F1F5F9'
          : 'transparent',
        transition: 'background-color 0.12s ease, color 0.12s ease',
        userSelect: 'none',
        ...style
      }}
    >
      {Icon && (
        <Icon
          size={14}
          style={{
            color: disabled ? '#CBD5E1' : selected ? '#1D4ED8' : isHovered ? '#0F172A' : '#64748B',
            flexShrink: 0
          }}
        />
      )}
      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </Box>
  );
};

export default SharedPopover;
