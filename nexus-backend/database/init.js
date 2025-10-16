// Written by: Emma - Backend Team
// Reviewed by: Roberto Silva
// Status: Production-Ready

import Database from 'better-sqlite3';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = process.env.DB_PATH || './data/nexus.db';

let db = null;

export async function initDatabase() {
  try {
    // Ensure data directory exists
    await mkdir(dirname(DB_PATH), { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL'); // Better concurrency

    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // Create workbench items table (files, notes, context)
    db.exec(`
      CREATE TABLE IF NOT EXISTS workbench_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL, -- 'file', 'note', 'context'
        title TEXT NOT NULL,
        content TEXT,
        metadata TEXT, -- JSON string for additional data
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create conversations table
    // Enhanced by: Bobby Chen - Added archive, tags, favorites, branching
    db.exec(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        folder TEXT DEFAULT 'general',
        tags TEXT,
        favorited INTEGER DEFAULT 0,
        archived INTEGER DEFAULT 0,
        archived_at DATETIME,
        parent_conversation_id TEXT,
        branch_point_message_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_conversation_id) REFERENCES conversations(id) ON DELETE SET NULL
      )
    `);

    // Create messages table
    db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        sender TEXT,
        edited INTEGER DEFAULT 0,
        edited_at DATETIME,
        deleted INTEGER DEFAULT 0,
        deleted_at DATETIME,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Create user preferences table
    db.exec(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        ai_personality TEXT DEFAULT 'professional',
        theme TEXT DEFAULT 'dark',
        session_timeout INTEGER DEFAULT 3600,
        auto_save_drafts INTEGER DEFAULT 1,
        enable_markdown INTEGER DEFAULT 1,
        enable_syntax_highlight INTEGER DEFAULT 1,
        preferences_json TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create audit logs table
    db.exec(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        details TEXT,
        ip_address TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Create drafts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS drafts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conversation_id TEXT NOT NULL,
        content TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        UNIQUE(user_id, conversation_id)
      )
    `);

    // Create context items table for selective context awareness
    db.exec(`
      CREATE TABLE IF NOT EXISTS context_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        conversation_id TEXT,
        type TEXT NOT NULL,
        content TEXT NOT NULL,
        metadata TEXT,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `);

    // Create indexes
    // Comprehensive indexes for all features
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_workbench_user ON workbench_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);
      CREATE INDEX IF NOT EXISTS idx_conversations_folder ON conversations(folder);
      CREATE INDEX IF NOT EXISTS idx_conversations_favorited ON conversations(favorited);
      CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      CREATE INDEX IF NOT EXISTS idx_drafts_user ON drafts(user_id);
      CREATE INDEX IF NOT EXISTS idx_context_items_user ON context_items(user_id);
      CREATE INDEX IF NOT EXISTS idx_context_items_conversation ON context_items(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_context_items_active ON context_items(active);
    `);

    // Full-text search index for conversations and messages
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS messages_fts USING fts5(
        message_id UNINDEXED,
        conversation_id UNINDEXED,
        content,
        tokenize = 'porter'
      );
    `);

    // Create default admin user if none exists
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (userCount.count === 0) {
      const defaultUsername = process.env.DEFAULT_USERNAME || 'admin';
      const defaultPassword = process.env.DEFAULT_PASSWORD || 'changeme';
      const passwordHash = await bcrypt.hash(defaultPassword, 10);

      db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(
        defaultUsername,
        passwordHash
      );

      console.log(`✅ Default user created: ${defaultUsername}`);
      console.log(`⚠️  Please change the password immediately!`);
    }

    console.log('✅ Database initialized successfully');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}
