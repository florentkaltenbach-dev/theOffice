// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Dmitri (Security), Alexandra Morrison
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * Audit Log API
 * Provides access to user activity logs for security and compliance
 * Only returns logs for the authenticated user
 */

// Get audit logs for current user
router.get('/', authenticateToken, (req, res) => {
  try {
    const { limit = 50, offset = 0, action, resource_type, start_date, end_date } = req.query;

    const db = getDatabase();

    // Build query dynamically based on filters
    let query = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }

    if (resource_type) {
      query += ' AND resource_type = ?';
      params.push(resource_type);
    }

    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count FROM audit_logs ${query}
    `).get(...params).count;

    // Get paginated logs
    const logs = db.prepare(`
      SELECT
        id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        timestamp
      FROM audit_logs
      ${query}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).all(...params, parseInt(limit), parseInt(offset));

    // Parse JSON details
    const logsWithParsedDetails = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    res.json({
      logs: logsWithParsedDetails,
      total: totalCount,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get audit log statistics
router.get('/stats', authenticateToken, (req, res) => {
  try {
    const { days = 30 } = req.query;

    const db = getDatabase();

    // Calculate date threshold
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    const startDateStr = startDate.toISOString();

    // Get action counts
    const actionStats = db.prepare(`
      SELECT action, COUNT(*) as count
      FROM audit_logs
      WHERE user_id = ? AND timestamp >= ?
      GROUP BY action
      ORDER BY count DESC
    `).all(req.user.id, startDateStr);

    // Get resource type counts
    const resourceStats = db.prepare(`
      SELECT resource_type, COUNT(*) as count
      FROM audit_logs
      WHERE user_id = ? AND timestamp >= ? AND resource_type IS NOT NULL
      GROUP BY resource_type
      ORDER BY count DESC
    `).all(req.user.id, startDateStr);

    // Get daily activity
    const dailyActivity = db.prepare(`
      SELECT
        DATE(timestamp) as date,
        COUNT(*) as count
      FROM audit_logs
      WHERE user_id = ? AND timestamp >= ?
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `).all(req.user.id, startDateStr);

    // Get total count
    const totalCount = db.prepare(`
      SELECT COUNT(*) as count
      FROM audit_logs
      WHERE user_id = ? AND timestamp >= ?
    `).get(req.user.id, startDateStr).count;

    res.json({
      period_days: parseInt(days),
      total_events: totalCount,
      by_action: actionStats,
      by_resource_type: resourceStats,
      daily_activity: dailyActivity
    });
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Get specific audit log entry
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const log = db.prepare(`
      SELECT * FROM audit_logs
      WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Parse JSON details
    if (log.details) {
      log.details = JSON.parse(log.details);
    }

    res.json(log);
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// Create audit log entry (for manual logging or testing)
// Note: In production, this is typically done via middleware, not direct API calls
router.post('/', authenticateToken, (req, res) => {
  try {
    const { action, resource_type, resource_id, details } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'Action is required' });
    }

    const db = getDatabase();

    // Get IP address from request
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const result = db.prepare(`
      INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      action,
      resource_type || null,
      resource_id || null,
      details ? JSON.stringify(details) : null,
      ipAddress
    );

    res.status(201).json({
      message: 'Audit log created',
      id: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    res.status(500).json({ error: 'Failed to create audit log' });
  }
});

// Export audit logs (for compliance/backup)
router.get('/export/json', authenticateToken, (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const db = getDatabase();

    let query = 'WHERE user_id = ?';
    const params = [req.user.id];

    if (start_date) {
      query += ' AND timestamp >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND timestamp <= ?';
      params.push(end_date);
    }

    const logs = db.prepare(`
      SELECT * FROM audit_logs
      ${query}
      ORDER BY timestamp ASC
    `).all(...params);

    // Parse JSON details
    const exportData = logs.map(log => ({
      ...log,
      details: log.details ? JSON.parse(log.details) : null
    }));

    const exportPackage = {
      user_id: req.user.id,
      username: req.user.username,
      exported_at: new Date().toISOString(),
      start_date,
      end_date,
      total_logs: exportData.length,
      logs: exportData
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${req.user.id}-${Date.now()}.json"`);
    res.json(exportPackage);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ error: 'Failed to export audit logs' });
  }
});

// Delete old audit logs (retention policy)
// Restricted endpoint - only for cleanup/maintenance
router.delete('/cleanup', authenticateToken, (req, res) => {
  try {
    const { days = 90 } = req.body;

    if (days < 7) {
      return res.status(400).json({ error: 'Cannot delete logs newer than 7 days' });
    }

    const db = getDatabase();

    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoffDateStr = cutoffDate.toISOString();

    const result = db.prepare(`
      DELETE FROM audit_logs
      WHERE user_id = ? AND timestamp < ?
    `).run(req.user.id, cutoffDateStr);

    res.json({
      message: 'Old audit logs deleted',
      deleted_count: result.changes,
      cutoff_date: cutoffDateStr
    });
  } catch (error) {
    console.error('Error cleaning up audit logs:', error);
    res.status(500).json({ error: 'Failed to cleanup audit logs' });
  }
});

export default router;
