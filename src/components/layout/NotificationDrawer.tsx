import React, { useState, useRef, useEffect } from 'react';
import { Bell, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  type: 'alert' | 'info' | 'success';
}

const SAMPLE_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Ethicon Robotics (REP-2026-001)', description: 'Manager review completed for all issues. Ready for Director submission.', time: '15m ago', type: 'info' },
  { id: '2', title: 'Biosense Webster (REP-2026-006)', description: 'Critical issue logged on TP-110. Mandatory VP sign-off gate triggered.', time: '1h ago', type: 'alert' },
  { id: '3', title: 'Depuy Synthes (REP-2026-003)', description: 'Management response and remediation date submitted by Business Contact.', time: '3h ago', type: 'success' },
];

export const NotificationDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="jnj-bell-button"
        title="Notifications"
        style={{ position: 'relative' }}
      >
        <Bell size={20} strokeWidth={1.8} color="#000000" />
        <span
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: '#eb1700',
          }}
        />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '320px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
            border: '1px solid #d8d8d8',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #d8d8d8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#212121' }}>Notifications</span>
            <span style={{ fontSize: '11px', color: '#000099', cursor: 'pointer', fontWeight: 600 }}>Mark all as read</span>
          </div>

          <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
            {SAMPLE_NOTIFICATIONS.map(n => (
              <div
                key={n.id}
                style={{
                  padding: '10px 14px',
                  borderBottom: '1px solid #f4f4f4',
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start',
                }}
              >
                {n.type === 'alert' ? (
                  <AlertTriangle size={16} color="#eb1700" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : n.type === 'success' ? (
                  <CheckCircle size={16} color="#087d0d" style={{ marginTop: '2px', flexShrink: 0 }} />
                ) : (
                  <Clock size={16} color="#000099" style={{ marginTop: '2px', flexShrink: 0 }} />
                )}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#212121' }}>{n.title}</div>
                  <div style={{ fontSize: '11px', color: '#63666a', marginTop: '2px' }}>{n.description}</div>
                  <div style={{ fontSize: '10px', color: '#888b8d', marginTop: '4px' }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
