require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

async function testLlmGeneration() {
  if (!GOOGLE_API_KEY) {
    console.error('Error: GOOGLE_API_KEY environment variable is not set in .env file.');
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" }); // Using gemini-2.5-pro

    const prompt = "Tell me a short story about a brave knight.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Successfully generated content:');
    console.log(text);
  } catch (error) {
    console.error('Error testing LLM generation:', error.message);
    if (error.status === 401) {
      console.error('Authentication failed. Please check if your GOOGLE_API_KEY is correct and has the necessary permissions.');
    } else if (error.status === 403) {
      console.error('Permission denied. Ensure your API key has access to the Generative Language API.');
    } else if (error.status === 404) {
      console.error('Model not found or not supported. Please check the model name and API version.');
    }
  }
}

testLlmGeneration();
