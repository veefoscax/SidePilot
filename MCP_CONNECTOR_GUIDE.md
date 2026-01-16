# MCP Connector Guide

SidePilot's MCP Connector allows external AI tools like Cline and Aider to use browser automation capabilities through the Model Context Protocol (MCP).

## Overview

The MCP Connector exposes SidePilot's browser tools to external clients, enabling:
- **Browser automation** from terminal-based AI tools
- **Tool discovery** via MCP protocol
- **Secure authentication** with token-based access

## Setup

### 1. Enable the Connector

1. Open SidePilot settings (gear icon)
2. Find the "MCP Connector" section
3. Toggle "Enable" to ON
4. Select which tools to expose (recommended: start with `navigation`, `tabs`, `page_content`)

### 2. Copy Your Auth Token

1. In the MCP Connector settings, find the "Authentication Token" field
2. Click the copy button to copy your token
3. Keep this token secret - it grants access to browser automation

### 3. Set Up the Companion Proxy

Chrome extensions cannot directly accept incoming connections. You need a companion proxy to bridge external tools to the extension.

#### Option A: Native Messaging Host (Recommended)

Create a native messaging host that communicates with the extension:

```javascript
// sidepilot-mcp-host.js
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Read messages from stdin (native messaging format)
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    
    // Forward to extension via chrome.runtime.sendMessage
    // The extension listens for MCP_CONNECTOR_REQUEST messages
    const response = await sendToExtension({
      type: 'MCP_CONNECTOR_REQUEST',
      payload: message
    });
    
    // Write response to stdout
    console.log(JSON.stringify(response));
  } catch (error) {
    console.log(JSON.stringify({
      error: { code: -32603, message: error.message }
    }));
  }
});
```

#### Option B: HTTP Proxy Server

Run a local HTTP server that forwards requests to the extension:

```javascript
// sidepilot-mcp-proxy.js
const http = require('http');
const WebSocket = require('ws');

const PORT = 54321;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const message = JSON.parse(body);
        // Forward to extension and get response
        const response = await forwardToExtension(message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(response));
      } catch (error) {
        res.writeHead(500);
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`SidePilot MCP Proxy running on port ${PORT}`);
});
```

## Connecting from Cline

Add SidePilot as an MCP server in your Cline configuration:

```json
{
  "mcpServers": {
    "sidepilot": {
      "command": "node",
      "args": ["/path/to/sidepilot-mcp-host.js"],
      "env": {
        "SIDEPILOT_AUTH_TOKEN": "your-auth-token-here"
      }
    }
  }
}
```

Or if using HTTP proxy:

```json
{
  "mcpServers": {
    "sidepilot": {
      "url": "http://localhost:54321",
      "headers": {
        "Authorization": "Bearer your-auth-token-here"
      }
    }
  }
}
```

## Connecting from Aider

Aider can use MCP servers via the `--mcp` flag:

```bash
aider --mcp sidepilot=http://localhost:54321
```

Or configure in `.aider.conf.yml`:

```yaml
mcp:
  sidepilot:
    url: http://localhost:54321
    auth_token: your-auth-token-here
```

## Available Tools

When connected, external tools can use these browser automation capabilities:

| Tool | Description |
|------|-------------|
| `navigation` | Navigate to URLs, go back/forward, reload |
| `tabs` | Create, close, switch between tabs |
| `computer` | Click, type, scroll, take screenshots |
| `page_content` | Get page HTML, text, or specific elements |
| `execute_script` | Run JavaScript in the page context |
| `accessibility` | Get accessibility tree for element targeting |
| `console` | Read browser console logs |
| `network` | Monitor network requests |
| `clipboard` | Read/write clipboard content |
| `tab_groups` | Manage Chrome tab groups |
| `shortcuts` | Execute saved shortcuts |
| `web_search` | Perform web searches |

## MCP Protocol Messages

### Initialize

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}
```

### List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

### Call Tool

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "navigation",
    "arguments": {
      "action": "goto",
      "url": "https://example.com"
    },
    "authToken": "your-auth-token-here"
  }
}
```

## Security Considerations

1. **Keep your auth token secret** - Anyone with the token can control your browser
2. **Only expose necessary tools** - Start with minimal tools and add more as needed
3. **Use localhost only** - Don't expose the proxy to external networks
4. **Regenerate token if compromised** - Use the regenerate button in settings

## Troubleshooting

### "MCP Connector is not enabled"
- Open SidePilot settings and enable the connector

### "Invalid or missing authentication token"
- Ensure you're passing the correct auth token in requests
- Check that the token hasn't been regenerated

### "Tool not exposed"
- Enable the tool in MCP Connector settings
- Verify the tool name matches exactly

### "No active tab found"
- Ensure Chrome has an active tab in the current window
- The connector uses the active tab for all operations

### Connection refused
- Verify the proxy server is running
- Check the port number matches your configuration
- Ensure no firewall is blocking localhost connections

## Example: Automated Web Research

Here's how an external AI tool might use SidePilot for web research:

```
User: Research the latest React 19 features

AI (via Cline/Aider):
1. Call navigation tool: goto "https://react.dev/blog"
2. Call page_content tool: get text content
3. Call navigation tool: goto specific article
4. Call page_content tool: extract article content
5. Summarize findings for user
```

The AI tool handles the reasoning while SidePilot handles the browser automation!
