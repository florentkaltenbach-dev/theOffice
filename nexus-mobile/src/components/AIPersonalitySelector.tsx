// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Diana Foster (Product Management)
// Status: Production-Ready

import './AIPersonalitySelector.css';

interface AIPersonalitySelectorProps {
  selected: string;
  onChange: (personality: string) => void;
  disabled?: boolean;
}

const PERSONALITIES = [
  {
    id: 'balanced',
    name: 'Balanced',
    description: 'Well-rounded responses with moderate detail',
    icon: '⚖️'
  },
  {
    id: 'creative',
    name: 'Creative',
    description: 'Innovative and exploratory solutions',
    icon: '🎨'
  },
  {
    id: 'precise',
    name: 'Precise',
    description: 'Technical and detailed explanations',
    icon: '🎯'
  },
  {
    id: 'concise',
    name: 'Concise',
    description: 'Brief and to-the-point responses',
    icon: '⚡'
  }
];

export default function AIPersonalitySelector({
  selected,
  onChange,
  disabled = false
}: AIPersonalitySelectorProps) {
  const selectedPersonality = PERSONALITIES.find((p) => p.id === selected) || PERSONALITIES[0];

  return (
    <div className="ai-personality-selector">
      <label className="selector-label">AI Mode</label>
      <div className="personality-dropdown">
        <select
          value={selected}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="personality-select"
        >
          {PERSONALITIES.map((personality) => (
            <option key={personality.id} value={personality.id}>
              {personality.icon} {personality.name}
            </option>
          ))}
        </select>
        <div className="personality-description">
          {selectedPersonality.description}
        </div>
      </div>
    </div>
  );
}
