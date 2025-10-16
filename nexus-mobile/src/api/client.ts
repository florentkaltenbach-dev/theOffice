// Written by: Jake - Frontend Team
// Reviewed by: Sarah Williams, Kevin O'Brien
// Status: Production-Ready

// Use relative URL to work with both IP and domain
// When accessed via Caddy, /api/* is proxied to backend
// Falls back to localhost for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  typeof window !== 'undefined' && window.location.hostname !== 'localhost'
    ? '' // Use relative URLs in production (Caddy proxies /api/*)
    : 'http://localhost:3001'
);

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  getToken() {
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      this.clearToken();
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || 'Request failed');
    }

    return response;
  }

  // Auth endpoints
  async login(username: string, password: string) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();
    this.setToken(data.token);
    return data;
  }

  async verifyToken() {
    try {
      const response = await this.request('/api/auth/verify');
      return await response.json();
    } catch (error) {
      return { valid: false };
    }
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.request('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    return await response.json();
  }

  // Chat endpoints
  async getConversations() {
    const response = await this.request('/api/chat/conversations');
    return await response.json();
  }

  async getConversation(id: string) {
    const response = await this.request(`/api/chat/conversations/${id}/messages`);
    return await response.json();
  }

  async createConversation(title: string) {
    const response = await this.request('/api/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
    return await response.json();
  }

  async deleteConversation(id: string) {
    const response = await this.request(`/api/chat/conversations/${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  }

  // Streaming message endpoint
  async sendMessage(conversationId: string, content: string, onChunk: (chunk: any) => void) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            onChunk(data);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  // Workbench endpoints
  async getWorkbenchItems(type?: string) {
    const query = type ? `?type=${type}` : '';
    const response = await this.request(`/api/workbench/items${query}`);
    return await response.json();
  }

  async getWorkbenchItem(id: number) {
    const response = await this.request(`/api/workbench/items/${id}`);
    return await response.json();
  }

  async createWorkbenchItem(item: { type: string; title: string; content?: string; metadata?: any }) {
    const response = await this.request('/api/workbench/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return await response.json();
  }

  async updateWorkbenchItem(id: number, updates: { title?: string; content?: string; metadata?: any }) {
    const response = await this.request(`/api/workbench/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    return await response.json();
  }

  async deleteWorkbenchItem(id: number) {
    const response = await this.request(`/api/workbench/items/${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  }

  async getWorkbenchStats() {
    const response = await this.request('/api/workbench/stats');
    return await response.json();
  }

  // Folder endpoints
  async getFolders() {
    const response = await this.request('/api/folders');
    return await response.json();
  }

  async createFolder(name: string, parentId?: string) {
    const response = await this.request('/api/folders', {
      method: 'POST',
      body: JSON.stringify({ name, parentId }),
    });
    return await response.json();
  }

  async updateFolder(id: string, name: string) {
    const response = await this.request(`/api/folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name }),
    });
    return await response.json();
  }

  async deleteFolder(id: string) {
    const response = await this.request(`/api/folders/${id}`, {
      method: 'DELETE',
    });
    return await response.json();
  }

  // Conversation metadata endpoints
  async updateConversationMetadata(conversationId: string, metadata: any) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/metadata`, {
      method: 'PUT',
      body: JSON.stringify(metadata),
    });
    return await response.json();
  }

  async toggleFavorite(conversationId: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/favorite`, {
      method: 'POST',
    });
    return await response.json();
  }

  async updateTags(conversationId: string, tags: string[]) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/tags`, {
      method: 'PATCH',
      body: JSON.stringify({ tags }),
    });
    return await response.json();
  }

  async moveToFolder(conversationId: string, folderId: string | null) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/folder`, {
      method: 'PUT',
      body: JSON.stringify({ folderId }),
    });
    return await response.json();
  }

  // Search endpoint
  async searchConversations(query: string) {
    const response = await this.request(`/api/search?q=${encodeURIComponent(query)}`);
    return await response.json();
  }

  // Branch endpoints
  async getBranchTree(conversationId: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/branches`);
    return await response.json();
  }

  async createBranch(conversationId: string, messageId: string, title?: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/branches`, {
      method: 'POST',
      body: JSON.stringify({ messageId, title }),
    });
    return await response.json();
  }

  // Message edit/delete endpoints
  async editMessage(conversationId: string, messageId: string, content: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return await response.json();
  }

  async deleteMessage(conversationId: string, messageId: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
      method: 'DELETE',
    });
    return await response.json();
  }

  async retryMessage(conversationId: string, messageId: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/messages/${messageId}/retry`, {
      method: 'POST',
    });
    return await response.json();
  }

  // Preferences endpoints
  async getPreferences() {
    const response = await this.request('/api/preferences');
    return await response.json();
  }

  async updatePreferences(preferences: any) {
    const response = await this.request('/api/preferences', {
      method: 'PUT',
      body: JSON.stringify(preferences),
    });
    return await response.json();
  }

  // Context management endpoints
  async addContextItem(conversationId: string, item: any) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/context`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
    return await response.json();
  }

  async removeContextItem(conversationId: string, itemId: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/context/${itemId}`, {
      method: 'DELETE',
    });
    return await response.json();
  }

  // AI Personality endpoint
  async setAIPersonality(conversationId: string, personality: string) {
    const response = await this.request(`/api/chat/conversations/${conversationId}/personality`, {
      method: 'PUT',
      body: JSON.stringify({ personality }),
    });
    return await response.json();
  }

  // Session management
  async renewSession() {
    const response = await this.request('/api/auth/renew', {
      method: 'POST',
    });
    return await response.json();
  }
}

export const apiClient = new ApiClient();
