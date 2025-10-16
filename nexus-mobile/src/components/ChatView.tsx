// Written by: Tom - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

import { useEffect, useRef, useState } from 'react';
import type { Message } from '../types';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import UserMenu from './UserMenu';
import ChangePasswordModal from './ChangePasswordModal';
import './ChatView.css';

interface ChatViewProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  onLogout?: () => void;
}

export default function ChatView({ messages, onSendMessage, onLogout }: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePasswordChangeSuccess = () => {
    setPasswordChangeSuccess(true);
    setTimeout(() => setPasswordChangeSuccess(false), 3000);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="header-content">
          <div>
            <h1>Nexus Software Solutions</h1>
            <p className="chat-subtitle">Your Development Team</p>
          </div>
          {onLogout && (
            <UserMenu
              onLogout={handleLogout}
              onChangePassword={() => setIsPasswordModalOpen(true)}
            />
          )}
        </div>
        {passwordChangeSuccess && (
          <div className="success-banner">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z"/>
            </svg>
            Password changed successfully!
          </div>
        )}
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome! 👋</h2>
            <p>Tell us about your idea or development request.</p>
            <p>Our entire team is ready to help bring it to life.</p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-container">
        <MessageInput onSend={onSendMessage} />
      </div>
    </div>
  );
}
