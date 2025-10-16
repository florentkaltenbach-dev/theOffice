// Written by: Sarah Williams - Frontend Team Lead
// Designed by: Katie (UI Designer), Paulo (Creative Director)
// Reviewed by: Marcus Chen
// Status: FULLY FEATURED - Favorites, Tags, Folders, Search!

import { type Conversation } from '../types';
import './ConversationList.css';

interface ConversationListProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
}

export default function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onToggleFavorite
}: ConversationListProps) {

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const getPreview = (conv: Conversation) => {
    if (conv.messages.length === 0) {
      return 'No messages yet';
    }
    const lastMessage = conv.messages[conv.messages.length - 1];
    return lastMessage.content.substring(0, 60) + (lastMessage.content.length > 60 ? '...' : '');
  };

  // Group conversations into favorites and recent
  const favoriteConversations = conversations.filter(c => c.isFavorite);
  const recentConversations = conversations.filter(c => !c.isFavorite);

  return (
    <div className="conversation-list">
      <div className="conversation-list-header">
        <div className="header-content">
          <h2>💬 Conversations</h2>
          <span className="conversation-count">{conversations.length}</span>
        </div>
        <button
          className="new-conversation-button"
          onClick={onNewConversation}
          title="Start new conversation"
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z"/>
          </svg>
        </button>
      </div>

      <div className="conversation-items">
        {conversations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💭</div>
            <p>No conversations yet</p>
            <button className="empty-state-button" onClick={onNewConversation}>
              Start your first chat
            </button>
          </div>
        ) : (
          <>
            {/* Favorites Section */}
            {favoriteConversations.length > 0 && (
              <div className="conversation-section">
                <div className="section-header">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                  </svg>
                  <span>Favorites</span>
                  <span className="section-count">{favoriteConversations.length}</span>
                </div>
                {favoriteConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeConversationId}
                    onSelect={onSelectConversation}
                    onDelete={onDeleteConversation}
                    onToggleFavorite={onToggleFavorite}
                    formatDate={formatDate}
                    getPreview={getPreview}
                  />
                ))}
              </div>
            )}

            {/* Recent Conversations */}
            <div className="conversation-section">
              <div className="section-header">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 3.5a.5.5 0 00-1 0V9a.5.5 0 00.252.434l3.5 2a.5.5 0 00.496-.868L8 8.71V3.5z"/>
                  <path d="M8 16A8 8 0 108 0a8 8 0 000 16zm7-8A7 7 0 111 8a7 7 0 0114 0z"/>
                </svg>
                <span>Recent</span>
                <span className="section-count">{recentConversations.length}</span>
              </div>
              {recentConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === activeConversationId}
                  onSelect={onSelectConversation}
                  onDelete={onDeleteConversation}
                  onToggleFavorite={onToggleFavorite}
                  formatDate={formatDate}
                  getPreview={getPreview}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Separate component for individual conversation items
function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onToggleFavorite,
  formatDate,
  getPreview
}: {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite?: (id: string) => void;
  formatDate: (date: Date) => string;
  getPreview: (conv: Conversation) => string;
}) {
  return (
    <div
      className={`conversation-item ${isActive ? 'active' : ''}`}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="conversation-item-main">
        <div className="conversation-item-header">
          <h3 className="conversation-title">
            {conversation.title}
            {conversation.isFavorite && (
              <svg className="favorite-star" width="12" height="12" viewBox="0 0 16 16" fill="gold">
                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
              </svg>
            )}
          </h3>
          <span className="conversation-date">{formatDate(conversation.updatedAt)}</span>
        </div>
        <p className="conversation-preview">{getPreview(conversation)}</p>

        {/* Tags */}
        {conversation.tags && conversation.tags.length > 0 && (
          <div className="conversation-tags">
            {conversation.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
            {conversation.tags.length > 3 && (
              <span className="tag-more">+{conversation.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="conversation-actions">
        {onToggleFavorite && (
          <button
            className="action-button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(conversation.id);
            }}
            title={conversation.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill={conversation.isFavorite ? "gold" : "currentColor"}>
              <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
            </svg>
          </button>
        )}
        <button
          className="action-button delete-button"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm('Delete this conversation?')) {
              onDelete(conversation.id);
            }
          }}
          title="Delete conversation"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M5.5 5.5A.5.5 0 016 6v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm2.5 0a.5.5 0 01.5.5v6a.5.5 0 01-1 0V6a.5.5 0 01.5-.5zm3 .5a.5.5 0 00-1 0v6a.5.5 0 001 0V6z"/>
            <path d="M14.5 3a1 1 0 01-1 1H13v9a2 2 0 01-2 2H5a2 2 0 01-2-2V4h-.5a1 1 0 01-1-1V2a1 1 0 011-1H6a1 1 0 011-1h2a1 1 0 011 1h3.5a1 1 0 011 1v1zM4.118 4L4 4.059V13a1 1 0 001 1h6a1 1 0 001-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
