// src/api/docs.ts

// In a real application, this would be configured via environment variables.
const BASE_API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api'; // User needs to change this to their deployed backend URL

interface Document {
  name: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export const docApi = {
  async getDocument(docName: string): Promise<Document | null> {
    const response = await fetch(`${BASE_API_URL}/docs/${docName}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Error fetching document: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  },

  async updateDocument(docName: string, content: string): Promise<Document | null> {
    const response = await fetch(`${BASE_API_URL}/docs/${docName}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content }),
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
