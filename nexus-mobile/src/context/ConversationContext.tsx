// Written by: Lin - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

import { createContext, useContext, useState, type ReactNode, useEffect } from 'react';
import type { Conversation, ConversationState, Message } from '../types';
import { generateUUID } from '../utils/uuid';

const ConversationContext = createContext<ConversationState | undefined>(undefined);

const STORAGE_KEY = 'nexus-conversations';

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      return parsed.map((conv: any) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    }
  } catch (error) {
    console.error('Failed to load conversations:', error);
  }
  return [];
}

function saveConversations(conversations: Conversation[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error('Failed to save conversations:', error);
  }
}

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const loaded = loadConversations();
    // Initialize with a default conversation if none exist
    if (loaded.length === 0) {
      const newConversation: Conversation = {
        id: generateUUID(),
        title: 'New Request',
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };
      return [newConversation];
    }
    return loaded;
  });

  const [activeConversationId, setActiveConversationId] = useState<string | null>(() => {
    const existing = loadConversations();
    if (existing.length === 0) {
      // Will be set by the conversations initial state above
      return null;
    }
    return existing[0].id;
  });

  // Set active conversation ID after initial conversations are set
  useEffect(() => {
    if (activeConversationId === null && conversations.length > 0) {
      setActiveConversationId(conversations[0].id);
    }
  }, [conversations, activeConversationId]);

  // Persist to localStorage whenever conversations change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  const addMessage = (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        const newMessage: Message = {
          ...message,
          id: generateUUID(),
          timestamp: new Date()
        };
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          updatedAt: new Date()
        };
      }
      return conv;
    }));
  };

  const updateLastMessage = (conversationId: string, content: string) => {
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId && conv.messages.length > 0) {
        const messages = [...conv.messages];
        const lastMessage = messages[messages.length - 1];
        messages[messages.length - 1] = {
          ...lastMessage,
          content
        };
        return {
          ...conv,
          messages,
          updatedAt: new Date()
        };
      }
      return conv;
    }));
  };

  const createConversation = (title: string): string => {
    const newConversation: Conversation = {
      id: generateUUID(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setConversations(prev => [newConversation, ...prev]);
    return newConversation.id;
  };

  const setActiveConversation = (id: string) => {
    setActiveConversationId(id);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => {
      const filtered = prev.filter(conv => conv.id !== id);
      if (activeConversationId === id && filtered.length > 0) {
        setActiveConversationId(filtered[0].id);
      } else if (filtered.length === 0) {
        setActiveConversationId(null);
      }
      return filtered;
    });
  };

  const value: ConversationState = {
    conversations,
    activeConversationId,
    addMessage,
    updateLastMessage,
    createConversation,
    setActiveConversation,
    deleteConversation,
    setConversations
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
