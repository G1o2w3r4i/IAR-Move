import React, { useState, useMemo, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  Sparkles,
  X,
  Plus,
  RotateCcw,
  GitCompare,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  AlertTriangle,
  ArrowLeft,
  Save,
  Send
} from 'lucide-react';
import type { CriticalityLevel, Issue } from '../../../types/dataverse.types';
import {
  SharedTextArea,
  SharedSelect,
  SharedButton,
  SharedFieldLabel,
  AIInput,
  SharedConfirmDialog,
  SharedTooltip,
  BackButton
} from '../../../components/shared';
import testProceduresData from '../data/testProcedures.json';
import engagementsData from '../data/engagements.json';

interface CreateIssueDialogProps {
  open: boolean;
  onClose: () => void;
  engagementId: string;
  engagementName?: string;
  job?: any;
  defaultFunction?: 'IT' | 'FinOps';
  onSave: (newIssue: Partial<Issue>) => void;
}

const CRITICALITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' }
];

const PROCESS_AREA_OPTIONS = [
  { value: 'Access Control & IAM', label: 'Access Control & IAM' },
  { value: 'Cybersecurity & Infrastructure', label: 'Cybersecurity & Infrastructure' },
  { value: 'Regulatory Compliance & GxP', label: 'Regulatory Compliance & GxP' },
  { value: 'Supply Chain & Manufacturing', label: 'Supply Chain & Manufacturing' },
  { value: 'Financial Controls & Sox', label: 'Financial Controls & SOX' },
  { value: 'Change Management & DevOps', label: 'Change Management & DevOps' },
  { value: 'Quality Assurance & Calibration', label: 'Quality Assurance & Calibration' }
];

const ROOT_CAUSE_TYPE_OPTIONS = [
  { value: 'Process Gap', label: 'Process Gap' },
  { value: 'System Configuration', label: 'System Configuration' },
  { value: 'Human Oversight', label: 'Human Oversight' },
  { value: 'Third-Party Dependency', label: 'Third-Party Dependency' },
  { value: 'Resource Constraint', label: 'Resource Constraint' }
];

const DEFAULT_TEST_PROCEDURES = [
  { value: 'TP-101', label: 'TP-101: User Access & Authentication Review', function: 'IT' },
  { value: 'TP-102', label: 'TP-102: Privileged Access Management Verification', function: 'IT' },
  { value: 'TP-103', label: 'TP-103: Automated Telemetry & Calibration Logging Review', function: 'IT' },
  { value: 'TP-104', label: 'TP-104: Segregation of Duties & Authorization Matrix', function: 'FinOps' },
  { value: 'TP-105', label: 'TP-105: Third-Party Vendor Network Deprovisioning', function: 'IT' },
  { value: 'TP-106', label: 'TP-106: Inventory Scrap & Variance Reconciliation', function: 'FinOps' },
  { value: 'TP-107', label: 'TP-107: Cleanroom Environmental HVAC Controls', function: 'FinOps' },
  { value: 'TP-110', label: 'TP-110: GxP Software Validation & Data Integrity Audit', function: 'IT' }
];

interface AiFields {
  updatedIssueHeader: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
}

export const CreateIssueDialog: React.FC<CreateIssueDialogProps> = ({
  open,
  onClose,
  engagementId,
  engagementName,
  job,
  defaultFunction = 'IT',
  onSave
}) => {
  // Resolve engagement display name
  const resolvedEngagementName = useMemo(() => {
    if (engagementName) return engagementName;
    if (job?.engagementName) return job.engagementName;
    if (job?.title) return job.title;
    if (job?.name) return job.name;
    if (job?.engagement) return job.engagement;
    const cleanId = (engagementId || '').trim().toUpperCase();
    const found = (engagementsData as any[]).find(
      (e) =>
        (e.id && e.id.toUpperCase() === cleanId) ||
        (e.jobId && String(e.jobId).toUpperCase() === cleanId)
    );
    return found?.engagementName || found?.fileName || engagementId;
  }, [engagementName, job, engagementId]);

  // Test Procedures filtered dynamically by engagement
  const testProcedureOptions = useMemo(() => {
    if (!engagementId) return DEFAULT_TEST_PROCEDURES;
    const cleanId = engagementId.trim().toUpperCase();
    const matched = (testProceduresData as any[]).filter(
      (tp) =>
        (tp.engagementId && tp.engagementId.toUpperCase() === cleanId) ||
        (tp.jobId && String(tp.jobId).toUpperCase() === cleanId) ||
        (job?.jobId && String(tp.jobId) === String(job.jobId))
    );

    if (matched.length > 0) {
      return matched.map((tp) => ({
        value: tp.code || tp.id,
        label: tp.fullName || `${tp.code}: ${tp.name}`,
        function: tp.function || 'IT'
      }));
    }
    return DEFAULT_TEST_PROCEDURES;
  }, [engagementId, job]);

  // Form State: 3 Core Initial Fields
  const [testProcedure, setTestProcedure] = useState<string>(
    testProcedureOptions[0]?.value || 'TP-101'
  );
  const [originalIssue, setOriginalIssue] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<'IT' | 'FinOps'>(defaultFunction);

  // Additional Fields State (Collapsible)
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [criticality, setCriticality] = useState<CriticalityLevel>('Major');
  const [repeatFinding, setRepeatFinding] = useState<'No' | 'Yes'>('No');
  const [soxReportable, setSoxReportable] = useState<'No' | 'Yes'>('No');
  const [processArea, setProcessArea] = useState('Access Control & IAM');
  const [rootCauseType, setRootCauseType] = useState('Process Gap');

  // AI Generation & Studio Mode State
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);

  // Active AI Generated Fields
  const [aiData, setAiData] = useState<AiFields>({
    updatedIssueHeader: '',
    description: '',
    rootCause: '',
    impact: '',
    recommendation: ''
  });

  // Snapshot of parameters used when generating current AI draft
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    testProcedure: string;
    originalIssue: string;
    selectedFunction: 'IT' | 'FinOps';
  } | null>(null);

  // State to track if user dismissed the "regenerate" warning banner
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Compare Dialog state
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState<boolean>(false);
  const [previousAiData, setPreviousAiData] = useState<AiFields | null>(null);
  const [candidateAiData, setCandidateAiData] = useState<AiFields | null>(null);

  // Unsaved changes confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  // Field selection for comparison / hybrid merge: 'candidate' | 'previous'
  const [selectedComparisonVersions, setSelectedComparisonVersions] = useState<
    Record<keyof AiFields, 'candidate' | 'previous'>
  >({
    updatedIssueHeader: 'candidate',
    description: 'candidate',
    rootCause: 'candidate',
    impact: 'candidate',
    recommendation: 'candidate'
  });

  // Field-level remarks for AI fine-tuning
  const [fieldRemarks, setFieldRemarks] = useState<Record<keyof AiFields, string>>({
    updatedIssueHeader: '',
    description: '',
    rootCause: '',
    impact: '',
    recommendation: ''
  });

  // Automatically adjust default function when a test procedure is picked
  const handleTestProcedureChange = (val: string) => {
    setTestProcedure(val);
    setIsBannerDismissed(false);
    const found = testProcedureOptions.find((o) => o.value === val);
    if (found?.function) {
      setSelectedFunction(found.function as 'IT' | 'FinOps');
    }
  };

  const handleOriginalIssueChange = (val: string) => {
    setOriginalIssue(val);
    setIsBannerDismissed(false);
  };

  const handleFunctionChange = (func: 'IT' | 'FinOps') => {
    setSelectedFunction(func);
    setIsBannerDismissed(false);
  };

  // Check if original issue, function, or test procedure have changed since AI draft was generated
  const hasParamsChanged = useMemo(() => {
    if (!lastGeneratedParams || !isAiGenerated) return false;
    return (
      lastGeneratedParams.originalIssue.trim() !== originalIssue.trim() ||
      lastGeneratedParams.selectedFunction !== selectedFunction ||
      lastGeneratedParams.testProcedure !== testProcedure
    );
  }, [lastGeneratedParams, isAiGenerated, originalIssue, selectedFunction, testProcedure]);

  const showRegenerateBanner = hasParamsChanged && !isBannerDismissed;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTestProcedure(testProcedureOptions[0]?.value || 'TP-101');
      setOriginalIssue('');
      setSelectedFunction(defaultFunction);
      setIsAdditionalOpen(false);
      setCriticality('Major');
      setRepeatFinding('No');
      setSoxReportable('No');
      setProcessArea('Access Control & IAM');
      setRootCauseType('Process Gap');
      setIsAiLoading(false);
      setIsAiGenerated(false);
      setIsFullScreen(false);
      setCurrentVersionNumber(1);
      setLastGeneratedParams(null);
      setIsBannerDismissed(false);
      setIsCompareDialogOpen(false);
      setIsConfirmDialogOpen(false);
      setPreviousAiData(null);
      setCandidateAiData(null);
      setAiData({
        updatedIssueHeader: '',
        description: '',
        rootCause: '',
        impact: '',
        recommendation: ''
      });
      setFieldRemarks({
        updatedIssueHeader: '',
        description: '',
        rootCause: '',
        impact: '',
        recommendation: ''
      });
    }
  }, [open, testProcedureOptions, defaultFunction]);

  // Synthesis Helper: Generates corporate audit narrative based on inputs & remarks
  const synthesizeAiDraft = (
    procCode: string,
    issueText: string,
    func: 'IT' | 'FinOps',
    remarksMap: Record<keyof AiFields, string>,
    _cycleNum: number
  ): AiFields => {
    const selectedProc = testProcedureOptions.find((p) => p.value === procCode);
    const procTitle = selectedProc ? selectedProc.label.replace(/^TP-\d+:\s*/, '') : 'Audit Review';
    const textLower = (issueText || '').toLowerCase();

    // Contextual Citation based on keywords
    let citation = 'Standard S-15: Security Architecture & Operational Governance';
    let stdCode = 'STD-IAPP-S15';
    if (textLower.includes('access') || textLower.includes('user') || textLower.includes('dormant') || textLower.includes('entitlement')) {
      citation = 'Standard S-07: Semi-Annual User Entitlement Review & Deprovisioning';
      stdCode = 'STD-IAPP-S07';
    } else if (textLower.includes('telemetry') || textLower.includes('sensor') || textLower.includes('calibration')) {
      citation = 'Standard S-12: Automated System Telemetry Logging & Monitoring Protocols';
      stdCode = 'STD-IAPP-S12';
    } else if (textLower.includes('scrap') || textLower.includes('variance') || textLower.includes('inventory')) {
      citation = 'Standard S-04: Material Scrap & Inventory Financial Reconciliation';
      stdCode = 'STD-IAPP-S04';
    } else if (textLower.includes('gxp') || textLower.includes('software') || textLower.includes('validation')) {
      citation = 'Standard S-19: GxP Electronic Records Integrity (21 CFR Part 11)';
      stdCode = 'STD-IAPP-S19';
    }

    const headerRemark = remarksMap.updatedIssueHeader ? ` (${remarksMap.updatedIssueHeader})` : '';
    const descRemark = remarksMap.description ? `\n\n[Auditor Note]: ${remarksMap.description}` : '';
    const rootRemark = remarksMap.rootCause ? ` Specifically addressing: ${remarksMap.rootCause}.` : '';
    const impactRemark = remarksMap.impact ? ` Critical exposure factor: ${remarksMap.impact}.` : '';
    const recRemark = remarksMap.recommendation ? `\n4. ${remarksMap.recommendation}` : '';

    return {
      updatedIssueHeader: `${procCode}: Inadequate Controls over ${procTitle}${headerRemark}`,
      description: `During field audit testing of ${procTitle} for the ${engagementId} environment, audit identified that ${issueText.trim()}.\n\nApplicable Standard Citation: Under Johnson & Johnson ${citation} (${stdCode}), operational environments must maintain continuous verifiable evidence of compliance.${descRemark}`,
      rootCause: `Systemic governance and automated synchronization gaps in ${processArea}. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols under the ${func} operating model.${rootRemark}`,
      impact: `Criticality rated as ${criticality}. Uncontrolled variance exposes the operational environment to potential compliance citations, unauthorized data modification, and SOX/GxP regulatory escalation.${impactRemark}`,
      recommendation: `1. Implement automated real-time exception alerting and scheduled synchronization for ${procTitle}.\n2. Establish mandatory dual-custody authorization for configuration overrides within ${func} operations.\n3. Conduct retrospective audit reconciliations on a quarterly basis.${recRemark}`
    };
  };

  // Trigger Initial AI Generation
  const handleGenerateAi = async () => {
    if (!testProcedure) {
      alert('Please select a Test Procedure.');
      return;
    }
    if (!originalIssue.trim()) {
      alert('Please enter the Original Issue text before generating AI fields.');
      return;
    }

    // Keep in compact modal dialog and show loader over the entire dialog
    setIsAiLoading(true);

    // Simulate enterprise LLM synthesis latency
    await new Promise((res) => setTimeout(res, 1100));

    const generated = synthesizeAiDraft(
      testProcedure,
      originalIssue,
      selectedFunction,
      fieldRemarks,
      1
    );

    setAiData(generated);
    setIsAiGenerated(true);
    setCurrentVersionNumber(1);
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
    });
    setIsBannerDismissed(false);
    setIsAiLoading(false);

    // Once generation completes, THEN transition into full-page studio beneath global header
    setIsFullScreen(true);
  };

  // Trigger AI Regeneration with Remarks & open Compare as Dialog
  const handleRegenerateAi = async () => {
    setIsAiLoading(true);

    // Preserve current draft as previous version
    setPreviousAiData({ ...aiData });

    await new Promise((res) => setTimeout(res, 850));

    const nextVer = currentVersionNumber + 1;
    const regenerated = synthesizeAiDraft(
      testProcedure,
      originalIssue,
      selectedFunction,
      fieldRemarks,
      nextVer
    );

    // Save candidate data and select candidate by default
    setCandidateAiData(regenerated);
    setSelectedComparisonVersions({
      updatedIssueHeader: 'candidate',
      description: 'candidate',
      rootCause: 'candidate',
      impact: 'candidate',
      recommendation: 'candidate'
    });

    setIsAiLoading(false);
    // Open Compare as a Dialog
    setIsCompareDialogOpen(true);
  };

  // Apply Hybrid Merge from Comparison Dialog
  const handleApplyComparisonMerge = () => {
    if (!previousAiData || !candidateAiData) {
      setIsCompareDialogOpen(false);
      return;
    }

    const merged: AiFields = {
      updatedIssueHeader:
        selectedComparisonVersions.updatedIssueHeader === 'candidate'
          ? candidateAiData.updatedIssueHeader
          : previousAiData.updatedIssueHeader,
      description:
        selectedComparisonVersions.description === 'candidate'
          ? candidateAiData.description
          : previousAiData.description,
      rootCause:
        selectedComparisonVersions.rootCause === 'candidate'
          ? candidateAiData.rootCause
          : previousAiData.rootCause,
      impact:
        selectedComparisonVersions.impact === 'candidate'
          ? candidateAiData.impact
          : previousAiData.impact,
      recommendation:
        selectedComparisonVersions.recommendation === 'candidate'
          ? candidateAiData.recommendation
          : previousAiData.recommendation
    };

    setAiData(merged);
    setCurrentVersionNumber((prev) => prev + 1);
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
    });
    setIsBannerDismissed(false);
    setIsCompareDialogOpen(false);
  };

  const handleKeepPreviousVersion = () => {
    if (previousAiData) {
      setAiData(previousAiData);
    }
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
    });
    setIsBannerDismissed(true);
    setIsCompareDialogOpen(false);
  };

  const handleDiscardComparison = () => {
    if (previousAiData) {
      setAiData(previousAiData);
    }
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
    });
    setIsBannerDismissed(true);
    setIsCompareDialogOpen(false);
  };

  const handleCancelComparison = () => {
    if (previousAiData) {
      setAiData(previousAiData);
    }
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
    });
    setIsBannerDismissed(true);
    setIsCompareDialogOpen(false);
  };

  // Field change handler for AI fields
  const handleAiFieldChange = (key: keyof AiFields, val: string) => {
    setAiData((prev) => ({ ...prev, [key]: val }));
  };

  // Remark change handler for AI fields
  const handleFieldRemarkChange = (key: keyof AiFields, remarkVal: string) => {
    setFieldRemarks((prev) => ({ ...prev, [key]: remarkVal }));
  };

  // Save Finding (either as draft 'Pending Staff' or submit 'Pending TC')
  const handleSaveFinding = (
    targetStatus: 'Pending Staff' | 'Pending TC' = 'Pending Staff',
    isManualDraft = false
  ) => {
    const selectedProc = testProcedureOptions.find((p) => p.value === testProcedure);
    const procTitle = selectedProc ? selectedProc.label.replace(/^TP-\d+:\s*/, '') : 'Audit Review';

    const finalTitle = isManualDraft
      ? originalIssue.slice(0, 80) || `${testProcedure}: Audit Finding`
      : aiData.updatedIssueHeader || originalIssue.slice(0, 80);

    const finalDescription = isManualDraft
      ? originalIssue.trim()
      : aiData.description || originalIssue.trim();

    onSave({
      engagementId,
      title: finalTitle.trim(),
      criticality,
      status: targetStatus,
      testProcedureCode: testProcedure,
      testProcedureTitle: procTitle,
      accountableProcessArea: processArea,
      accountableFunction:
        selectedFunction === 'IT'
          ? 'IT Infrastructure & Identity Access Management'
          : 'Finance Operations & Internal Controls',
      description: finalDescription.trim(),
      rootCause: aiData.rootCause.trim() || `${rootCauseType} identified during fieldwork.`,
      impact: aiData.impact.trim() || `Operational criticality categorized as ${criticality}.`,
      recommendation: aiData.recommendation.trim() || 'Remediate identified control variance.',
      activeAiVersionNumber: isAiGenerated ? currentVersionNumber : 1
    });

    handleClose();
  };

  // Close handler that thoroughly resets studio and full-screen state
  const handleClose = () => {
    setIsConfirmDialogOpen(false);
    setIsFullScreen(false);
    setIsAiGenerated(false);
    setIsAiLoading(false);
    setIsCompareDialogOpen(false);
    onClose();
  };

  if (!open) return null;

  // =========================================================================
  // MODE 1: COMPACT DIALOG (70% HEIGHT, 3 MANDATORY FIELDS + FOOTER)
  // Only closes when user clicks close button (backdrop clicks disabled)
  // =========================================================================
  if (!isFullScreen) {
    return (
      <>
        <Dialog
          open={open && !isFullScreen}
        onClose={(_event, reason) => {
          // Strictly prevent closing on clicking outside the dialog or pressing Escape
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
        }}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            width: '760px',
            maxWidth: '92vw',
            height: '70vh',
            minHeight: '480px',
            maxHeight: '70vh',
            borderRadius: '8px',
            backgroundColor: '#FFFFFF',
            overflow: 'hidden',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
          {/* Full-Dialog Loader Overlay during AI Generation */}
          {isAiLoading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 200,
                backgroundColor: 'rgba(255, 255, 255, 0.94)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '14px',
                padding: '24px',
                textAlign: 'center',
                borderRadius: '8px'
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: '#EFF6FF',
                  border: '1.5px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000099',
                  boxShadow: '0 4px 12px rgba(0, 0, 153, 0.08)'
                }}
              >
                <Sparkles size={22} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                  Generating Audit Finding with AI...
                </div>
                <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '360px', lineHeight: 1.4 }}>
                  Synthesizing observation notes, testing scope, standard citations, and root cause analysis...
                </div>
              </div>
            </div>
          )}

          <DialogTitle
            sx={{
              p: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              flexShrink: 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '5px',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000099'
                  }}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                  <h2 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                    Add Audit Finding
                  </h2>
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, lineHeight: 1.25 }}>
                    {resolvedEngagementName}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  if (originalIssue.trim()) {
                    setIsConfirmDialogOpen(true);
                  } else {
                    handleClose();
                  }
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: '#64748B',
                  padding: '4px',
                  borderRadius: '4px'
                }}
                title="Close"
              >
                <X size={17} />
              </button>
            </div>
          </DialogTitle>

          <DialogContent
            className="slim-light-scrollbar"
            sx={{
              flex: 1,
              minHeight: 0,
              px: '24px',
              pt: '20px !important',
              pb: '20px',
              backgroundColor: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: '#E2E8F0 transparent',
              '&::-webkit-scrollbar': {
                width: '4px',
                height: '4px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: '#E2E8F0',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: '#CBD5E1',
              },
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '2px' }}>
              
              {/* Row 1: Test Procedure (col 1) & Function (col 2) as a two-column input */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', alignItems: 'flex-start' }}>
                <div>
                  <SharedSelect
                    label="Test Procedure"
                    value={testProcedure}
                    onChange={(val) => handleTestProcedureChange(val as string)}
                    options={testProcedureOptions.map((opt) => ({
                      value: opt.value,
                      label: opt.label
                    }))}
                    required
                  />
                </div>

                <div>
                  <SharedFieldLabel label="Function" required />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedFunction('IT')}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: selectedFunction === 'IT' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                        backgroundColor: selectedFunction === 'IT' ? '#EFF6FF' : '#FFFFFF',
                        color: selectedFunction === 'IT' ? '#000099' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Cpu size={14} />
                      <span>IT</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedFunction('FinOps')}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        border: selectedFunction === 'FinOps' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                        backgroundColor: selectedFunction === 'FinOps' ? '#EFF6FF' : '#FFFFFF',
                        color: selectedFunction === 'FinOps' ? '#000099' : '#475569',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Layers size={14} />
                      <span>FinOps</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Row 2: Original Issue (Multiline Textarea) */}
              <div>
                <SharedTextArea
                  label="Original Issue"
                  value={originalIssue}
                  onChange={setOriginalIssue}
                  placeholder=""
                  rows={4}
                  required
                  showCharCount
                  maxLength={1200}
                />
              </div>

              {/* Toggle: "+ Additional Fields" Collapsible Section */}
              <div style={{ paddingTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#000099',
                    fontSize: '12.5px',
                    fontWeight: 700
                  }}
                >
                  {isAdditionalOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  <span>{isAdditionalOpen ? 'Hide Additional Fields' : '+ Additional Fields'}</span>
                </button>
              </div>

              {/* Collapsed Fields Section */}
              {isAdditionalOpen && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    animation: 'fadeIn 0.2s ease'
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <SharedSelect
                      label="Criticality"
                      value={criticality}
                      onChange={(v) => setCriticality(v as CriticalityLevel)}
                      options={CRITICALITY_OPTIONS}
                    />

                    <SharedSelect
                      label="Process Area"
                      value={processArea}
                      onChange={setProcessArea}
                      options={PROCESS_AREA_OPTIONS}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                    <SharedSelect
                      label="Repeat Finding"
                      value={repeatFinding}
                      onChange={(v) => setRepeatFinding(v as 'No' | 'Yes')}
                      options={[
                        { value: 'No', label: 'No' },
                        { value: 'Yes', label: 'Yes' }
                      ]}
                    />

                    <SharedSelect
                      label="SOX Reportable"
                      value={soxReportable}
                      onChange={(v) => setSoxReportable(v as 'No' | 'Yes')}
                      options={[
                        { value: 'No', label: 'No' },
                        { value: 'Yes', label: 'Yes' }
                      ]}
                    />

                    <SharedSelect
                      label="Root Cause Type"
                      value={rootCauseType}
                      onChange={setRootCauseType}
                      options={ROOT_CAUSE_TYPE_OPTIONS}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Empty space underneath 3 inputs as requested */}
            <div style={{ flex: 1, minHeight: '32px' }} />
          </DialogContent>

          <DialogActions
            sx={{
              p: '12px 24px',
              borderTop: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              flexShrink: 0,
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <SharedButton
              variant="outline"
              onClick={() => {
                if (originalIssue.trim()) {
                  setIsConfirmDialogOpen(true);
                } else {
                  handleClose();
                }
              }}
            >
              Cancel
            </SharedButton>

            <SharedButton
              variant="primary"
              startIcon={<Sparkles size={15} />}
              onClick={handleGenerateAi}
              disabled={!originalIssue.trim() || !testProcedure}
            >
              Generate with AI
            </SharedButton>
          </DialogActions>
        </div>
      </Dialog>

      <SharedConfirmDialog
        open={isConfirmDialogOpen}
        title="Unsaved Changes"
        message="Changes have been unsaved. Leaving will discard the draft and any edits. Are you sure you want to go back?"
        confirmLabel="Back"
        cancelLabel="Cancel"
        onConfirm={handleClose}
        onCancel={() => setIsConfirmDialogOpen(false)}
        variant="warning"
      />
    </>
  );
  }

  // =========================================================================
  // MODE 2: FULL-PAGE STUDIO SPLIT VIEW (LEFT MANUAL / RIGHT AI GENERATED)
  // Renders beneath global header ribbon at top: 77px with NO modal backdrop
  // =========================================================================
  return (
    <div
      className="create-issue-studio-root"
      style={{
        position: 'fixed',
        top: '77px',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: 'calc(100vh - 77px)',
        zIndex: 990,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Studio Body: Two Column Split Layout starting directly beneath global header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '52% 48%',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* ------------------------------------------------------------------- */}
        {/* LEFT COLUMN: MANUAL ENTRY & WORKPAPER CONTEXT                      */}
        {/* ------------------------------------------------------------------- */}
        <div
          className="slim-light-scrollbar"
          style={{
            backgroundColor: '#FFFFFF',
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#E2E8F0 transparent'
          }}
        >
          {/* Header with Icon-Only Back Button & Finding Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BackButton
              onClick={() => setIsConfirmDialogOpen(true)}
              title="Back"
              ariaLabel="Back"
            />
            <h1
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: '#334155',
                lineHeight: '1.3',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {resolvedEngagementName || 'Engagement'}
            </h1>
          </div>

          {/* Row 1: Test Procedure (col 1) & Function (col 2) as a two-column input */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <SharedSelect
                label="Test Procedure"
                value={testProcedure}
                onChange={(val) => handleTestProcedureChange(val as string)}
                options={testProcedureOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label
                }))}
                required
              />
            </div>

            <div>
              <SharedFieldLabel label="Function" required />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleFunctionChange('IT')}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedFunction === 'IT' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                    backgroundColor: selectedFunction === 'IT' ? '#EFF6FF' : '#FFFFFF',
                    color: selectedFunction === 'IT' ? '#000099' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Cpu size={14} />
                  <span>IT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFunctionChange('FinOps')}
                  style={{
                    flex: 1,
                    height: '36px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedFunction === 'FinOps' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                    backgroundColor: selectedFunction === 'FinOps' ? '#EFF6FF' : '#FFFFFF',
                    color: selectedFunction === 'FinOps' ? '#000099' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={14} />
                  <span>FinOps</span>
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Original Issue (Multiline Textarea) */}
          <div>
            <SharedTextArea
              label="Original Issue"
              value={originalIssue}
              onChange={handleOriginalIssueChange}
              placeholder=""
              rows={5}
              required
              showCharCount
            />
          </div>

              {/* Collapsible Additional Fields */}
              <div
                style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '6px',
                  backgroundColor: '#F8FAFC',
                  overflow: 'hidden'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#334155'
                  }}
                >
                  <span>Additional Finding Classification</span>
                  {isAdditionalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isAdditionalOpen && (
                  <div
                    style={{
                      padding: '0 14px 14px 14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      borderTop: '1px solid #E2E8F0',
                      paddingTop: '12px'
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <SharedSelect
                        label="Criticality"
                        value={criticality}
                        onChange={(v) => setCriticality(v as CriticalityLevel)}
                        options={CRITICALITY_OPTIONS}
                      />
                      <SharedSelect
                        label="Process Area"
                        value={processArea}
                        onChange={setProcessArea}
                        options={PROCESS_AREA_OPTIONS}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <SharedSelect
                        label="Repeat Finding"
                        value={repeatFinding}
                        onChange={(v) => setRepeatFinding(v as 'No' | 'Yes')}
                        options={[
                          { value: 'No', label: 'No' },
                          { value: 'Yes', label: 'Yes' }
                        ]}
                      />
                      <SharedSelect
                        label="SOX Reportable"
                        value={soxReportable}
                        onChange={(v) => setSoxReportable(v as 'No' | 'Yes')}
                        options={[
                          { value: 'No', label: 'No' },
                          { value: 'Yes', label: 'Yes' }
                        ]}
                      />
                    </div>

                    <SharedSelect
                      label="Root Cause Type"
                      value={rootCauseType}
                      onChange={setRootCauseType}
                      options={ROOT_CAUSE_TYPE_OPTIONS}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* RIGHT COLUMN: AI GENERATED FIELDS RECTANGULAR CONTAINER            */}
            {/* ------------------------------------------------------------------- */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                padding: '20px 24px',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0
              }}
            >
              {/* Right Side Rectangle Container (Enclosed very very light grey #F8F9FA Card starting underneath global header with gap) */}
              <div
                style={{
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                  minHeight: 0,
                  overflow: 'hidden'
                }}
              >
                {/* Scroll occurs only inside this rectangular container */}
                <div
                  className="slim-light-scrollbar"
                  style={{
                    flex: 1,
                    minHeight: 0,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#E2E8F0 transparent'
                  }}
                >
                  {/* Conditional Regeneration Notice (only shown when original issue or function changed) */}
                  {showRegenerateBanner && (
                    <div
                      style={{
                        backgroundColor: '#EFF6FF',
                        border: '1px solid #BFDBFE',
                        borderRadius: '8px',
                        padding: '14px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        boxShadow: '0 1px 3px rgba(0, 0, 153, 0.08)'
                      }}
                    >
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: '#DBEAFE',
                            border: '1px solid #93C5FD',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#000099',
                            flexShrink: 0
                          }}
                        >
                          <AlertTriangle size={15} />
                        </div>
                        <div>
                          <div style={{ fontSize: '12.5px', color: '#1E3A8A', lineHeight: 1.45, fontWeight: 500 }}>
                            Changed the issue or function, so generated AI might not be valid, please click on Regenerate AI if needed.
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => setIsBannerDismissed(true)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '5px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: '1px solid #CBD5E1',
                            backgroundColor: '#FFFFFF',
                            color: '#475569'
                          }}
                        >
                          Cancel
                        </button>

                        <SharedButton
                          variant="primary"
                          size="small"
                          startIcon={<RotateCcw size={12} />}
                          onClick={handleRegenerateAi}
                          disabled={isAiLoading}
                          loading={isAiLoading}
                        >
                          {isAiLoading ? 'Regenerating...' : 'Regenerate AI'}
                        </SharedButton>
                      </div>
                    </div>
                  )}

                  {/* Standard AI Fields (Always visible in edit mode) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Field 1: Issue Title */}
                    <AIInput
                      label="Issue Title"
                      value={aiData.updatedIssueHeader}
                      onChange={(v) => handleAiFieldChange('updatedIssueHeader', v)}
                      remark={fieldRemarks.updatedIssueHeader}
                      onRemarkChange={(r) => handleFieldRemarkChange('updatedIssueHeader', r)}
                      rows={2}
                      required
                      isAiLoading={isAiLoading}
                      placeholder="AI generated finding title..."
                    />

                    {/* Field 2: Description */}
                    <AIInput
                      label="Description"
                      value={aiData.description}
                      onChange={(v) => handleAiFieldChange('description', v)}
                      remark={fieldRemarks.description}
                      onRemarkChange={(r) => handleFieldRemarkChange('description', r)}
                      rows={5}
                      required
                      isAiLoading={isAiLoading}
                      placeholder="AI synthesized condition narrative & standard citations..."
                    />

                    {/* Field 3: Root Cause */}
                    <AIInput
                      label="Root Cause"
                      value={aiData.rootCause}
                      onChange={(v) => handleAiFieldChange('rootCause', v)}
                      remark={fieldRemarks.rootCause}
                      onRemarkChange={(r) => handleFieldRemarkChange('rootCause', r)}
                      rows={3}
                      required
                      isAiLoading={isAiLoading}
                      placeholder="Underlying operational or technical root cause gap..."
                    />

                    {/* Field 4: Impact */}
                    <AIInput
                      label="Impact"
                      value={aiData.impact}
                      onChange={(v) => handleAiFieldChange('impact', v)}
                      remark={fieldRemarks.impact}
                      onRemarkChange={(r) => handleFieldRemarkChange('impact', r)}
                      rows={3}
                      required
                      isAiLoading={isAiLoading}
                      placeholder="Compliance, financial, or data integrity impact..."
                    />

                    {/* Field 5: Recommendations */}
                    <AIInput
                      label="Recommendations"
                      value={aiData.recommendation}
                      onChange={(v) => handleAiFieldChange('recommendation', v)}
                      remark={fieldRemarks.recommendation}
                      onRemarkChange={(r) => handleFieldRemarkChange('recommendation', r)}
                      rows={4}
                      required
                      isAiLoading={isAiLoading}
                      placeholder="Numbered corrective actions and recommendations..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Studio Footer: Full-Width Fixed Bottom Bar with Cancel, Save (Draft) and Submit */}
          <div
            style={{
              height: '56px',
              minHeight: '56px',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #D8D8D8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              padding: '0 24px',
              gap: '12px',
              boxShadow: '0 -2px 6px rgba(0,0,0,0.04)',
              flexShrink: 0
            }}
          >
            <SharedButton
              variant="outline"
              onClick={() => setIsConfirmDialogOpen(true)}
            >
              Cancel
            </SharedButton>

            <SharedTooltip title="issue saved as draft not moved to TC" placement="top">
              <span>
                <SharedButton
                  variant="outline"
                  startIcon={<Save size={14} />}
                  onClick={() => handleSaveFinding('Pending Staff', false)}
                  disabled={isAiLoading}
                >
                  Save
                </SharedButton>
              </span>
            </SharedTooltip>

            <SharedTooltip title="issue submitted to next elvel" placement="top">
              <span>
                <SharedButton
                  variant="primary"
                  startIcon={<Send size={14} />}
                  onClick={() => handleSaveFinding('Pending TC', false)}
                  disabled={isAiLoading}
                >
                  Submit
                </SharedButton>
              </span>
            </SharedTooltip>
          </div>

          {/* ========================================================================= */}
          {/* COMPARE AI VERSIONS MODAL DIALOG                                          */}
          {/* Opens when user clicks Regenerate AI                                      */}
          {/* ========================================================================= */}
          <Dialog
            open={isCompareDialogOpen}
            onClose={handleCancelComparison}
            maxWidth="lg"
            fullWidth
            sx={{
              '& .MuiDialog-paper': {
                width: '960px',
                maxWidth: '94vw',
                maxHeight: '85vh',
                borderRadius: '8px',
                backgroundColor: '#FFFFFF',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }
            }}
          >
            <DialogTitle
              sx={{
                p: '14px 24px',
                borderBottom: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: '#F0FDF4',
                    border: '1px solid #BBF7D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#15803D'
                  }}
                >
                  <GitCompare size={17} />
                </div>
                <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Compare Versions
                </h2>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleKeepPreviousVersion}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#334155',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                    e.currentTarget.style.borderColor = '#94A3B8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#CBD5E1';
                  }}
                >
                  Keep Previous Version
                </button>

                <button
                  type="button"
                  onClick={handleApplyComparisonMerge}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: '#16A34A',
                    color: '#FFFFFF',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.08)',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#15803D';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#16A34A';
                  }}
                >
                  <Check size={14} />
                  <span>Keep Selected</span>
                </button>

                <button
                  type="button"
                  onClick={handleDiscardComparison}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '5px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#64748B',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.color = '#0F172A';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.color = '#64748B';
                  }}
                  title="Discard changes and keep previous version"
                >
                  <X size={13} />
                  <span>Discard</span>
                </button>
              </div>
            </DialogTitle>

            <DialogContent
              className="slim-light-scrollbar"
              sx={{
                p: '0 !important',
                overflowY: 'auto',
                backgroundColor: '#F8FAFC'
              }}
            >
              {/* Inner container with direct inline padding ensuring top gap is strictly preserved */}
              <div
                style={{
                  padding: '28px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px'
                }}
              >
                {/* Side-by-Side Field Cards */}
                {previousAiData && candidateAiData && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {[
                      { key: 'updatedIssueHeader' as const, label: 'Issue Title' },
                      { key: 'description' as const, label: 'Description' },
                      { key: 'rootCause' as const, label: 'Root Cause' },
                      { key: 'impact' as const, label: 'Impact' },
                      { key: 'recommendation' as const, label: 'Recommendations' }
                    ].map(({ key, label }) => {
                      const prevText = previousAiData[key];
                      const candidateText = candidateAiData[key];
                      const choice = selectedComparisonVersions[key];

                      return (
                        <div
                          key={key}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
                              {label}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                              Selected:{' '}
                              <strong style={{ color: choice === 'candidate' ? '#15803D' : '#000099' }}>
                                {choice === 'candidate' ? 'Regenerated' : 'Previous'}
                              </strong>
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            {/* Previous Version Box */}
                            <div
                              onClick={() =>
                                setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'previous' }))
                              }
                              style={{
                                padding: '14px',
                                borderRadius: '6px',
                                border: choice === 'previous' ? '2px solid #000099' : '1px solid #CBD5E1',
                                backgroundColor: choice === 'previous' ? '#EFF6FF' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: choice === 'previous' ? '0 1px 3px rgba(0, 0, 153, 0.08)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '13px', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {prevText || 'No previous content.'}
                              </span>
                            </div>

                            {/* Candidate / Regenerated Version Box */}
                            <div
                              onClick={() =>
                                setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'candidate' }))
                              }
                              style={{
                                padding: '14px',
                                borderRadius: '6px',
                                border: choice === 'candidate' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                                backgroundColor: choice === 'candidate' ? '#F0FDF4' : '#FFFFFF',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: choice === 'candidate' ? '0 1px 3px rgba(22, 163, 74, 0.1)' : '0 1px 2px rgba(0, 0, 0, 0.03)',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '13px', color: choice === 'candidate' ? '#14532D' : '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                {candidateText || 'No candidate content.'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Unsaved Changes Confirmation Dialog */}
          <SharedConfirmDialog
            open={isConfirmDialogOpen}
            title="Unsaved Changes"
            message="Changes have been unsaved. Leaving will discard the draft and any edits. Are you sure you want to go back?"
            confirmLabel="Back"
            cancelLabel="Cancel"
            onConfirm={handleClose}
            onCancel={() => setIsConfirmDialogOpen(false)}
            variant="warning"
          />
        </div>
    );
};

export default CreateIssueDialog;
