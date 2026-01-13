#!/usr/bin/env node

/**
 * Debug ZAI Connection Issues
 * 
 * Comprehensive diagnostic tool to identify ZAI API connection problems
 */

console.log('🔍 Debugging ZAI Connection Issues...\n');

const apiKey = '42ec8b23449644a5b05f01b04eca69dc.Q9hxA5iMzNBTKZb1';

// Test endpoints to try
const endpoints = [
  {
    name: 'ZAI Coding Plan',
    url: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    description: 'Dedicated endpoint for GLM Coding Plan'
  },
  {
    name: 'ZAI General Plan', 
    url: 'https://api.z.ai/api/paas/v4/chat/completions',
    description: 'General endpoint for standard plans'
  }
];

async function testEndpoint(endpoint) {
  console.log(`\n🧪 Testing: ${endpoint.name}`);
  console.log(`   URL: ${endpoint.url}`);
  console.log(`   Description: ${endpoint.description}`);
  
  const testPayload = {
    model: 'glm-4.7',
    messages: [
      {
        role: 'user',
        content: 'Hello, this is a connection test.'
      }
    ],
    max_tokens: 10,
    temperature: 0.1
  };

  try {
    console.log('   Making request...');
    
    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept-Language': 'en-US,en'
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ SUCCESS! Connection working');
      console.log(`   Model: ${data.model || 'Unknown'}`);
      console.log(`   Response: ${data.choices?.[0]?.message?.content || 'No content'}`);
      return { success: true, endpoint: endpoint.name };
    } else {
      const errorText = await response.text();
      console.log('   ❌ FAILED');
      console.log(`   Error: ${errorText}`);
      return { success: false, error: errorText, status: response.status };
    }
    
  } catch (error) {
    console.log('   ❌ NETWORK ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message, networkError: true };
  }
}

async function testModelsEndpoint(baseUrl) {
  console.log(`\n🔍 Testing Models Endpoint: ${baseUrl}/models`);
  
  try {
    const response = await fetch(`${baseUrl}/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept-Language': 'en-US,en'
      }
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Models endpoint working');
      console.log(`   Available models: ${data.data?.length || 0}`);
      if (data.data?.length > 0) {
        console.log(`   First model: ${data.data[0].id}`);
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Models endpoint failed');
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log('   ❌ Models endpoint network error');
    console.log(`   Error: ${error.message}`);
  }
}

async function runDiagnostics() {
  console.log('🔧 Running Comprehensive ZAI Diagnostics');
  console.log('=====================================');
  
  // Test API key format
  console.log('\n1. API Key Analysis:');
  console.log(`   Length: ${apiKey.length} characters`);
  console.log(`   Format: ${apiKey.includes('.') ? 'UUID.token format ✅' : 'Invalid format ❌'}`);
  
  // Test both endpoints
  console.log('\n2. Endpoint Testing:');
  const results = [];
  
  for (const endpoint of endpoints) {
    const result = await testEndpoint(endpoint);
    results.push(result);
    
    if (result.success) {
      // Test models endpoint for successful connection
      const baseUrl = endpoint.url.replace('/chat/completions', '');
      await testModelsEndpoint(baseUrl);
    }
  }
  
  // Summary
  console.log('\n📊 Diagnostic Summary:');
  console.log('=====================================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`✅ Working endpoints: ${successful.length}`);
    successful.forEach(r => console.log(`   - ${r.endpoint}`));
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed endpoints: ${failed.length}`);
    failed.forEach((r, i) => {
      console.log(`   - ${endpoints[i].name}: ${r.error}`);
    });
  }
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('=====================================');
  
  if (successful.length === 0) {
    console.log('❌ No endpoints working. Possible issues:');
    console.log('   1. API key is invalid or expired');
    console.log('   2. Account has no credits/balance');
    console.log('   3. Network connectivity issues');
    console.log('   4. ZAI service is down');
    console.log('\n🔧 Try these solutions:');
    console.log('   1. Verify API key in ZAI dashboard');
    console.log('   2. Check account balance/credits');
    console.log('   3. Try from different network');
    console.log('   4. Contact ZAI support');
  } else {
    const workingEndpoint = successful[0];
    console.log(`✅ Use ${workingEndpoint.endpoint} endpoint`);
    console.log('   Update SidePilot configuration accordingly');
  }
}

// Run diagnostics
runDiagnostics().catch(console.error);