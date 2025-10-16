// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Marcus Chen, Sarah Williams
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Context Awareness API
 * Manages contextual information that can be attached to conversations
 * Supports files, code snippets, notes, and custom context types
 */

// Get all active context items
router.get('/', authenticateToken, (req, res) => {
  try {
    const { conversation_id, type, active_only = 'true' } = req.query;

    const db = getDatabase();

    let query = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (conversation_id) {
      query += ' AND (conversation_id = ? OR conversation_id IS NULL)';
      params.push(conversation_id);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    if (active_only === 'true') {
      query += ' AND active = 1';
    }

    const items = db.prepare(`
      SELECT
        id,
        conversation_id,
        type,
        content,
        metadata,
        active,
        created_at
      FROM context_items
      ${query}
      ORDER BY created_at DESC
    `).all(...params);

    // Parse JSON metadata
    const itemsWithParsedMetadata = items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null,
      active: !!item.active
    }));

    res.json(itemsWithParsedMetadata);
  } catch (error) {
    console.error('Error fetching context items:', error);
    res.status(500).json({ error: 'Failed to fetch context items' });
  }
});

// Get specific context item
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const item = db.prepare(`
      SELECT * FROM context_items
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    // Parse JSON metadata
    if (item.metadata) {
      item.metadata = JSON.parse(item.metadata);
    }

    item.active = !!item.active;

    res.json(item);
  } catch (error) {
    console.error('Error fetching context item:', error);
    res.status(500).json({ error: 'Failed to fetch context item' });
  }
});

// Create new context item
router.post('/', authenticateToken, (req, res) => {
  try {
    const { conversation_id, type, content, metadata, active = true } = req.body;

    // Validation
    if (!type || !content) {
      return res.status(400).json({ error: 'Type and content are required' });
    }

    const validTypes = ['file', 'code', 'note', 'url', 'command', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid context type',
        valid_types: validTypes
      });
    }

    const db = getDatabase();

    // If conversation_id provided, verify it belongs to user
    if (conversation_id) {
      const conversation = db.prepare(`
        SELECT * FROM conversations WHERE id = ? AND user_id = ?
      `).get(conversation_id, req.user.id);

      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }
    }

    const result = db.prepare(`
      INSERT INTO context_items (
        user_id,
        conversation_id,
        type,
        content,
        metadata,
        active
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      conversation_id || null,
      type,
      content,
      metadata ? JSON.stringify(metadata) : null,
      active ? 1 : 0
    );

    res.status(201).json({
      message: 'Context item created',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating context item:', error);
    res.status(500).json({ error: 'Failed to create context item' });
  }
});

// Update context item
router.patch('/:id', authenticateToken, (req, res) => {
  try {
    const { content, metadata, active } = req.body;

    const db = getDatabase();

    // Verify item belongs to user
    const item = db.prepare(`
      SELECT * FROM context_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    // Build update query
    const updates = [];
    const params = [];

    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }

    if (metadata !== undefined) {
      updates.push('metadata = ?');
      params.push(metadata ? JSON.stringify(metadata) : null);
    }

    if (active !== undefined) {
      updates.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(req.params.id);

    db.prepare(`
      UPDATE context_items
      SET ${updates.join(', ')}
      WHERE id = ?
    `).run(...params);

    res.json({ message: 'Context item updated' });
  } catch (error) {
    console.error('Error updating context item:', error);
    res.status(500).json({ error: 'Failed to update context item' });
  }
});

// Toggle context item active status
router.post('/:id/toggle', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify item belongs to user
    const item = db.prepare(`
      SELECT * FROM context_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    const newActiveStatus = item.active ? 0 : 1;

    db.prepare(`
      UPDATE context_items SET active = ? WHERE id = ?
    `).run(newActiveStatus, req.params.id);

    res.json({
      message: newActiveStatus ? 'Context item activated' : 'Context item deactivated',
      active: !!newActiveStatus
    });
  } catch (error) {
    console.error('Error toggling context item:', error);
    res.status(500).json({ error: 'Failed to toggle context item' });
  }
});

// Delete context item
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify item belongs to user
    const item = db.prepare(`
      SELECT * FROM context_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    db.prepare(`
      DELETE FROM context_items WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Context item deleted' });
  } catch (error) {
    console.error('Error deleting context item:', error);
    res.status(500).json({ error: 'Failed to delete context item' });
  }
});

// Attach context item to conversation
router.post('/:id/attach', authenticateToken, (req, res) => {
  try {
    const { conversation_id } = req.body;

    if (!conversation_id) {
      return res.status(400).json({ error: 'Conversation ID required' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(conversation_id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify context item belongs to user
    const item = db.prepare(`
      SELECT * FROM context_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    // Attach to conversation
    db.prepare(`
      UPDATE context_items
      SET conversation_id = ?
      WHERE id = ?
    `).run(conversation_id, req.params.id);

    res.json({ message: 'Context item attached to conversation' });
  } catch (error) {
    console.error('Error attaching context item:', error);
    res.status(500).json({ error: 'Failed to attach context item' });
  }
});

// Detach context item from conversation (make it global)
router.post('/:id/detach', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify context item belongs to user
    const item = db.prepare(`
      SELECT * FROM context_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Context item not found' });
    }

    // Detach from conversation
    db.prepare(`
      UPDATE context_items
      SET conversation_id = NULL
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Context item detached from conversation' });
  } catch (error) {
    console.error('Error detaching context item:', error);
    res.status(500).json({ error: 'Failed to detach context item' });
  }
});

// Get context summary for a conversation
router.get('/summary/:conversation_id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.conversation_id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all active context items for this conversation and global items
    const items = db.prepare(`
      SELECT type, COUNT(*) as count, SUM(LENGTH(content)) as total_size
      FROM context_items
      WHERE user_id = ?
      AND (conversation_id = ? OR conversation_id IS NULL)
      AND active = 1
      GROUP BY type
    `).all(req.user.id, req.params.conversation_id);

    const totalItems = items.reduce((sum, item) => sum + item.count, 0);
    const totalSize = items.reduce((sum, item) => sum + item.total_size, 0);

    res.json({
      conversation_id: req.params.conversation_id,
      total_items: totalItems,
      total_size_bytes: totalSize,
      by_type: items
    });
  } catch (error) {
    console.error('Error fetching context summary:', error);
    res.status(500).json({ error: 'Failed to fetch context summary' });
  }
});

// Bulk activate/deactivate context items
router.post('/bulk/toggle', authenticateToken, (req, res) => {
  try {
    const { ids, active } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'IDs array required' });
    }

    if (active === undefined) {
      return res.status(400).json({ error: 'Active status required' });
    }

    const db = getDatabase();

    // Verify all items belong to user
    const placeholders = ids.map(() => '?').join(',');
    const items = db.prepare(`
      SELECT id FROM context_items
      WHERE id IN (${placeholders})
      AND user_id = ?
    `).all(...ids, req.user.id);

    if (items.length !== ids.length) {
      return res.status(404).json({ error: 'Some context items not found' });
    }

    // Update all items
    db.prepare(`
      UPDATE context_items
      SET active = ?
      WHERE id IN (${placeholders})
      AND user_id = ?
    `).run(active ? 1 : 0, ...ids, req.user.id);

    res.json({
      message: 'Context items updated',
      count: ids.length
    });
  } catch (error) {
    console.error('Error bulk toggling context items:', error);
    res.status(500).json({ error: 'Failed to toggle context items' });
  }
});

export default router;
