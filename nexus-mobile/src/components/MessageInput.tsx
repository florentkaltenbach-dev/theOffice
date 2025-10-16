// Written by: Jake - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from 'react';
import DraftIndicator from './DraftIndicator';
import './MessageInput.css';

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  conversationId?: string;
  autoSaveDrafts?: boolean;
}

export default function MessageInput({
  onSend,
  disabled = false,
  conversationId,
  autoSaveDrafts = true
}: MessageInputProps) {
  const [input, setInput] = useState('');
  const [draftStatus, setDraftStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);
  const debounceTimer = useRef<number | undefined>(undefined);

  // Load draft on mount or conversation change
  useEffect(() => {
    if (conversationId && autoSaveDrafts) {
      const draft = localStorage.getItem(`draft_${conversationId}`);
      if (draft) {
        setInput(draft);
      }
    }
  }, [conversationId, autoSaveDrafts]);

  // Auto-save draft with debouncing
  useEffect(() => {
    if (!autoSaveDrafts || !conversationId) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (input.trim()) {
      setDraftStatus('saving');
      debounceTimer.current = setTimeout(() => {
        try {
          localStorage.setItem(`draft_${conversationId}`, input);
          setDraftStatus('saved');
          setLastSaved(new Date());
        } catch (error) {
          console.error('Failed to save draft:', error);
          setDraftStatus('error');
        }
      }, 1000); // Save after 1 second of no typing
    } else {
      // Clear draft if empty
      localStorage.removeItem(`draft_${conversationId}`);
      setDraftStatus('idle');
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [input, conversationId, autoSaveDrafts]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
      // Clear draft after sending
      if (conversationId) {
        localStorage.removeItem(`draft_${conversationId}`);
        setDraftStatus('idle');
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="message-input-container">
      {autoSaveDrafts && draftStatus !== 'idle' && (
        <DraftIndicator status={draftStatus} lastSaved={lastSaved} />
      )}
      <form className="message-input-form" onSubmit={handleSubmit}>
        <textarea
          className="message-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe your idea or request..."
          disabled={disabled}
          rows={1}
        />
        <button
          type="submit"
          className="send-button"
          disabled={disabled || !input.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}
