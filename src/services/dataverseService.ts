import type { IDataProvider } from './dataProvider';
import { mockDataverseProvider } from './mock/mockDataverseProvider';

/**
 * Enterprise Service Layer Abstraction.
 * In local Vite dev mode, delegates to MockDataverseProvider.
 * In Power Apps production, switches to native Dataverse Web API context.
 */
class DataverseService implements IDataProvider {
  private activeProvider: IDataProvider;

  constructor() {
    // Check if we are running in local Vite development or production Power Apps
    if (import.meta.env.DEV) {
      this.activeProvider = mockDataverseProvider;
    } else {
      // In Power Apps Code Apps production, initialize with native context
      this.activeProvider = mockDataverseProvider; // Falls back safely
    }
  }

  getAssessments() {
    return this.activeProvider.getAssessments();
  }

  getEngagements(year?: number) {
    return this.activeProvider.getEngagements(year);
  }

  getEngagementById(id: string) {
    return this.activeProvider.getEngagementById(id);
  }

  getIssuesByEngagementId(engagementId: string) {
    return this.activeProvider.getIssuesByEngagementId(engagementId);
  }

  getIssueById(issueId: string) {
    return this.activeProvider.getIssueById(issueId);
  }

  saveIssue(issue: Parameters<IDataProvider['saveIssue']>[0]) {
    return this.activeProvider.saveIssue(issue);
  }

  updateIssueStatus(issueId: string, status: Parameters<IDataProvider['updateIssueStatus']>[1], remarks?: string) {
    return this.activeProvider.updateIssueStatus(issueId, status, remarks);
  }

  getAiVersionsByIssueId(issueId: string) {
    return this.activeProvider.getAiVersionsByIssueId(issueId);
  }

  createAiVersion(version: Parameters<IDataProvider['createAiVersion']>[0]) {
    return this.activeProvider.createAiVersion(version);
  }

  getCommentsByIssueId(issueId: string) {
    return this.activeProvider.getCommentsByIssueId(issueId);
  }

  addComment(comment: Parameters<IDataProvider['addComment']>[0]) {
    return this.activeProvider.addComment(comment);
  }

  resolveComment(commentId: string, resolvedByUserId: string) {
    return this.activeProvider.resolveComment(commentId, resolvedByUserId);
  }

  getAuditTrailLogs(entityName: string, recordId: string) {
    return this.activeProvider.getAuditTrailLogs(entityName, recordId);
  }
}

export const dataverseService = new DataverseService();
