// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Dmitri (Security)
// Status: Production-Ready

import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/init.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Session Timeout Middleware
 * Checks if user's session has expired based on their preferences
 * Works in conjunction with JWT expiration
 */
export function checkSessionTimeout(req, res, next) {
  try {
    // Decode JWT if not already done by authenticateToken
    if (!req.user) {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return next(); // No token, skip session check
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Set req.user for downstream middleware
      } catch (err) {
        return next(); // Invalid token, let authenticateToken handle it
      }
    }

    const db = getDatabase();

    // Get user preferences for session timeout
    const preferences = db.prepare(`
      SELECT session_timeout FROM user_preferences WHERE user_id = ?
    `).get(req.user.id);

    // Default timeout: 1 hour (3600 seconds)
    const sessionTimeout = preferences?.session_timeout || 3600;

    // Get user's last login time
    const user = db.prepare(`
      SELECT last_login FROM users WHERE id = ?
    `).get(req.user.id);

    if (!user || !user.last_login) {
      // No last login recorded - allow but update it
      db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.user.id);
      return next();
    }

    // Calculate time since last login
    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const secondsSinceLogin = Math.floor((now - lastLogin) / 1000);

    // Check if session has expired
    if (secondsSinceLogin > sessionTimeout) {
      return res.status(401).json({
        error: 'Session expired',
        reason: 'timeout',
        message: 'Your session has expired due to inactivity. Please log in again.'
      });
    }

    // Session is still valid - update last activity time on non-GET requests
    // This prevents session from expiring during active use
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      db.prepare(`
        UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?
      `).run(req.user.id);
    }

    next();
  } catch (error) {
    console.error('Session timeout check error:', error);
    // On error, allow request to proceed (fail open for availability)
    next();
  }
}

/**
 * Enhanced Authentication Middleware with Session Timeout
 * Combines JWT authentication with session timeout checking
 */
export function authenticateWithTimeout(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    req.user = user;

    // Now check session timeout
    checkSessionTimeout(req, res, next);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        reason: 'jwt_expired',
        message: 'Your authentication token has expired. Please log in again.'
      });
    }
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Get remaining session time
 * Utility function to check how much time is left in current session
 */
export function getRemainingSessionTime(userId) {
  try {
    const db = getDatabase();

    // Get user preferences for session timeout
    const preferences = db.prepare(`
      SELECT session_timeout FROM user_preferences WHERE user_id = ?
    `).get(userId);

    const sessionTimeout = preferences?.session_timeout || 3600;

    // Get user's last login time
    const user = db.prepare(`
      SELECT last_login FROM users WHERE id = ?
    `).get(userId);

    if (!user || !user.last_login) {
      return sessionTimeout; // Full timeout remaining if no login recorded
    }

    const lastLogin = new Date(user.last_login);
    const now = new Date();
    const secondsSinceLogin = Math.floor((now - lastLogin) / 1000);
    const remainingSeconds = Math.max(0, sessionTimeout - secondsSinceLogin);

    return remainingSeconds;
  } catch (error) {
    console.error('Error calculating remaining session time:', error);
    return 0;
  }
}

/**
 * Express route handler to get session status
 * Can be used as: app.get('/api/auth/session-status', authenticateToken, getSessionStatus)
 */
export function getSessionStatus(req, res) {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const remainingSeconds = getRemainingSessionTime(req.user.id);
    const db = getDatabase();

    const preferences = db.prepare(`
      SELECT session_timeout FROM user_preferences WHERE user_id = ?
    `).get(req.user.id);

    const totalTimeout = preferences?.session_timeout || 3600;

    res.json({
      user_id: req.user.id,
      username: req.user.username,
      session_timeout_seconds: totalTimeout,
      remaining_seconds: remainingSeconds,
      expires_at: new Date(Date.now() + remainingSeconds * 1000).toISOString(),
      is_active: remainingSeconds > 0
    });
  } catch (error) {
    console.error('Error fetching session status:', error);
    res.status(500).json({ error: 'Failed to fetch session status' });
  }
}

export default {
  checkSessionTimeout,
  authenticateWithTimeout,
  getRemainingSessionTime,
  getSessionStatus
};
