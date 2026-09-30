import React, { useState, useRef } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

export interface SharedSelectButtonItem {
  key?: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  dividerAfter?: boolean;
}

export interface SharedSelectButtonProps {
  /** Configurable button text, defaults to 'Options' */
  label?: string;
  /** Array of menu items with icon, label, and action handler */
  items: SharedSelectButtonItem[];
  /** Button size tier */
  size?: 'small' | 'medium';
  /** Disabled state */
  disabled?: boolean;
  /** Width of the dropdown menu */
  menuWidth?: string | number;
  /** Optional icon before label */
  startIcon?: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Inline style overrides */
  style?: React.CSSProperties;
  /** Tooltip title */
  title?: string;
}

/**
 * SharedSelectButton
 * 
 * An enterprise button component matching the SharedSelect (Root Cause Type) input style:
 * - White background (#ffffff) with 1px primary blue border (#000099).
 * - Exact same 4px border radius, 14px font size, 400 font weight, and "jj-circular" typography as primary inputs.
 * - Right-aligned KeyboardArrowDownIcon indicator matching SharedSelect.
 * - Dropdown menu with pixel-identical styling to SharedSelect (border-slate-200, shadow-lg, 14px items, 6px/12px padding, #f1f5f9 hover).
 */
export const SharedSelectButton: React.FC<SharedSelectButtonProps> = ({
  label = 'Options',
  items,
  size = 'small',
  disabled = false,
  menuWidth = '220px',
  startIcon,
  className = '',
  style,
  title,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const isOpen = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleItemClick = (item: SharedSelectButtonItem) => {
    if (item.disabled) return;
    handleClose();
    item.onClick();
  };

  const height = size === 'small' ? '28px' : '36px';
  const padding = size === 'small' ? '0 10px' : '0 12px';

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={handleOpen}
        onMouseEnter={() => !disabled && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={title}
        className={className}
        style={{
          height,
          padding,
          fontSize: '14px',
          fontWeight: 400,
          fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
          color: disabled ? '#94A3B8' : '#000099',
          backgroundColor: disabled ? '#F8FAFC' : isOpen ? '#E6EDFF' : isHovered ? '#F0F4FF' : '#ffffff',
          border: disabled ? '1px solid #CBD5E1' : isOpen ? '1px solid #000066' : isHovered ? '1px solid #000080' : '1px solid #000099',
          borderRadius: '4px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          boxSizing: 'border-box',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
          outline: 'none',
          ...style,
        }}
      >
        {startIcon && (
          <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            {startIcon}
          </span>
        )}

        <span>{label}</span>

        <KeyboardArrowDownIcon
          style={{
            width: '16px',
            height: '16px',
            flexShrink: 0,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
            color: disabled ? '#94A3B8' : '#000099',
          }}
        />
      </button>

      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        elevation={0}
        slotProps={{
          paper: {
            className: 'mt-1 rounded-md border border-slate-200 shadow-lg overflow-hidden py-1 max-h-60',
            sx: {
              mt: '4px',
              minWidth: menuWidth,
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#FFFFFF',
              py: '4px',
              px: 0,
              '& .MuiMenuItem-root': {
                fontSize: '14px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                fontWeight: 400,
                color: '#334155',
                paddingY: '6px',
                paddingX: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                '&:hover': {
                  backgroundColor: '#f1f5f9',
                  color: '#1E293B',
                },
              },
            },
          },
        }}
      >
        {items.map((item, idx) => {
          const itemKey = item.key || `item-${idx}`;

          return (
            <React.Fragment key={itemKey}>
              <MenuItem
                disabled={item.disabled}
                onClick={() => handleItemClick(item)}
                sx={{
                  color: item.disabled
                    ? '#94A3B8'
                    : item.danger
                    ? '#991B1B !important'
                    : '#334155',
                  '&:hover': {
                    backgroundColor: item.disabled
                      ? 'transparent'
                      : item.danger
                      ? '#FEF2F2 !important'
                      : '#f1f5f9 !important',
                    color: item.disabled
                      ? '#94A3B8'
                      : item.danger
                      ? '#7F1D1D !important'
                      : '#1E293B',
                  },
                }}
              >
                {item.icon && (
                  <Box
                    sx={{
                      width: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </Box>
                )}

                <Box component="span" sx={{ flex: 1, whiteSpace: 'nowrap' }}>
                  {item.label}
                </Box>
              </MenuItem>

              {item.dividerAfter && (
                <Box
                  sx={{
                    height: '1px',
                    backgroundColor: '#E2E8F0',
                    my: '4px',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </Menu>
    </>
  );
};

export default SharedSelectButton;
