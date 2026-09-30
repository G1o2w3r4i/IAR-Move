import type { IDataProvider } from '../dataProvider';
import type {
  Assessment,
  Engagement,
  Issue,
  IssueStatus,
  IssueAiVersion,
  IssueComment,
  AuditTrailLog
} from '../../types/dataverse.types';
import { SEED_ASSESSMENTS, SEED_ENGAGEMENTS, SEED_ISSUES } from './mockData';

export class MockDataverseProvider implements IDataProvider {
  private assessments: Assessment[] = [...SEED_ASSESSMENTS];
  private engagements: Engagement[] = [...SEED_ENGAGEMENTS];
  private issues: Issue[] = [...SEED_ISSUES];
  private comments: IssueComment[] = [];
  private aiVersions: IssueAiVersion[] = [];
  private auditLogs: AuditTrailLog[] = [];

  async getAssessments(): Promise<Assessment[]> {
    return Promise.resolve([...this.assessments]);
  }

  async getEngagements(assessmentYear?: number): Promise<Engagement[]> {
    if (assessmentYear) {
      return Promise.resolve(this.engagements.filter(e => e.assessmentId.includes(assessmentYear.toString())));
    }
    return Promise.resolve([...this.engagements]);
  }

  async getEngagementById(engagementId: string): Promise<Engagement | null> {
    const found = this.engagements.find(e => e.id === engagementId || e.reportId === engagementId);
    return Promise.resolve(found ? { ...found } : null);
  }

  async getIssuesByEngagementId(engagementId: string): Promise<Issue[]> {
    return Promise.resolve(this.issues.filter(i => i.engagementId === engagementId));
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const found = this.issues.find(i => i.id === issueId);
    return Promise.resolve(found ? { ...found } : null);
  }

  async saveIssue(issueData: Partial<Issue>): Promise<Issue> {
    if (issueData.id) {
      const idx = this.issues.findIndex(i => i.id === issueData.id);
      if (idx >= 0) {
        this.issues[idx] = { ...this.issues[idx], ...issueData } as Issue;
        return Promise.resolve({ ...this.issues[idx] });
      }
    }

    const newIssue: Issue = {
      id: `ISSUE-${String(this.issues.length + 1).padStart(3, '0')}`,
      engagementId: issueData.engagementId || 'REP-2026-001',
      testProcedureCode: issueData.testProcedureCode || 'TP-101',
      title: issueData.title || 'Untitled Issue',
      criticality: issueData.criticality || 'Moderate',
      status: 'Pending Staff',
      ...issueData
    } as Issue;

    this.issues.push(newIssue);
    return Promise.resolve({ ...newIssue });
  }

  async updateIssueStatus(issueId: string, targetStatus: IssueStatus, remarks?: string): Promise<Issue> {
    const issue = this.issues.find(i => i.id === issueId);
    if (!issue) {
      throw new Error(`Issue ${issueId} not found`);
    }

    const priorState = issue.status;
    issue.status = targetStatus;

    // Record immutable audit trail log
    this.auditLogs.push({
      logId: `LOG-${Date.now()}`,
      entityName: 'cr_issue',
      recordId: issueId,
      action: 'STATUS_TRANSITION',
      previousState: priorState,
      newState: targetStatus,
      performedByUserId: 'USR-003',
      performedByUserName: 'Current User',
      userRole: 'Audit Manager',
      remarks: remarks || `Transitioned from ${priorState} to ${targetStatus}`,
      timestamp: new Date().toISOString()
    });

    return Promise.resolve({ ...issue });
  }

  async getAiVersionsByIssueId(issueId: string): Promise<IssueAiVersion[]> {
    return Promise.resolve(this.aiVersions.filter(v => v.issueId === issueId));
  }

  async createAiVersion(versionData: Partial<IssueAiVersion>): Promise<IssueAiVersion> {
    const newVersion: IssueAiVersion = {
      versionId: `AIVER-${Date.now()}`,
      issueId: versionData.issueId || 'ISSUE-001',
      versionNumber: versionData.versionNumber || 1,
      status: 'CANDIDATE',
      synthesizedHeader: versionData.synthesizedHeader || '',
      synthesizedDescription: versionData.synthesizedDescription || '',
      synthesizedRootCause: versionData.synthesizedRootCause || '',
      synthesizedImpact: versionData.synthesizedImpact || '',
      synthesizedRecommendation: versionData.synthesizedRecommendation || '',
      generatedByUserId: 'USR-003',
      generatedAt: new Date().toISOString(),
      ...versionData
    };
    this.aiVersions.push(newVersion);
    return Promise.resolve({ ...newVersion });
  }

  async getCommentsByIssueId(issueId: string): Promise<IssueComment[]> {
    return Promise.resolve(this.comments.filter(c => c.issueId === issueId));
  }

  async addComment(commentData: Partial<IssueComment>): Promise<IssueComment> {
    const newComment: IssueComment = {
      commentId: `COM-${Date.now()}`,
      issueId: commentData.issueId || '',
      fieldKey: commentData.fieldKey || 'general',
      content: commentData.content || '',
      authorId: 'USR-003',
      authorName: 'Amanda Palmer',
      taggedUserId: commentData.taggedUserId || null,
      taggedUserName: commentData.taggedUserName || null,
      isResolved: false,
      createdAt: new Date().toISOString(),
      ...commentData
    };
    this.comments.push(newComment);
    return Promise.resolve({ ...newComment });
  }

  async resolveComment(commentId: string, resolvedByUserId: string): Promise<IssueComment> {
    const comment = this.comments.find(c => c.commentId === commentId);
    if (!comment) throw new Error(`Comment ${commentId} not found`);
    comment.isResolved = true;
    comment.resolvedById = resolvedByUserId;
    comment.resolvedByName = 'Current User';
    comment.resolvedAt = new Date().toISOString();
    return Promise.resolve({ ...comment });
  }

  async getAuditTrailLogs(entityName: string, recordId: string): Promise<AuditTrailLog[]> {
    return Promise.resolve(this.auditLogs.filter(l => l.entityName === entityName && l.recordId === recordId));
  }
}

export const mockDataverseProvider = new MockDataverseProvider();
