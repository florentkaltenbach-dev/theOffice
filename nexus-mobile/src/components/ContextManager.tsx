// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Marcus Chen, Jake
// Status: Production-Ready

import type { ContextItem } from '../types';
import './ContextManager.css';

interface ContextManagerProps {
  contextItems: ContextItem[];
  onRemoveItem: (itemId: string) => void;
  onAddItem?: () => void;
  maxItems?: number;
}

export default function ContextManager({
  contextItems,
  onRemoveItem,
  onAddItem,
  maxItems = 10
}: ContextManagerProps) {
  const getTypeIcon = (type: ContextItem['type']) => {
    switch (type) {
      case 'file':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V2a2 2 0 00-2-2H4zm0 1h8a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V2a1 1 0 011-1z" />
          </svg>
        );
      case 'url':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.354 5.5H4a3 3 0 000 6h3a3 3 0 002.83-4H9c-.086 0-.17.01-.25.031A2 2 0 017 10.5H4a2 2 0 110-4h1.535c.218-.376.495-.714.82-1z" />
            <path d="M9 5.5a3 3 0 00-2.83 4h1.098A2 2 0 019 6.5h3a2 2 0 110 4h-1.535a4.02 4.02 0 01-.82 1H12a3 3 0 100-6H9z" />
          </svg>
        );
      case 'text':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M0 2a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2.5a1 1 0 00-.8.4l-1.9 2.533a1 1 0 01-1.6 0L5.3 12.4a1 1 0 00-.8-.4H2a2 2 0 01-2-2V2z" />
          </svg>
        );
      case 'image':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.002 5.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M2.002 1a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V3a2 2 0 00-2-2h-12zm12 1a1 1 0 011 1v6.5l-3.777-1.947a.5.5 0 00-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 00-.63.062L1.002 12V3a1 1 0 011-1h12z" />
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
            <path d="M5.255 5.786a.237.237 0 00.241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 00.25.246h.811a.25.25 0 00.25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z" />
          </svg>
        );
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div className="context-manager">
      <div className="context-header">
        <div className="context-title">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.5A1.5 1.5 0 012.5 1h3.797a1.5 1.5 0 011.06.44l.415.414A.5.5 0 008.126 2H11.5A1.5 1.5 0 0113 3.5v9a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 011 12.5v-10z" />
          </svg>
          <span>
            Context ({contextItems.length}/{maxItems})
          </span>
        </div>
        {onAddItem && contextItems.length < maxItems && (
          <button className="add-context-button" onClick={onAddItem} title="Add context">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 01.5.5v5h5a.5.5 0 010 1h-5v5a.5.5 0 01-1 0v-5h-5a.5.5 0 010-1h5v-5A.5.5 0 018 2z" />
            </svg>
          </button>
        )}
      </div>

      <div className="context-items">
        {contextItems.length === 0 ? (
          <div className="context-empty-state">
            <p>No context items attached</p>
            {onAddItem && (
              <button className="add-first-context" onClick={onAddItem}>
                Add context
              </button>
            )}
          </div>
        ) : (
          contextItems.map((item) => (
            <div key={item.id} className="context-item">
              <div className="context-item-icon">{getTypeIcon(item.type)}</div>
              <div className="context-item-info">
                <div className="context-item-name">{item.name}</div>
                <div className="context-item-meta">
                  <span className="context-item-type">{item.type}</span>
                  {item.size && (
                    <>
                      <span className="context-meta-separator">•</span>
                      <span className="context-item-size">{formatSize(item.size)}</span>
                    </>
                  )}
                </div>
              </div>
              <button
                className="remove-context-button"
                onClick={() => onRemoveItem(item.id)}
                title="Remove context"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {contextItems.length >= maxItems && (
        <div className="context-limit-warning">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
            <path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z" />
          </svg>
          <span>Maximum context items reached</span>
        </div>
      )}
    </div>
  );
}
