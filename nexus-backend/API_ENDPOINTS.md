# Nexus Backend API Endpoints Documentation

**Written by:** Roberto Silva - Backend Team Lead
**Status:** Production-Ready
**Date:** 2025-10-15

## Overview

Complete backend infrastructure for all 22 features of the Nexus Mobile PWA.

## Base URL

```
http://localhost:3001/api
```

---

## Authentication

All endpoints except `/auth/login` and `/auth/register` require authentication via Bearer token.

**Headers:**
```
Authorization: Bearer <jwt_token>
```

---

## Chat & Conversations API (`/api/chat`)

### Conversations

#### Get All Conversations
```
GET /api/chat/conversations
```
Returns list of conversations for authenticated user (excluding archived by default).

#### Get Conversation Messages
```
GET /api/chat/conversations/:id/messages
```
Returns conversation details and all non-deleted messages.

#### Create Conversation
```
POST /api/chat/conversations
Body: { "title": "New Request" }
```

#### Send Message (Streaming)
```
POST /api/chat/conversations/:id/messages
Body: { "content": "Your message" }
```
Server-Sent Events (SSE) streaming response from Claude.

#### Delete Conversation
```
DELETE /api/chat/conversations/:id
```
Permanently deletes conversation and stops Claude process.

#### Archive Conversation
```
POST /api/chat/conversations/:id/archive
```
Archives conversation and stops Claude process.

#### Unarchive Conversation
```
POST /api/chat/conversations/:id/unarchive
```

#### Rename Conversation
```
PATCH /api/chat/conversations/:id/rename
Body: { "title": "New Title" }
```

#### Move to Folder
```
PATCH /api/chat/conversations/:id/folder
Body: { "folder": "Projects" }
```

#### Update Tags
```
PATCH /api/chat/conversations/:id/tags
Body: { "tags": ["bug", "urgent"] }
```

#### Toggle Favorite
```
POST /api/chat/conversations/:id/favorite
```

#### Branch Conversation
```
POST /api/chat/conversations/:id/branch
Body: { "messageId": "msg_123", "title": "Branch Title" }
```
Creates new conversation from a branch point.

#### Get Folders
```
GET /api/chat/folders
```
Returns list of folders with conversation counts.

#### Get Tags
```
GET /api/chat/tags
```
Returns all unique tags used by user.

### Messages

#### Edit Message
```
PATCH /api/chat/messages/:id
Body: { "content": "Updated content" }
```
Updates message and FTS index.

#### Delete Message
```
DELETE /api/chat/messages/:id
```
Soft deletes message and removes from FTS index.

#### Retry Message
```
POST /api/chat/conversations/:id/messages/:messageId/retry
```
Regenerates response for a user message (SSE streaming).

### Export

#### Export as JSON
```
GET /api/chat/conversations/:id/export/json
```
Downloads conversation as JSON file.

#### Export as Markdown
```
GET /api/chat/conversations/:id/export/markdown
```
Downloads conversation as Markdown file.

### Search

#### Search Conversations & Messages
```
GET /api/chat/search?q=query&folder=Projects&favorited=true
```
Full-text search using SQLite FTS5.

---

## User Preferences API (`/api/preferences`)

#### Get Preferences
```
GET /api/preferences
```

#### Update Preferences
```
PATCH /api/preferences
Body: {
  "ai_personality": "professional" | "friendly" | "technical" | "creative",
  "theme": "light" | "dark" | "auto",
  "session_timeout": 3600,
  "auto_save_drafts": true,
  "enable_markdown": true,
  "enable_syntax_highlight": true,
  "custom": { "key": "value" }
}
```

#### Reset Preferences
```
POST /api/preferences/reset
```

#### Get Specific Preference
```
GET /api/preferences/:key
```

---

## Audit Logs API (`/api/audit`)

#### Get Audit Logs
```
GET /api/audit?limit=50&offset=0&action=create&resource_type=conversation&start_date=2025-01-01&end_date=2025-12-31
```

#### Get Audit Statistics
```
GET /api/audit/stats?days=30
```
Returns activity statistics by action, resource type, and daily breakdown.

#### Get Specific Log
```
GET /api/audit/:id
```

#### Create Audit Log (Manual)
```
POST /api/audit
Body: {
  "action": "custom_action",
  "resource_type": "conversation",
  "resource_id": "conv_123",
  "details": { "key": "value" }
}
```

#### Export Audit Logs
```
GET /api/audit/export/json?start_date=2025-01-01&end_date=2025-12-31
```

#### Cleanup Old Logs
```
DELETE /api/audit/cleanup
Body: { "days": 90 }
```
Deletes logs older than specified days (minimum 7).

---

## Context Awareness API (`/api/context`)

#### Get Context Items
```
GET /api/context?conversation_id=conv_123&type=file&active_only=true
```

#### Get Specific Item
```
GET /api/context/:id
```

#### Create Context Item
```
POST /api/context
Body: {
  "conversation_id": "conv_123",
  "type": "file" | "code" | "note" | "url" | "command" | "custom",
  "content": "Context content",
  "metadata": { "filename": "example.js" },
  "active": true
}
```

#### Update Context Item
```
PATCH /api/context/:id
Body: {
  "content": "Updated content",
  "metadata": {},
  "active": false
}
```

#### Toggle Active Status
```
POST /api/context/:id/toggle
```

#### Delete Context Item
```
DELETE /api/context/:id
```

#### Attach to Conversation
```
POST /api/context/:id/attach
Body: { "conversation_id": "conv_123" }
```

#### Detach from Conversation
```
POST /api/context/:id/detach
```
Makes context item global.

#### Get Context Summary
```
GET /api/context/summary/:conversation_id
```
Returns statistics about active context items.

#### Bulk Toggle
```
POST /api/context/bulk/toggle
Body: {
  "ids": [1, 2, 3],
  "active": true
}
```

---

## Drafts API (`/api/drafts`)

#### Get Draft for Conversation
```
GET /api/drafts/:conversation_id
```

#### Save/Update Draft
```
POST /api/drafts/:conversation_id
Body: { "content": "Draft content" }
```
Empty content clears the draft.

#### Delete Draft
```
DELETE /api/drafts/:conversation_id
```

#### Get All Drafts
```
GET /api/drafts
```

#### Get Draft Count
```
GET /api/drafts/count
```

#### Batch Save Drafts
```
POST /api/drafts/batch
Body: {
  "drafts": [
    { "conversation_id": "conv_1", "content": "Draft 1" },
    { "conversation_id": "conv_2", "content": "Draft 2" }
  ]
}
```

#### Clear All Drafts
```
DELETE /api/drafts
```

#### Cleanup Old Drafts
```
POST /api/drafts/cleanup
Body: { "days": 30 }
```

---

## Session Management

#### Get Session Status
```
GET /api/auth/session-status
```
Returns remaining session time and expiration info.

---

## Middleware Features

### 1. Rate Limiting

All endpoints are rate-limited:
- **Auth endpoints:** 5 attempts per 15 minutes
- **API endpoints:** 60 requests per minute
- **Message sending:** 20 messages per minute
- **Search:** 30 searches per minute
- **Exports:** 10 per hour

Rate limit headers included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1633024800000
Retry-After: 30
```

### 2. Audit Logging

All authenticated requests are automatically logged with:
- User ID
- Action type
- Resource type and ID
- IP address
- Request details
- Timestamp

### 3. Session Timeout

Sessions expire based on user preferences (default: 1 hour).
Session refreshes on non-GET requests.

### 4. Duplicate Prevention

Prevents duplicate POST/PUT/PATCH/DELETE requests within 5-second window.
Uses content hashing for detection.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Detailed error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "reason": "timeout" | "jwt_expired",
  "message": "Session expired message"
}
```

### 403 Forbidden
```json
{
  "error": "Invalid or expired token"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 409 Conflict
```json
{
  "error": "Duplicate request detected",
  "retry_after_ms": 2500
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests",
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "stack": "..." // Only in development
}
```

---

## Database Schema

### Tables Created
- `users` - User accounts
- `conversations` - Chat conversations with folders, tags, favorites
- `messages` - Messages with edit/delete tracking
- `workbench_items` - Workbench files and notes
- `user_preferences` - User settings
- `audit_logs` - Activity logs
- `drafts` - Auto-saved message drafts
- `context_items` - Context awareness data
- `messages_fts` - Full-text search index (SQLite FTS5)

### Indexes
All tables have appropriate indexes for optimal query performance.

---

## Migration System

Database schema is automatically migrated on server start.
Migrations are idempotent and safe to run multiple times.

Migration features:
- Archive support
- Folder organization
- Tags
- Favorites
- Conversation branching
- Message edit/delete tracking
- FTS index population

---

## Testing the API

### Using cURL

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

# Get conversations (with token)
curl http://localhost:3001/api/chat/conversations \
  -H "Authorization: Bearer YOUR_TOKEN"

# Search
curl "http://localhost:3001/api/chat/search?q=bug%20fix" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Next Steps for Integration

1. **Frontend Integration:**
   - Update API client to use new endpoints
   - Implement UI for new features
   - Handle streaming responses (SSE)

2. **Testing:**
   - Test all CRUD operations
   - Verify rate limiting behavior
   - Test search functionality
   - Validate export formats

3. **Security:**
   - Change default JWT_SECRET in production
   - Configure ALLOWED_ORIGINS
   - Review audit log retention policies

4. **Performance:**
   - Monitor rate limit statistics
   - Review audit log growth
   - Optimize FTS queries if needed

---

## Support

For issues or questions, contact:
- Roberto Silva (Backend Team Lead)
- Emma (Backend Team)
- Dmitri (Security Review)
