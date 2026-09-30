import React, { useState } from 'react';
import type { Issue } from '../../../types/dataverse.types';
import {
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { IssueNavCard, SharedListBoxFilter } from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';

interface FindingNavigatorProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string | null) => void;
  onReorderIssues: (newIssues: Issue[], isCrossPriority?: boolean, fromCrit?: string, toCrit?: string) => void;
  onOpenCreateDialog: () => void;
  onIncludeIssue?: (issueId: string) => void;
  userRole?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const FindingNavigator: React.FC<FindingNavigatorProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  onReorderIssues,
  onOpenCreateDialog,
  onIncludeIssue,
  userRole = 'it-manager',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [filterDomain, setFilterDomain] = useState<'all' | 'IT' | 'FinOps'>('all');
  const [draggedIssueId, setDraggedIssueId] = useState<string | null>(null);
  const [dragOverIssueId, setDragOverIssueId] = useState<string | null>(null);
  const [draggableCardId, setDraggableCardId] = useState<string | null>(null);

  // Helper to test if an issue is IT
  const isItemIT = (item: Issue) => {
    const fn = (item.function || (item as any).functionType || '').toUpperCase();
    if (fn.includes('FINOPS') || fn.includes('FIN')) return false;
    if (fn.includes('IT')) return true;
    const testProc = (item.testProcedureCode || (item as any).testProcedure || '').toUpperCase();
    const acct = (item.accountableFunction || '').toUpperCase();
    if (acct.includes('FINOPS') || acct.includes('FINANCE')) return false;
    if (acct.includes('IT')) return true;
    return testProc.includes('TP-101') || testProc.includes('TP-102') || testProc.includes('TP-110');
  };

  const itCount = issues.filter(isItemIT).length;
  const finOpsCount = issues.length - itCount;

  const filterOptions: ListBoxFilterOption<'all' | 'IT' | 'FinOps'>[] = [
    { value: 'all', label: 'All', count: issues.length },
    { value: 'IT', label: 'IT', count: itCount },
    { value: 'FinOps', label: 'FinOps', count: finOpsCount },
  ];

  // Filtered list
  const filteredIssues = issues.filter((issue) => {
    if (filterDomain === 'all') return true;
    const isIT = isItemIT(issue);
    if (filterDomain === 'IT') return isIT;
    return !isIT;
  });

  // Check editability restriction by role
  const checkIssueEditability = (item: Issue) => {
    const roleStr = (userRole || '').toLowerCase();
    if (roleStr.includes('vp') || roleStr.includes('head')) {
      return { canEdit: true, reason: null };
    }
    const isIT = isItemIT(item);
    const isITRole = roleStr.includes('it');
    const isFinOpsRole = roleStr.includes('finops') || roleStr.includes('fin');

    if (isITRole && !isIT) {
      return {
        canEdit: false,
        reason: 'As an IT reviewer, you can only modify IT findings. This finding belongs to FinOps.',
      };
    }
    if (isFinOpsRole && isIT) {
      return {
        canEdit: false,
        reason: 'As a FinOps reviewer, you can only modify FinOps findings. This finding belongs to IT.',
      };
    }
    return { canEdit: true, reason: null };
  };

  // Reorder helper with priority change detection
  const performReorder = (draggedId: string, targetId: string) => {
    const dragIdx = issues.findIndex((i) => i.id === draggedId);
    const targetIdx = issues.findIndex((i) => i.id === targetId);
    if (dragIdx === -1 || targetIdx === -1 || dragIdx === targetIdx) return;

    const currentItem = issues[dragIdx];
    const targetItem = issues[targetIdx];
    const isCrossPriority = currentItem.criticality !== targetItem.criticality;

    const updated = [...issues];
    const [moved] = updated.splice(dragIdx, 1);
    updated.splice(targetIdx, 0, moved);

    // Realign sequential numbers
    const sequenced = updated.map((item, idx) => ({
      ...item,
      reportRef: idx + 1,
    }));

    onReorderIssues(sequenced, isCrossPriority, currentItem.criticality, targetItem.criticality);
  };

  // Arrow button reorder helper
  const handleMoveIssueById = (issueId: string, direction: 'up' | 'down') => {
    const currentFilteredIdx = filteredIssues.findIndex((i) => i.id === issueId);
    if (currentFilteredIdx === -1) return;
    const targetFilteredIdx = direction === 'up' ? currentFilteredIdx - 1 : currentFilteredIdx + 1;
    if (targetFilteredIdx < 0 || targetFilteredIdx >= filteredIssues.length) return;

    const targetIssueId = filteredIssues[targetFilteredIdx].id;
    performReorder(issueId, targetIssueId);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, issueId: string) => {
    setDraggedIssueId(issueId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', issueId);
  };

  const handleDragOver = (e: React.DragEvent, issueId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIssueId !== issueId) {
      setDragOverIssueId(issueId);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, issueId: string) => {
    if (dragOverIssueId === issueId) {
      setDragOverIssueId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIssueId: string) => {
    e.preventDefault();
    if (!draggedIssueId || draggedIssueId === targetIssueId) {
      setDraggedIssueId(null);
      setDragOverIssueId(null);
      setDraggableCardId(null);
      return;
    }
    performReorder(draggedIssueId, targetIssueId);
    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDraggableCardId(null);
  };

  const handleDragEnd = () => {
    setDraggedIssueId(null);
    setDragOverIssueId(null);
    setDraggableCardId(null);
  };

  // If collapsed, render 36px rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#F4F6F8',
          borderRight: 'none',
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
          onClick={() => onToggleCollapse?.(false)}
          title="Expand Issues List"
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
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
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
          ISSUES ({issues.length})
        </div>
      </div>
    );
  }

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F4F6F8',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Pane 1 Header Toolbar */}
      <div
        style={{
          padding: '10px 12px 6px 12px',
          borderBottom: 'none',
          backgroundColor: '#F4F6F8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Left End: Collapse Button + List Box Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
          {onToggleCollapse && (
            <button
              onClick={() => onToggleCollapse(true)}
              title="Collapse Issues List"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              <PanelLeftClose style={{ width: '16px', height: '16px' }} />
            </button>
          )}

          <SharedListBoxFilter<'all' | 'IT' | 'FinOps'>
            options={filterOptions}
            value={filterDomain}
            onChange={(val) => setFilterDomain(val)}
            size="small"
            ariaLabel="Filter issues by domain"
          />
        </div>

        {/* Right End: Add Option */}
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <SharedButton
            variant="outline"
            size="small"
            startIcon={<Plus size={12} color="#000099" />}
            onClick={onOpenCreateDialog}
            style={{
              height: '26px',
              fontSize: '11px',
              padding: '0 10px',
              backgroundColor: '#ffffff',
              border: '1px solid #000099',
              color: '#000099',
              fontWeight: 700,
            }}
          >
            Add
          </SharedButton>
        </div>
      </div>

      {/* Cards List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '6px 10px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#F4F6F8',
        }}
      >
        {filteredIssues.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>
              No {filterDomain !== 'all' ? filterDomain : ''} Findings
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '4px' }}>
              No findings recorded matching the active filter.
            </div>
          </div>
        ) : (
          filteredIssues.map((item, filteredIdx) => {
            const editability = checkIssueEditability(item);
            return (
              <IssueNavCard
                key={item.id}
                issue={item}
                index={filteredIdx}
                isSelected={selectedIssueId === item.id}
                isReadOnly={!editability.canEdit}
                readOnlyReason={editability.reason || undefined}
                isFirst={filteredIdx === 0}
              isLast={filteredIdx === filteredIssues.length - 1}
              isDragging={draggedIssueId === item.id}
              isOver={dragOverIssueId === item.id}
              draggable={draggableCardId === item.id}
              onSelect={() => onSelectIssue(selectedIssueId === item.id ? null : item.id)}
              onMoveUp={() => handleMoveIssueById(item.id, 'up')}
              onMoveDown={() => handleMoveIssueById(item.id, 'down')}
              onInclude={() => onIncludeIssue?.(item.id)}
              onDragStart={(e) => handleDragStart(e, item.id)}
              onDragOver={(e) => handleDragOver(e, item.id)}
              onDragLeave={(e) => handleDragLeave(e, item.id)}
              onDrop={(e) => handleDrop(e, item.id)}
              onDragEnd={handleDragEnd}
              onDragHandleMouseEnter={() => setDraggableCardId(item.id)}
              onDragHandleMouseLeave={() => {
                if (!draggedIssueId) setDraggableCardId(null);
              }}
              onDragHandleMouseDown={(e) => {
                e.stopPropagation();
                setDraggableCardId(item.id);
              }}
            />
          );
        })
        )}
      </div>
    </aside>
  );
};
