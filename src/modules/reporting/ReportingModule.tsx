import React from 'react';
import { useEngagement } from '../../context/EngagementContext';
import { AuditQueueView } from './views/AuditQueueView';
import { AuditReportStudioView } from './views/AuditReportStudioView';
import { ExecutiveStudioView } from './views/ExecutiveStudioView';

export const ReportingModule: React.FC = () => {
  const { activeReportingView } = useEngagement();

  switch (activeReportingView) {
    case 'audit-studio':
      return <AuditReportStudioView />;
    case 'executive-studio':
      return <ExecutiveStudioView />;
    case 'queue':
    default:
      return <AuditQueueView />;
  }
};
