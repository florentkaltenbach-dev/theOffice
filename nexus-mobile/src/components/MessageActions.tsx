// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Jake, Priya
// Status: Production-Ready

import { useState } from 'react';
import type { Message } from '../types';
import './MessageActions.css';

interface MessageActionsProps {
  message: Message;
  onCopy?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onBranch?: (messageId: string) => void;
  isEditable?: boolean;
  showRetry?: boolean;
}

export default function MessageActions({
  message,
  onCopy,
  onEdit,
  onDelete,
  onRetry,
  onBranch,
  isEditable = true,
  showRetry = false
}: MessageActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    if (onCopy) onCopy();
    // Visual feedback
    const button = document.activeElement as HTMLElement;
    if (button) {
      button.style.color = '#4CAF50';
      setTimeout(() => {
        button.style.color = '';
      }, 1000);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowActions(false);
  };

  const handleSaveEdit = () => {
    if (onEdit && editContent.trim() !== message.content) {
      onEdit(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditContent(message.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this message?')) {
      onDelete(message.id);
    }
    setShowActions(false);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry(message.id);
    }
    setShowActions(false);
  };

  const handleBranch = () => {
    if (onBranch) {
      onBranch(message.id);
    }
    setShowActions(false);
  };

  if (isEditing) {
    return (
      <div className="message-edit-container">
        <textarea
          className="message-edit-input"
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={Math.min(10, editContent.split('\n').length + 1)}
          autoFocus
        />
        <div className="message-edit-actions">
          <button className="btn-save" onClick={handleSaveEdit}>
            Save
          </button>
          <button className="btn-cancel" onClick={handleCancelEdit}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="message-actions"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`actions-toolbar ${showActions ? 'visible' : ''}`}>
        <button
          className="action-button"
          onClick={handleCopy}
          title="Copy message"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V2z"/>
            <path d="M2 5a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-1h-1v1a1 1 0 01-1 1H2a1 1 0 01-1-1V7a1 1 0 011-1h1V5H2z"/>
          </svg>
        </button>

        {isEditable && message.role === 'user' && onEdit && (
          <button
            className="action-button"
            onClick={handleEdit}
            title="Edit message"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12.146.146a.5.5 0 01.708 0l3 3a.5.5 0 010 .708l-10 10a.5.5 0 01-.168.11l-5 2a.5.5 0 01-.65-.65l2-5a.5.5 0 01.11-.168l10-10zM11.207 2.5L13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 01.5.5v.5h.5a.5.5 0 01.5.5v.5h.293l6.5-6.5z"/>
            </svg>
          </button>
        )}

        {onBranch && (
          <button
            className="action-button"
            onClick={handleBranch}
            title="Branch conversation from here"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M6 2a.5.5 0 01.5.5v6.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 11.708-.708L5.5 9.293V2.5A.5.5 0 016 2z"/>
              <path d="M12.5 6a.5.5 0 01.5.5v6.793l2.146-2.147a.5.5 0 01.708.708l-3 3a.5.5 0 01-.708 0l-3-3a.5.5 0 01.708-.708L12 13.293V6.5a.5.5 0 01.5-.5z"/>
            </svg>
          </button>
        )}

        {showRetry && onRetry && (
          <button
            className="action-button"
            onClick={handleRetry}
            title="Retry message"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 3a5 5 0 104.546 2.914.5.5 0 00-.908-.417A4 4 0 118 4a4 4 0 014 4 .5.5 0 001 0A5 5 0 008 3z"/>
              <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z"/>
            </svg>
          </button>
        )}

        {onDelete && (
          <button
            className="action-button action-delete"
            onClick={handleDelete}
            title="Delete message"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
              <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1z"/>
            </svg>
          </button>
        )}
      </div>

      {message.editedAt && (
        <div className="message-edited-indicator">
          <span title={`Edited at ${message.editedAt.toLocaleString()}`}>
            (edited)
          </span>
        </div>
      )}
    </div>
  );
}
