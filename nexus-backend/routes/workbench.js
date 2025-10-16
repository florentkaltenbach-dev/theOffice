// Written by: David - Backend Team
// Reviewed by: Roberto Silva
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all workbench items for user
router.get('/items', authenticateToken, (req, res) => {
  try {
    const { type } = req.query; // Optional filter by type

    const db = getDatabase();
    let query = 'SELECT * FROM workbench_items WHERE user_id = ?';
    const params = [req.user.id];

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY updated_at DESC';

    const items = db.prepare(query).all(...params);

    // Parse metadata JSON
    const itemsWithMetadata = items.map(item => ({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    }));

    res.json(itemsWithMetadata);
  } catch (error) {
    console.error('Error fetching workbench items:', error);
    res.status(500).json({ error: 'Failed to fetch workbench items' });
  }
});

// Get single workbench item
router.get('/items/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const item = db.prepare(`
      SELECT * FROM workbench_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    });
  } catch (error) {
    console.error('Error fetching workbench item:', error);
    res.status(500).json({ error: 'Failed to fetch item' });
  }
});

// Create workbench item
router.post('/items', authenticateToken, (req, res) => {
  try {
    const { type, title, content, metadata } = req.body;

    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }

    const validTypes = ['file', 'note', 'context'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Must be: file, note, or context' });
    }

    const db = getDatabase();
    const result = db.prepare(`
      INSERT INTO workbench_items (user_id, type, title, content, metadata)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      type,
      title,
      content || '',
      metadata ? JSON.stringify(metadata) : null
    );

    const item = db.prepare('SELECT * FROM workbench_items WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      ...item,
      metadata: item.metadata ? JSON.parse(item.metadata) : null
    });
  } catch (error) {
    console.error('Error creating workbench item:', error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Update workbench item
router.put('/items/:id', authenticateToken, (req, res) => {
  try {
    const { title, content, metadata } = req.body;

    const db = getDatabase();

    // Verify item belongs to user
    const item = db.prepare(`
      SELECT * FROM workbench_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare(`
      UPDATE workbench_items
      SET title = ?, content = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      title !== undefined ? title : item.title,
      content !== undefined ? content : item.content,
      metadata ? JSON.stringify(metadata) : item.metadata,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM workbench_items WHERE id = ?').get(req.params.id);

    res.json({
      ...updated,
      metadata: updated.metadata ? JSON.parse(updated.metadata) : null
    });
  } catch (error) {
    console.error('Error updating workbench item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete workbench item
router.delete('/items/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify item belongs to user
    const item = db.prepare(`
      SELECT * FROM workbench_items WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    db.prepare('DELETE FROM workbench_items WHERE id = ?').run(req.params.id);

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting workbench item:', error);
    res.status(500).json({ error: 'Failed to delete item' });
  }
});

// Get workbench statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const stats = {
      files: db.prepare('SELECT COUNT(*) as count FROM workbench_items WHERE user_id = ? AND type = ?')
        .get(req.user.id, 'file').count,
      notes: db.prepare('SELECT COUNT(*) as count FROM workbench_items WHERE user_id = ? AND type = ?')
        .get(req.user.id, 'note').count,
      contexts: db.prepare('SELECT COUNT(*) as count FROM workbench_items WHERE user_id = ? AND type = ?')
        .get(req.user.id, 'context').count,
      totalConversations: db.prepare('SELECT COUNT(*) as count FROM conversations WHERE user_id = ?')
        .get(req.user.id).count
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

export default router;
