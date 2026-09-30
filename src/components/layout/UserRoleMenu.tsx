import React, { useState, useRef, useEffect } from 'react';
import { useUserSession } from '../../context/UserSessionContext';
import { ChevronDown, Check, User } from 'lucide-react';

export const UserRoleMenu: React.FC = () => {
  const { currentUser, activeRole, setActiveRoleId, availableRoles } = useUserSession();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const itRoles = availableRoles.filter(r => r.category === 'IT Roles');
  const finOpsRoles = availableRoles.filter(r => r.category === 'FinOps Roles');
  const caseRoles = availableRoles.filter(r => r.category === 'Case-Based');

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="jnj-user-profile-button"
        title={`Current Persona: ${activeRole.label}`}
      >
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '1.5px solid #212121',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#212121',
            flexShrink: 0,
          }}
        >
          <User size={15} strokeWidth={2} />
        </div>
        <span className="jnj-user-profile-name" style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>
          {currentUser.name}
        </span>
        <ChevronDown size={14} color="#000000" />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: '280px',
            backgroundColor: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 28px rgba(0, 0, 0, 0.14)',
            border: '1px solid #d8d8d8',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '12px 16px', backgroundColor: '#fafafc', borderBottom: '1px solid #d8d8d8' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#212121' }}>{currentUser.name}</div>
            <div style={{ fontSize: '11px', color: '#63666a', marginTop: '2px' }}>
              Active Role: <strong style={{ color: '#000099' }}>{activeRole.label}</strong>
            </div>
            <div style={{ fontSize: '10px', color: '#888b8d', marginTop: '1px' }}>{currentUser.department}</div>
          </div>

          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px 0' }}>
            {/* IT Roles */}
            <div style={{ padding: '6px 14px 2px', fontSize: '10px', fontWeight: 800, color: '#000099', textTransform: 'uppercase' }}>
              IT Governance Roles
            </div>
            {itRoles.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRoleId(role.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 14px',
                  border: 'none',
                  backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                  color: activeRole.id === role.id ? '#000099' : '#212121',
                  fontSize: '12px',
                  fontWeight: activeRole.id === role.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span>{role.label}</span>
                {activeRole.id === role.id && <Check size={14} color="#000099" />}
              </button>
            ))}

            {/* FinOps Roles */}
            <div style={{ padding: '8px 14px 2px', fontSize: '10px', fontWeight: 800, color: '#eb1700', textTransform: 'uppercase' }}>
              FinOps Governance Roles
            </div>
            {finOpsRoles.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRoleId(role.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 14px',
                  border: 'none',
                  backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                  color: activeRole.id === role.id ? '#000099' : '#212121',
                  fontSize: '12px',
                  fontWeight: activeRole.id === role.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span>{role.label}</span>
                {activeRole.id === role.id && <Check size={14} color="#000099" />}
              </button>
            ))}

            {/* Case-Based Roles */}
            <div style={{ padding: '8px 14px 2px', fontSize: '10px', fontWeight: 800, color: '#63666a', textTransform: 'uppercase' }}>
              Business Contact Roles
            </div>
            {caseRoles.map(role => (
              <button
                key={role.id}
                onClick={() => {
                  setActiveRoleId(role.id);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 14px',
                  border: 'none',
                  backgroundColor: activeRole.id === role.id ? '#f1f4ff' : 'transparent',
                  color: activeRole.id === role.id ? '#000099' : '#212121',
                  fontSize: '12px',
                  fontWeight: activeRole.id === role.id ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                <span>{role.label}</span>
                {activeRole.id === role.id && <Check size={14} color="#000099" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
