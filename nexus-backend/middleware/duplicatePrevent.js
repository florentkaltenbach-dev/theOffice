// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Emma, Dmitri
// Status: Production-Ready

import crypto from 'crypto';

/**
 * Duplicate Request Prevention Middleware
 * Prevents duplicate form submissions and API calls using hash-based detection
 *
 * How it works:
 * 1. Creates a hash of request content (body + user + path)
 * 2. Stores hashes in memory with expiration
 * 3. Rejects duplicate requests within the time window
 *
 * Useful for preventing:
 * - Double-clicks on submit buttons
 * - Network retry storms
 * - Accidental duplicate API calls
 */

// In-memory store for request hashes
// In production, consider using Redis for distributed systems
const requestHashes = new Map();

// Cleanup interval (run every 60 seconds)
const CLEANUP_INTERVAL = 60000;

// Start cleanup timer
setInterval(() => {
  cleanupExpiredHashes();
}, CLEANUP_INTERVAL);

/**
 * Main duplicate prevention middleware
 */
export function preventDuplicates(options = {}) {
  const {
    windowMs = 5000, // Default: 5 seconds
    methods = ['POST', 'PUT', 'PATCH', 'DELETE'],
    excludePaths = [],
    hashBody = true,
    hashQuery = false,
    hashHeaders = []
  } = options;

  return (req, res, next) => {
    // Only apply to specified methods
    if (!methods.includes(req.method)) {
      return next();
    }

    // Skip excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Skip if user is not authenticated (can't track duplicates reliably)
    if (!req.user) {
      return next();
    }

    try {
      // Generate request hash
      const requestHash = generateRequestHash(req, {
        hashBody,
        hashQuery,
        hashHeaders
      });

      // Check if this request was recently seen
      const existingRequest = requestHashes.get(requestHash);

      if (existingRequest) {
        const now = Date.now();
        const age = now - existingRequest.timestamp;

        // If within window, reject as duplicate
        if (age < windowMs) {
          return res.status(409).json({
            error: 'Duplicate request detected',
            message: 'This request was already processed recently. Please wait a moment before trying again.',
            retry_after_ms: windowMs - age
          });
        }

        // Expired, remove and allow
        requestHashes.delete(requestHash);
      }

      // Store this request hash
      requestHashes.set(requestHash, {
        timestamp: Date.now(),
        expiresAt: Date.now() + windowMs,
        userId: req.user.id,
        path: req.path,
        method: req.method
      });

      // Continue processing
      next();

    } catch (error) {
      console.error('Duplicate prevention error:', error);
      // On error, allow request through (fail open)
      next();
    }
  };
}

/**
 * Generate hash for request
 */
function generateRequestHash(req, options) {
  const hashComponents = [];

  // Always include user ID and path
  hashComponents.push(req.user.id.toString());
  hashComponents.push(req.method);
  hashComponents.push(req.path);

  // Include body if requested
  if (options.hashBody && req.body) {
    // Sanitize body - remove timestamps and IDs that might change
    const sanitizedBody = sanitizeForHash(req.body);
    hashComponents.push(JSON.stringify(sanitizedBody));
  }

  // Include query if requested
  if (options.hashQuery && req.query) {
    hashComponents.push(JSON.stringify(req.query));
  }

  // Include specific headers if requested
  if (options.hashHeaders && options.hashHeaders.length > 0) {
    options.hashHeaders.forEach(header => {
      if (req.headers[header]) {
        hashComponents.push(req.headers[header]);
      }
    });
  }

  // Create hash
  const hashString = hashComponents.join('|');
  return crypto.createHash('sha256').update(hashString).digest('hex');
}

/**
 * Sanitize object for hashing
 * Remove fields that naturally change between requests
 */
function sanitizeForHash(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = Array.isArray(obj) ? [] : {};
  const excludeKeys = ['timestamp', 'created_at', 'updated_at', 'id', 'nonce'];

  for (const [key, value] of Object.entries(obj)) {
    if (excludeKeys.includes(key)) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeForHash(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Clean up expired request hashes
 */
function cleanupExpiredHashes() {
  const now = Date.now();
  let removed = 0;

  for (const [hash, data] of requestHashes.entries()) {
    if (data.expiresAt < now) {
      requestHashes.delete(hash);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired request hashes`);
  }
}

/**
 * Get statistics about duplicate prevention
 */
export function getDuplicatePreventionStats() {
  const now = Date.now();
  let active = 0;
  let expired = 0;

  for (const [, data] of requestHashes.entries()) {
    if (data.expiresAt >= now) {
      active++;
    } else {
      expired++;
    }
  }

  return {
    total_hashes: requestHashes.size,
    active_hashes: active,
    expired_hashes: expired,
    memory_usage_mb: (requestHashes.size * 200) / (1024 * 1024) // Rough estimate
  };
}

/**
 * Clear all stored hashes (for testing or manual reset)
 */
export function clearAllHashes() {
  const count = requestHashes.size;
  requestHashes.clear();
  return { cleared: count };
}

/**
 * Express route handler to get duplicate prevention stats
 * app.get('/api/admin/duplicate-prevention-stats', authenticateToken, getDuplicatePreventionStatsHandler)
 */
export function getDuplicatePreventionStatsHandler(req, res) {
  try {
    const stats = getDuplicatePreventionStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching duplicate prevention stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

/**
 * Idempotency key middleware (alternative approach)
 * Client provides an idempotency key in header
 */
export function idempotencyKey(options = {}) {
  const {
    windowMs = 300000, // 5 minutes
    headerName = 'idempotency-key'
  } = options;

  return (req, res, next) => {
    // Only apply to mutation methods
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers[headerName];

    if (!idempotencyKey) {
      // No key provided, proceed normally
      return next();
    }

    // Check if we've seen this key before
    const cacheKey = `idem:${req.user?.id || 'anon'}:${idempotencyKey}`;
    const cached = requestHashes.get(cacheKey);

    if (cached) {
      const now = Date.now();
      const age = now - cached.timestamp;

      if (age < windowMs) {
        // Return cached response if available
        if (cached.response) {
          return res.status(cached.status || 200).json(cached.response);
        }

        // Request is being processed
        return res.status(409).json({
          error: 'Request already in progress',
          message: 'A request with this idempotency key is currently being processed.'
        });
      }

      // Expired, remove and allow
      requestHashes.delete(cacheKey);
    }

    // Mark as in progress
    requestHashes.set(cacheKey, {
      timestamp: Date.now(),
      expiresAt: Date.now() + windowMs,
      userId: req.user?.id,
      status: 'processing'
    });

    // Capture response
    const originalJson = res.json.bind(res);
    res.json = function(data) {
      // Cache the successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        requestHashes.set(cacheKey, {
          timestamp: Date.now(),
          expiresAt: Date.now() + windowMs,
          userId: req.user?.id,
          status: res.statusCode,
          response: data
        });
      }

      return originalJson(data);
    };

    next();
  };
}

export default {
  preventDuplicates,
  idempotencyKey,
  getDuplicatePreventionStats,
  clearAllHashes,
  getDuplicatePreventionStatsHandler
};
