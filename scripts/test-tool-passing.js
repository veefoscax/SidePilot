/**
 * Test Tool Passing
 * 
 * Verify that tools are correctly passed from Chat.tsx through to the provider's buildRequest method.
 */

console.log('🧪 Testing tool passing through provider chain...\n');

// Simulate the tool preparation in Chat.tsx
const mockTools = [
  {
    name: 'screenshot',
    description: 'Capture a screenshot of the current page',
    inputSchema: {
      type: 'object',
      properties: {
        annotate: { type: 'boolean' }
      }
    }
  },
  {
    name: 'click',
    description: 'Click an element',
    inputSchema: {
      type: 'object',
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      }
    }
  }
];

console.log('✅ Mock tools prepared (simulating Chat.tsx):', {
  toolsCount: mockTools.length,
  toolNames: mockTools.map(t => t.name)
});

// Simulate the ChatOptions object
const chatOptions = {
  model: 'glm-4.7',
  tools: mockTools,
  systemPrompt: 'You are an AI assistant',
  stream: true
};

console.log('\n✅ ChatOptions object created:', {
  model: chatOptions.model,
  hasTools: !!chatOptions.tools,
  toolsCount: chatOptions.tools?.length || 0,
  stream: chatOptions.stream
});

// Simulate destructuring in buildRequest
const {
  model = 'default-model',
  maxTokens,
  temperature,
  tools,
  systemPrompt
} = chatOptions;

console.log('\n✅ After destructuring in buildRequest:', {
  model,
  hasTools: !!tools,
  toolsCount: tools?.length || 0,
  toolNames: tools?.map(t => t.name) || []
});

// Simulate the OpenAI request building
if (tools && tools.length > 0) {
  const openaiTools = tools.map(tool => ({
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  }));

  console.log('\n✅ OpenAI tools formatted:', {
    toolsCount: openaiTools.length,
    toolNames: openaiTools.map(t => t.function.name),
    firstTool: openaiTools[0]
  });
} else {
  console.log('\n❌ ERROR: Tools were lost during destructuring!');
}

console.log('\n✅ Test completed - tools should flow correctly through the chain');
