export type AuditPhase =
  | 'pre-planning'
  | 'planning'
  | 'fieldwork'
  | 'reporting'
  | 'wrap-up'
  | 'dashboards';

export interface PhaseItem {
  id: AuditPhase;
  label: string;
  isImplemented: boolean;
}

export type RoleCategory = 'IT Roles' | 'FinOps Roles' | 'Case-Based';

export type BaseRole =
  | 'auditor'
  | 'team-coordinator'
  | 'manager'
  | 'director'
  | 'vp'
  | 'primary-business-contact';

export interface ApplicationRole {
  id: string;
  label: string;
  category: RoleCategory;
  scope: string;
  domain: 'IT' | 'FinOps' | 'All';
  baseRole: BaseRole;
}

export interface UserSession {
  userId: string;
  name: string;
  email: string;
  role: string;
  baseRole: BaseRole;
  avatar: string;
  department: string;
}
