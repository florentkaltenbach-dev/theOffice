// Written by: Roberto Silva - Backend Team Lead
// Enhanced by: Bobby Chen - Intern (with supervision)
// Reviewed by: Marcus Chen, Emma
// Status: Production-Ready

import { getDatabase } from './init.js';

/**
 * Comprehensive database migration system
 * Handles all schema updates for the 22-feature implementation
 * Migrations are idempotent - safe to run multiple times
 */
export function migrateDatabase() {
  const db = getDatabase();

  try {
    console.log('🔄 Starting database migration...');

    // Get current schema information
    const conversationsTableInfo = db.prepare("PRAGMA table_info(conversations)").all();
    const messagesTableInfo = db.prepare("PRAGMA table_info(messages)").all();

    const conversationsColumns = new Set(conversationsTableInfo.map(col => col.name));
    const messagesColumns = new Set(messagesTableInfo.map(col => col.name));

    // Track migrations applied
    let migrationsApplied = [];

    // Migration 1: Add archive support to conversations
    if (!conversationsColumns.has('archived')) {
      console.log('📦 Migration 1: Adding archive support...');
      db.exec(`
        ALTER TABLE conversations ADD COLUMN archived INTEGER DEFAULT 0;
        ALTER TABLE conversations ADD COLUMN archived_at DATETIME;
        CREATE INDEX IF NOT EXISTS idx_conversations_archived ON conversations(archived);
      `);
      migrationsApplied.push('archive_support');
    }

    // Migration 2: Add folder organization
    if (!conversationsColumns.has('folder')) {
      console.log('📂 Migration 2: Adding folder support...');
      db.exec(`
        ALTER TABLE conversations ADD COLUMN folder TEXT DEFAULT 'general';
        CREATE INDEX IF NOT EXISTS idx_conversations_folder ON conversations(folder);
      `);
      migrationsApplied.push('folder_support');
    }

    // Migration 3: Add tags support
    if (!conversationsColumns.has('tags')) {
      console.log('🏷️  Migration 3: Adding tags support...');
      db.exec(`
        ALTER TABLE conversations ADD COLUMN tags TEXT;
      `);
      migrationsApplied.push('tags_support');
    }

    // Migration 4: Add favorites support
    if (!conversationsColumns.has('favorited')) {
      console.log('⭐ Migration 4: Adding favorites support...');
      db.exec(`
        ALTER TABLE conversations ADD COLUMN favorited INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_conversations_favorited ON conversations(favorited);
      `);
      migrationsApplied.push('favorites_support');
    }

    // Migration 5: Add conversation branching support
    if (!conversationsColumns.has('parent_conversation_id')) {
      console.log('🌳 Migration 5: Adding branching support...');
      db.exec(`
        ALTER TABLE conversations ADD COLUMN parent_conversation_id TEXT;
        ALTER TABLE conversations ADD COLUMN branch_point_message_id TEXT;
        CREATE INDEX IF NOT EXISTS idx_conversations_parent ON conversations(parent_conversation_id);
      `);
      migrationsApplied.push('branching_support');
    }

    // Migration 6: Add message edit/delete tracking
    if (!messagesColumns.has('edited')) {
      console.log('✏️  Migration 6: Adding message edit/delete tracking...');
      db.exec(`
        ALTER TABLE messages ADD COLUMN edited INTEGER DEFAULT 0;
        ALTER TABLE messages ADD COLUMN edited_at DATETIME;
        ALTER TABLE messages ADD COLUMN deleted INTEGER DEFAULT 0;
        ALTER TABLE messages ADD COLUMN deleted_at DATETIME;
        CREATE INDEX IF NOT EXISTS idx_messages_deleted ON messages(deleted);
      `);
      migrationsApplied.push('message_edit_delete');
    }

    // Migration 7: Populate FTS index for existing messages
    const ftsCount = db.prepare("SELECT COUNT(*) as count FROM messages_fts").get();
    const messagesCount = db.prepare("SELECT COUNT(*) as count FROM messages WHERE deleted = 0").get();

    if (ftsCount.count < messagesCount.count) {
      console.log('🔍 Migration 7: Populating full-text search index...');

      // Clear and rebuild FTS index
      db.exec(`DELETE FROM messages_fts;`);

      // Insert all non-deleted messages into FTS
      const messages = db.prepare(`
        SELECT id, conversation_id, content
        FROM messages
        WHERE deleted = 0
      `).all();

      const insertStmt = db.prepare(`
        INSERT INTO messages_fts (message_id, conversation_id, content)
        VALUES (?, ?, ?)
      `);

      const insertMany = db.transaction((msgs) => {
        for (const msg of msgs) {
          insertStmt.run(msg.id, msg.conversation_id, msg.content);
        }
      });

      insertMany(messages);
      migrationsApplied.push('fts_population');
    }

    // Migration 8: Ensure all required tables exist (defensive check)
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all().map(t => t.name);

    const requiredTables = [
      'users', 'conversations', 'messages', 'workbench_items',
      'user_preferences', 'audit_logs', 'drafts', 'context_items', 'messages_fts'
    ];

    const missingTables = requiredTables.filter(t => !tables.includes(t));
    if (missingTables.length > 0) {
      console.warn(`⚠️  Warning: Missing tables detected: ${missingTables.join(', ')}`);
      console.warn('   Database may need re-initialization. Run initDatabase() first.');
    }

    // Summary
    if (migrationsApplied.length > 0) {
      console.log(`✅ Migrations complete: ${migrationsApplied.join(', ')}`);
    } else {
      console.log('✅ Database schema is up to date');
    }

    // Run VACUUM to optimize database after migrations
    if (migrationsApplied.length > 0) {
      console.log('🧹 Optimizing database...');
      db.exec('VACUUM;');
      db.exec('ANALYZE;');
    }

    return { success: true, migrationsApplied };

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}
