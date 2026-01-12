# Technology Stack

## Core Technologies

| Category | Technology | Version |
|----------|------------|---------|
| Build | Vite | 5.x |
| UI Framework | React | 18.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.x |
| UI Components | shadcn/ui v4 | latest |
| State Management | Zustand | 4.x |
| Extension API | Manifest V3 | - |
| Browser Control | Chrome DevTools Protocol | 1.3 |

## shadcn/ui v4 Configuration

### New Visual Styles (December 2025)
shadcn/ui v4 introduced 5 new visual styles beyond the classic "default" and "new-york":

- **Vega** – The classic shadcn/ui look
- **Nova** – Reduced padding and margins for compact layouts ✅ (USING THIS)
- **Maia** – Soft and rounded, with generous spacing  
- **Lyra** – Boxy and sharp. Pairs well with mono fonts
- **Mira** – (Additional style)

### Icon Libraries
- **lucide-react** – Default for most styles
- **hugeicons** – Alternative icon library ✅ (USING THIS)
- **radix-icons** – Used with new-york style

### Component Library Support
v4 supports multiple component libraries:
- **Radix UI** – Default (what we've been using)
- **Base UI** – New alternative, fully compatible

### Critical Configuration Notes
```json
{
  "style": "nova",           // ✅ Use nova for compact layouts
  "iconLibrary": "hugeicons", // ✅ Use hugeicons instead of lucide
  "tailwind": {
    "baseColor": "neutral",   // Works with nova style
    "cssVariables": true      // Recommended approach
  }
}
```

### Installation Approach
- For existing projects: Keep current components.json with nova/hugeicons
- Components are backwards compatible
- CLI auto-detects library and applies transformations
- No need to reinstall existing components when switching styles

### ⚠️ Nova Style Component Installation Workaround
**Problem**: Some components (like `alert-dialog`) are not yet available in the nova style registry.
**Error**: `The item at https://ui.shadcn.com/r/styles/nova/alert-dialog.json was not found`

**Solution**: Download directly from the default registry using curl:
```bash
# Get the component JSON from default registry
curl -s https://ui.shadcn.com/r/styles/default/COMPONENT-NAME.json

# Extract the content field and fix import paths
# Change: "@/registry/default/ui/button" 
# To: "@/components/ui/button"

# Install required dependencies (check dependencies field in JSON)
npm install @radix-ui/react-alert-dialog
```

**Components Known to Have This Issue**:
- alert-dialog ✅ (Fixed using curl method)
- (Add others as discovered)

**Root Cause**: Nova style registry URLs return 404 for some components.
**Proper Fix**: The CLI should fall back to default registry when nova is unavailable, but currently doesn't.

### Component Installation Issues & Solutions
**Problem**: Nova style components may not be available in registry yet
**Solution**: 
1. Manually create component using Radix UI pattern (copy from default style)
2. Install required Radix UI dependency: `npm install @radix-ui/react-[component-name]`
3. Component will automatically use Nova styling via CSS variables

**Example**: For alert-dialog component:
```bash
# This may fail for nova style
npx shadcn@latest add alert-dialog

# Solution: Create component manually and install dependency
npm install @radix-ui/react-alert-dialog
```

**Root Cause**: New visual styles (nova, maia, lyra, mira) are recent additions and some components may not have registry entries yet. The underlying Radix UI components work the same way, just need manual creation.

## Architecture Decisions

### Provider Factory Pattern
Use factory pattern (like Cline) to support 40+ LLM providers with unified interface:
```typescript
interface LLMProvider {
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
  stream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<StreamChunk>;
  testConnection(): Promise<boolean>;
  listModels?(): Promise<ModelInfo[]>;
}

function createProvider(type: ProviderType, config: ProviderConfig): LLMProvider;
```

### shadcn/ui Components
Use shadcn/ui for consistent, accessible, dark-mode-ready components:
- Dialog, Sheet, Popover for modals
- Button, Input, Textarea for forms
- Select, Dropdown for selections
- Card, Alert for display
- Tabs for navigation

### State Management with Zustand
```typescript
const useChatStore = create<ChatState>()(...);
const useProviderStore = create<ProviderState>()(...);
const usePermissionStore = create<PermissionState>()(...);
```

### Chrome Storage Wrapper
Abstraction over chrome.storage.local for typed access:
```typescript
class Storage {
  async get<T>(key: string): Promise<T | null>;
  async set<T>(key: string, value: T): Promise<void>;
  async remove(key: string): Promise<void>;
}
```

### CDP Wrapper
Encapsulate chrome.debugger API for browser control:
```typescript
class CDPWrapper {
  async attachDebugger(tabId: number): Promise<void>;
  async sendCommand(tabId: number, method: string, params?: object): Promise<any>;
  async click(tabId: number, x: number, y: number): Promise<void>;
  async type(tabId: number, text: string): Promise<void>;
  async screenshot(tabId: number): Promise<ScreenshotResult>;
}
```

## Development Guidelines

### File Organization
- `/src/sidepanel/` - Side panel React app
- `/src/background/` - Service worker
- `/src/content/` - Content scripts
- `/src/providers/` - LLM provider implementations
- `/src/tools/` - Browser tools
- `/src/components/` - Shared React components
- `/src/lib/` - Utilities

### Naming Conventions
- Components: PascalCase (`ChatMessage.tsx`)
- Hooks: camelCase with `use` prefix (`useProvider.ts`)
- Types: PascalCase (`LLMProvider.ts`)
- Utils: camelCase (`storage.ts`)

### Testing
- Unit tests for providers and tools
- Integration tests for E2E flows
