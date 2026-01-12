# S01: Extension Scaffold - Design

## Time Tracking
- **Estimated**: 45 minutes
- **Actual**: 2 hours 15 minutes  
- **Status**: ✅ Completed
- **Critical Issue**: Vite path resolution required `base: './'` for Chrome extension compatibility

## Architecture Overview

**Type**: Self-Contained Chrome Extension (Serverless)
**Runtime**: Client-side execution in Browser Context + Service Worker
**Build**: Static asset generation via Vite

> **NOTE**: No external backend server (Node/Python) is required for runtime. Vite is used ONLY for development (HMR) and building static assets.

```
┌─────────────────────────────────────────────────────────────┐
│                    Chrome Extension (Client Side)            │
├─────────────────────────────────────────────────────────────┤
│  Side Panel (React)     │  Service Worker    │  Content     │
│  ├── Chat UI            │  ├── Messaging     │  ├── DOM     │
│  ├── Settings           │  ├── Tools Exec    │  └── Visual  │
│  └── Components         │  └── CDP Control   │              │
├─────────────────────────────────────────────────────────────┤
│                    Chrome APIs (Storage/Runtime)             │
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

**Style Configuration:**
- **Style**: Nova
- **Base Color**: Neutral
- **Theme**: Cyan
- **Icon Library**: Hugeicons
- **Font**: Figtree
- **Radius**: Small
- **Menu Accent**: Subtle
- **Menu Color**: Default

**Initialization:**
Use the following configuration when initializing or `components.json`:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "nova",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "hugeicons"
}
```

> **IMPORTANT**: Always use the **shadcn MCP server** to pull and install components to ensure consistent styling and implementation. Do not manually copy-paste component code unless absolutely necessary.

## Playwright Testing Setup

**Goal**: Automate verification and capture screenshots for DEVLOG.

**Configuration (`playwright.config.ts`)**:
Must support Chrome Extension loading:
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  use: {
    // Exact path to the extension build directory
    // IMPORTANT: build (npm run build) must run before tests
    headless: false, // Extensions don't work in headless mode usually
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

**Test Helper (`tests/fixtures.ts`)**:
Need a custom fixture to load the extension:
```typescript
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'path';

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  context: async ({ }, use) => {
    const pathToExtension = path.join(__dirname, '../dist');
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Logic to find extension ID from service worker or pages
    // ...
    await use(extensionId);
  },
});
```

## shadcn Components to Install

Using shadcn MCP:

```bash
npx shadcn@latest add button input textarea card alert dialog sheet tabs select scroll-area avatar badge dropdown-menu tooltip
```
