// src/api/docs.ts

// Use relative path that works on both local (with proxy) and Vercel
const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || '/api';

interface Comment {
  ownerId: string;
  ownerName: string;
  text: string;
  createdAt: string;
}

interface Document {
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  comments: Comment[];
  lastUpdatedBy?: string;
}

export const docApi = {
  async getDocument(docName: string): Promise<Document | null> {
    const url = `${BASE_API_URL}/docs/${docName}`;
    console.log('Fetching document from URL:', url);
    const response = await fetch(url);
    console.log('Raw response status:', response.status);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Document ${docName} not found (404).`);
        return null;
      }
      throw new Error(`Error fetching document: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Document data received:', data);
    return data;
  },

  async updateDocument(docName: string, content: string, lastUpdatedBy: string): Promise<Document | null> {
    const response = await fetch(`${BASE_API_URL}/docs/${docName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content, lastUpdatedBy }),
    });
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error updating document: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  async createDocument(docName: string, content: string): Promise<Document> {
    const response = await fetch(`${BASE_API_URL}/docs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: docName, content }),
    });
    if (!response.ok) {
      throw new Error(`Error creating document: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  async deleteDocument(docName: string): Promise<boolean> {
    const response = await fetch(`${BASE_API_URL}/docs/${docName}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      if (response.status === 404) return false;
      throw new Error(`Error deleting document: ${response.statusText}`);
    }
    return true;
  },

  async getAllDocuments(): Promise<Document[]> {
    const response = await fetch(`${BASE_API_URL}/docs`);
    if (!response.ok) {
      throw new Error(`Error fetching all documents: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  async addComment(docName: string, ownerId: string, ownerName: string, text: string): Promise<Comment> {
    const response = await fetch(`${BASE_API_URL}/docs/${docName}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ownerId, ownerName, text }),
    });
    if (!response.ok) {
      throw new Error(`Error adding comment: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  async searchDocuments(query: string): Promise<{ answer: string; sources: string[] }> {
    const response = await fetch(`${BASE_API_URL}/docs/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });
    if (!response.ok) {
      throw new Error(`Error searching documents: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  // --- Utility for initial seeding (for demo purposes) ---
  // This will now attempt to create the document via the API.
  async seedDocument(docName: string, content: string): Promise<void> {
    try {
      await this.createDocument(docName, content);
    } catch (error: any) {
      // If it's a conflict (document already exists), that's fine for seeding.
      if (error.message && error.message.includes('already exists')) {
        console.log(`Document ${docName} already exists, skipping seed.`);
      } else {
        console.error(`Error seeding document ${docName}:`, error);
      }
    }
  }
};
