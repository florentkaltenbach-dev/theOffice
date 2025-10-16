// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Priya
// Status: Production-Ready

import type { Message } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
import MessageActions from './MessageActions';
import './ChatMessage.css';

interface ChatMessageProps {
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onBranch?: (messageId: string) => void;
  showActions?: boolean;
  showLineNumbers?: boolean;
}

export default function ChatMessage({
  message,
  onEdit,
  onDelete,
  onRetry,
  onBranch,
  showActions = true,
  showLineNumbers = false
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = message.isError || false;

  return (
    <div className={`chat-message ${isUser ? 'user-message' : 'nexus-message'} ${isError ? 'error-message' : ''}`}>
      {!isUser && message.sender && (
        <div className="message-sender">{message.sender}</div>
      )}
      <div className="message-content">
        <MarkdownRenderer content={message.content} showLineNumbers={showLineNumbers} />
      </div>
      <div className="message-footer">
        <div className="message-timestamp">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
        {showActions && (
          <MessageActions
            message={message}
            onEdit={onEdit}
            onDelete={onDelete}
            onRetry={onRetry}
            onBranch={onBranch}
            isEditable={isUser}
            showRetry={isError}
          />
        )}
      </div>
    </div>
  );
}
