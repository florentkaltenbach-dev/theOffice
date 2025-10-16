# Nexus PWA Deployment Guide

**Written by:** Kevin O'Brien - DevOps Team
**Reviewed by:** Alexandra Morrison - CTO, Dmitri - Security, Roberto Silva
**Status:** Production-Ready
**Updated:** Using Claude Code CLI instances (modular architecture)

## Architecture Overview

```
[Mobile Browser] → [Caddy HTTPS] → [Express Backend] → [Process Manager]
                                          ↓                      ↓
                                   [SQLite Database]    [Claude CLI Instances]
                                                         ├─ Conversation 1
                                                         ├─ Conversation 2
                                                         └─ Conversation N
```

### Key Features:
- **No API Keys Required**: Uses your existing Claude Code authentication
- **Modular**: Each conversation spawns its own isolated Claude CLI instance
- **Scalable**: Multiple conversations run in parallel
- **Persistent**: All conversations and workbench data stored in SQLite

## Prerequisites

- Node.js 18.x or higher
- Claude Code CLI installed and authenticated (already set up on this server)
- Domain pointing to your server (nexus.kaltenbach.dev)
- Caddy web server installed

## Setup Instructions

### 1. Backend Configuration

Navigate to the backend directory:
```bash
cd /opt/theOffice/nexus-backend
```

Configure your environment:
```bash
cp .env.example .env
nano .env
```

**Required changes in `.env`:**
```bash
# Generate secure secrets (run these commands):
JWT_SECRET=$(openssl rand -base64 32)
SESSION_SECRET=$(openssl rand -base64 32)

# Update for production
NODE_ENV=production
ALLOWED_ORIGINS=https://nexus.kaltenbach.dev

# Optional: Change default admin credentials
DEFAULT_USERNAME=admin
DEFAULT_PASSWORD=your-secure-password
```

**Note:** No API key needed! The backend spawns Claude Code CLI instances using your existing authentication.

Install dependencies (already done):
```bash
npm install
```

### 2. Frontend Configuration

Navigate to the frontend directory:
```bash
cd /opt/theOffice/nexus-mobile
```

Update the API URL for production:
```bash
nano .env
```

Change to:
```bash
VITE_API_URL=https://nexus.kaltenbach.dev
```

Build the frontend (already done):
```bash
npm run build
```

### 3. DNS Configuration

Point your subdomain to this server:
```
nexus.kaltenbach.dev → A record → [your-server-ip]
```

Wait for DNS propagation (can take a few minutes to hours).

### 4. Start Services

#### Start the Backend (in a tmux/screen session or as a systemd service):

```bash
cd /opt/theOffice/nexus-backend
node server.js
```

**Or use PM2 (recommended):**
```bash
npm install -g pm2
pm2 start server.js --name nexus-backend
pm2 save
pm2 startup  # Follow the instructions
```

#### Start Caddy:

```bash
cd /opt/theOffice/nexus-mobile
sudo caddy start
```

Caddy will automatically obtain Let's Encrypt SSL certificates for nexus.kaltenbach.dev.

### 5. First Login

1. Open https://nexus.kaltenbach.dev in your browser
2. Default credentials:
   - Username: `admin`
   - Password: `changeme`

**⚠️  IMPORTANT: Change the password immediately after first login!**

Currently there's no UI for password change, so you need to use the API:
```bash
curl -X POST https://nexus.kaltenbach.dev/api/auth/change-password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"changeme","newPassword":"your-new-secure-password"}'
```

## Testing Locally

For local development without SSL:

1. Start backend:
```bash
cd /opt/theOffice/nexus-backend
npm run dev
```

2. Start frontend dev server:
```bash
cd /opt/theOffice/nexus-mobile
npm run dev
```

3. Access at http://localhost:5173

## Service Management

### Using PM2:

```bash
# Status
pm2 status

# Logs
pm2 logs nexus-backend

# Restart
pm2 restart nexus-backend

# Stop
pm2 stop nexus-backend
```

### Caddy:

```bash
# Reload configuration
sudo caddy reload --config /opt/theOffice/nexus-mobile/Caddyfile

# Stop
sudo caddy stop

# Logs
sudo journalctl -u caddy -f
```

## Security Checklist

- [x] HTTPS enabled via Caddy + Let's Encrypt
- [x] API key stored server-side only
- [x] JWT-based authentication
- [x] Bcrypt password hashing
- [x] CORS restrictions
- [x] Security headers (HSTS, X-Frame-Options, etc.)
- [ ] Change default admin password
- [ ] Regular security updates
- [ ] Database backups

## Workbench Feature

The workbench allows you to:
- **Upload files**: Share code, docs, or data with Nexus team
- **Create notes**: Keep context and requirements
- **Store context**: Maintain conversation history

Access via API endpoints:
- `GET /api/workbench/items` - List all items
- `POST /api/workbench/items` - Create new item
- `PUT /api/workbench/items/:id` - Update item
- `DELETE /api/workbench/items/:id` - Delete item

Example creating a note:
```bash
curl -X POST https://nexus.kaltenbach.dev/api/workbench/items \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "note",
    "title": "Project Requirements",
    "content": "Build a dashboard with real-time metrics..."
  }'
```

## Troubleshooting

### Backend won't start
- Check if port 3001 is available: `lsof -i :3001`
- Verify .env file exists and has API key
- Check logs: `pm2 logs nexus-backend`

### Frontend shows connection errors
- Verify backend is running
- Check CORS settings in backend .env
- Verify API_URL in frontend .env

### SSL certificate issues
- Ensure DNS is pointing to correct IP
- Check Caddy logs: `sudo journalctl -u caddy -f`
- Verify port 80 and 443 are open

### Can't login
- Check backend logs for auth errors
- Verify database was initialized: `ls /opt/theOffice/nexus-backend/data/`
- Reset admin password by manually editing database if needed

## Database Backup

```bash
# Backup
cp /opt/theOffice/nexus-backend/data/nexus.db ~/nexus-backup-$(date +%Y%m%d).db

# Restore
cp ~/nexus-backup-YYYYMMDD.db /opt/theOffice/nexus-backend/data/nexus.db
pm2 restart nexus-backend
```

## Contact

Built with ❤️ by Nexus Software Solutions

For issues, contact:
- DevOps: Kevin O'Brien
- Security: Dmitri
- Architecture: Marcus Chen
- CTO: Alexandra Morrison
