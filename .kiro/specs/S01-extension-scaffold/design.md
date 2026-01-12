# S01: Extension Scaffold - Design

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension                          │
├─────────────────────────────────────────────────────────────┤
│  Side Panel (React)     │  Service Worker    │  Content     │
│  ├── Chat UI            │  ├── Messaging     │  ├── DOM     │
│  ├── Settings           │  ├── Tools Exec    │  └── Visual  │
│  └── Components         │  └── CDP Control   │              │
├─────────────────────────────────────────────────────────────┤
│                    Chrome APIs                               │
│  sidePanel, storage, debugger, tabs, scripting               │
└─────────────────────────────────────────────────────────────┘
```

## Manifest V3 Configuration

> **Icons**: Generate icons from `assets/Sidepilot.svg` at 16x16, 48x48, and 128x128 PNG sizes.
> Place in `public/icons/` folder.

```json
{
  "manifest_version": 3,
  "name": "SidePilot",
  "version": "1.0.0",
  "description": "Your AI Co-Pilot in the Browser - Browser automation with any LLM",
  "permissions": [
    "sidePanel",
    "storage",
    "activeTab",
    "tabs",
    "scripting",
    "debugger",
    "notifications"
  ],
  "host_permissions": ["<all_urls>"],
  "side_panel": {
    "default_path": "sidepanel.html"
  },
  "background": {
    "service_worker": "service-worker.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content.js"]
  }],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        sidepanel: path.resolve(__dirname, 'src/sidepanel/index.html'),
        'service-worker': path.resolve(__dirname, 'src/background/service-worker.ts'),
        content: path.resolve(__dirname, 'src/content/content.ts'),
      },
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## shadcn/ui Setup

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils"
  }
}
```

## Storage Wrapper

```typescript
// src/lib/storage.ts
class Storage {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? null;
  }

  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  }

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  }
}

export const storage = new Storage();
```

## Messaging Infrastructure

```typescript
// src/lib/messaging.ts
type MessageHandler = (message: any, sender: chrome.runtime.MessageSender) => Promise<any>;

const handlers = new Map<string, MessageHandler>();

export function registerHandler(type: string, handler: MessageHandler) {
  handlers.set(type, handler);
}

export function sendMessage<T>(type: string, payload?: any): Promise<T> {
  return chrome.runtime.sendMessage({ type, payload });
}

// In service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = handlers.get(message.type);
  if (handler) {
    handler(message.payload, sender).then(sendResponse);
    return true; // Keep channel open for async response
  }
});
```

## shadcn Components to Install
```bash
npx shadcn@latest add button input textarea card alert dialog sheet tabs select
```
