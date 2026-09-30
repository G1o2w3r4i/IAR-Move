import React, { createContext, useContext, useState } from 'react';
import type { AuditPhase, PhaseItem } from '../types/navigation.types';

export const AUDIT_PHASES: PhaseItem[] = [
  { id: 'pre-planning', label: 'Pre-Planning', isImplemented: false },
  { id: 'planning', label: 'Planning', isImplemented: false },
  { id: 'fieldwork', label: 'Fieldwork', isImplemented: false },
  { id: 'reporting', label: 'Reporting', isImplemented: true },
  { id: 'wrap-up', label: 'Wrap-up', isImplemented: false },
  { id: 'dashboards', label: 'Dashboards', isImplemented: false },
];

interface NavigationContextType {
  currentPhase: AuditPhase;
  setCurrentPhase: (phase: AuditPhase) => void;
  phases: PhaseItem[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPhase, setCurrentPhase] = useState<AuditPhase>('reporting');

  return (
    <NavigationContext.Provider value={{ currentPhase, setCurrentPhase, phases: AUDIT_PHASES }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationContextType => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};
