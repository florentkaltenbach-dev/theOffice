// Written by: Bobby Chen - Software Engineering Intern
// Reviewed by: Dmitri (Security), Roberto Silva (Backend Lead)
// Status: Production-Ready
//
// Duplicate Message Prevention - Because nobody wants to accidentally send the same thing twice!
// This prevents users from spamming the same message if they double-click the send button.

import crypto from 'crypto';

/**
 * DUPLICATE MESSAGE PREVENTION MIDDLEWARE
 * ========================================
 *
 * How it works:
 * 1. Hash the message content + user ID + conversation ID
 * 2. Store the hash in memory with a TTL (Time To Live)
 * 3. If same hash comes in within TTL, reject with 409 Conflict
 * 4. Clean up old hashes periodically to prevent memory bloat
 *
 * Why in-memory instead of database?
 * - Speed! We need to respond quickly
 * - Temporary data - no need to persist
 * - Auto-cleanup with TTL
 *
 * Edge Cases I'm Handling:
 * - What if user WANTS to send the same message? (Short TTL of 5 seconds)
 * - What if server restarts? (In-memory cache is lost, but that's OK)
 * - What if memory fills up? (LRU-style cleanup, max 10,000 entries)
 */

class DuplicateMessageChecker {
  constructor() {
    // Store hashes with timestamps: Map<hash, timestamp>
    this.recentMessages = new Map();

    // Configuration
    this.TTL_MS = 5000;          // 5 seconds - short enough to allow intentional duplicates
    this.MAX_ENTRIES = 10000;    // Maximum cache size
    this.CLEANUP_INTERVAL = 60000; // Clean up every 60 seconds

    // Start periodic cleanup
    this.startCleanup();

    console.log('✅ Bobby\'s Duplicate Message Checker initialized');
  }

  /**
   * Generate a hash for a message
   *
   * @param {number} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @returns {string} SHA256 hash
   */
  generateHash(userId, conversationId, content) {
    // Include user, conversation, and content in hash
    // This way, same message in different conversations is OK
    const data = `${userId}:${conversationId}:${content}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if a message is a duplicate
   *
   * @param {number} userId - User ID
   * @param {string} conversationId - Conversation ID
   * @param {string} content - Message content
   * @returns {boolean} True if duplicate, false if unique
   */
  isDuplicate(userId, conversationId, content) {
    const hash = this.generateHash(userId, conversationId, content);
    const now = Date.now();

    // Check if we've seen this message recently
    if (this.recentMessages.has(hash)) {
      const timestamp = this.recentMessages.get(hash);

      // If within TTL, it's a duplicate
      if (now - timestamp < this.TTL_MS) {
        console.log(`⚠️ Duplicate message detected (hash: ${hash.substring(0, 8)}...) - Bobby`);
        return true;
      }

      // If TTL expired, remove old entry
      this.recentMessages.delete(hash);
    }

    // Not a duplicate - store this hash
    this.recentMessages.set(hash, now);

    // If cache is getting too large, remove oldest entries
    if (this.recentMessages.size > this.MAX_ENTRIES) {
      this.trimCache();
    }

    return false;
  }

  /**
   * Trim cache to prevent memory bloat
   * Removes oldest 10% of entries
   */
  trimCache() {
    const entriesToRemove = Math.floor(this.recentMessages.size * 0.1);
    const entries = Array.from(this.recentMessages.entries());

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1] - b[1]);

    // Remove oldest entries
    for (let i = 0; i < entriesToRemove; i++) {
      this.recentMessages.delete(entries[i][0]);
    }

    console.log(`🧹 Bobby cleaned up ${entriesToRemove} old message hashes`);
  }

  /**
   * Periodic cleanup of expired entries
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [hash, timestamp] of this.recentMessages.entries()) {
      if (now - timestamp > this.TTL_MS) {
        this.recentMessages.delete(hash);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`🧹 Bobby's cleanup: Removed ${removed} expired hashes, ${this.recentMessages.size} remaining`);
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop periodic cleanup (for graceful shutdown)
   */
  stopCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get statistics about the cache
   *
   * @returns {Object} Cache statistics
   */
  getStats() {
    return {
      totalHashes: this.recentMessages.size,
      maxEntries: this.MAX_ENTRIES,
      ttlMs: this.TTL_MS,
      utilizationPercent: (this.recentMessages.size / this.MAX_ENTRIES) * 100
    };
  }

  /**
   * Clear all cached hashes (for testing or manual reset)
   */
  clear() {
    const count = this.recentMessages.size;
    this.recentMessages.clear();
    console.log(`🗑️ Bobby cleared ${count} message hashes`);
  }
}

// Create singleton instance
const duplicateChecker = new DuplicateMessageChecker();

/**
 * Express middleware to check for duplicate messages
 *
 * Usage:
 * router.post('/conversations/:id/messages', authenticateToken, checkDuplicate, async (req, res) => {
 *   // Handle message...
 * });
 */
export function checkDuplicate(req, res, next) {
  // Only check for message creation endpoints
  const { content } = req.body;
  const conversationId = req.params.id;
  const userId = req.user?.id;

  if (!content || !conversationId || !userId) {
    // If we don't have all required data, skip the check
    return next();
  }

  // Check if this is a duplicate
  if (duplicateChecker.isDuplicate(userId, conversationId, content)) {
    return res.status(409).json({
      error: 'Duplicate message detected',
      message: 'This message was recently sent. Please wait a moment before sending it again.',
      retryAfter: Math.ceil(duplicateChecker.TTL_MS / 1000) // Seconds
    });
  }

  // Not a duplicate, proceed
  next();
}

// Export the checker instance for testing/monitoring
export { duplicateChecker };
