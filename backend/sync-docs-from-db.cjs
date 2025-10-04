const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const API_BASE_URL = 'http://localhost:5001/api';

async function syncDocsFromDb() {
  try {
    const response = await axios.get(`${API_BASE_URL}/docs`);
    const documents = response.data;

    for (const doc of documents) {
      const filePath = path.join(DOCS_DIR, `${doc.name}.md`);
      fs.writeFileSync(filePath, doc.content, 'utf8');
      console.log(`Successfully synced: ${doc.name}.md`);
    }

    console.log('Sync complete.');
  } catch (error) {
    console.error('Error during sync:', error.message);
  }
}

syncDocsFromDb();
