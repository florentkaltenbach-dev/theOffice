// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Diana Foster, Dmitri
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * User Preferences API
 * Manages user-specific settings and customizations
 */

// Get user preferences
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    let preferences = db.prepare(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `).get(req.user.id);

    // If no preferences exist, create default ones
    if (!preferences) {
      db.prepare(`
        INSERT INTO user_preferences (user_id)
        VALUES (?)
      `).run(req.user.id);

      preferences = db.prepare(`
        SELECT * FROM user_preferences WHERE user_id = ?
      `).get(req.user.id);
    }

    // Parse JSON preferences if they exist
    const response = {
      ai_personality: preferences.ai_personality,
      theme: preferences.theme,
      session_timeout: preferences.session_timeout,
      auto_save_drafts: !!preferences.auto_save_drafts,
      enable_markdown: !!preferences.enable_markdown,
      enable_syntax_highlight: !!preferences.enable_syntax_highlight,
      custom: preferences.preferences_json ? JSON.parse(preferences.preferences_json) : {}
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update user preferences
router.patch('/', authenticateToken, (req, res) => {
  try {
    const {
      ai_personality,
      theme,
      session_timeout,
      auto_save_drafts,
      enable_markdown,
      enable_syntax_highlight,
      custom
    } = req.body;

    const db = getDatabase();

    // Ensure preferences record exists
    let preferences = db.prepare(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `).get(req.user.id);

    if (!preferences) {
      db.prepare(`
        INSERT INTO user_preferences (user_id)
        VALUES (?)
      `).run(req.user.id);
    }

    // Build update query dynamically based on provided fields
    const updates = [];
    const params = [];

    if (ai_personality !== undefined) {
      const validPersonalities = ['professional', 'friendly', 'technical', 'creative'];
      if (!validPersonalities.includes(ai_personality)) {
        return res.status(400).json({
          error: 'Invalid AI personality',
          valid_options: validPersonalities
        });
      }
      updates.push('ai_personality = ?');
      params.push(ai_personality);
    }

    if (theme !== undefined) {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(theme)) {
        return res.status(400).json({
          error: 'Invalid theme',
          valid_options: validThemes
        });
      }
      updates.push('theme = ?');
      params.push(theme);
    }

    if (session_timeout !== undefined) {
      const timeout = parseInt(session_timeout);
      if (isNaN(timeout) || timeout < 300 || timeout > 86400) {
        return res.status(400).json({
          error: 'Invalid session timeout (must be between 300 and 86400 seconds)'
        });
      }
      updates.push('session_timeout = ?');
      params.push(timeout);
    }

    if (auto_save_drafts !== undefined) {
      updates.push('auto_save_drafts = ?');
      params.push(auto_save_drafts ? 1 : 0);
    }

    if (enable_markdown !== undefined) {
      updates.push('enable_markdown = ?');
      params.push(enable_markdown ? 1 : 0);
    }

    if (enable_syntax_highlight !== undefined) {
      updates.push('enable_syntax_highlight = ?');
      params.push(enable_syntax_highlight ? 1 : 0);
    }

    if (custom !== undefined) {
      if (typeof custom !== 'object' || Array.isArray(custom)) {
        return res.status(400).json({ error: 'Custom preferences must be an object' });
      }
      updates.push('preferences_json = ?');
      params.push(JSON.stringify(custom));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid preferences to update' });
    }

    // Add user_id to params
    params.push(req.user.id);

    // Execute update
    db.prepare(`
      UPDATE user_preferences
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `).run(...params);

    res.json({ message: 'Preferences updated successfully' });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Reset preferences to defaults
router.post('/reset', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    db.prepare(`
      DELETE FROM user_preferences WHERE user_id = ?
    `).run(req.user.id);

    db.prepare(`
      INSERT INTO user_preferences (user_id)
      VALUES (?)
    `).run(req.user.id);

    res.json({ message: 'Preferences reset to defaults' });
  } catch (error) {
    console.error('Error resetting preferences:', error);
    res.status(500).json({ error: 'Failed to reset preferences' });
  }
});

// Get specific preference value
router.get('/:key', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const preferences = db.prepare(`
      SELECT * FROM user_preferences WHERE user_id = ?
    `).get(req.user.id);

    if (!preferences) {
      return res.status(404).json({ error: 'Preferences not found' });
    }

    const key = req.params.key;
    let value;

    // Map keys to database columns
    switch (key) {
      case 'ai_personality':
        value = preferences.ai_personality;
        break;
      case 'theme':
        value = preferences.theme;
        break;
      case 'session_timeout':
        value = preferences.session_timeout;
        break;
      case 'auto_save_drafts':
        value = !!preferences.auto_save_drafts;
        break;
      case 'enable_markdown':
        value = !!preferences.enable_markdown;
        break;
      case 'enable_syntax_highlight':
        value = !!preferences.enable_syntax_highlight;
        break;
      default:
        // Check in custom preferences JSON
        if (preferences.preferences_json) {
          const custom = JSON.parse(preferences.preferences_json);
          value = custom[key];
        }
        if (value === undefined) {
          return res.status(404).json({ error: 'Preference key not found' });
        }
    }

    res.json({ key, value });
  } catch (error) {
    console.error('Error fetching preference:', error);
    res.status(500).json({ error: 'Failed to fetch preference' });
  }
});

export default router;
