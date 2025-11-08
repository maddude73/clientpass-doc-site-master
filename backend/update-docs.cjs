const fs = require('fs');
const path = require('path');
const axios = require('axios');

const DOCS_DIR = path.join(__dirname, '../public/docs');
const API_BASE_URL = process.env.API_URL || 'https://clientpass-doc-site.vercel.app/api';

const frontmatterRegex = /^---\s*\nid:\s*(.*)\s*\nrevision:\s*(.*)\s*\n---\s*/;

async function updateDocuments() {
  try {
    const files = fs.readdirSync(DOCS_DIR);

    for (const file of files) {
      if (file.endsWith('.md')) {
        const docName = file.replace('.md', '');
        const filePath = path.join(DOCS_DIR, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        const match = fileContent.match(frontmatterRegex);
        let content = fileContent;
        let id, revision;

        if (match) {
          id = match[1];
          revision = parseInt(match[2], 10);
          content = fileContent.replace(frontmatterRegex, '');
        }

        try {
          const updatePayload = {
            content,
            lastUpdatedBy: 'system-update',
            revision,
            updatedAt: new Date().toISOString()
          };

          const response = await axios.put(`${API_BASE_URL}/docs/${docName}`, updatePayload, {
            validateStatus: function (status) {
              return status >= 200 && status < 300 || status === 304;
            }
          });
          console.log(`Status for ${docName}: ${response.status}`);
          if (response.status === 200) {
            console.log(`✓ Successfully updated: ${docName} (revision ${revision})`);
          } else if (response.status === 304) {
            console.log(`○ No changes for: ${docName}`);
          }
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.log(`Document ${docName} not found, creating it...`);
            try {
              await axios.post(`${API_BASE_URL}/docs`, { name: docName, content });
              console.log(`Successfully created: ${docName}`);
            } catch (createError) {
              console.error(`Error creating ${docName}:`, createError.message);
            }
          } else if (error.response && error.response.status === 409) {
            console.warn(`Conflict updating ${docName}: ${error.response.data.message}`);
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
