
// API client

const api = {
  baseUrl: 'http://localhost:8000/api',
  
  // Tables API
  async getTables() {
    return this._request('/tables');
  },
  
  async getTable(id) {
    return this._request(`/tables/${id}`);
  },
  
  async uploadTable(file, name) {
    const formData = new FormData();
    formData.append('file', file);
    if (name) {
      formData.append('name', name);
    }
    
    return this._request('/tables/upload', {
      method: 'POST',
      body: formData,
      headers: {}  // Let the browser set the content type with boundary
    });
  },
  
  async mergeTable(tableIds, name, joinType, columnMappings) {
    return this._request('/tables/merge', {
      method: 'POST',
      body: JSON.stringify({
        table_ids: tableIds,
        name,
        join_type: joinType,
        column_mappings: columnMappings
      })
    });
  },
  
  async deleteTable(id) {
    return this._request(`/tables/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Chats API
  async getChatSessions() {
    return this._request('/chats');
  },
  
  async getChatSession(id) {
    return this._request(`/chats/${id}`);
  },
  
  async createChatSession(tableId, name) {
    return this._request('/chats/create', {
      method: 'POST',
      body: JSON.stringify({
        table_id: tableId,
        name
      })
    });
  },
  
  async sendMessage(sessionId, message) {
    return this._request(`/chats/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify({
        message_content: message
      })
    });
  },
  
  async deleteChatSession(id) {
    return this._request(`/chats/${id}`, {
      method: 'DELETE'
    });
  },
  
  // Helper Methods
  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error: ${response.status}`);
      }
      
      // For DELETE requests, might not have JSON response
      if (options.method === 'DELETE') {
        return { success: true };
      }
      
      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }
};
