import React from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TablePagination from '@mui/material/TablePagination';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';

export type SharedTableSortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  id: string;
  label: string;
  field?: keyof T;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  className?: string;
}

export interface SharedTableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  emptyState?: React.ReactNode;
  loadingState?: React.ReactNode;
  errorState?: React.ReactNode;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  sortField?: string | null;
  sortDirection?: SharedTableSortDirection;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onSortChange?: (field: string, direction: SharedTableSortDirection) => void;
  onRowClick?: (row: T, index: number) => void;
  rowKey?: (row: T, index: number) => string | number;
  stickyHeader?: boolean;
  dense?: boolean;
  className?: string;
  tableClassName?: string;
  showPagination?: boolean;
  rowsPerPageOptions?: number[];
  ariaLabel?: string;
  noBorder?: boolean;
}

const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_ROWS_PER_PAGE_OPTIONS = [5, 10, 25, 50];

function getCellValue<T>(row: T, column: TableColumn<T>, index: number) {
  if (column.render) {
    return column.render(row, index);
  }

  if (column.field) {
    const value = row[column.field];
    return value == null ? '—' : value;
  }

  return null;
}

export function SharedTable<T>({
  columns,
  rows,
  loading = false,
  error = null,
  emptyMessage = 'No records found.',
  emptyState,
  loadingState,
  errorState,
  page = 0,
  rowsPerPage = DEFAULT_PAGE_SIZE,
  totalCount,
  sortField = null,
  sortDirection = 'asc',
  onPageChange,
  onRowsPerPageChange,
  onSortChange,
  onRowClick,
  rowKey,
  stickyHeader = true,
  dense = false,
  className = '',
  tableClassName = '',
  showPagination = true,
  rowsPerPageOptions = DEFAULT_ROWS_PER_PAGE_OPTIONS,
  ariaLabel = 'Data table',
  noBorder = false,
}: SharedTableProps<T>) {
  const resolvedTotalCount = totalCount ?? rows.length;
  const effectiveRows = rows;
  const canPaginate = showPagination && resolvedTotalCount > 0;

  const handleSort = (column: TableColumn<T>) => {
    if (!column.sortable || !onSortChange) {
      return;
    }

    const nextDirection = sortField === column.id && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(column.id, nextDirection);
  };

  const renderLoadingState = () => {
    if (loadingState) {
      return loadingState;
    }

    return (
      <div className="flex min-h-[160px] items-center justify-center gap-3 text-sm font-medium text-slate-600">
        <CircularProgress size={18} className="text-slate-500" />
        <span>Loading data...</span>
      </div>
    );
  };

  const renderEmptyState = () => {
    if (emptyState) {
      return emptyState;
    }

    return (
      <div className="flex min-h-[160px] items-center justify-center px-6 text-sm text-slate-500">
        {emptyMessage}
      </div>
    );
  };

  const renderErrorState = () => {
    if (errorState) {
      return errorState;
    }

    return (
      <div className="flex min-h-[160px] items-center justify-center px-6 text-sm font-medium text-red-600">
        {error ?? 'Unable to load data.'}
      </div>
    );
  };

  const tableWrapperClass = [
    'shared-table-wrapper w-full overflow-x-auto bg-transparent',
    noBorder ? 'no-border' : 'border border-slate-200 bg-white',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const tableClass = [
    'shared-table-root min-w-full border-collapse',
    noBorder ? 'border-0' : 'border-separate border-spacing-0',
    tableClassName,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={tableWrapperClass} aria-label={ariaLabel}>
      <TableContainer className="max-w-full overflow-x-auto">
        <Table className={tableClass} size={dense ? 'small' : 'medium'} stickyHeader={stickyHeader} aria-label={ariaLabel}>
          <TableHead>
            <TableRow className="bg-[#f2f2f1]">
              {columns.map((column) => {
                const isSorted = sortField === column.id && !!onSortChange;
                const alignment = column.align ?? 'left';
                const cellClassName = [
                  'border-b border-slate-200 bg-[#f2f2f1] px-4 py-3 align-middle text-left',
                  'font-bold uppercase tracking-[0.12em] text-slate-500',
                  alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
                  column.className ?? '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <TableCell
                    key={column.id}
                    align={alignment}
                    sortDirection={isSorted ? sortDirection : false}
                    className={cellClassName}
                    style={{ width: column.width ?? 'auto', backgroundColor: '#f2f2f1' }}
                  >
                    {column.sortable && onSortChange ? (
                      <TableSortLabel
                        active={isSorted}
                        direction={isSorted ? sortDirection : 'asc'}
                        onClick={() => handleSort(column)}
                        className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500"
                      >
                        {column.label}
                      </TableSortLabel>
                    ) : (
                      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                        {column.label}
                      </span>
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="border-b border-slate-200 bg-white p-0">
                  {renderLoadingState()}
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="border-b border-slate-200 bg-white p-0">
                  {renderErrorState()}
                </TableCell>
              </TableRow>
            ) : effectiveRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="border-b border-slate-200 bg-white p-0">
                  {renderEmptyState()}
                </TableCell>
              </TableRow>
            ) : (
              effectiveRows.map((row, rowIndex) => {
                const key = rowKey ? rowKey(row, rowIndex) : rowIndex;

                return (
                  <TableRow
                    key={String(key)}
                    hover={Boolean(onRowClick)}
                    onClick={() => onRowClick?.(row, rowIndex)}
                    className={[
                      'transition-colors duration-150 hover:bg-slate-50',
                      onRowClick ? 'cursor-pointer' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {columns.map((column) => {
                      const value = getCellValue(row, column, rowIndex);
                      const alignment = column.align ?? 'left';
                      const cellClassName = [
                        'border-b border-slate-200 bg-white px-4 py-3 align-middle text-[13px] text-slate-700',
                        alignment === 'center' ? 'text-center' : alignment === 'right' ? 'text-right' : 'text-left',
                        column.className ?? '',
                        dense ? 'py-2' : '',
                      ]
                        .filter(Boolean)
                        .join(' ');

                      return (
                        <TableCell key={`${String(key)}-${column.id}`} align={alignment} className={cellClassName}>
                          {value as React.ReactNode}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {showPagination && !loading && !error && canPaginate && (
        <TablePagination
          component="div"
          className="border-t border-slate-200 bg-slate-50 text-sm text-slate-600"
          count={resolvedTotalCount}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, nextPage) => onPageChange?.(nextPage)}
          onRowsPerPageChange={(event) => onRowsPerPageChange?.(Number(event.target.value))}
          rowsPerPageOptions={rowsPerPageOptions}
          labelRowsPerPage="Rows per page"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
        />
      )}
    </div>
  );
}

export default SharedTable;
