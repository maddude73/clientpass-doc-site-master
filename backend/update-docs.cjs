const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const API_BASE_URL = 'http://localhost:5001/api';

async function updateDocuments() {
  try {
    const files = fs.readdirSync(DOCS_DIR);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const docName = file.replace('.md', '');
        const filePath = path.join(DOCS_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');

        try {
          await axios.put(`${API_BASE_URL}/docs/${docName}`, { content, lastUpdatedBy: 'system-update' });
          console.log(`Successfully updated: ${docName}`);
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`Document ${docName} not found, creating it...`);
            try {
              await axios.post(`${API_BASE_URL}/docs`, { name: docName, content });
              console.log(`Successfully created: ${docName}`);
            } catch (createError) {
              console.error(`Error creating ${docName}:`, createError.message);
            }
          } else {
            console.error(`Error updating ${docName}:`, error.message);
          }
        }
      }
    }
    console.log('Update complete.');
  } catch (error) {
    console.error('Error during update:', error.message);
  }
}

updateDocuments();
