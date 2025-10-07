require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function testEmbedding() {
  if (!GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_API_KEY environment variable is not set in .env file.');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const text = "Hello, world!";
    const result = await model.embedContent([text]); // Sending as an array of strings
    
    console.log('API Key is valid! Successfully generated embedding for:', text);
    console.log('Embedding dimensions:', result.embedding.values.length);
  } catch (error) {
    console.error('Error testing API Key:', error.message);
    if (error.status === 401) {
      console.error('Authentication failed. Please check if your GOOGLE_API_KEY is correct and has the necessary permissions.');
    } else if (error.status === 403) {
      console.error('Permission denied. Ensure your API key has access to the Generative Language API.');
    }
  }
}

testEmbedding();