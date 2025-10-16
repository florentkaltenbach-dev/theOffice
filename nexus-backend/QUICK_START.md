# Backend Quick Start Guide

**Roberto Silva - Backend Team Lead**
**Date:** October 15, 2025

---

## What's Been Implemented

Complete backend infrastructure for all 22 features:

### ✅ Core Features
1. Conversation management (CRUD)
2. Message sending with Claude (streaming SSE)
3. Archive/unarchive conversations
4. Folder organization
5. Tag management
6. Favorite conversations
7. Full-text search (SQLite FTS5)
8. Export (JSON and Markdown)
9. Conversation branching
10. Message editing
11. Message deletion (soft)
12. Retry failed messages

### ✅ User Features
13. User preferences (AI personality, theme, timeouts, etc.)
14. Session management with configurable timeouts
15. Draft auto-save
16. Context awareness (files, code snippets, notes)

### ✅ System Features
17. Audit logging (automatic + manual)
18. Rate limiting (per-user and per-IP)
19. Duplicate request prevention
20. Security headers
21. CORS protection
22. Comprehensive error handling

---

## File Structure

```
nexus-backend/
├── server.js                    # Main server (ENHANCED)
├── database/
│   ├── init.js                  # Database initialization
│   └── migrate.js               # Schema migrations (ENHANCED)
├── routes/
│   ├── auth.js                  # Authentication
│   ├── chat.js                  # Chat/conversations (ENHANCED - 30KB)
│   ├── workbench.js             # Workbench items
│   ├── preferences.js           # User preferences (NEW)
│   ├── audit.js                 # Audit logs (NEW)
│   ├── context.js               # Context awareness (NEW)
│   └── drafts.js                # Draft auto-save (NEW)
├── middleware/
│   ├── auth.js                  # JWT authentication
│   ├── sessionTimeout.js        # Session expiry (NEW)
│   ├── auditLog.js              # Auto logging (NEW)
│   ├── duplicatePrevent.js      # Duplicate detection (NEW)
│   └── rateLimiter.js           # Rate limiting (NEW)
└── lib/
    └── claudeProcessManager.js  # Claude CLI integration

Documentation:
├── API_ENDPOINTS.md             # Complete API reference (NEW)
├── IMPLEMENTATION_REPORT.md     # Detailed implementation report (NEW)
└── QUICK_START.md              # This file (NEW)
```

---

## Starting the Server

```bash
cd /opt/theOffice/nexus-backend
npm install  # If not already installed
node server.js
```

Expected output:
```
✅ Database initialized successfully
🔄 Starting database migration...
✅ Database schema is up to date
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏢  NEXUS SOFTWARE SOLUTIONS - Backend Server         ║
║                                                           ║
║   Status: Online                                          ║
║   Port: 3001                                              ║
║   Environment: development                                ║
║   Time: ...                                               ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

---

## Testing the Implementation

### 1. Health Check
```bash
curl http://localhost:3001/health
```

Expected:
```json
{
  "status": "healthy",
  "service": "Nexus Backend",
  "timestamp": "2025-10-15T..."
}
```

### 2. Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'
```

Expected:
```json
{
  "token": "eyJhbGc...",
  "user": { "id": 1, "username": "admin" }
}
```

### 3. Get Conversations
```bash
TOKEN="<your_token_here>"
curl http://localhost:3001/api/chat/conversations \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Get Preferences
```bash
curl http://localhost:3001/api/preferences \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Search
```bash
curl "http://localhost:3001/api/chat/search?q=test" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Get Folders
```bash
curl http://localhost:3001/api/chat/folders \
  -H "Authorization: Bearer $TOKEN"
```

### 7. Get Audit Logs
```bash
curl http://localhost:3001/api/audit \
  -H "Authorization: Bearer $TOKEN"
```

---

## Key API Endpoints Summary

### Conversations
- `GET /api/chat/conversations` - List conversations
- `POST /api/chat/conversations` - Create new
- `POST /api/chat/conversations/:id/archive` - Archive
- `PATCH /api/chat/conversations/:id/rename` - Rename
- `PATCH /api/chat/conversations/:id/folder` - Move to folder
- `PATCH /api/chat/conversations/:id/tags` - Update tags
- `POST /api/chat/conversations/:id/favorite` - Toggle favorite
- `POST /api/chat/conversations/:id/branch` - Branch conversation
- `GET /api/chat/conversations/:id/export/json` - Export JSON
- `GET /api/chat/conversations/:id/export/markdown` - Export MD

### Messages
- `GET /api/chat/conversations/:id/messages` - Get messages
- `POST /api/chat/conversations/:id/messages` - Send message (SSE)
- `PATCH /api/chat/messages/:id` - Edit message
- `DELETE /api/chat/messages/:id` - Delete message
- `POST /api/chat/conversations/:id/messages/:mid/retry` - Retry

### Search & Organization
- `GET /api/chat/search?q=query` - Full-text search
- `GET /api/chat/folders` - List folders
- `GET /api/chat/tags` - List tags

### User Features
- `GET /api/preferences` - Get preferences
- `PATCH /api/preferences` - Update preferences
- `GET /api/drafts/:conversation_id` - Get draft
- `POST /api/drafts/:conversation_id` - Save draft
- `GET /api/context` - List context items
- `POST /api/context` - Add context

### System
- `GET /api/audit` - Get audit logs
- `GET /api/audit/stats` - Get statistics
- `GET /api/auth/session-status` - Check session

---

## Rate Limits

Default rate limits (per user):
- **Auth endpoints:** 5 attempts per 15 minutes
- **API endpoints:** 60 requests per minute
- **Messages:** 20 per minute
- **Search:** 30 per minute
- **Exports:** 10 per hour

Rate limit headers in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1633024800000
```

---

## Common Issues & Solutions

### Issue: Port already in use
```
Error: listen EADDRINUSE: address already in use 0.0.0.0:3001
```

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 node server.js
```

### Issue: Database locked
```
Error: database is locked
```

**Solution:**
- Stop all server instances
- Check for `-wal` and `-shm` files
- Restart server

### Issue: JWT token invalid
```
{"error": "Invalid or expired token"}
```

**Solution:**
- Login again to get new token
- Check JWT_SECRET hasn't changed
- Verify token in Authorization header: `Bearer <token>`

---

## Database Management

### View Database
```bash
sqlite3 data/nexus.db

# Useful commands:
.tables                    # List tables
.schema conversations      # View table schema
SELECT COUNT(*) FROM messages;
```

### Backup Database
```bash
cp data/nexus.db data/nexus-backup-$(date +%Y%m%d).db
```

### Reset Database
```bash
rm data/nexus.db
node server.js  # Will recreate and migrate
```

---

## Environment Variables

Create `.env` file:
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=dev-secret-change-in-production
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
DB_PATH=./data/nexus.db
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=changeme
```

**⚠️ IMPORTANT:** Change JWT_SECRET and DEFAULT_PASSWORD in production!

---

## Development Tips

### Watch Mode
```bash
npm install -g nodemon
nodemon server.js
```

### Debug Mode
```bash
NODE_ENV=development node --inspect server.js
```

### Check Logs
All errors logged to console. Audit logs in database:
```sql
SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 10;
```

---

## Next Steps

1. **Frontend Integration:**
   - Update API client with new endpoints
   - Implement UI for new features
   - Test streaming responses

2. **Testing:**
   - Run integration tests
   - Load test rate limiting
   - Validate search accuracy

3. **Production Prep:**
   - Change default credentials
   - Configure environment variables
   - Set up monitoring
   - Enable HTTPS

4. **Documentation:**
   - See `API_ENDPOINTS.md` for complete API reference
   - See `IMPLEMENTATION_REPORT.md` for technical details

---

## Support

For questions or issues:
- **Backend:** Roberto Silva (Backend Team Lead)
- **Security:** Dmitri (Security Team)
- **Database:** Emma (Backend Team)

---

## Quick Reference Card

```bash
# Start server
node server.js

# Test health
curl http://localhost:3001/health

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"changeme"}'

# Use API (replace TOKEN)
curl http://localhost:3001/api/chat/conversations \
  -H "Authorization: Bearer TOKEN"

# Search
curl "http://localhost:3001/api/chat/search?q=query" \
  -H "Authorization: Bearer TOKEN"

# Export conversation
curl http://localhost:3001/api/chat/conversations/CONV_ID/export/json \
  -H "Authorization: Bearer TOKEN" > conversation.json
```

---

**Status:** Ready for Integration ✅
**Last Updated:** October 15, 2025
