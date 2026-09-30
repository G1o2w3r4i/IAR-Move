import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  CheckCircle2,
  Lock,
  Tag,
  Check,
  ChevronDown,
} from 'lucide-react';
import type { IssueComment } from '../../../types/dataverse.types';

export interface CommentUser {
  userId: string;
  name: string;
  role?: string;
  avatar?: string;
  avatarBg?: string;
}

interface FieldCommentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: string;
  engagementId: string;
  fieldKey: string;
  fieldLabel: string;
  comments: IssueComment[];
  currentUser: CommentUser;
  availableUsers?: CommentUser[];
  placement?: 'up' | 'down';
  onAddComment: (text: string, taggedUser?: CommentUser) => void;
  onResolveComment: (commentId: string) => void;
}

export const FieldCommentPopover: React.FC<FieldCommentPopoverProps> = ({
  isOpen,
  onClose,
  fieldKey: _fieldKey,
  fieldLabel,
  comments = [],
  currentUser,
  availableUsers = [],
  placement = 'down',
  onAddComment,
  onResolveComment,
}) => {
  const [commentText, setCommentText] = useState('');
  const [selectedTaggedUser, setSelectedTaggedUser] = useState<CommentUser | null>(null);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close tag dropdown on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!isOpen) return null;

  const handlePost = () => {
    if (!commentText.trim()) return;
    onAddComment(commentText.trim(), selectedTaggedUser || undefined);
    setCommentText('');
    setSelectedTaggedUser(null);
    setIsTagDropdownOpen(false);
  };

  const unresolvedCount = comments.filter((c) => !c.isResolved).length;

  return (
    <div
      ref={popoverRef}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: placement === 'up' ? 'auto' : 'calc(100% + 6px)',
        bottom: placement === 'up' ? 'calc(100% + 6px)' : 'auto',
        right: 0,
        width: '360px',
        maxWidth: '92vw',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #CBD5E1',
        boxShadow: '0 16px 36px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        textAlign: 'left',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      {/* Popover Header */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#0F172A',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare style={{ width: '14px', height: '14px', color: '#60A5FA' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.2px' }}>
            {fieldLabel}
          </span>
          <span
            style={{
              backgroundColor: unresolvedCount > 0 ? '#DC2626' : '#166534',
              color: '#ffffff',
              fontSize: '9.5px',
              fontWeight: 800,
              padding: '1px 6px',
              borderRadius: '10px',
            }}
          >
            {unresolvedCount > 0 ? `${unresolvedCount} Open` : 'All Resolved'}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            border: 'none',
            background: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Close Popover"
        >
          <X style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {/* Comments List */}
      <div
        style={{
          maxHeight: '260px',
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          backgroundColor: '#F8FAFC',
        }}
      >
        {comments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 8px', color: '#94A3B8', fontSize: '11.5px' }}>
            No comments yet on this field.
            <br />
            Tag a team member or leave a review note below!
          </div>
        ) : (
          comments.map((c) => {
            const isTaggedToCurrentUser =
              c.taggedUserId && (c.taggedUserId === currentUser.userId || c.taggedUserName === currentUser.name);
            const canResolve = !c.taggedUserId || isTaggedToCurrentUser;

            return (
              <div
                key={c.commentId}
                style={{
                  backgroundColor: c.isResolved ? '#F0FDF4' : '#ffffff',
                  border: c.isResolved ? '1px solid #BBF7D0' : '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                }}
              >
                {/* Author & Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        backgroundColor: '#000099',
                        color: '#ffffff',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {c.authorName ? c.authorName.charAt(0).toUpperCase() : 'U'}
                    </span>
                    <div>
                      <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                        {c.authorName || 'Reviewer'}
                      </div>
                      <div style={{ fontSize: '9.5px', color: '#64748B' }}>
                        Audit Contributor
                      </div>
                    </div>
                  </div>

                  <span style={{ fontSize: '9.5px', color: '#94A3B8' }}>
                    {c.createdAt ? new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                  </span>
                </div>

                {/* Tagged User Pill */}
                {c.taggedUserName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 800,
                        color: '#4338CA',
                        backgroundColor: '#EEF2FF',
                        border: '1px solid #C7D2FE',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Tag style={{ width: '10px', height: '10px' }} />
                      <span>Assigned to @{c.taggedUserName}</span>
                    </span>
                  </div>
                )}

                {/* Comment Text */}
                <p
                  style={{
                    fontSize: '11.5px',
                    color: '#1E293B',
                    margin: '2px 0 0 0',
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                  }}
                >
                  {c.content}
                </p>

                {/* Resolution Footer Row */}
                <div
                  style={{
                    marginTop: '4px',
                    paddingTop: '6px',
                    borderTop: '1px dashed #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                  }}
                >
                  {c.isResolved ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#166534', fontSize: '10.5px', fontWeight: 700 }}>
                      <CheckCircle2 style={{ width: '13px', height: '13px', color: '#166534' }} />
                      <span>Resolved by {c.resolvedByName || 'Reviewer'}</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      {c.taggedUserName && !canResolve ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309', fontSize: '10px' }}>
                          <Lock style={{ width: '11px', height: '11px' }} />
                          <span>Requires @{c.taggedUserName} to resolve</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: '10px', color: '#64748B' }}>
                          {c.taggedUserName ? 'You are assigned' : 'Generic thread (anyone can resolve)'}
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={!canResolve}
                        onClick={() => onResolveComment(c.commentId)}
                        title={canResolve ? 'Click to mark this comment as done' : `Only @${c.taggedUserName} can resolve`}
                        style={{
                          padding: '3px 8px',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          color: canResolve ? '#166534' : '#94A3B8',
                          backgroundColor: canResolve ? '#DCFCE7' : '#F1F5F9',
                          border: canResolve ? '1px solid #86EFAC' : '1px solid #CBD5E1',
                          borderRadius: '5px',
                          cursor: canResolve ? 'pointer' : 'not-allowed',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Check style={{ width: '11px', height: '11px' }} />
                        <span>Mark Done</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Comment Box */}
      <div
        style={{
          padding: '12px',
          borderTop: '1px solid #E2E8F0',
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {/* Tag Picker Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }} ref={tagDropdownRef}>
          {selectedTaggedUser ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#EEF2FF',
                border: '1px solid #C7D2FE',
                borderRadius: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                color: '#3730A3',
                fontWeight: 700,
              }}
            >
              <Tag style={{ width: '11px', height: '11px' }} />
              <span>Tagging: @{selectedTaggedUser.name}</span>
              <button
                type="button"
                onClick={() => setSelectedTaggedUser(null)}
                style={{ border: 'none', background: 'none', color: '#6366F1', cursor: 'pointer', padding: '0 2px' }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              style={{
                fontSize: '11px',
                color: '#475569',
                backgroundColor: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: '6px',
                padding: '3px 8px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                fontWeight: 600,
              }}
            >
              <Tag style={{ width: '11px', height: '11px', color: '#64748B' }} />
              <span>@Tag a Person (Strict Resolution)</span>
              <ChevronDown style={{ width: '11px', height: '11px' }} />
            </button>
          )}

          {/* Tag Dropdown Menu */}
          {isTagDropdownOpen && availableUsers.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: 0,
                width: '240px',
                backgroundColor: '#ffffff',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                zIndex: 600,
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '4px 0',
              }}
            >
              <div style={{ padding: '4px 10px', fontSize: '10px', fontWeight: 800, color: '#94A3B8', borderBottom: '1px solid #F1F5F9' }}>
                ASSIGN REVIEW ACTION TO:
              </div>
              {availableUsers.map((u) => (
                <button
                  key={u.userId}
                  type="button"
                  onClick={() => {
                    setSelectedTaggedUser(u);
                    setIsTagDropdownOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    border: 'none',
                    background: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#EEF2FF')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      backgroundColor: u.avatarBg || '#000099',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {u.avatar || u.name.charAt(0)}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{u.name}</div>
                    <div style={{ fontSize: '9.5px', color: '#64748B' }}>{u.role || 'Audit Member'}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Input with Send Button */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <textarea
            rows={2}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                handlePost();
              }
            }}
            placeholder={
              selectedTaggedUser
                ? `Write note for @${selectedTaggedUser.name}... (Ctrl+Enter to post)`
                : 'Add a comment or observation... (Ctrl+Enter to post)'
            }
            style={{
              flex: 1,
              padding: '6px 8px',
              fontSize: '11.5px',
              borderRadius: '6px',
              border: '1px solid #CBD5E1',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              resize: 'none',
            }}
          />
          <button
            type="button"
            onClick={handlePost}
            disabled={!commentText.trim()}
            style={{
              padding: '0 12px',
              backgroundColor: commentText.trim() ? '#000099' : '#CBD5E1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: commentText.trim() ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
            }}
            title="Post comment (Ctrl+Enter)"
          >
            <Send style={{ width: '13px', height: '13px' }} />
          </button>
        </div>
      </div>
    </div>
  );
};
