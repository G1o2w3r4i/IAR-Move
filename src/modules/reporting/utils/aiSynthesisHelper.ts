// ==============================================================================
// AI Synthesis & Draft Generator Helper
// Reusable corporate audit narrative synthesizer for CreateIssue & FindingWorkpaper
// ==============================================================================

export interface AiSynthesizedFields {
  updatedIssueHeader: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
}

export const synthesizeAiDraft = (
  procCode: string,
  issueText: string,
  func: 'IT' | 'FinOps',
  remarksMap: Record<string, string> = {},
  _cycleNum: number = 1,
  processArea: string = 'Access Control & IAM',
  criticality: string = 'Major',
  engagementId: string = 'REP-2026-001'
): AiSynthesizedFields => {
  const textLower = (issueText || '').toLowerCase();

  // Contextual Citation based on keywords
  let citation = 'Standard S-15: Security Architecture & Operational Governance';
  let stdCode = 'STD-IAPP-S15';
  if (
    textLower.includes('access') ||
    textLower.includes('user') ||
    textLower.includes('dormant') ||
    textLower.includes('entitlement')
  ) {
    citation = 'Standard S-07: Semi-Annual User Entitlement Review & Deprovisioning';
    stdCode = 'STD-IAPP-S07';
  } else if (
    textLower.includes('telemetry') ||
    textLower.includes('sensor') ||
    textLower.includes('calibration')
  ) {
    citation = 'Standard S-12: Automated System Telemetry Logging & Monitoring Protocols';
    stdCode = 'STD-IAPP-S12';
  } else if (
    textLower.includes('scrap') ||
    textLower.includes('variance') ||
    textLower.includes('inventory')
  ) {
    citation = 'Standard S-04: Material Scrap & Inventory Financial Reconciliation';
    stdCode = 'STD-IAPP-S04';
  } else if (
    textLower.includes('gxp') ||
    textLower.includes('software') ||
    textLower.includes('validation')
  ) {
    citation = 'Standard S-19: GxP Electronic Records Integrity (21 CFR Part 11)';
    stdCode = 'STD-IAPP-S19';
  }

  const procTitle = procCode ? `${procCode} Verification` : 'Audit Procedure Review';

  const headerRemark = remarksMap.updatedIssueHeader || remarksMap.title
    ? ` (${remarksMap.updatedIssueHeader || remarksMap.title})`
    : '';
  const descRemark = remarksMap.description || remarksMap.issueNarrative
    ? `\n\n[Auditor Note]: ${remarksMap.description || remarksMap.issueNarrative}`
    : '';
  const rootRemark = remarksMap.rootCause ? ` Specifically addressing: ${remarksMap.rootCause}.` : '';
  const impactRemark = remarksMap.impact ? ` Critical exposure factor: ${remarksMap.impact}.` : '';
  const recRemark = remarksMap.recommendation ? `\n4. ${remarksMap.recommendation}` : '';

  return {
    updatedIssueHeader: `${procCode || 'TP-101'}: Inadequate Controls over ${procTitle}${headerRemark}`,
    description: `During field audit testing of ${procTitle} for the ${engagementId} environment, audit identified that ${issueText.trim()}.\n\nApplicable Standard Citation: Under Johnson & Johnson ${citation} (${stdCode}), operational environments must maintain continuous verifiable evidence of compliance.${descRemark}`,
    rootCause: `Systemic governance and automated synchronization gaps in ${processArea}. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols under the ${func} operating model.${rootRemark}`,
    impact: `Criticality rated as ${criticality}. Uncontrolled variance exposes the operational environment to potential compliance citations, unauthorized data modification, and SOX/GxP regulatory escalation.${impactRemark}`,
    recommendation: `1. Implement automated real-time exception alerting and scheduled synchronization for ${procTitle}.\n2. Establish mandatory dual-custody authorization for configuration overrides within ${func} operations.\n3. Conduct retrospective audit reconciliations on a quarterly basis.${recRemark}`,
  };
};
