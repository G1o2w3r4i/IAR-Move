import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  ShieldCheck,
  FileText,
  Minimize2,
  Plus,
  X,
  Check,
  Loader2
} from 'lucide-react';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedTooltip } from '../feedback/SharedTooltip';
import { SharedPopover, SharedPopoverItem } from '../common/SharedPopover';

export interface AIInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  remark?: string;
  onRemarkChange?: (remark: string) => void;
  onAiRewrite?: (action: 'rewrite' | 'tone' | 'detailed' | 'shorter', selectedText?: string) => void | Promise<void>;
  isAiLoading?: boolean;
  helperText?: string;
  disabled?: boolean;
  versionBadge?: string;
  className?: string;
  style?: React.CSSProperties;
  inputBackgroundColor?: string;
  extraHeaderActions?: React.ReactNode;
}

export interface PendingAiProposal {
  start: number;
  end: number;
  originalText: string;
  newText: string;
  isSelection: boolean;
}

export const AIInput: React.FC<AIInputProps> = ({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  rows = 3,
  remark = '',
  onRemarkChange,
  onAiRewrite,
  isAiLoading = false,
  helperText,
  disabled = false,
  versionBadge,
  className = '',
  style,
  inputBackgroundColor = '#FFFFFF',
  extraHeaderActions
}) => {
  const [wandAnchorEl, setWandAnchorEl] = useState<HTMLElement | null>(null);
  const [isRemarkOpen, setIsRemarkOpen] = useState(false);
  const [localRemark, setLocalRemark] = useState(remark);
  const [pendingProposal, setPendingProposal] = useState<PendingAiProposal | null>(null);
  const [isFieldLoading, setIsFieldLoading] = useState(false);
  const [selectionLoading, setSelectionLoading] = useState<{ start: number; end: number; text: string } | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Text selection tracking inside textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const aiTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedRange, setSelectedRange] = useState<{ start: number; end: number; text: string } | null>(null);
  const [selectionAnchorEl, setSelectionAnchorEl] = useState<HTMLElement | null>(null);

  // Sync external remark
  useEffect(() => {
    setLocalRemark(remark || '');
  }, [remark]);

  const effectiveFieldLoading = isAiLoading || isFieldLoading;
  const isSelectionActive = selectionLoading !== null || (pendingProposal !== null && pendingProposal.isSelection);
  const isFieldProposalActive = isFieldLoading || (pendingProposal !== null && !pendingProposal.isSelection);
  const isNestedBoxActive = isSelectionActive || isFieldProposalActive;
  const isAnyAiActive = effectiveFieldLoading || selectionLoading !== null || pendingProposal !== null;
  const isAiDisabled = disabled || isAnyAiActive;

  // Auto-resize standard textarea dynamically to fit all text without internal scroll
  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

    // Reset height to 0px to accurately measure full scrollHeight
    el.style.setProperty('height', '0px', 'important');
    const scrollH = el.scrollHeight;

    const computedLineHeight = 21; // 14px * 1.5 lineHeight
    const minHeight = rows * computedLineHeight + 18;
    const targetHeight = Math.max(minHeight, scrollH + 4);
    el.style.setProperty('height', `${targetHeight}px`, 'important');
  }, [rows]);

  // Adjust on value, rows, active state
  useEffect(() => {
    adjustHeight();
  }, [value, rows, adjustHeight, isNestedBoxActive]);

  // Multi-stage timers & window/parent resize to handle modal entrance animations
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;

    adjustHeight();
    const intervals = [30, 80, 150, 250, 400, 600, 800];
    const timers = intervals.map((ms) => setTimeout(adjustHeight, ms));

    const handleWindowResize = () => adjustHeight();
    window.addEventListener('resize', handleWindowResize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && el.parentElement) {
      ro = new ResizeObserver(() => {
        adjustHeight();
      });
      ro.observe(el.parentElement);
    }

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleWindowResize);
      if (ro) ro.disconnect();
    };
  }, [adjustHeight, isNestedBoxActive]);

  // Primary nested AI textarea auto-resize
  const adjustAiHeight = useCallback(() => {
    const el = aiTextareaRef.current;
    if (!el) return;
    if (el.offsetWidth === 0 && el.offsetHeight === 0) return;

    el.style.setProperty('height', '0px', 'important');
    const scrollH = el.scrollHeight;
    const minHeight = 44;
    const targetHeight = Math.max(minHeight, scrollH + 4);
    el.style.setProperty('height', `${targetHeight}px`, 'important');
  }, []);

  useEffect(() => {
    if (pendingProposal) {
      adjustAiHeight();
      const intervals = [30, 80, 150, 250, 400];
      const timers = intervals.map((ms) => setTimeout(adjustAiHeight, ms));
      return () => timers.forEach(clearTimeout);
    }
  }, [pendingProposal?.newText, adjustAiHeight, isNestedBoxActive]);

  const handleSelect = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    if (typeof start === 'number' && typeof end === 'number' && start !== end && end > start) {
      const selectedText = target.value.substring(start, end);
      if (selectedText.trim().length > 0) {
        setSelectedRange({ start, end, text: selectedText });
        return;
      }
    }
    if (!selectionAnchorEl) {
      setSelectedRange(null);
    }
  };

  const handleTriggerAction = async (action: 'rewrite' | 'tone' | 'detailed' | 'shorter') => {
    setWandAnchorEl(null);
    if (onAiRewrite) {
      await onAiRewrite(action);
      return;
    }

    // Built-in smart client synthesis for entire field
    setIsFieldLoading(true);
    await new Promise((res) => setTimeout(res, 600));

    const clean = value.trim();
    let result = clean;

    if (action === 'rewrite') {
      result = clean
        ? `${clean} (Optimized & Verified by GxP AI)`
        : `Verified compliance narrative adhering to mandatory operational controls.`;
    } else if (action === 'tone') {
      result = clean
        ? `Corporate Audit Finding: ${clean.replace(/^(Corporate Audit Finding:\s*)+/, '')}`
        : `Corporate Audit Notification: Verification conducted across operational environment.`;
    } else if (action === 'detailed') {
      result = clean
        ? `${clean}\n\nDetailed Evidence: Operational sampling across 72 hours of telemetry logs confirmed lack of automated controls and deviation from approved SLA standards.`
        : `Detailed Audit Observation: Telemetry and process logging review revealed variance against approved operating tolerance limits.`;
    } else if (action === 'shorter') {
      const firstSentence = clean.split('.')[0];
      result = firstSentence ? `${firstSentence.trim()}.` : clean;
    }

    setPendingProposal({
      start: 0,
      end: value.length,
      originalText: value,
      newText: result,
      isSelection: false
    });
    setIsFieldLoading(false);
  };

  const handleTriggerSelectionAction = async (action: 'rewrite' | 'tone' | 'detailed' | 'shorter') => {
    if (!selectedRange) return;
    const targetRange = { ...selectedRange };
    setSelectionAnchorEl(null);
    setSelectedRange(null);

    // Enter selection-only loading state inside the input box
    setSelectionLoading({
      start: targetRange.start,
      end: targetRange.end,
      text: targetRange.text
    });

    if (onAiRewrite) {
      await onAiRewrite(action, targetRange.text);
      setSelectionLoading(null);
      return;
    }

    await new Promise((res) => setTimeout(res, 650));

    const clean = targetRange.text.trim();
    let result = clean;

    if (action === 'rewrite') {
      result = `${clean} (Optimized & Verified by GxP AI)`;
    } else if (action === 'tone') {
      result = `Corporate Audit Finding: ${clean.replace(/^(Corporate Audit Finding:\s*)+/, '')}`;
    } else if (action === 'detailed') {
      result = `${clean} Specifically, forensic inspection confirmed deviation from approved operational criteria and lack of secondary authorization logs.`;
    } else if (action === 'shorter') {
      const firstSentence = clean.split('.')[0];
      result = firstSentence ? `${firstSentence.trim()}.` : clean;
    }

    setPendingProposal({
      start: targetRange.start,
      end: targetRange.end,
      originalText: targetRange.text,
      newText: result,
      isSelection: true
    });
    setSelectionLoading(null);
  };

  const handleAcceptPending = () => {
    if (pendingProposal !== null) {
      const updated =
        value.slice(0, pendingProposal.start) +
        pendingProposal.newText +
        value.slice(pendingProposal.end);
      onChange(updated);
      setPendingProposal(null);
      setSelectionLoading(null);
      setSelectedRange(null);
    }
  };

  const handleDiscardPending = () => {
    setPendingProposal(null);
    setSelectionLoading(null);
    setIsFieldLoading(false);
    setSelectedRange(null);
  };

  const handleSaveRemark = () => {
    if (onRemarkChange) {
      onRemarkChange(localRemark.trim());
    }
    setIsRemarkOpen(false);
  };

  const handleClearRemark = () => {
    setLocalRemark('');
    if (onRemarkChange) {
      onRemarkChange('');
    }
    setIsRemarkOpen(false);
  };

  // Determine prefix, previous, and suffix text for the in-place nested box
  let prefixText = '';
  let previousText = '';
  let suffixText = '';
  let isNestedLoading = false;

  if (isSelectionActive) {
    const activeStart = selectionLoading ? selectionLoading.start : pendingProposal!.start;
    const activeEnd = selectionLoading ? selectionLoading.end : pendingProposal!.end;
    prefixText = value.slice(0, activeStart);
    previousText = selectionLoading ? selectionLoading.text : pendingProposal!.originalText;
    suffixText = value.slice(activeEnd);
    isNestedLoading = selectionLoading !== null;
  } else if (isFieldProposalActive) {
    prefixText = '';
    previousText = value;
    suffixText = '';
    isNestedLoading = isFieldLoading;
  }

  return (
    <div
      className={`ai-input-group ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Top Header Bar: Field Label (matches SharedTextArea) + AI Wand + Remarks Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '16px',
          lineHeight: '16px',
          marginBottom: '6px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* AI Magic Wand Icon with SharedPopover (hidden when disabled) */}
          {!disabled && (
            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
              <SharedTooltip
                title={
                  pendingProposal !== null
                    ? "Accept or discard current AI generation to rewrite again"
                    : "AI Writing & Rewrite Options"
                }
                placement="top"
              >
                <button
                  type="button"
                  onClick={(e) => !isAiDisabled && setWandAnchorEl(wandAnchorEl ? null : e.currentTarget)}
                  disabled={isAiDisabled}
                  style={{
                    background: Boolean(wandAnchorEl) ? '#EFF6FF' : 'transparent',
                    border: 'none',
                    padding: '0 2px',
                    height: '16px',
                    borderRadius: '3px',
                    cursor: isAiDisabled ? 'not-allowed' : 'pointer',
                    opacity: isAiDisabled ? 0.45 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000099',
                    transition: 'all 0.15s ease',
                    lineHeight: 1
                  }}
                >
                  <Sparkles size={12} style={{ color: '#000099' }} />
                </button>
              </SharedTooltip>

              {/* AI Writing Options Menu (SharedPopover harmonized with Select Menu) */}
              <SharedPopover
                open={Boolean(wandAnchorEl)}
                anchorEl={wandAnchorEl}
                onClose={() => setWandAnchorEl(null)}
                menuWidth={210}
              >
                {[
                  { action: 'rewrite', label: 'Auto-rewrite with AI', icon: Sparkles },
                  { action: 'tone', label: 'Adjust tone professionally', icon: ShieldCheck },
                  { action: 'detailed', label: 'Make it more detailed', icon: FileText },
                  { action: 'shorter', label: 'Make it concise / shorter', icon: Minimize2 }
                ].map((item) => (
                  <SharedPopoverItem
                    key={item.action}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => {
                      setWandAnchorEl(null);
                      handleTriggerAction(item.action as any);
                    }}
                  />
                ))}
              </SharedPopover>
            </div>
          )}

          {/* Field Label: exactly harmonized with SharedFieldLabel / SharedTextArea */}
          <SharedFieldLabel
            label={label}
            required={required}
            disabled={disabled}
            style={{ marginBottom: 0, lineHeight: '16px' }}
          />

          {/* Optional Version Badge */}
          {versionBadge && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                padding: '1px 6px',
                borderRadius: '4px',
                backgroundColor: '#EFF6FF',
                color: '#000099',
                border: '1px solid #BFDBFE'
              }}
            >
              {versionBadge}
            </span>
          )}
        </div>

        {/* Remarks Toggle Action & Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {extraHeaderActions}
          {remark ? (
            <SharedTooltip
              title={`Remark: "${remark}"${disabled ? '' : ' (Click to edit)'}`}
              placement="top"
            >
              <button
                type="button"
                onClick={() => !disabled && setIsRemarkOpen(!isRemarkOpen)}
                disabled={disabled}
                style={{
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  borderRadius: '10px',
                  padding: '0 6px',
                  height: '16px',
                  lineHeight: '14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#1D4ED8',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: disabled ? 'default' : 'pointer'
                }}
              >
                <Plus size={11} style={{ color: '#1D4ED8' }} />
                <span>Remark Added</span>
              </button>
            </SharedTooltip>
          ) : !disabled ? (
            <SharedTooltip
              title={isRemarkOpen ? "Hide remark" : "Add remark for AI"}
              placement="top"
            >
              <button
                type="button"
                onClick={() => setIsRemarkOpen(!isRemarkOpen)}
                disabled={disabled}
                style={{
                  background: isRemarkOpen ? '#EFF6FF' : 'transparent',
                  border: isRemarkOpen ? '1px solid #BFDBFE' : 'none',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isRemarkOpen ? '#000099' : '#64748B',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '0 4px',
                  height: '16px',
                  lineHeight: '14px',
                  borderRadius: '3px'
                }}
              >
                <Plus size={11} style={{ color: isRemarkOpen ? '#000099' : '#64748B' }} />
                <span>{isRemarkOpen ? 'Hide Remark' : 'Add Remark'}</span>
              </button>
            </SharedTooltip>
          ) : null}
        </div>
      </div>

      {/* Main Input Display: In-Place Nested Box Inside Input Box OR Standard Single Textarea */}
      {isNestedBoxActive ? (
        <div
          style={{
            position: 'relative',
            width: '100%',
            boxSizing: 'border-box',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            backgroundColor: disabled ? '#FAFAFA' : inputBackgroundColor,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Prefix Text (Text preceding the selected portion) */}
          {prefixText && (
            <div
              style={{
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1E293B',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {prefixText}
            </div>
          )}

          {/* Primary Nested Box (Created wherever the selected text is) */}
          <div
            style={{
              width: '100%',
              boxSizing: 'border-box',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #000099',
              borderRadius: '4px',
              boxShadow: '0 0 0 2px #DBEAFE',
              padding: '8px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            {/* Header: AI Generated Title + Discard / Accept (or Loading spinner) */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#000099',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Sparkles size={12} style={{ color: '#000099' }} />
                AI Generated
              </span>

              {isNestedLoading ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite', color: '#000099' }} />
                  <button
                    type="button"
                    onClick={handleDiscardPending}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#64748B',
                      fontSize: '10.5px',
                      cursor: 'pointer',
                      padding: '2px 4px'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={handleDiscardPending}
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#64748B',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'background-color 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F1F5F9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                  >
                    <X size={11} /> Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptPending}
                    style={{
                      padding: '3px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#FFFFFF',
                      backgroundColor: '#000099',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      transition: 'background-color 0.12s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#1D4ED8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#000099';
                    }}
                  >
                    <Check size={11} /> Accept
                  </button>
                </div>
              )}
            </div>

            {/* Primary Nested Box Content: Loader ONLY on this nested box during loading, OR Auto-Resizing AI Textarea */}
            {isNestedLoading ? (
              <div
                style={{
                  minHeight: '44px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000099',
                  backgroundColor: '#F8F9FA',
                  borderRadius: '4px',
                  border: '1px dashed #BFDBFE'
                }}
              >
                <Loader2 size={20} className="spin" style={{ animation: 'spin 1s linear infinite', color: '#000099' }} />
              </div>
            ) : pendingProposal ? (
              <textarea
                ref={aiTextareaRef}
                value={pendingProposal.newText}
                onChange={(e) => {
                  setPendingProposal({ ...pendingProposal, newText: e.target.value });
                  adjustAiHeight();
                }}
                onInput={() => adjustAiHeight()}
                onKeyDown={() => requestAnimationFrame(adjustAiHeight)}
                onKeyUp={() => adjustAiHeight()}
                className="ai-input-textarea"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '4px 0',
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 400,
                  lineHeight: '21px',
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                  color: '#1E293B',
                  overflow: 'hidden',
                  resize: 'none',
                  display: 'block'
                }}
              />
            ) : null}

            {/* Secondary Nested Box: Displays Previous Content Dynamically Without Internal Scroll */}
            <div
              style={{
                backgroundColor: '#F8F9FA',
                border: '1px solid #E2E8F0',
                borderRadius: '4px',
                padding: '6px 8px',
                marginTop: '2px'
              }}
            >
              <div
                style={{
                  fontSize: '10.5px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: '#64748B',
                  marginBottom: '2px'
                }}
              >
                Previous Content
              </div>
              <div
                style={{
                  fontSize: '13px',
                  lineHeight: '20px',
                  color: '#64748B',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
                }}
              >
                {previousText || <span style={{ fontStyle: 'italic', color: '#94A3B8' }}>(Empty)</span>}
              </div>
            </div>
          </div>

          {/* Suffix Text (Text following the selected portion) */}
          {suffixText && (
            <div
              style={{
                fontSize: '14px',
                lineHeight: '21px',
                color: '#1E293B',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            >
              {suffixText}
            </div>
          )}
        </div>
      ) : (
        /* Standard Single Textarea Container: Auto-Resizes Dynamically to Content with No Internal Scroll */
        <div
          style={{
            position: 'relative',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          {/* Floating AI Selection Action Button (Shows inside the input box when text is selected) */}
          {selectedRange && !isAnyAiActive && (
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                zIndex: 20,
                animation: 'fadeInScale 0.15s ease'
              }}
            >
              <SharedTooltip title="AI options for selected text" placement="top">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    // Prevent textarea blur so selection isn't lost
                    e.preventDefault();
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectionAnchorEl(selectionAnchorEl ? null : e.currentTarget);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    height: '24px',
                    borderRadius: '4px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #BFDBFE',
                    boxShadow: '0 2px 8px rgba(0, 0, 153, 0.15)',
                    color: '#000099',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#EFF6FF';
                    e.currentTarget.style.borderColor = '#93C5FD';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                    e.currentTarget.style.borderColor = '#BFDBFE';
                  }}
                >
                  <Sparkles size={12} style={{ color: '#000099' }} />
                  <span>AI</span>
                </button>
              </SharedTooltip>

              {/* Selection AI Popover Options (Standardized Select Menu styling) */}
              <SharedPopover
                open={Boolean(selectionAnchorEl)}
                anchorEl={selectionAnchorEl}
                onClose={() => {
                  setSelectionAnchorEl(null);
                  setSelectedRange(null);
                }}
                menuWidth={210}
              >
                {[
                  { action: 'rewrite', label: 'Auto-rewrite with AI', icon: Sparkles },
                  { action: 'tone', label: 'Adjust tone professionally', icon: ShieldCheck },
                  { action: 'detailed', label: 'Make it more detailed', icon: FileText },
                  { action: 'shorter', label: 'Make it concise / shorter', icon: Minimize2 }
                ].map((item) => (
                  <SharedPopoverItem
                    key={item.action}
                    icon={item.icon}
                    label={item.label}
                    onClick={() => handleTriggerSelectionAction(item.action as any)}
                  />
                ))}
              </SharedPopover>
            </div>
          )}

          {/* Native Textarea with Active Dynamic Height Auto-Expansion */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              adjustHeight();
            }}
            onInput={() => adjustHeight()}
            onKeyDown={() => requestAnimationFrame(adjustHeight)}
            onKeyUp={(e) => {
              handleSelect(e);
              adjustHeight();
            }}
            onSelect={handleSelect}
            onMouseUp={handleSelect}
            placeholder={placeholder || `Enter or refine ${label.toLowerCase()}...`}
            disabled={disabled || effectiveFieldLoading}
            className="ai-input-textarea"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '8px 12px',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: '21px',
              borderRadius: '4px',
              border: disabled
                ? '1px solid #CBD5E1'
                : isFocused
                ? '1px solid #2563EB'
                : isHovered
                ? '1px solid #94A3B8'
                : '1px solid #CBD5E1',
              boxShadow: isFocused ? '0 0 0 2px #DBEAFE' : 'none',
              outline: 'none',
              fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              color: '#1E293B',
              backgroundColor: disabled ? '#FAFAFA' : inputBackgroundColor,
              cursor: disabled ? 'default' : undefined,
              overflow: 'hidden',
              resize: 'none',
              display: 'block',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
            }}
            onMouseEnter={() => {
              setIsHovered(true);
              adjustHeight();
            }}
            onMouseLeave={() => setIsHovered(false)}
            onFocus={() => {
              setIsFocused(true);
              adjustHeight();
            }}
            onBlur={() => {
              setIsFocused(false);
              setTimeout(() => {
                if (!selectionAnchorEl) {
                  setSelectedRange(null);
                }
              }, 150);
            }}
          />

          {/* Field-level Loading Overlay (Blue Spinner, No Text) */}
          {effectiveFieldLoading && !isNestedBoxActive && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(1px)',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000099',
                zIndex: 10
              }}
            >
              <Loader2 size={22} className="spin" style={{ animation: 'spin 1s linear infinite', color: '#000099' }} />
            </div>
          )}
        </div>
      )}

      {/* Collapsible / Active Remarks Panel (Rendered bottom to the input box) */}
      {isRemarkOpen && (
        <div
          style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            marginTop: '6px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#334155' }}>
              Remark for AI
            </span>
            <button
              type="button"
              onClick={() => setIsRemarkOpen(false)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '1px' }}
            >
              <X size={13} />
            </button>
          </div>
          <input
            type="text"
            value={localRemark}
            onChange={(e) => setLocalRemark(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '6px 8px',
              fontSize: '12px',
              borderRadius: '4px',
              border: '1px solid #CBD5E1',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              fontFamily: 'inherit',
              color: '#1E293B'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSaveRemark();
              }
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
            {remark && (
              <button
                type="button"
                onClick={handleClearRemark}
                style={{
                  padding: '3px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#64748B',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveRemark}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#FFFFFF',
                backgroundColor: '#475569',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#334155';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#475569';
              }}
            >
              Save Remark
            </button>
          </div>
        </div>
      )}

      {helperText && (
        <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default AIInput;
