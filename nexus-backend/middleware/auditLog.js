// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Dmitri (Security), Alexandra Morrison
// Status: Production-Ready

import { getDatabase } from '../database/init.js';

/**
 * Automatic Audit Logging Middleware
 * Logs all authenticated API requests for security and compliance
 *
 * Logs include:
 * - User actions (CRUD operations)
 * - Resource access
 * - IP addresses
 * - Timestamps
 */

/**
 * Main audit logging middleware
 * Automatically logs requests after they complete
 */
export function auditLogger(options = {}) {
  const {
    excludePaths = ['/health', '/api/auth/session-status'],
    excludeMethods = ['GET', 'HEAD', 'OPTIONS'],
    logGets = false // Set to true to log GET requests
  } = options;

  return (req, res, next) => {
    // Skip if user is not authenticated
    if (!req.user) {
      return next();
    }

    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip excluded methods (unless explicitly enabled for GETs)
    if (!logGets && excludeMethods.includes(req.method)) {
      return next();
    }

    // Capture the original end function
    const originalEnd = res.end;
    const startTime = Date.now();

    // Override res.end to log after response
    res.end = function(chunk, encoding) {
      res.end = originalEnd;
      res.end(chunk, encoding);

      // Log the request asynchronously (don't block response)
      setImmediate(() => {
        try {
          logAuditEntry(req, res, Date.now() - startTime);
        } catch (error) {
          console.error('Audit logging error:', error);
        }
      });
    };

    next();
  };
}

/**
 * Log audit entry to database
 */
function logAuditEntry(req, res, duration) {
  try {
    const db = getDatabase();

    // Determine action based on method and path
    const action = determineAction(req);

    // Extract resource information
    const { resource_type, resource_id } = extractResourceInfo(req);

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.socket.remoteAddress;

    // Build details object
    const details = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: duration,
      user_agent: req.headers['user-agent']
    };

    // Add query params if present (excluding sensitive data)
    if (req.query && Object.keys(req.query).length > 0) {
      const sanitizedQuery = { ...req.query };
      delete sanitizedQuery.password;
      delete sanitizedQuery.token;
      details.query = sanitizedQuery;
    }

    // Add body summary for POST/PUT/PATCH (excluding sensitive data)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitizedBody = { ...req.body };
      delete sanitizedBody.password;
      delete sanitizedBody.password_hash;
      delete sanitizedBody.token;

      // Truncate long content
      if (sanitizedBody.content && sanitizedBody.content.length > 100) {
        sanitizedBody.content = sanitizedBody.content.substring(0, 100) + '...';
      }

      details.body = sanitizedBody;
    }

    // Only log successful operations and meaningful errors
    // Skip logging 404s on resource reads to reduce noise
    if (res.statusCode === 404 && req.method === 'GET') {
      return;
    }

    // Insert audit log
    db.prepare(`
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
      resource_type,
      resource_id,
      JSON.stringify(details),
      ipAddress
    );

  } catch (error) {
    console.error('Failed to log audit entry:', error);
    // Don't throw - audit logging failures shouldn't break the app
  }
}

/**
 * Determine action name from request
 */
function determineAction(req) {
  const method = req.method;
  const path = req.path;

  // Special actions
  if (path.includes('/login')) return 'login';
  if (path.includes('/logout')) return 'logout';
  if (path.includes('/archive')) return 'archive';
  if (path.includes('/unarchive')) return 'unarchive';
  if (path.includes('/export')) return 'export';
  if (path.includes('/branch')) return 'branch';
  if (path.includes('/favorite')) return 'favorite';
  if (path.includes('/search')) return 'search';

  // CRUD actions
  switch (method) {
    case 'POST':
      return 'create';
    case 'GET':
      return 'read';
    case 'PUT':
    case 'PATCH':
      return 'update';
    case 'DELETE':
      return 'delete';
    default:
      return 'unknown';
  }
}

/**
 * Extract resource type and ID from request path
 */
function extractResourceInfo(req) {
  const path = req.path;

  // Common patterns
  const patterns = [
    { regex: /\/conversations\/([^\/]+)/, type: 'conversation' },
    { regex: /\/messages\/([^\/]+)/, type: 'message' },
    { regex: /\/workbench\/([^\/]+)/, type: 'workbench_item' },
    { regex: /\/context\/([^\/]+)/, type: 'context_item' },
    { regex: /\/drafts\/([^\/]+)/, type: 'draft' },
    { regex: /\/preferences/, type: 'preferences' },
    { regex: /\/audit/, type: 'audit_log' }
  ];

  for (const pattern of patterns) {
    const match = path.match(pattern.regex);
    if (match) {
      return {
        resource_type: pattern.type,
        resource_id: match[1] !== undefined ? match[1] : null
      };
    }
  }

  // Generic fallback
  const parts = path.split('/').filter(p => p.length > 0);
  if (parts.length >= 2) {
    return {
      resource_type: parts[parts.length - 2],
      resource_id: parts[parts.length - 1]
    };
  }

  return {
    resource_type: null,
    resource_id: null
  };
}

/**
 * Manual audit logging function
 * For use in specific places where you want explicit audit logs
 */
export function logAudit(userId, action, resourceType, resourceId, details, ipAddress) {
  try {
    const db = getDatabase();

    db.prepare(`
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
      userId,
      action,
      resourceType || null,
      resourceId || null,
      details ? JSON.stringify(details) : null,
      ipAddress || null
    );
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

/**
 * Middleware to log specific sensitive operations
 * Use this for operations that should always be logged
 */
export function requireAuditLog(action, resourceType) {
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    // Extract resource ID from params if available
    const resourceId = req.params.id || req.params.conversation_id || null;

    // Get IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                      req.headers['x-real-ip'] ||
                      req.socket.remoteAddress;

    // Log the operation
    const details = {
      method: req.method,
      path: req.path,
      timestamp: new Date().toISOString()
    };

    logAudit(req.user.id, action, resourceType, resourceId, details, ipAddress);

    next();
  };
}

export default {
  auditLogger,
  logAudit,
  requireAuditLog
};
