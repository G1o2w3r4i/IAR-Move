import React from 'react';
import { Header } from './Header';
import { useNavigation } from '../../context/NavigationContext';
import { ReportingModule } from '../../modules/reporting';
import { PrePlanningPlaceholder } from '../../modules/pre-planning';
import { PlanningPlaceholder } from '../../modules/planning';
import { FieldworkPlaceholder } from '../../modules/fieldwork';
import { WrapUpPlaceholder } from '../../modules/wrap-up';
import { DashboardsPlaceholder } from '../../modules/dashboards';

export const AppShell: React.FC = () => {
  const { currentPhase } = useNavigation();

  const renderActiveModule = () => {
    switch (currentPhase) {
      case 'reporting':
        return <ReportingModule />;
      case 'pre-planning':
        return <PrePlanningPlaceholder />;
      case 'planning':
        return <PlanningPlaceholder />;
      case 'fieldwork':
        return <FieldworkPlaceholder />;
      case 'wrap-up':
        return <WrapUpPlaceholder />;
      case 'dashboards':
        return <DashboardsPlaceholder />;
      default:
        return <ReportingModule />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f4f4f4' }}>
      <Header />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderActiveModule()}
      </main>
    </div>
  );
};
