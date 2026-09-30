import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';

export interface AccordionColumn {
  id: string;
  label: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface AccordionValue {
  columnId: string;
  content: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface SharedAccordionProps {
  // Legacy column-based API (backward compatible)
  columns?: AccordionColumn[];
  values?: AccordionValue[];
  
  // New simple API
  title?: string;
  children?: React.ReactNode;
  
  // State management
  expanded?: boolean;
  defaultExpanded?: boolean;
  onChange?: (event: React.SyntheticEvent, isExpanded: boolean) => void;
  
  // Customization
  headerContent?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  dense?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface AccordionGroupProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  dense?: boolean;
}

export function SharedAccordion({
  columns,
  values,
  title,
  children,
  expanded,
  defaultExpanded = false,
  onChange,
  headerContent,
  className = '',
  headerClassName = '',
  contentClassName = '',
  dense = false,
  disabled = false,
  ariaLabel,
}: SharedAccordionProps) {
  const [internalExpanded, setInternalExpanded] = React.useState(defaultExpanded);
  const isControlled = expanded !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  const handleChange = (event: React.SyntheticEvent, newExpanded: boolean) => {
    if (disabled) return;

    if (!isControlled) {
      setInternalExpanded(newExpanded);
    }

    onChange?.(event, newExpanded);
  };

  // Determine if using new simple API or legacy column-based API
  const useSimpleAPI = title !== undefined || children !== undefined;
  const useLegacyAPI = columns !== undefined && values !== undefined;

  // Create a map of column widths for consistent alignment (legacy API)
  const columnWidths = columns?.map((col) => col.width ?? 'auto') ?? [];

  // Build grid template columns string (legacy API)
  const gridTemplateColumns = columnWidths
    .map((width) => (typeof width === 'number' ? `${width}px` : width))
    .join(' ');

  const accordionWrapperClass = ['w-full', className].filter(Boolean).join(' ');

  const headerClass = [
    'flex items-center gap-3 bg-transparent px-4',
    dense ? 'py-2' : 'py-3',
    headerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const legacyHeaderClass = [
    'grid items-center gap-4 bg-transparent px-4',
    dense ? 'py-2' : 'py-3',
    headerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const contentClass = [
    'bg-transparent px-4',
    dense ? 'py-2 pb-3' : 'py-3 pb-4',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const legacyContentClass = [
    'grid items-start gap-4 bg-transparent px-4',
    dense ? 'py-2 pb-3' : 'py-3 pb-4',
    contentClassName,
  ]
    .filter(Boolean)
    .join(' ');

  const effectiveAriaLabel = ariaLabel ?? title ?? 'Accordion';

  return (
    <div className={accordionWrapperClass} aria-label={effectiveAriaLabel}>
      <Accordion
        expanded={isExpanded}
        onChange={handleChange}
        disabled={disabled}
        disableGutters
        elevation={0}
        sx={{
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          '&:before': { display: 'none' },
          '&.Mui-expanded': { 
            margin: 0,
            border: 'none',
          },
          '&.Mui-disabled': {
            backgroundColor: 'transparent',
          },
        }}
      >
        <AccordionSummary
          expandIcon={null}
          aria-controls={`${effectiveAriaLabel}-content`}
          id={`${effectiveAriaLabel}-header`}
          sx={{
            backgroundColor: 'transparent',
            border: 'none',
            minHeight: dense ? '48px' : '56px',
            padding: 0,
            margin: 0,
            cursor: disabled ? 'default' : 'pointer',
            '&.Mui-expanded': {
              minHeight: dense ? '48px' : '56px',
              margin: 0,
              borderBottom: 'none',
            },
            '& .MuiAccordionSummary-content': {
              margin: 0,
              padding: 0,
              '&.Mui-expanded': {
                margin: 0,
              },
            },
            '&:hover': {
              backgroundColor: disabled ? 'transparent' : 'rgba(0, 0, 0, 0.02)',
            },
          }}
        >
          {useSimpleAPI ? (
            <div className={headerClass} style={{ width: '100%' }}>
              {isExpanded ? (
                <RemoveIcon 
                  sx={{ 
                    fontSize: 28,
                    color: '#eb1700',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }} 
                />
              ) : (
                <AddIcon 
                  sx={{ 
                    fontSize: 28,
                    color: '#eb1700',
                    fontWeight: 'bold',
                    flexShrink: 0,
                  }} 
                />
              )}
              {headerContent || (
                <span className="text-[15px] font-medium text-slate-700">
                  {title}
                </span>
              )}
            </div>
          ) : useLegacyAPI ? (
            <div className={legacyHeaderClass} style={{ gridTemplateColumns, width: '100%' }}>
              {headerContent ? (
                <div className="col-span-full">{headerContent}</div>
              ) : (
                columns?.map((column) => {
                  const alignment = column.align ?? 'left';
                  const cellClassName = [
                    'text-[13px] font-medium text-slate-700',
                    alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
                    column.className ?? '',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div key={column.id} className={cellClassName}>
                      {column.label}
                    </div>
                  );
                })
              )}
            </div>
          ) : null}
        </AccordionSummary>

        <AccordionDetails
          sx={{
            padding: 0,
            margin: 0,
            border: 'none',
            backgroundColor: 'transparent',
          }}
        >
          {useSimpleAPI ? (
            <div className={contentClass}>
              {children}
            </div>
          ) : useLegacyAPI ? (
            <div className={legacyContentClass} style={{ gridTemplateColumns }}>
              {values?.map((value) => {
                const alignment = value.align ?? 'left';
                const cellClassName = [
                  'text-[13px] text-slate-700',
                  alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
                  value.className ?? '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <div key={value.columnId} className={cellClassName}>
                    {value.content}
                  </div>
                );
              })}
            </div>
          ) : null}
        </AccordionDetails>
      </Accordion>
    </div>
  );
}

// AccordionGroup component for parent header + multiple accordions
export function AccordionGroup({
  title,
  children,
  className = '',
  headerClassName = '',
  dense = false,
}: AccordionGroupProps) {
  const groupClass = [
    'w-full border border-slate-200 bg-white overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  
  const headerClass = [
    'bg-[#f2f2f1] border-b border-slate-200 px-4',
    dense ? 'py-2' : 'py-3',
    headerClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={groupClass}>
      {title && (
        <div className={headerClass}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 m-0">
            {title}
          </h3>
        </div>
      )}
      <div>
        {React.Children.map(children, (child, index) => (
          <>
            {child}
            {index < React.Children.count(children) - 1 && (
              <div className="border-t border-slate-200" />
            )}
          </>
        ))}
      </div>
    </div>
  );
}

export default SharedAccordion;
