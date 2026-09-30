import React from 'react';
import { SharedTooltip } from '../feedback/SharedTooltip';

export interface QueueRolePillProps {
  role: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Maps role names to required abbreviations and full descriptive names:
 * Staff -> STF
 * Manager -> MGR
 * Team Coordinator -> TC
 * Director -> DIR
 * Vice President -> VP
 * Business Contact -> BIZ
 */
export const getRoleAbbreviation = (roleName: string): { abbr: string; full: string } => {
  const r = (roleName || '').trim();
  const lower = r.toLowerCase();

  if (lower === 'staff' || lower === 'stf') {
    return { abbr: 'STF', full: 'Staff' };
  }
  if (lower === 'manager' || lower === 'mgr') {
    return { abbr: 'MGR', full: 'Manager' };
  }
  if (lower.includes('coordinator') || lower === 'tc' || lower.includes('co-ordinator')) {
    return { abbr: 'TC', full: 'Team Coordinator' };
  }
  if (lower === 'director' || lower === 'dir') {
    return { abbr: 'DIR', full: 'Director' };
  }
  if (lower === 'vice president' || lower === 'vicepresident' || lower === 'vp') {
    return { abbr: 'VP', full: 'Vice President' };
  }
  if (lower.includes('business') || lower === 'biz') {
    return { abbr: 'BIZ', full: 'Business Contact' };
  }
  if (lower === 'closed') {
    return { abbr: 'Closed', full: 'Closed' };
  }

  // Fallback: 3-4 letter uppercase
  return {
    abbr: r.length <= 4 ? r.toUpperCase() : r.slice(0, 3).toUpperCase(),
    full: r
  };
};

/**
 * QueueRolePill:
 * Uniform light grey background (#F1F5F9) and primary black text (#212121),
 * with short role abbreviation and tooltip on hover.
 */
export const QueueRolePill: React.FC<QueueRolePillProps> = ({ role, className = '', style }) => {
  const { abbr, full } = getRoleAbbreviation(role);

  return (
    <SharedTooltip title={full} placement="top">
      <span
        className={`queue-role-pill ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2.5px 7px',
          borderRadius: '4px',
          fontSize: '11px',
          fontWeight: 700,
          color: '#212121',
          backgroundColor: '#F1F5F9',
          border: '1px solid #D8D8D8',
          whiteSpace: 'nowrap',
          lineHeight: '1.2',
          cursor: 'default',
          letterSpacing: '0.03em',
          userSelect: 'none',
          ...style
        }}
      >
        {abbr}
      </span>
    </SharedTooltip>
  );
};

export interface QueueRolePillGroupProps {
  roles: string[];
  className?: string;
  style?: React.CSSProperties;
}

export const QueueRolePillGroup: React.FC<QueueRolePillGroupProps> = ({
  roles,
  className = '',
  style
}) => {
  if (!roles || roles.length === 0) {
    return <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>;
  }

  return (
    <div
      className={`queue-role-pill-group ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
        ...style
      }}
    >
      {roles.map((r, idx) => (
        <QueueRolePill key={`${r}-${idx}`} role={r} />
      ))}
    </div>
  );
};

export default QueueRolePill;
