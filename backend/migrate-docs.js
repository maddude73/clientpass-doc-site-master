// backend/migrate-docs.js
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // For making HTTP requests

const DOCS_DIR = path.join(__dirname, '../public/docs'); // Path to your static markdown files
const API_BASE_URL = 'http://localhost:5001/api'; // Your backend API URL

async function migrateDocuments() {
  try {
    const files = fs.readdirSync(DOCS_DIR);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const docName = file.replace('.md', '');
        const filePath = path.join(DOCS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');

        try {
          // Attempt to create the document
          await axios.post(`${API_BASE_URL}/docs`, { name: docName, content });
          console.log(`Successfully migrated: ${docName}`);
        } catch (error) {
          if (error.response && error.response.status === 409) {
            console.log(`Document ${docName} already exists, skipping.`);
          } else {
            console.error(`Error migrating ${docName}:`, error.message);
          }
        }
      }
    }
    console.log('Migration complete.');
  } catch (error) {
    console.error('Error during migration:', error.message);
  }
}

migrateDocuments();
