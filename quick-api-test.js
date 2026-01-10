#!/usr/bin/env node

// Quick test to verify API endpoints are working
const http = require('http');

function testAPI() {
    console.log('🧪 Testing API Endpoints...\n');

    // Test the search endpoint
    const postData = JSON.stringify({
        query: 'What is the architecture?'
    });

    const options = {
        hostname: 'localhost',
        port: 5500,
        path: '/api/docs/search',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);

        let data = '';
        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            console.log('Response:', data);
            if (res.statusCode === 200) {
                console.log('✅ API is working!');
            } else {
                console.log('❌ API returned an error');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`❌ Connection error: ${e.message}`);
    });

    req.write(postData);
    req.end();
}

// Test connection first
const testReq = http.request({
    hostname: 'localhost',
    port: 5500,
    path: '/api/docs',
    method: 'GET'
}, (res) => {
    console.log(`📡 Server connectivity test: ${res.statusCode}`);
    if (res.statusCode === 200) {
        console.log('✅ Server is responding\n');
        console.log('🔍 Testing search endpoint...');
        testAPI();
    } else {
        console.log('❌ Server not responding properly');
    }
}).on('error', (e) => {
    console.error(`❌ Cannot connect to server: ${e.message}`);
    console.log('\n💡 Make sure the API server is running on port 5500');
    console.log('   Run: node api/server.cjs');
});

testReq.end();