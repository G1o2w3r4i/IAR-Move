import React, { createContext, useContext, useState } from 'react';
import type { Engagement, Issue } from '../types/dataverse.types';

export type ReportingSubView = 'queue' | 'audit-studio' | 'executive-studio' | 'issues-ledger';

interface EngagementContextType {
  selectedEngagementId: string | null;
  setSelectedEngagementId: (id: string | null) => void;
  activeReportingView: ReportingSubView;
  setActiveReportingView: (view: ReportingSubView) => void;
  selectedIssueId: string | null;
  setSelectedIssueId: (id: string | null) => void;
  activeEngagement: Engagement | null;
  setActiveEngagement: (eng: Engagement | null) => void;
  activeIssue: Issue | null;
  setActiveIssue: (issue: Issue | null) => void;
}

const EngagementContext = createContext<EngagementContextType | undefined>(undefined);

export const EngagementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedEngagementId, setSelectedEngagementId] = useState<string | null>('REP-2026-001');
  const [activeReportingView, setActiveReportingView] = useState<ReportingSubView>('queue');
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [activeEngagement, setActiveEngagement] = useState<Engagement | null>(null);
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null);

  return (
    <EngagementContext.Provider
      value={{
        selectedEngagementId,
        setSelectedEngagementId,
        activeReportingView,
        setActiveReportingView,
        selectedIssueId,
        setSelectedIssueId,
        activeEngagement,
        setActiveEngagement,
        activeIssue,
        setActiveIssue,
      }}
    >
      {children}
    </EngagementContext.Provider>
  );
};

export const useEngagement = (): EngagementContextType => {
  const context = useContext(EngagementContext);
  if (!context) {
    throw new Error('useEngagement must be used within an EngagementProvider');
  }
  return context;
};
