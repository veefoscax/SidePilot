/**
 * Debug Ollama Connection
 * 
 * Test script to debug Ollama connectivity and model availability
 */

const OLLAMA_BASE_URL = 'http://localhost:11434';

async function testOllamaConnection() {
  console.log('🔍 Testing Ollama Connection...\n');
  
  // Test 1: Check if Ollama server is running
  console.log('1. Testing server connectivity...');
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Server is running`);
      console.log(`   📦 Available models: ${data.models.length}`);
      
      if (data.models.length > 0) {
        console.log('\n   Available models:');
        data.models.forEach(model => {
          console.log(`   - ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
        });
      } else {
        console.log('   ⚠️  No models installed');
        console.log('   💡 Run: ollama pull llama3.2');
      }
    } else {
      console.log(`   ❌ Server responded with error: ${response.status}`);
    }
  } catch (error) {
    console.log(`   ❌ Connection failed: ${error.message}`);
    console.log('   💡 Make sure Ollama is running: ollama serve');
    return;
  }
  
  // Test 2: Try a simple chat request
  console.log('\n2. Testing chat API...');
  try {
    const chatRequest = {
      model: 'qwen3:1.7b', // Use a model that exists on your system
      messages: [
        { role: 'user', content: 'Hello, can you respond with just "OK"?' }
      ],
      stream: false
    };
    
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(chatRequest)
    });
    
    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ Chat API working`);
      console.log(`   🤖 Response: "${data.message.content}"`);
    } else {
      const errorText = await response.text();
      console.log(`   ❌ Chat API failed: ${response.status}`);
      console.log(`   📝 Error: ${errorText}`);
      
      if (response.status === 404) {
        console.log('   💡 Model might not be installed. Try: ollama pull llama3.2');
      }
    }
  } catch (error) {
    console.log(`   ❌ Chat request failed: ${error.message}`);
  }
  
  // Test 3: Check what models are actually available
  console.log('\n3. Checking model availability...');
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (response.ok) {
      const data = await response.json();
      
      if (data.models.length === 0) {
        console.log('   ⚠️  No models found!');
        console.log('   💡 Install a model first:');
        console.log('      ollama pull llama3.2');
        console.log('      ollama pull llama3.2:3b');
        console.log('      ollama pull qwen2.5:7b');
      } else {
        console.log('   📋 Detailed model info:');
        data.models.forEach(model => {
          console.log(`   - Name: ${model.name}`);
          console.log(`     Size: ${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB`);
          console.log(`     Family: ${model.details?.family || 'unknown'}`);
          console.log('');
        });
      }
    }
  } catch (error) {
    console.log(`   ❌ Failed to check models: ${error.message}`);
  }
}

// Run the test
testOllamaConnection().catch(console.error);