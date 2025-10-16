// Written by: Lin - Frontend Team
// Reviewed by: Sarah Williams
// Status: Production-Ready

/**
 * Generates a UUID v4 string
 * Uses crypto.randomUUID if available (HTTPS/secure context)
 * Falls back to manual implementation for HTTP or older browsers
 */
export function generateUUID(): string {
  // Try native crypto.randomUUID first (secure contexts only)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch (e) {
      // Fall through to manual implementation
    }
  }

  // Fallback: Manual UUID v4 generation
  // Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
