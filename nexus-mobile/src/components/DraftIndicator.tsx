// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Jake
// Status: Production-Ready

import './DraftIndicator.css';

interface DraftIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
}

export default function DraftIndicator({ status, lastSaved }: DraftIndicatorProps) {
  if (status === 'idle') return null;

  const getStatusText = () => {
    switch (status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return lastSaved
          ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'Saved';
      case 'error':
        return 'Failed to save';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'saving':
        return (
          <svg className="draft-spinner" width="14" height="14" viewBox="0 0 16 16">
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeDasharray="30"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 8 8"
                to="360 8 8"
                dur="1s"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        );
      case 'saved':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M16 8A8 8 0 110 8a8 8 0 0116 0zm-3.97-3.03a.75.75 0 00-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 00-1.06 1.06L6.97 11.03a.75.75 0 001.079-.02l3.992-4.99a.75.75 0 00-.01-1.05z" />
          </svg>
        );
      case 'error':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 15A7 7 0 118 1a7 7 0 010 14zm0 1A8 8 0 108 0a8 8 0 000 16z" />
            <path d="M7.002 11a1 1 0 112 0 1 1 0 01-2 0zM7.1 4.995a.905.905 0 111.8 0l-.35 3.507a.552.552 0 01-1.1 0L7.1 4.995z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`draft-indicator draft-${status}`}>
      {getStatusIcon()}
      <span className="draft-text">{getStatusText()}</span>
    </div>
  );
}
