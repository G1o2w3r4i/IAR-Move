import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

export interface SharedTabItem<T = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

export interface SharedTabsProps<T = string> {
  items: SharedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'primary' | 'workbench' | 'pills';
  size?: 'small' | 'medium';
  ariaLabel?: string;
  rightAction?: React.ReactNode;
  /** Whether to render the horizontal baseline divider under the tabs. Default: true */
  hasBottomBorder?: boolean;
  /** Border color of the horizontal baseline. Default: #d8d8d8 */
  borderColor?: string;
  /** Border width / thickness of the horizontal baseline. Default: 1px */
  borderWidth?: string | number;
  /** Selected tab text & indicator color. Default: #000099 (Primary Blue) */
  activeColor?: string;
}

export const SharedTabs = <T extends string = string>({
  items,
  value,
  onChange,
  variant = 'primary',
  size = 'medium',
  ariaLabel = 'Navigation tabs',
  rightAction,
  hasBottomBorder = true,
  borderColor = '#d8d8d8',
  borderWidth = '1px',
  activeColor = '#000099'
}: SharedTabsProps<T>): React.ReactElement => {
  const handleChange = (_event: React.SyntheticEvent, newValue: T) => {
    onChange(newValue);
  };

  const isWorkbench = variant === 'workbench';
  const resolvedBorderWidth = typeof borderWidth === 'number' ? `${borderWidth}px` : borderWidth;

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: hasBottomBorder ? `${resolvedBorderWidth} solid ${borderColor}` : 'none',
        marginBottom: isWorkbench ? '0px' : '14px',
        paddingLeft: isWorkbench ? '38px' : '0px'
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: size === 'small' ? '36px' : '44px',
          '& .MuiTabs-indicator': {
            backgroundColor: activeColor,
            height: '3px',
            borderRadius: '2px 2px 0 0',
            transition: 'all 0.2s ease-in-out',
            bottom: 0
          },
          '& .MuiTabs-flexContainer': {
            gap: isWorkbench ? '16px' : '6px'
          }
        }}
      >
        {items.map((item) => {
          const isSelected = item.id === value;

          return (
            <Tab
              key={item.id}
              value={item.id}
              disabled={item.disabled}
              disableRipple
              label={
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {item.icon && (
                    <Box
                      component="span"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected ? activeColor : '#64748B'
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: isWorkbench ? '10.5px' : '11px',
                        fontWeight: 700,
                        padding: isWorkbench ? '1px 6px' : '1px 8px',
                        borderRadius: isWorkbench ? '10px' : '12px',
                        backgroundColor: isSelected
                          ? (isWorkbench ? '#EFF6FF' : activeColor)
                          : (isWorkbench ? '#F1F5F9' : '#E2E8F0'),
                        color: isSelected
                          ? (isWorkbench ? activeColor : '#ffffff')
                          : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.count}
                    </Box>
                  )}
                </Box>
              }
              sx={{
                minHeight: size === 'small' ? '36px' : '44px',
                minWidth: 'auto',
                padding: isWorkbench
                  ? '6px 2px 8px 2px'
                  : (size === 'small' ? '6px 12px' : '10px 18px'),
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                fontSize: isWorkbench ? '12.5px' : (size === 'small' ? '12.5px' : '13.5px'),
                fontWeight: isSelected ? 700 : (isWorkbench ? 700 : 600),
                textTransform: isWorkbench ? 'uppercase' : 'none',
                color: isSelected ? activeColor : '#64748B',
                transition: 'color 0.15s ease',
                '&.Mui-selected': {
                  color: activeColor
                },
                '&:hover': {
                  color: activeColor,
                  opacity: 0.95
                },
                '&.Mui-disabled': {
                  opacity: 0.4
                }
              }}
            />
          );
        })}
      </Tabs>

      {rightAction && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {rightAction}
        </Box>
      )}
    </Box>
  );
};
