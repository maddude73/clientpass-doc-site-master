#!/usr/bin/env node

// test_api_search.js - Test the RAG search API endpoint
const fs = require('fs');

async function testSearchAPI() {
    const API_BASE = process.env.API_BASE || 'http://localhost:5001';
    const testQuery = "What is ClientPass?";

    console.log('🧪 Testing RAG Search API Endpoint');
    console.log('==================================');
    console.log(`API Base URL: ${API_BASE}`);
    console.log(`Test Query: "${testQuery}"`);
    console.log('');

    try {
        const response = await fetch(`${API_BASE}/api/docs/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: testQuery }),
        });

        console.log(`Response Status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error:');
            console.error(errorText);
            return false;
        }

        const data = await response.json();
        console.log('✅ API Response Success:');
        console.log('Answer:', data.answer?.substring(0, 200) + '...');
        console.log('Sources:', data.sources);
        return true;

    } catch (error) {
        console.error('❌ Network Error:');
        console.error(error.message);
        return false;
    }
}

// Run test if called directly
if (require.main === module) {
    testSearchAPI().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = { testSearchAPI };