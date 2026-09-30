import React from 'react';
import { SharedTooltip } from '../feedback/SharedTooltip';

export interface UserTablePillProps {
  owners?: string[];
  queue?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const UserTablePill: React.FC<UserTablePillProps> = ({
  owners = [],
  queue,
  className = '',
  style
}) => {
  if (!owners || owners.length === 0) {
    return <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>;
  }

  if (queue === 'Closed') {
    return (
      <span style={{ fontSize: '11.5px', color: '#64748B', fontStyle: 'italic', fontWeight: 500 }}>
        Finalized (Archive)
      </span>
    );
  }

  const firstUser = owners[0];
  const remainingUsers = owners.slice(1);

  const getInitials = (name: string): string => {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={`user-table-pill-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Primary Full User Pill */}
      <SharedTooltip title={firstUser} placement="top">
        <div
          className="user-table-pill-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px 2px 4px',
            borderRadius: '12px',
            fontSize: '11.5px',
            fontWeight: 600,
            lineHeight: 'normal',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            color: '#212121',
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            flexShrink: 0
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#64748B',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getInitials(firstUser)}
          </span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#212121',
              fontSize: '11.5px',
              fontWeight: 600,
              lineHeight: 'normal',
              display: 'inline-block',
              maxWidth: '120px'
            }}
          >
            {firstUser}
          </span>
        </div>
      </SharedTooltip>

      {/* 2. Remaining Users (+N) Badge with Portal Tooltip Popover */}
      {remainingUsers.length > 0 && (
        <SharedTooltip
          variant="light"
          placement="bottom-start"
          title={
            <div style={{ minWidth: '180px' }}>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748B',
                  letterSpacing: '0.05em',
                  marginBottom: '6px',
                  paddingBottom: '4px',
                  borderBottom: '1px solid #F1F5F9'
                }}
              >
                Other Owners ({remainingUsers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {remainingUsers.map((name, i) => (
                  <div
                    key={`${name}-${i}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '7px',
                      fontSize: '11.5px',
                      color: '#212121',
                      fontWeight: 600
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: '#64748B',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      {getInitials(name)}
                    </span>
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          }
        >
          <button
            type="button"
            className="user-table-pill-overflow-badge"
            aria-label={`${remainingUsers.length} more owners`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: '#F1F5F9',
              color: '#475569',
              border: '1px solid #CBD5E1',
              cursor: 'pointer',
              lineHeight: 1,
              userSelect: 'none'
            }}
          >
            +{remainingUsers.length}
          </button>
        </SharedTooltip>
      )}
    </div>
  );
};

export default UserTablePill;
