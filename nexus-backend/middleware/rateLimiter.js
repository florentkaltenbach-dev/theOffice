// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Dmitri (Security), Kevin O'Brien
// Status: Production-Ready

/**
 * Rate Limiting Middleware
 * Protects API from abuse by limiting request rates
 *
 * Features:
 * - Per-user and per-IP rate limiting
 * - Configurable windows and limits
 * - Different limits for different endpoint types
 * - Memory-efficient sliding window implementation
 */

// In-memory store for rate limit tracking
// In production, consider using Redis for distributed systems
const rateLimitStore = new Map();

// Cleanup interval (run every 60 seconds)
const CLEANUP_INTERVAL = 60000;

// Start cleanup timer
setInterval(() => {
  cleanupExpiredEntries();
}, CLEANUP_INTERVAL);

/**
 * Create rate limiter middleware
 */
export function rateLimit(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 60, // 60 requests per minute
    keyGenerator = defaultKeyGenerator,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    handler = defaultHandler
  } = options;

  return async (req, res, next) => {
    try {
      // Generate key for this request
      const key = keyGenerator(req);

      // Get or create rate limit entry
      let entry = rateLimitStore.get(key);

      if (!entry) {
        entry = {
          count: 0,
          resetAt: Date.now() + windowMs,
          requests: []
        };
        rateLimitStore.set(key, entry);
      }

      // Check if window has expired
      const now = Date.now();
      if (now >= entry.resetAt) {
        // Reset the window
        entry.count = 0;
        entry.resetAt = now + windowMs;
        entry.requests = [];
      }

      // Remove old requests outside window (sliding window)
      entry.requests = entry.requests.filter(timestamp => timestamp > now - windowMs);
      entry.count = entry.requests.length;

      // Check if limit exceeded
      if (entry.count >= maxRequests) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);

        res.setHeader('X-RateLimit-Limit', maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', entry.resetAt);
        res.setHeader('Retry-After', retryAfter);

        return handler(req, res, next);
      }

      // Add this request to the window
      entry.requests.push(now);
      entry.count = entry.requests.length;

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - entry.count);
      res.setHeader('X-RateLimit-Reset', entry.resetAt);

      // If configured, remove this request on success/failure
      if (skipSuccessfulRequests || skipFailedRequests) {
        const originalEnd = res.end;
        res.end = function(chunk, encoding) {
          res.end = originalEnd;
          res.end(chunk, encoding);

          const shouldSkip =
            (skipSuccessfulRequests && res.statusCode < 400) ||
            (skipFailedRequests && res.statusCode >= 400);

          if (shouldSkip && entry.requests.length > 0) {
            entry.requests.pop(); // Remove last request
            entry.count = entry.requests.length;
          }
        };
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // On error, allow request through (fail open)
      next();
    }
  };
}

/**
 * Default key generator - uses user ID or IP address
 */
function defaultKeyGenerator(req) {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
             req.headers['x-real-ip'] ||
             req.socket.remoteAddress;

  return `ip:${ip}`;
}

/**
 * Default handler for rate limit exceeded
 */
function defaultHandler(req, res, next) {
  return res.status(429).json({
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  });
}

/**
 * Cleanup expired entries from store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove if reset time has passed and no recent requests
    if (entry.resetAt < now && entry.requests.length === 0) {
      rateLimitStore.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired rate limit entries`);
  }
}

/**
 * Preset rate limiters for common use cases
 */

// Strict rate limit for auth endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 attempts
  keyGenerator: (req) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
               req.socket.remoteAddress;
    return `auth:${ip}`;
  },
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Too many authentication attempts',
      message: 'Please wait 15 minutes before trying again.',
      code: 'AUTH_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Moderate rate limit for API endpoints
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60 // 60 requests per minute
});

// Strict rate limit for message sending (to prevent spam)
export const messageRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20, // 20 messages per minute
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Message rate limit exceeded',
      message: 'You are sending messages too quickly. Please slow down.',
      code: 'MESSAGE_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Lenient rate limit for read operations
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
  skipSuccessfulRequests: true // Don't count successful GETs
});

// Strict rate limit for export operations (resource intensive)
export const exportRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 exports per hour
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Export rate limit exceeded',
      message: 'You have exceeded the hourly limit for exports. Please try again later.',
      code: 'EXPORT_RATE_LIMIT_EXCEEDED'
    });
  }
});

// Moderate rate limit for search operations
export const searchRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // 30 searches per minute
  handler: (req, res) => {
    return res.status(429).json({
      error: 'Search rate limit exceeded',
      message: 'You are searching too frequently. Please wait a moment.',
      code: 'SEARCH_RATE_LIMIT_EXCEEDED'
    });
  }
});

/**
 * Get rate limiting statistics
 */
export function getRateLimitStats() {
  const stats = {
    total_keys: rateLimitStore.size,
    by_type: {
      user: 0,
      ip: 0,
      auth: 0,
      other: 0
    },
    top_users: []
  };

  const userCounts = new Map();

  for (const [key, entry] of rateLimitStore.entries()) {
    // Categorize by key type
    if (key.startsWith('user:')) {
      stats.by_type.user++;
      const userId = key.split(':')[1];
      userCounts.set(userId, (userCounts.get(userId) || 0) + entry.count);
    } else if (key.startsWith('ip:')) {
      stats.by_type.ip++;
    } else if (key.startsWith('auth:')) {
      stats.by_type.auth++;
    } else {
      stats.by_type.other++;
    }
  }

  // Get top users by request count
  const sortedUsers = Array.from(userCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  stats.top_users = sortedUsers.map(([userId, count]) => ({
    user_id: userId,
    request_count: count
  }));

  stats.memory_usage_mb = (rateLimitStore.size * 300) / (1024 * 1024); // Rough estimate

  return stats;
}

/**
 * Clear all rate limit data (for testing or manual reset)
 */
export function clearAllRateLimits() {
  const count = rateLimitStore.size;
  rateLimitStore.clear();
  return { cleared: count };
}

/**
 * Clear rate limit for specific key
 */
export function clearRateLimit(key) {
  const existed = rateLimitStore.has(key);
  rateLimitStore.delete(key);
  return { cleared: existed };
}

/**
 * Get rate limit info for specific key
 */
export function getRateLimitInfo(key) {
  const entry = rateLimitStore.get(key);

  if (!entry) {
    return null;
  }

  const now = Date.now();
  const remaining = Math.max(0, entry.resetAt - now);

  return {
    key,
    count: entry.count,
    reset_at: entry.resetAt,
    remaining_ms: remaining,
    requests: entry.requests
  };
}

/**
 * Express route handler for rate limit stats
 * app.get('/api/admin/rate-limit-stats', authenticateToken, getRateLimitStatsHandler)
 */
export function getRateLimitStatsHandler(req, res) {
  try {
    const stats = getRateLimitStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching rate limit stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}

export default {
  rateLimit,
  authRateLimit,
  apiRateLimit,
  messageRateLimit,
  readRateLimit,
  exportRateLimit,
  searchRateLimit,
  getRateLimitStats,
  clearAllRateLimits,
  clearRateLimit,
  getRateLimitInfo,
  getRateLimitStatsHandler
};
