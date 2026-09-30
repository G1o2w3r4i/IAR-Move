import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Write content here...',
  minHeight = '90px',
  disabled = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChangeRef = useRef(false);

  // Sync incoming value to innerHTML when not focused/modified internally
  useEffect(() => {
    if (editorRef.current && !isInternalChangeRef.current) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
    isInternalChangeRef.current = false;
  }, [value]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      isInternalChangeRef.current = true;
      const html = editorRef.current.innerHTML;
      onChange(html === '<p><br></p>' || html === '<br>' ? '' : html);
    }
  };

  const executeCmd = (command: string, cmdValue: string | null = null) => {
    if (editorRef.current && !disabled) {
      editorRef.current.focus();
      document.execCommand(command, false, cmdValue || undefined);
      handleInput();
    }
  };

  const toolbarButtons = [
    { icon: Bold, cmd: 'bold', title: 'Bold (Ctrl+B)' },
    { icon: Italic, cmd: 'italic', title: 'Italic (Ctrl+I)' },
    { icon: Underline, cmd: 'underline', title: 'Underline (Ctrl+U)' },
    { divider: true },
    { icon: List, cmd: 'insertUnorderedList', title: 'Bullet List' },
    { icon: ListOrdered, cmd: 'insertOrderedList', title: 'Numbered List' },
    { divider: true },
    { icon: RotateCcw, cmd: 'undo', title: 'Undo (Ctrl+Z)' },
    { icon: RotateCw, cmd: 'redo', title: 'Redo (Ctrl+Y)' },
    { icon: RemoveFormatting, cmd: 'removeFormat', title: 'Clear Formatting' },
  ];

  return (
    <div
      style={{
        border: '1px solid #CBD5E1',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        transition: 'border-color 0.15s ease',
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {/* Editor Formatting Toolbar */}
      {!disabled && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            padding: '4px 6px',
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            flexWrap: 'wrap',
          }}
        >
          {toolbarButtons.map((btn, idx) => {
            if (btn.divider) {
              return (
                <div
                  key={`div-${idx}`}
                  style={{
                    width: '1px',
                    height: '14px',
                    backgroundColor: '#CBD5E1',
                    margin: '0 3px',
                  }}
                />
              );
            }

            const IconComponent = btn.icon as React.FC<{ style?: React.CSSProperties }>;
            return (
              <button
                key={`btn-${idx}`}
                type="button"
                onClick={() => btn.cmd && executeCmd(btn.cmd)}
                title={btn.title}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'background 0.15s ease, color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E2E8F0';
                  e.currentTarget.style.color = '#0F172A';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }}
              >
                <IconComponent style={{ width: '13px', height: '13px' }} />
              </button>
            );
          })}
        </div>
      )}

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        data-placeholder={placeholder}
        style={{
          minHeight,
          padding: '10px 12px',
          outline: 'none',
          fontSize: '11.5px',
          lineHeight: '1.5',
          color: '#0F172A',
          fontFamily: 'inherit',
          cursor: disabled ? 'not-allowed' : 'text',
        }}
      />
    </div>
  );
};
