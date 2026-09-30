import type { IssueAiVersion } from '../types/dataverse.types';

export interface AiSynthesisRequest {
  testProcedureCode: string;
  rawFieldworkNotes: string;
  engagementContext?: string;
  priorVersionId?: string;
  refinementInstructions?: string;
}

export interface ReportExportRequest {
  engagementId: string;
  reportType: 'audit' | 'executive';
  format: 'pdf' | 'docx';
}

class FlowService {
  /**
   * Invokes Power Automate HTTP Instant Flow FLW-IAR-GenerateAiFinding
   */
  async generateAiFinding(payload: AiSynthesisRequest): Promise<Partial<IssueAiVersion>> {
    // In local dev mode, simulate enterprise LLM synthesis
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          versionNumber: payload.priorVersionId ? 2 : 1,
          status: 'CANDIDATE',
          synthesizedHeader: `Exclusion of Dormant & Inactive Accounts from Periodic Verification (${payload.testProcedureCode})`,
          synthesizedDescription: `Field audit testing identified that the automated verification scope omitted accounts dormant for >90 days, conflicting with standard access governance policies.`,
          synthesizedRootCause: `Lack of synchronization between the Identity Management (IAM) directory and the audit extraction filter parameters.`,
          synthesizedImpact: `Increased exposure to unauthorized lateral movement and non-compliance with Sarbanes-Oxley IT general controls (ITGC).`,
          synthesizedRecommendation: `Reconfigure IAM synchronization scripts to mandate inclusion of all inactive/dormant profiles in semi-annual user access reviews.`
        });
      }, 1200);
    });
  }

  /**
   * Invokes Power Automate HTTP Instant Flow FLW-IAR-CompileAndExportReport
   */
  async compileAndExportReport(request: ReportExportRequest): Promise<{ downloadUrl: string; sharePointPath: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          downloadUrl: `https://jnj.sharepoint.com/sites/IAR/Engagements/${request.engagementId}/FinalReports/${request.reportType}_report.pdf`,
          sharePointPath: `/Sites/IAR/Engagements/${request.engagementId}/FinalReports/`
        });
      }, 1500);
    });
  }
}

export const flowService = new FlowService();
