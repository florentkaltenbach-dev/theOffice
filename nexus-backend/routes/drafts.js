// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Sarah Williams, Emma
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Draft Auto-Save API
 * Manages automatic saving and retrieval of message drafts
 * Each conversation can have one draft per user
 */

// Get draft for conversation
router.get('/:conversation_id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.conversation_id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get draft
    const draft = db.prepare(`
      SELECT id, content, updated_at
      FROM drafts
      WHERE user_id = ? AND conversation_id = ?
    `).get(req.user.id, req.params.conversation_id);

    if (!draft) {
      return res.json({ draft: null });
    }

    res.json({ draft });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ error: 'Failed to fetch draft' });
  }
});

// Save or update draft
router.post('/:conversation_id', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Allow empty strings to clear drafts
    if (typeof content !== 'string') {
      return res.status(400).json({ error: 'Content must be a string' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.conversation_id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // If content is empty, delete the draft
    if (content.trim().length === 0) {
      db.prepare(`
        DELETE FROM drafts
        WHERE user_id = ? AND conversation_id = ?
      `).run(req.user.id, req.params.conversation_id);

      return res.json({ message: 'Draft cleared' });
    }

    // Check if draft exists
    const existingDraft = db.prepare(`
      SELECT id FROM drafts
      WHERE user_id = ? AND conversation_id = ?
    `).get(req.user.id, req.params.conversation_id);

    if (existingDraft) {
      // Update existing draft
      db.prepare(`
        UPDATE drafts
        SET content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND conversation_id = ?
      `).run(content, req.user.id, req.params.conversation_id);

      res.json({
        message: 'Draft updated',
        id: existingDraft.id
      });
    } else {
      // Create new draft
      const result = db.prepare(`
        INSERT INTO drafts (user_id, conversation_id, content)
        VALUES (?, ?, ?)
      `).run(req.user.id, req.params.conversation_id, content);

      res.status(201).json({
        message: 'Draft created',
        id: result.lastInsertRowid
      });
    }
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

// Delete draft
router.delete('/:conversation_id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.conversation_id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const result = db.prepare(`
      DELETE FROM drafts
      WHERE user_id = ? AND conversation_id = ?
    `).run(req.user.id, req.params.conversation_id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ message: 'Draft deleted' });
  } catch (error) {
    console.error('Error deleting draft:', error);
    res.status(500).json({ error: 'Failed to delete draft' });
  }
});

// Get all drafts for user
router.get('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const drafts = db.prepare(`
      SELECT
        d.id,
        d.conversation_id,
        d.content,
        d.updated_at,
        c.title as conversation_title
      FROM drafts d
      JOIN conversations c ON d.conversation_id = c.id
      WHERE d.user_id = ?
      ORDER BY d.updated_at DESC
    `).all(req.user.id);

    res.json({ drafts });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    res.status(500).json({ error: 'Failed to fetch drafts' });
  }
});

// Get draft count for user
router.get('/count', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const result = db.prepare(`
      SELECT COUNT(*) as count
      FROM drafts
      WHERE user_id = ?
    `).get(req.user.id);

    res.json({ count: result.count });
  } catch (error) {
    console.error('Error fetching draft count:', error);
    res.status(500).json({ error: 'Failed to fetch draft count' });
  }
});

// Batch save drafts (for syncing multiple drafts)
router.post('/batch', authenticateToken, (req, res) => {
  try {
    const { drafts } = req.body;

    if (!Array.isArray(drafts)) {
      return res.status(400).json({ error: 'Drafts must be an array' });
    }

    const db = getDatabase();

    // Validate all conversations belong to user
    const conversationIds = drafts.map(d => d.conversation_id);
    const placeholders = conversationIds.map(() => '?').join(',');

    const conversations = db.prepare(`
      SELECT id FROM conversations
      WHERE id IN (${placeholders})
      AND user_id = ?
    `).all(...conversationIds, req.user.id);

    if (conversations.length !== conversationIds.length) {
      return res.status(404).json({ error: 'Some conversations not found' });
    }

    // Use transaction for batch operation
    const saveDrafts = db.transaction((draftsList) => {
      const results = [];

      for (const draft of draftsList) {
        const { conversation_id, content } = draft;

        if (!conversation_id || content === undefined) {
          continue; // Skip invalid entries
        }

        // Check if draft exists
        const existing = db.prepare(`
          SELECT id FROM drafts
          WHERE user_id = ? AND conversation_id = ?
        `).get(req.user.id, conversation_id);

        if (existing) {
          // Update
          db.prepare(`
            UPDATE drafts
            SET content = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND conversation_id = ?
          `).run(content, req.user.id, conversation_id);

          results.push({ conversation_id, action: 'updated', id: existing.id });
        } else {
          // Insert
          const result = db.prepare(`
            INSERT INTO drafts (user_id, conversation_id, content)
            VALUES (?, ?, ?)
          `).run(req.user.id, conversation_id, content);

          results.push({ conversation_id, action: 'created', id: result.lastInsertRowid });
        }
      }

      return results;
    });

    const results = saveDrafts(drafts);

    res.json({
      message: 'Drafts saved',
      results
    });
  } catch (error) {
    console.error('Error batch saving drafts:', error);
    res.status(500).json({ error: 'Failed to batch save drafts' });
  }
});

// Clear all drafts for user
router.delete('/', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const result = db.prepare(`
      DELETE FROM drafts WHERE user_id = ?
    `).run(req.user.id);

    res.json({
      message: 'All drafts cleared',
      deleted_count: result.changes
    });
  } catch (error) {
    console.error('Error clearing drafts:', error);
    res.status(500).json({ error: 'Failed to clear drafts' });
  }
});

// Clean up old drafts (retention policy - drafts older than specified days)
router.post('/cleanup', authenticateToken, (req, res) => {
  try {
    const { days = 30 } = req.body;

    if (days < 1) {
      return res.status(400).json({ error: 'Days must be at least 1' });
    }

    const db = getDatabase();

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateStr = cutoffDate.toISOString();

    const result = db.prepare(`
      DELETE FROM drafts
      WHERE user_id = ? AND updated_at < ?
    `).run(req.user.id, cutoffDateStr);

    res.json({
      message: 'Old drafts cleaned up',
      deleted_count: result.changes,
      cutoff_date: cutoffDateStr
    });
  } catch (error) {
    console.error('Error cleaning up drafts:', error);
    res.status(500).json({ error: 'Failed to cleanup drafts' });
  }
});

export default router;
