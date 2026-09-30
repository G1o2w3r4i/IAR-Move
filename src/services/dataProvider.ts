import type {
  Assessment,
  Engagement,
  Issue,
  IssueStatus,
  IssueAiVersion,
  IssueComment,
  AuditTrailLog
} from '../types/dataverse.types';

export interface IDataProvider {
  getAssessments(): Promise<Assessment[]>;
  getEngagements(assessmentYear?: number): Promise<Engagement[]>;
  getEngagementById(engagementId: string): Promise<Engagement | null>;
  getIssuesByEngagementId(engagementId: string): Promise<Issue[]>;
  getIssueById(issueId: string): Promise<Issue | null>;
  saveIssue(issue: Partial<Issue>): Promise<Issue>;
  updateIssueStatus(issueId: string, targetStatus: IssueStatus, remarks?: string): Promise<Issue>;
  getAiVersionsByIssueId(issueId: string): Promise<IssueAiVersion[]>;
  createAiVersion(version: Partial<IssueAiVersion>): Promise<IssueAiVersion>;
  getCommentsByIssueId(issueId: string): Promise<IssueComment[]>;
  addComment(comment: Partial<IssueComment>): Promise<IssueComment>;
  resolveComment(commentId: string, resolvedByUserId: string): Promise<IssueComment>;
  getAuditTrailLogs(entityName: string, recordId: string): Promise<AuditTrailLog[]>;
}
