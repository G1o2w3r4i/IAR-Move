import React, { createContext, useContext, useState } from 'react';
import type { ApplicationRole, UserSession } from '../types/navigation.types';

export const APPLICATION_ROLES: ApplicationRole[] = [
  // IT Roles
  { id: 'it-auditor', label: 'IT Auditor', category: 'IT Roles', scope: 'Issues Only', domain: 'IT', baseRole: 'auditor' },
  { id: 'it-team-coordinator', label: 'IT Team Co-Ordinator', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'team-coordinator' },
  { id: 'it-manager', label: 'IT Manager', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'manager' },
  { id: 'it-director', label: 'IT Director', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'director' },
  { id: 'it-vp', label: 'IT VP', category: 'IT Roles', scope: 'Issues, Audit & Summary', domain: 'IT', baseRole: 'vp' },

  // FinOps Roles
  { id: 'finops-auditor', label: 'FinOps Auditor', category: 'FinOps Roles', scope: 'Issues Only', domain: 'FinOps', baseRole: 'auditor' },
  { id: 'finops-team-coordinator', label: 'FinOps Team Co-Ordinator', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'team-coordinator' },
  { id: 'finops-manager', label: 'FinOps Manager', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'manager' },
  { id: 'finops-director', label: 'FinOps Director', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'director' },
  { id: 'finops-vp', label: 'FinOps VP', category: 'FinOps Roles', scope: 'Issues, Audit & Summary', domain: 'FinOps', baseRole: 'vp' },

  // Case-Based Roles
  { id: 'primary-business-contact', label: 'Primary Business Contact', category: 'Case-Based', scope: 'Issues, Audit & Summary', domain: 'All', baseRole: 'primary-business-contact' }
];

interface UserSessionContextType {
  currentUser: UserSession;
  activeRole: ApplicationRole;
  setActiveRoleId: (roleId: string) => void;
  availableRoles: ApplicationRole[];
}

const DEFAULT_USER: UserSession = {
  userId: 'USR-001',
  name: 'Tamilselvan',
  email: 'tamilselvan@jnj.com',
  role: 'IT Manager',
  baseRole: 'manager',
  avatar: 'TS',
  department: 'Global Audit & Assurance (GA&A)'
};

const UserSessionContext = createContext<UserSessionContextType | undefined>(undefined);

export const UserSessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRoleId, setActiveRoleId] = useState<string>('it-manager');

  const activeRole = APPLICATION_ROLES.find(r => r.id === activeRoleId) || APPLICATION_ROLES[2];

  const currentUser: UserSession = {
    ...DEFAULT_USER,
    role: activeRole.label,
    baseRole: activeRole.baseRole
  };

  return (
    <UserSessionContext.Provider
      value={{
        currentUser,
        activeRole,
        setActiveRoleId,
        availableRoles: APPLICATION_ROLES
      }}
    >
      {children}
    </UserSessionContext.Provider>
  );
};

export const useUserSession = (): UserSessionContextType => {
  const context = useContext(UserSessionContext);
  if (!context) {
    throw new Error('useUserSession must be used within a UserSessionProvider');
  }
  return context;
};
