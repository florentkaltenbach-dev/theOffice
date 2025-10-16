// Written by: Priya - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

export type MessageRole = 'user' | 'nexus';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  sender?: string; // For Nexus messages, which employee is speaking
  parentId?: string; // For conversation branching
  editedAt?: Date; // Track message edits
  isError?: boolean; // Flag for error messages
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  folderId?: string; // Folder organization
  tags?: string[]; // Tag system
  isFavorite?: boolean; // Favorite status
  metadata?: ConversationMetadata; // Additional metadata
}

export interface ConversationMetadata {
  aiPersonality?: string; // AI mode: 'balanced', 'creative', 'precise', 'concise'
  contextItems?: ContextItem[]; // Attached context
  branchPoints?: string[]; // Message IDs where branches exist
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string; // Support nested folders
  createdAt: Date;
}

export interface ContextItem {
  id: string;
  type: 'file' | 'url' | 'text' | 'image' | 'code' | 'note' | 'snippet' | 'conversation';
  name: string;
  content?: string;
  url?: string;
  size?: number;
  addedAt: Date;
  active?: boolean; // Bobby's addition: Track if context is active
  metadata?: ContextMetadata; // Bobby's addition: Additional context data
}

// Bobby's addition: Metadata for context items
export interface ContextMetadata {
  title?: string;
  language?: string;
  filename?: string;
  description?: string;
  conversationId?: string;
  truncated?: boolean;
  originalSize?: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  defaultAIPersonality: string;
  autoSaveDrafts: boolean;
  showLineNumbers: boolean;
  syntaxHighlighting: boolean;
  enableNotifications: boolean;
  sessionTimeout: number; // minutes
}

export interface SearchResult {
  conversationId: string;
  conversationTitle: string;
  messageId: string;
  messageContent: string;
  messageTimestamp: Date;
  highlightedContent?: string;
}

export interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  addMessage: (conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateLastMessage: (conversationId: string, content: string) => void;
  createConversation: (title: string) => string;
  setActiveConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  setConversations: (conversations: Conversation[]) => void;
}

// Bobby's additions for branching and personalities!

export interface BranchNode {
  id: string;
  title: string;
  created_at: string;
  branch_point_message_id: string | null;
  parent_conversation_id: string | null;
}

export interface BranchTree {
  current: BranchNode;
  ancestors: BranchNode[];
  siblings: BranchNode[];
  children: BranchNode[];
  depth: number;
  isRoot: boolean;
  hasChildren: boolean;
}

export interface Personality {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface BranchCreateRequest {
  messageId: string;
  title?: string;
}

export interface DuplicateMessageError {
  error: string;
  message: string;
  retryAfter: number; // seconds
}
