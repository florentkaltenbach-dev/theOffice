// Written by: Sarah Williams - Frontend Team Lead
// Reviewed by: Katie, Priya
// Status: Production-Ready

import { useState } from 'react';
import type { UserPreferences } from '../types';
import './PreferencesModal.css';

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSave: (preferences: UserPreferences) => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  fontSize: 'medium',
  defaultAIPersonality: 'balanced',
  autoSaveDrafts: true,
  showLineNumbers: false,
  syntaxHighlighting: true,
  enableNotifications: true,
  sessionTimeout: 30
};

export default function PreferencesModal({
  isOpen,
  onClose,
  preferences,
  onSave
}: PreferencesModalProps) {
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(
    preferences || DEFAULT_PREFERENCES
  );

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(localPrefs);
    onClose();
  };

  const handleReset = () => {
    setLocalPrefs(DEFAULT_PREFERENCES);
  };

  return (
    <div className="preferences-modal-overlay" onClick={onClose}>
      <div className="preferences-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preferences-modal-header">
          <h2>Preferences</h2>
          <button className="close-button" onClick={onClose} title="Close">
            <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4.646 4.646a.5.5 0 01.708 0L8 7.293l2.646-2.647a.5.5 0 01.708.708L8.707 8l2.647 2.646a.5.5 0 01-.708.708L8 8.707l-2.646 2.647a.5.5 0 01-.708-.708L7.293 8 4.646 5.354a.5.5 0 010-.708z"/>
            </svg>
          </button>
        </div>

        <div className="preferences-modal-content">
          {/* Appearance */}
          <div className="preference-section">
            <h3>Appearance</h3>

            <div className="preference-item">
              <label>Theme</label>
              <select
                value={localPrefs.theme}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    theme: e.target.value as UserPreferences['theme']
                  })
                }
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="preference-item">
              <label>Font Size</label>
              <select
                value={localPrefs.fontSize}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    fontSize: e.target.value as UserPreferences['fontSize']
                  })
                }
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>

          {/* AI Settings */}
          <div className="preference-section">
            <h3>AI Behavior</h3>

            <div className="preference-item">
              <label>Default AI Personality</label>
              <select
                value={localPrefs.defaultAIPersonality}
                onChange={(e) =>
                  setLocalPrefs({ ...localPrefs, defaultAIPersonality: e.target.value })
                }
              >
                <option value="balanced">Balanced</option>
                <option value="creative">Creative</option>
                <option value="precise">Precise</option>
                <option value="concise">Concise</option>
              </select>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="preference-section">
            <h3>Editor</h3>

            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPrefs.syntaxHighlighting}
                  onChange={(e) =>
                    setLocalPrefs({
                      ...localPrefs,
                      syntaxHighlighting: e.target.checked
                    })
                  }
                />
                <span>Syntax Highlighting</span>
              </label>
            </div>

            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPrefs.showLineNumbers}
                  onChange={(e) =>
                    setLocalPrefs({ ...localPrefs, showLineNumbers: e.target.checked })
                  }
                />
                <span>Show Line Numbers in Code</span>
              </label>
            </div>

            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPrefs.autoSaveDrafts}
                  onChange={(e) =>
                    setLocalPrefs({ ...localPrefs, autoSaveDrafts: e.target.checked })
                  }
                />
                <span>Auto-save Drafts</span>
              </label>
            </div>
          </div>

          {/* Session Settings */}
          <div className="preference-section">
            <h3>Session</h3>

            <div className="preference-item">
              <label>Session Timeout (minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={localPrefs.sessionTimeout}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    sessionTimeout: parseInt(e.target.value) || 30
                  })
                }
              />
            </div>
          </div>

          {/* Notifications */}
          <div className="preference-section">
            <h3>Notifications</h3>

            <div className="preference-item">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={localPrefs.enableNotifications}
                  onChange={(e) =>
                    setLocalPrefs({
                      ...localPrefs,
                      enableNotifications: e.target.checked
                    })
                  }
                />
                <span>Enable Notifications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="preferences-modal-footer">
          <button className="btn-secondary" onClick={handleReset}>
            Reset to Defaults
          </button>
          <div className="footer-actions">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button className="btn-save" onClick={handleSave}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
