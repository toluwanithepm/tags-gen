// test-api.js - Simple test script for the Tag Generator API
const http = require('http');

// Test data
const testCases = [
  {
    field_label: "Soil pH Level",
    form_id: "form-1",
    field_id: "field-1"
  },
  {
    field_label: "Chick Vaccination Date",
    form_id: "form-1", 
    field_id: "field-2"
  },
  {
    field_label: "Crop Yield per Acre",
    form_id: "form-2",
    field_id: "field-3"
  },
  {
    field_label: "Water Consumption Level",
    form_id: "form-2",
    field_id: "field-4"
  }
];

// Function to make HTTP POST request
function makeRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/tag-generator',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Function to test health endpoint
function testHealth() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/health',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: result
          });
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Testing Tag Generator API...\n');
  
  try {
    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResult = await testHealth();
    console.log(`   Status: ${healthResult.statusCode}`);
    console.log(`   Response: ${JSON.stringify(healthResult.data, null, 2)}\n`);
    
    if (healthResult.statusCode !== 200) {
      console.error('❌ Health check failed. Make sure the server is running on port 3001.');
      return;
    }
    
    // Test tag generation
    console.log('2. Testing tag generation...\n');
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`   Test ${i + 1}: "${testCase.field_label}"`);
      
      try {
        const result = await makeRequest(testCase);
        console.log(`   Status: ${result.statusCode}`);
        
        if (result.statusCode === 200 && result.data.success) {
          console.log(`   ✅ Generated tag: "${result.data.tag}"`);
          console.log(`   Quality: ${result.data.quality} - ${result.data.message}`);
        } else {
          console.log(`   ❌ Error: ${JSON.stringify(result.data)}`);
        }
      } catch (error) {
        console.log(`   ❌ Request failed: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('🎉 Test completed!');
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    console.error('Make sure the server is running with: npm start');
  }
}

// Run the tests
runTests();