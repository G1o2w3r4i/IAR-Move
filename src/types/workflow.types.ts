import type { IssueStatus } from './dataverse.types';
import type { BaseRole } from './navigation.types';

export interface WorkflowTransitionGuard {
  allowedFrom: IssueStatus[];
  targetStatus: IssueStatus;
  requiredRole: BaseRole[];
  requiresAllIssuesApproved?: boolean;
  requiresNoCriticalIssues?: boolean;
  escalateToVpIfCritical?: boolean;
}

export interface ReviewAction {
  id: string;
  label: string;
  targetStatus: IssueStatus;
  variant: 'primary' | 'secondary' | 'danger';
  confirmPrompt?: string;
}
