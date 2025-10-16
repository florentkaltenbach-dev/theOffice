// Written by: Roberto Silva - Backend Team Lead
// Reviewed by: Marcus Chen, Alexandra Morrison, Kevin O'Brien
// Status: Production-Ready

import express from 'express';
import { getDatabase } from '../database/init.js';
import { authenticateToken } from '../middleware/auth.js';
import { claudeProcessManager } from '../lib/claudeProcessManager.js';

const router = express.Router();

// Get all conversations for user
router.get('/conversations', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    const conversations = db.prepare(`
      SELECT id, title, created_at, updated_at
      FROM conversations
      WHERE user_id = ?
      ORDER BY updated_at DESC
    `).all(req.user.id);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a conversation
router.get('/conversations/:id/messages', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = db.prepare(`
      SELECT id, role, content, sender, timestamp
      FROM messages
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `).all(req.params.id);

    res.json({ conversation, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message (streaming response via Claude CLI)
router.post('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Message content required' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Store user message
    const userMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, timestamp)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userMessageId, req.params.id, 'user', content);

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get or create Claude process for this conversation
      const claudeProcess = await claudeProcessManager.getOrCreateProcess(req.params.id);

      // Listen for messages from Claude
      const messageHandler = (message) => {
        if (message.type === 'text') {
          fullResponse += message.content;
          res.write(`data: ${JSON.stringify({ type: 'text', content: message.content })}\n\n`);
        } else if (message.type === 'content_block_delta' && message.delta?.type === 'text_delta') {
          // Handle streaming text deltas
          const text = message.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
        } else if (message.type === 'message_stop') {
          // Message complete
          cleanup();

          // Store assistant response
          db.prepare(`
            INSERT INTO messages (id, conversation_id, role, content, sender, timestamp)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(assistantMessageId, req.params.id, 'nexus', fullResponse, 'Nexus Team');

          // Update conversation timestamp
          db.prepare(`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).run(req.params.id);

          res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMessageId })}\n\n`);
          res.end();
        } else if (message.type === 'error') {
          cleanup();
          console.error('Claude error:', message);
          res.write(`data: ${JSON.stringify({ type: 'error', error: message.error })}\n\n`);
          res.end();
        }
      };

      const errorHandler = (error) => {
        cleanup();
        console.error('Claude process error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Claude process error' })}\n\n`);
        res.end();
      };

      const cleanup = () => {
        claudeProcess.removeListener('message', messageHandler);
        claudeProcess.removeListener('error', errorHandler);
      };

      claudeProcess.on('message', messageHandler);
      claudeProcess.on('error', errorHandler);

      // Send the message to Claude
      claudeProcess.sendMessage(content);

      // Handle client disconnect
      req.on('close', () => {
        cleanup();
      });

    } catch (processError) {
      console.error('Claude process error:', processError);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to communicate with Claude' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Error sending message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  }
});

// Create new conversation
router.post('/conversations', authenticateToken, (req, res) => {
  try {
    const { title } = req.body;
    const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const db = getDatabase();
    db.prepare(`
      INSERT INTO conversations (id, user_id, title, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(conversationId, req.user.id, title || 'New Request');

    const conversation = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conversationId);

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// Delete conversation
router.delete('/conversations/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Stop the Claude process if running
    claudeProcessManager.stopProcess(req.params.id);

    db.prepare('DELETE FROM conversations WHERE id = ?').run(req.params.id);

    res.json({ message: 'Conversation deleted' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Archive conversation
router.post('/conversations/:id/archive', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Stop the Claude process if running (archived conversations shouldn't have active processes)
    claudeProcessManager.stopProcess(req.params.id);

    // Archive the conversation
    db.prepare(`
      UPDATE conversations
      SET archived = 1, archived_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Conversation archived successfully' });
  } catch (error) {
    console.error('Error archiving conversation:', error);
    res.status(500).json({ error: 'Failed to archive conversation' });
  }
});

// Unarchive conversation
router.post('/conversations/:id/unarchive', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Unarchive the conversation
    db.prepare(`
      UPDATE conversations
      SET archived = 0, archived_at = NULL
      WHERE id = ?
    `).run(req.params.id);

    res.json({ message: 'Conversation unarchived successfully' });
  } catch (error) {
    console.error('Error unarchiving conversation:', error);
    res.status(500).json({ error: 'Failed to unarchive conversation' });
  }
});

// Rename conversation
router.patch('/conversations/:id/rename', authenticateToken, (req, res) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Valid title required' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Update title
    db.prepare(`
      UPDATE conversations SET title = ? WHERE id = ?
    `).run(title.trim(), req.params.id);

    res.json({ message: 'Conversation renamed successfully', title: title.trim() });
  } catch (error) {
    console.error('Error renaming conversation:', error);
    res.status(500).json({ error: 'Failed to rename conversation' });
  }
});

// Move conversation to folder
router.patch('/conversations/:id/folder', authenticateToken, (req, res) => {
  try {
    const { folder } = req.body;

    if (!folder || typeof folder !== 'string') {
      return res.status(400).json({ error: 'Folder name required' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Update folder
    db.prepare(`
      UPDATE conversations SET folder = ? WHERE id = ?
    `).run(folder, req.params.id);

    res.json({ message: 'Conversation moved to folder', folder });
  } catch (error) {
    console.error('Error moving conversation to folder:', error);
    res.status(500).json({ error: 'Failed to move conversation' });
  }
});

// Update conversation tags
router.patch('/conversations/:id/tags', authenticateToken, (req, res) => {
  try {
    const { tags } = req.body;

    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags must be an array' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Store tags as JSON string
    const tagsJson = JSON.stringify(tags);
    db.prepare(`
      UPDATE conversations SET tags = ? WHERE id = ?
    `).run(tagsJson, req.params.id);

    res.json({ message: 'Tags updated successfully', tags });
  } catch (error) {
    console.error('Error updating tags:', error);
    res.status(500).json({ error: 'Failed to update tags' });
  }
});

// Toggle favorite
router.post('/conversations/:id/favorite', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Toggle favorite status
    const newFavoritedStatus = conversation.favorited ? 0 : 1;
    db.prepare(`
      UPDATE conversations SET favorited = ? WHERE id = ?
    `).run(newFavoritedStatus, req.params.id);

    res.json({
      message: newFavoritedStatus ? 'Added to favorites' : 'Removed from favorites',
      favorited: newFavoritedStatus
    });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// Export conversation as JSON
router.get('/conversations/:id/export/json', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all non-deleted messages
    const messages = db.prepare(`
      SELECT id, role, content, sender, edited, edited_at, timestamp
      FROM messages
      WHERE conversation_id = ? AND deleted = 0
      ORDER BY timestamp ASC
    `).all(req.params.id);

    // Build export object
    const exportData = {
      conversation: {
        id: conversation.id,
        title: conversation.title,
        folder: conversation.folder,
        tags: conversation.tags ? JSON.parse(conversation.tags) : [],
        created_at: conversation.created_at,
        updated_at: conversation.updated_at
      },
      messages: messages.map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        sender: msg.sender,
        edited: !!msg.edited,
        edited_at: msg.edited_at,
        timestamp: msg.timestamp
      })),
      exported_at: new Date().toISOString()
    };

    // Set appropriate headers for download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation.id}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting conversation as JSON:', error);
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

// Export conversation as Markdown
router.get('/conversations/:id/export/markdown', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get all non-deleted messages
    const messages = db.prepare(`
      SELECT id, role, content, sender, edited, timestamp
      FROM messages
      WHERE conversation_id = ? AND deleted = 0
      ORDER BY timestamp ASC
    `).all(req.params.id);

    // Build markdown content
    let markdown = `# ${conversation.title}\n\n`;
    markdown += `**Created:** ${conversation.created_at}\n`;
    markdown += `**Updated:** ${conversation.updated_at}\n`;

    if (conversation.folder) {
      markdown += `**Folder:** ${conversation.folder}\n`;
    }

    if (conversation.tags) {
      const tags = JSON.parse(conversation.tags);
      if (tags.length > 0) {
        markdown += `**Tags:** ${tags.join(', ')}\n`;
      }
    }

    markdown += `\n---\n\n`;

    // Add messages
    messages.forEach(msg => {
      const sender = msg.sender || (msg.role === 'user' ? 'You' : 'Assistant');
      markdown += `## ${sender}\n`;
      markdown += `*${msg.timestamp}*${msg.edited ? ' *(edited)*' : ''}\n\n`;
      markdown += `${msg.content}\n\n`;
      markdown += `---\n\n`;
    });

    markdown += `\n*Exported: ${new Date().toISOString()}*\n`;

    // Set appropriate headers for download
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversation.title.replace(/[^a-z0-9]/gi, '-')}.md"`);
    res.send(markdown);
  } catch (error) {
    console.error('Error exporting conversation as Markdown:', error);
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

// Edit a message
router.patch('/messages/:id', authenticateToken, (req, res) => {
  try {
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return res.status(400).json({ error: 'Valid content required' });
    }

    const db = getDatabase();

    // Get message and verify it belongs to user's conversation
    const message = db.prepare(`
      SELECT m.*, c.user_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this message' });
    }

    if (message.deleted) {
      return res.status(400).json({ error: 'Cannot edit deleted message' });
    }

    // Update message content
    db.prepare(`
      UPDATE messages
      SET content = ?, edited = 1, edited_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(content.trim(), req.params.id);

    // Update FTS index
    db.prepare(`
      UPDATE messages_fts
      SET content = ?
      WHERE message_id = ?
    `).run(content.trim(), req.params.id);

    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ error: 'Failed to edit message' });
  }
});

// Delete a message (soft delete)
router.delete('/messages/:id', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    // Get message and verify it belongs to user's conversation
    const message = db.prepare(`
      SELECT m.*, c.user_id
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      WHERE m.id = ?
    `).get(req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (message.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Soft delete the message
    db.prepare(`
      UPDATE messages
      SET deleted = 1, deleted_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(req.params.id);

    // Remove from FTS index
    db.prepare(`
      DELETE FROM messages_fts WHERE message_id = ?
    `).run(req.params.id);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// Search conversations and messages
router.get('/search', authenticateToken, (req, res) => {
  try {
    const { q, folder, tags, favorited } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const db = getDatabase();

    // Search using FTS5
    const searchQuery = q.trim();

    // Build conversation filter
    let conversationFilter = 'WHERE c.user_id = ?';
    const filterParams = [req.user.id];

    if (folder) {
      conversationFilter += ' AND c.folder = ?';
      filterParams.push(folder);
    }

    if (favorited === 'true') {
      conversationFilter += ' AND c.favorited = 1';
    }

    // Search in messages using FTS
    let results = db.prepare(`
      SELECT
        m.id as message_id,
        m.content,
        m.timestamp,
        c.id as conversation_id,
        c.title,
        c.folder,
        c.favorited,
        snippet(messages_fts, 2, '<mark>', '</mark>', '...', 32) as snippet
      FROM messages_fts
      JOIN messages m ON messages_fts.message_id = m.id
      JOIN conversations c ON m.conversation_id = c.id
      ${conversationFilter}
      AND messages_fts MATCH ?
      AND m.deleted = 0
      AND c.archived = 0
      ORDER BY rank
      LIMIT 50
    `).all(...filterParams, searchQuery);

    // Also search in conversation titles
    const titleResults = db.prepare(`
      SELECT
        id as conversation_id,
        title,
        folder,
        favorited,
        created_at,
        updated_at
      FROM conversations
      ${conversationFilter}
      AND title LIKE ?
      AND archived = 0
      LIMIT 20
    `).all(...filterParams, `%${searchQuery}%`);

    res.json({
      messages: results,
      conversations: titleResults,
      query: searchQuery
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Branch conversation from a specific message
router.post('/conversations/:id/branch', authenticateToken, (req, res) => {
  try {
    const { messageId, title } = req.body;

    if (!messageId) {
      return res.status(400).json({ error: 'Message ID required for branching' });
    }

    const db = getDatabase();

    // Verify conversation belongs to user
    const parentConversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!parentConversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Verify message exists in conversation
    const branchMessage = db.prepare(`
      SELECT * FROM messages WHERE id = ? AND conversation_id = ?
    `).get(messageId, req.params.id);

    if (!branchMessage) {
      return res.status(404).json({ error: 'Message not found in conversation' });
    }

    // Create new conversation
    const newConversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const branchTitle = title || `${parentConversation.title} (Branch)`;

    db.prepare(`
      INSERT INTO conversations (
        id, user_id, title, folder, tags, parent_conversation_id,
        branch_point_message_id, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      newConversationId,
      req.user.id,
      branchTitle,
      parentConversation.folder,
      parentConversation.tags,
      req.params.id,
      messageId
    );

    // Copy messages up to and including the branch point
    const messagesToCopy = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      AND timestamp <= (SELECT timestamp FROM messages WHERE id = ?)
      AND deleted = 0
      ORDER BY timestamp ASC
    `).all(req.params.id, messageId);

    // Insert copied messages into new conversation
    const insertStmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, role, content, sender, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const copyMessages = db.transaction((messages) => {
      for (const msg of messages) {
        const newMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        insertStmt.run(
          newMessageId,
          newConversationId,
          msg.role,
          msg.content,
          msg.sender,
          msg.timestamp
        );

        // Add to FTS index
        db.prepare(`
          INSERT INTO messages_fts (message_id, conversation_id, content)
          VALUES (?, ?, ?)
        `).run(newMessageId, newConversationId, msg.content);
      }
    });

    copyMessages(messagesToCopy);

    res.status(201).json({
      message: 'Conversation branched successfully',
      conversationId: newConversationId,
      title: branchTitle
    });
  } catch (error) {
    console.error('Error branching conversation:', error);
    res.status(500).json({ error: 'Failed to branch conversation' });
  }
});

// Retry failed message (regenerate response)
router.post('/conversations/:id/messages/:messageId/retry', authenticateToken, async (req, res) => {
  try {
    const db = getDatabase();

    // Verify conversation belongs to user
    const conversation = db.prepare(`
      SELECT * FROM conversations WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get the message to retry
    const message = db.prepare(`
      SELECT * FROM messages WHERE id = ? AND conversation_id = ?
    `).get(req.params.messageId, req.params.id);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only retry user messages
    if (message.role !== 'user') {
      return res.status(400).json({ error: 'Can only retry user messages' });
    }

    // Delete the assistant response that came after this message (if any)
    db.prepare(`
      DELETE FROM messages
      WHERE conversation_id = ?
      AND timestamp > ?
      AND role = 'nexus'
      ORDER BY timestamp ASC
      LIMIT 1
    `).run(req.params.id, message.timestamp);

    // Set up SSE for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    let fullResponse = '';
    const assistantMessageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Get or create Claude process for this conversation
      const claudeProcess = await claudeProcessManager.getOrCreateProcess(req.params.id);

      // Listen for messages from Claude
      const messageHandler = (msg) => {
        if (msg.type === 'text') {
          fullResponse += msg.content;
          res.write(`data: ${JSON.stringify({ type: 'text', content: msg.content })}\n\n`);
        } else if (msg.type === 'content_block_delta' && msg.delta?.type === 'text_delta') {
          const text = msg.delta.text;
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
        } else if (msg.type === 'message_stop') {
          cleanup();

          // Store assistant response
          db.prepare(`
            INSERT INTO messages (id, conversation_id, role, content, sender, timestamp)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(assistantMessageId, req.params.id, 'nexus', fullResponse, 'Nexus Team');

          // Update conversation timestamp
          db.prepare(`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?
          `).run(req.params.id);

          res.write(`data: ${JSON.stringify({ type: 'done', messageId: assistantMessageId })}\n\n`);
          res.end();
        } else if (msg.type === 'error') {
          cleanup();
          console.error('Claude error:', msg);
          res.write(`data: ${JSON.stringify({ type: 'error', error: msg.error })}\n\n`);
          res.end();
        }
      };

      const errorHandler = (error) => {
        cleanup();
        console.error('Claude process error:', error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Claude process error' })}\n\n`);
        res.end();
      };

      const cleanup = () => {
        claudeProcess.removeListener('message', messageHandler);
        claudeProcess.removeListener('error', errorHandler);
      };

      claudeProcess.on('message', messageHandler);
      claudeProcess.on('error', errorHandler);

      // Resend the message to Claude
      claudeProcess.sendMessage(message.content);

      // Handle client disconnect
      req.on('close', () => {
        cleanup();
      });

    } catch (processError) {
      console.error('Claude process error:', processError);
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to communicate with Claude' })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('Error retrying message:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to retry message' });
    }
  }
});

// Get list of folders
router.get('/folders', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const folders = db.prepare(`
      SELECT DISTINCT folder, COUNT(*) as count
      FROM conversations
      WHERE user_id = ? AND archived = 0
      GROUP BY folder
      ORDER BY folder ASC
    `).all(req.user.id);

    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get all tags used by user
router.get('/tags', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();

    const conversations = db.prepare(`
      SELECT tags FROM conversations
      WHERE user_id = ? AND tags IS NOT NULL AND archived = 0
    `).all(req.user.id);

    // Collect all unique tags
    const tagsSet = new Set();
    conversations.forEach(conv => {
      if (conv.tags) {
        try {
          const tags = JSON.parse(conv.tags);
          tags.forEach(tag => tagsSet.add(tag));
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    res.json(Array.from(tagsSet).sort());
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

export default router;
