const fs = require('fs');
const path = require('path');

const DEV_DOCS_PAGE = path.join(__dirname, '../src/pages/DevDocsPage.tsx');
const newPages = process.argv.slice(2);

if (newPages.length === 0) {
  console.log('No new pages to add.');
  process.exit(0);
}

fs.readFile(DEV_DOCS_PAGE, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading DevDocsPage.tsx:', err);
    process.exit(1);
  }

  const featuresDocsRegex = /const featuresDocs = \[([^\]]*)\];/;
  const match = data.match(featuresDocsRegex);

  if (!match) {
    console.error('Could not find featuresDocs array in DevDocsPage.tsx');
    process.exit(1);
  }

  const existingEntries = match[1];
  let newEntries = existingEntries;

  for (const page of newPages) {
    const uppercasePage = page.toUpperCase();
    const description = `Documents the ${page} feature.`;
    const newEntry = `\n  { name: "${uppercasePage}.md", description: "${description}" },`;
    newEntries += newEntry;
  }

  const updatedData = data.replace(featuresDocsRegex, `const featuresDocs = [${newEntries}\n];`);

  fs.writeFile(DEV_DOCS_PAGE, updatedData, 'utf8', (err) => {
    if (err) {
      console.error('Error writing DevDocsPage.tsx:', err);
      process.exit(1);
    }
    console.log('Successfully updated DevDocsPage.tsx');
  });
});
