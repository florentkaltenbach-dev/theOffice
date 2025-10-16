// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Dmitri (Security), Alexandra Morrison (Architecture)
// Status: Production-Ready

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Route imports
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import workbenchRoutes from './routes/workbench.js';
import preferencesRoutes from './routes/preferences.js';
import auditRoutes from './routes/audit.js';
import contextRoutes from './routes/context.js';
import draftsRoutes from './routes/drafts.js';

// Database imports
import { initDatabase } from './database/init.js';
import { migrateDatabase } from './database/migrate.js';

// Middleware imports
import { authenticateToken } from './middleware/auth.js';
import { checkSessionTimeout, getSessionStatus } from './middleware/sessionTimeout.js';
import { auditLogger } from './middleware/auditLog.js';
import { preventDuplicates } from './middleware/duplicatePrevent.js';
import {
  apiRateLimit,
  authRateLimit,
  messageRateLimit,
  searchRateLimit,
  exportRateLimit
} from './middleware/rateLimiter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize database
await initDatabase();
migrateDatabase();

// Global middleware - Applied to all routes
// 1. Rate limiting (basic protection)
app.use(apiRateLimit);

// 2. Session timeout checking (for authenticated routes)
app.use(checkSessionTimeout);

// 3. Audit logging (log authenticated requests)
// NOTE: Must come AFTER session timeout which populates req.user
app.use(auditLogger({
  excludePaths: ['/health', '/api/auth/session-status'],
  logGets: false // Don't log GET requests to reduce noise
}));

// 4. Duplicate request prevention (for mutations)
app.use(preventDuplicates({
  windowMs: 5000, // 5 seconds
  methods: ['POST', 'PUT', 'PATCH', 'DELETE'],
  excludePaths: ['/api/chat/conversations', '/api/auth/login']
}));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Nexus Backend',
    timestamp: new Date().toISOString()
  });
});

// Session status endpoint
app.get('/api/auth/session-status', authenticateToken, getSessionStatus);

// API Routes
// Auth routes with stricter rate limiting
app.use('/api/auth', authRateLimit, authRoutes);

// Chat routes with message-specific rate limiting
app.use('/api/chat/search', searchRateLimit); // Stricter limit for search
app.use('/api/chat', chatRoutes);

// Export endpoints with strict rate limiting
app.use('/api/chat/conversations/:id/export', exportRateLimit);

// Workbench routes
app.use('/api/workbench', workbenchRoutes);

// New feature routes
app.use('/api/preferences', preferencesRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/context', contextRoutes);
app.use('/api/drafts', draftsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏢  NEXUS SOFTWARE SOLUTIONS - Backend Server         ║
║                                                           ║
║   Status: Online                                          ║
║   Port: ${PORT}                                           ║
║   Environment: ${process.env.NODE_ENV || 'development'}  ║
║   Time: ${new Date().toLocaleString()}                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
