import React from 'react';
import { Ban, FileText, PanelRightClose, PanelRightOpen } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { parseDescriptionWithViolations } from '../utils/violationParser';

interface AuditReportPreviewPaneProps {
  issues: Issue[];
  selectedIssue: Issue | null;
  isCollapsed: boolean;
  onToggleCollapse: (collapsed: boolean) => void;
  onIncludeIssue: (issueId: string) => void;
  engagementFileName?: string;
  auditableEntityName?: string;
}

export const AuditReportPreviewPane: React.FC<AuditReportPreviewPaneProps> = ({
  issues,
  selectedIssue,
  isCollapsed,
  onToggleCollapse,
  onIncludeIssue,
  engagementFileName = 'MedTech Suzhou - Orthopedics Plant_AuditReport',
  auditableEntityName = 'MRC-004341-GFS SSC Philippines',
}) => {
  // If collapsed, render 36px vertical rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#E8EDF2',
          borderLeft: 'none',
          boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.04)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '10px',
          gap: '16px',
          userSelect: 'none',
          flexShrink: 0,
          height: '100%',
        }}
      >
        <button
          onClick={() => onToggleCollapse(false)}
          title="Expand Report Preview"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <PanelRightOpen style={{ width: '16px', height: '16px' }} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          REPORT PREVIEW
        </div>
      </div>
    );
  }

  // Exact standard PDF Issue Card renderer from Backup_JNJ_IAR
  const renderPdfIssueCard = (item: Issue, idx: number = 0) => {
    const reportRefNum = item.reportRef || idx + 1;
    const critBg =
      item.criticality === 'Critical'
        ? '#D8001D'
        : item.criticality === 'Minor'
          ? '#008000'
          : '#F1B500';
    const critTextColor = '#ffffff';

    const narrative = item.issueNarrative || item.description || item.issue || '';
    const parsedViolations = parseDescriptionWithViolations(narrative);

    return (
      <div key={item.id} style={{ display: 'flex', flexDirection: 'column', marginBottom: '22px' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '11px',
            border: '1px solid #000000',
            color: '#000000',
            fontFamily: 'Arial, Helvetica, sans-serif',
            tableLayout: 'fixed',
          }}
        >
          <tbody>
            {/* ROW 1 (3 Columns) */}
            <tr>
              {/* Col 1: Report Ref & Boxed Criticality Badge */}
              <td
                style={{
                  width: '33.33%',
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '6px' }}>
                  Report Ref: {reportRefNum}
                </div>
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: critBg,
                    color: critTextColor,
                    fontWeight: 700,
                    fontSize: '11px',
                    padding: '4px 20px',
                    border: '1px solid #000000',
                    textAlign: 'center',
                  }}
                >
                  {item.criticality || 'Major'}
                </div>
              </td>

              {/* Col 2: Accountable Function(s) */}
              <td
                style={{
                  width: '33.33%',
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Accountable Function(s):
                </div>
                <div style={{ color: '#000000' }}>
                  {item.accountableFunction ||
                    item.function ||
                    (item.testProcedureCode?.includes('TP-10') ? 'Business IT, Information Security' : 'Finance Operations')}
                </div>
              </td>

              {/* Col 3: Process Area */}
              <td
                style={{
                  width: '33.34%',
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Process Area:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.processArea || item.accountableProcessArea || 'Global Access Management'}
                </div>
              </td>
            </tr>

            {/* ROW 2 (3 Columns) */}
            <tr>
              {/* Col 1: Report Finding */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Report Finding:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.repeatFinding || 'No'}
                </div>
              </td>

              {/* Col 2: Issue Cause Type */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Issue Cause Type:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.issueCauseType || 'Operating Effectiveness'}
                </div>
              </td>

              {/* Col 3: SOX Reportable */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  SOX Reportable:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.soxReportable || (item.criticality === 'Critical' ? 'Yes' : 'No')}
                </div>
              </td>
            </tr>

            {/* ROW 3 (3 Columns: Issue, Root Cause, Impact) */}
            <tr>
              {/* Col 1: Issue */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Issue:
                </div>
                <div style={{ fontWeight: 700, color: '#000000', marginBottom: '5px', lineHeight: '1.3' }}>
                  {item.title}
                </div>
                {parsedViolations && parsedViolations.hasViolations ? (
                  <div style={{ color: '#000000', lineHeight: '1.4' }}>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: '8px' }}>
                      {parsedViolations.mainText}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '10.5px', marginBottom: '2px' }}>
                      Violation Reference
                    </div>
                    {parsedViolations.subTitle && (
                      <div style={{ fontSize: '10px', color: '#333333', marginBottom: '4px' }}>
                        {parsedViolations.subTitle}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10px' }}>
                      {parsedViolations.items.map((vItem, vIdx) => (
                        <div key={vIdx}>
                          <span>{vItem.number}. </span>
                          <span style={{ color: '#1D4ED8', textDecoration: 'underline', fontWeight: 600 }}>
                            {vItem.linkText}
                          </span>
                          {vItem.title && <span> - {vItem.title}</span>}
                          {vItem.detail && <span> — {vItem.detail}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                    {narrative}
                  </div>
                )}
              </td>

              {/* Col 2: Root Cause */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Root Cause:
                </div>
                <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {item.rootCause || 'Process execution gap in automated synchronization and manual handoff between operational units and central monitoring systems.'}
                </div>
              </td>

              {/* Col 3: Impact */}
              <td
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Impact:
                </div>
                <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {item.impact || 'Heightened risk of unauthorized data modifications and non-compliance with regulatory and corporate security requirements.'}
                </div>
              </td>
            </tr>

            {/* ROW 4 (2 Columns: Recommendation & Management Response) */}
            <tr>
              {/* Col 1: Recommendation (50%) */}
              <td
                colSpan={1}
                style={{
                  width: '50%',
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Recommendation:
                </div>
                <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {item.recommendation || 'Standardize automated controls and implement periodic supervisory reviews to ensure continuous compliance.'}
                </div>
              </td>

              {/* Col 2: Management Response (50%) */}
              <td
                colSpan={2}
                style={{
                  width: '50%',
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '3px' }}>
                  Management Response:
                </div>
                <div style={{ color: '#000000', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                  {item.managementResponse || item.managementActionPlan || 'Management acknowledges the finding and has scheduled targeted remediations with the responsible engineering leads.'}
                </div>
              </td>
            </tr>

            {/* ROW 5 (2 Columns: Accountable Contact & Agreed Remediation Date) */}
            <tr>
              {/* Col 1: Accountable Contact (50%) */}
              <td
                colSpan={1}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '2px' }}>
                  Accountable Contact:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.accountableContact || item.businessContactName || 'Narasimha, Vinay'}
                </div>
              </td>

              {/* Col 2: Agreed Remediation Date (50%) */}
              <td
                colSpan={2}
                style={{
                  padding: '6px 8px',
                  border: '1px solid #000000',
                  verticalAlign: 'top',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000', marginBottom: '2px' }}>
                  Agreed Remediation Date:
                </div>
                <div style={{ color: '#000000' }}>
                  {item.agreedRemediationDate || item.remediationTargetDate || '2026-11-30'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const activeIssues = issues.filter((item) => !item.isExcluded);

  return (
    <div
      className="slim-light-scrollbar"
      style={{
        flex: 1,
        backgroundColor: '#E8EDF2',
        padding: '20px 20px 32px 20px',
        overflowY: 'auto',
        maxHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxSizing: 'border-box',
        position: 'relative',
        minWidth: '280px',
        scrollbarWidth: 'thin',
        scrollbarColor: '#CBD5E1 transparent',
      }}
    >
      {/* Centered White Document Sheet */}
      <div
        style={{
          width: '100%',
          maxWidth: '840px',
          backgroundColor: '#ffffff',
          borderRadius: '4px',
          border: '1px solid #D8D8D8',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          marginBottom: '40px',
        }}
      >
        {/* Red PDF Document Header Bar */}
        <div
          style={{
            backgroundColor: '#D8001D',
            color: '#ffffff',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            borderTopLeftRadius: '3px',
            borderTopRightRadius: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <FileText style={{ width: '16px', height: '16px', color: '#ffffff', flexShrink: 0 }} />
            <span
              style={{
                fontSize: '13px',
                fontWeight: 800,
                letterSpacing: '0.3px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {engagementFileName}
            </span>
          </div>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => onToggleCollapse(true)}
              title="Collapse Report Preview"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'background-color 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <PanelRightClose style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        {/* Document Content Canvas */}
        <div
          style={{
            padding: '28px 32px',
            color: '#000000',
            minHeight: '840px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Brand Header Line */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '8px',
              marginBottom: '8px',
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: '20px',
                  fontWeight: 900,
                  color: '#E05252',
                  letterSpacing: '-0.2px',
                }}
              >
                Johnson&amp;Johnson
              </div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#737373',
                  letterSpacing: '0.4px',
                  textTransform: 'uppercase',
                }}
              >
                REPORT DETAILS
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#737373' }}>
                Global Audit and Assurance
              </span>
            </div>
          </div>

          {/* Auditable Entity Subheader */}
          <div
            style={{
              fontSize: '12px',
              fontWeight: 800,
              color: '#000000',
              marginBottom: '16px',
            }}
          >
            Auditable Entity:{' '}
            <span style={{ fontWeight: 600 }}>
              {selectedIssue?.auditableEntity || auditableEntityName}
            </span>
          </div>

          {/* Render Selected Issue or All Issues in Sequence */}
          <div style={{ flex: 1 }}>
            {issues.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <FileText
                  style={{
                    width: '36px',
                    height: '36px',
                    color: '#94A3B8',
                    margin: '0 auto 10px',
                  }}
                />
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                  Report Contains 0 Issues
                </div>
                <div style={{ fontSize: '12px' }}>
                  No findings or issues have been recorded for this audit.
                </div>
              </div>
            ) : selectedIssue ? (
              selectedIssue.isExcluded ? (
                <div>
                  <div
                    style={{
                      padding: '10px 14px',
                      marginBottom: '16px',
                      borderRadius: '6px',
                      backgroundColor: '#F8FAFC',
                      border: '1.5px dashed #94A3B8',
                      color: '#475569',
                      fontSize: '11.5px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Ban style={{ width: '15px', height: '15px', color: '#64748B' }} />
                      <span>
                        <strong>Notice:</strong> This issue is currently <strong>Excluded</strong> and
                        omitted from the final generated report findings.
                      </span>
                    </div>
                    <button
                      onClick={() => onIncludeIssue(selectedIssue.id)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: '#059669',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                      }}
                    >
                      Include in Report
                    </button>
                  </div>
                  <div style={{ opacity: 0.55 }}>
                    {renderPdfIssueCard(
                      selectedIssue,
                      issues.findIndex((i) => i.id === selectedIssue.id)
                    )}
                  </div>
                </div>
              ) : (
                renderPdfIssueCard(
                  selectedIssue,
                  issues.findIndex((i) => i.id === selectedIssue.id)
                )
              )
            ) : activeIssues.length === 0 ? (
              <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748B' }}>
                <Ban
                  style={{
                    width: '36px',
                    height: '36px',
                    color: '#94A3B8',
                    margin: '0 auto 10px',
                  }}
                />
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1E293B', marginBottom: '4px' }}>
                  All Findings Excluded
                </div>
                <div style={{ fontSize: '12px' }}>
                  All findings in this audit are currently marked as excluded and omitted from the report.
                </div>
              </div>
            ) : (
              activeIssues.map((item, idx) => renderPdfIssueCard(item, idx))
            )}
          </div>

          {/* Footer Section */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
              paddingTop: '16px',
              fontSize: '10px',
              color: '#555555',
              position: 'relative',
            }}
          >
            {/* Left: Page Number */}
            <div style={{ color: '#555555' }}>
              Page{' '}
              {selectedIssue
                ? `${issues.findIndex((i) => i.id === selectedIssue.id) + 1} of ${issues.length}`
                : `1 of ${Math.max(1, activeIssues.length)}`}
            </div>

            {/* Center: Confidential Statement */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                color: '#555555',
                fontSize: '10px',
              }}
            >
              Confidential – Use Pursuant to Company Instructions
            </div>

            <div />
          </div>
        </div>
      </div>
    </div>
  );
};
