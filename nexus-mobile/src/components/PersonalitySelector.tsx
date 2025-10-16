// Written by: Bobby Chen - Software Engineering Intern
// Reviewed by: Sarah Williams (Frontend Lead), Paulo (Creative Director)
// Status: Ready for Testing
//
// Personality Selector - Choose how Claude responds!
// Different personalities for different needs.

import { useState } from 'react';
import './PersonalitySelector.css';

export interface Personality {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

interface PersonalitySelectorProps {
  currentPersonality?: string;
  onSelect: (personalityId: string) => void;
  compact?: boolean;
}

// Default personalities (can be loaded from API)
const DEFAULT_PERSONALITIES: Personality[] = [
  {
    id: 'nexus',
    name: 'Nexus Office',
    description: 'The full office simulation with all team members',
    icon: '🏢'
  },
  {
    id: 'professional',
    name: 'Professional Assistant',
    description: 'Direct, professional technical assistant',
    icon: '💼'
  },
  {
    id: 'teacher',
    name: 'Patient Teacher',
    description: 'Educational, explains concepts thoroughly',
    icon: '👨‍🏫'
  },
  {
    id: 'debugger',
    name: 'Debug Detective',
    description: 'Focused on finding and fixing bugs',
    icon: '🔍'
  },
  {
    id: 'architect',
    name: 'System Architect',
    description: 'High-level system design and architecture',
    icon: '🏗️'
  },
  {
    id: 'reviewer',
    name: 'Code Reviewer',
    description: 'Constructive code review and feedback',
    icon: '👀'
  },
  {
    id: 'creative',
    name: 'Creative Coder',
    description: 'Innovative and experimental approaches',
    icon: '🎨'
  }
];

export default function PersonalitySelector({
  currentPersonality = 'nexus',
  onSelect,
  compact = false
}: PersonalitySelectorProps) {
  const [personalities] = useState<Personality[]>(DEFAULT_PERSONALITIES);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(currentPersonality);

  const selectedPersonality = personalities.find(p => p.id === selectedId) || personalities[0];

  const handleSelect = (personalityId: string) => {
    setSelectedId(personalityId);
    onSelect(personalityId);
    setIsOpen(false);
  };

  if (compact) {
    // Compact mode: just a dropdown
    return (
      <div className="personality-selector compact">
        <select
          value={selectedId}
          onChange={(e) => handleSelect(e.target.value)}
          className="personality-dropdown"
        >
          {personalities.map((p) => (
            <option key={p.id} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // Full mode: visual selector
  return (
    <div className="personality-selector">
      <div className="selector-header">
        <h3>AI Personality</h3>
        <button
          className="current-personality"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="personality-icon">{selectedPersonality.icon}</span>
          <span className="personality-name">{selectedPersonality.name}</span>
          <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="personality-dropdown-panel">
          <div className="personality-grid">
            {personalities.map((personality) => (
              <button
                key={personality.id}
                className={`personality-card ${
                  personality.id === selectedId ? 'active' : ''
                }`}
                onClick={() => handleSelect(personality.id)}
              >
                <div className="card-icon">{personality.icon}</div>
                <div className="card-content">
                  <h4>{personality.name}</h4>
                  <p>{personality.description}</p>
                </div>
                {personality.id === selectedId && (
                  <div className="active-indicator">✓</div>
                )}
              </button>
            ))}
          </div>

          <div className="personality-hint">
            💡 <strong>Tip:</strong> Different personalities are better for different tasks.
            Try "Debug Detective" for troubleshooting, or "Teacher" for learning new concepts!
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact inline personality badge
 * Shows current personality without taking up much space
 */
export function PersonalityBadge({ personalityId = 'nexus' }: { personalityId?: string }) {
  const personality = DEFAULT_PERSONALITIES.find(p => p.id === personalityId) || DEFAULT_PERSONALITIES[0];

  return (
    <div className="personality-badge" title={personality.description}>
      <span className="badge-icon">{personality.icon}</span>
      <span className="badge-text">{personality.name}</span>
    </div>
  );
}
