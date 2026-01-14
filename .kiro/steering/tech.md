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

## Icon Usage with Hugeicons

### Correct Pattern (ALWAYS USE THIS)

Hugeicons requires a two-part import pattern:
1. Import the `HugeiconsIcon` wrapper component from `@hugeicons/react`
2. Import icon definitions from `@hugeicons/core-free-icons`
3. Render using the wrapper with the icon definition

```typescript
// ✅ CORRECT - Import wrapper and definitions separately
import { HugeiconsIcon } from '@hugeicons/react';
import { 
  Rocket01Icon, 
  CheckmarkCircle02Icon,
  Alert02Icon 
} from '@hugeicons/core-free-icons';

// ✅ CORRECT - Use wrapper with icon definition
function MyComponent() {
  return (
    <div>
      <HugeiconsIcon icon={Rocket01Icon} className="h-5 w-5 text-primary" />
      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
    </div>
  );
}
```

### Incorrect Patterns (NEVER USE THESE)

```typescript
// ❌ WRONG - Direct icon imports don't exist in the package
import { RocketIcon, CheckCircleIcon } from '@hugeicons/react';

// ❌ WRONG - Direct usage will cause TypeScript errors
<RocketIcon className="h-5 w-5" />
<CheckCircleIcon className="h-4 w-4" />
```

### Why This Pattern?

The `@hugeicons/react` package only exports the `HugeiconsIcon` wrapper component. The actual icon definitions (SVG paths) are in `@hugeicons/core-free-icons`. This separation allows:
- Tree-shaking: Only bundle icons you actually use
- Type safety: TypeScript knows which icons exist
- Consistency: All icons render through the same wrapper

### Common Icon Mappings

Use this reference when you need an icon for a specific purpose:

| Use Case | Icon Name | Import | Color Guidance |
|----------|-----------|--------|----------------|
| **Status Icons** |
| Success, Completed | `CheckmarkCircle02Icon` | `@hugeicons/core-free-icons` | `text-green-500` |
| Error, Failed | `Alert02Icon` | `@hugeicons/core-free-icons` | `text-red-500` |
| Warning, Caution | `Alert02Icon` | `@hugeicons/core-free-icons` | `text-yellow-500` |
| Info, Help | `InformationCircleIcon` | `@hugeicons/core-free-icons` | `text-blue-500` |
| Loading, Processing | `Loading01Icon` | `@hugeicons/core-free-icons` | `animate-spin` |
| Connected | `CheckmarkCircle01Icon` | `@hugeicons/core-free-icons` | `text-green-500` |
| Disconnected | `Cancel01Icon` | `@hugeicons/core-free-icons` | `text-red-500` |
| **Action Icons** |
| Add, Create | `Add01Icon` | `@hugeicons/core-free-icons` | - |
| Edit, Modify | `Edit02Icon` | `@hugeicons/core-free-icons` | - |
| Delete, Remove | `Delete01Icon` | `@hugeicons/core-free-icons` | `text-destructive` |
| Save | `Save` | `@hugeicons/core-free-icons` | - |
| Download | `Download01Icon` | `@hugeicons/core-free-icons` | - |
| **Navigation Icons** |
| External Link | `LinkExternal02Icon` | `@hugeicons/core-free-icons` | `text-primary` |
| Drag Handle | `DragDropVerticalIcon` | `@hugeicons/core-free-icons` | `text-muted-foreground` |
| **Feature Icons** |
| Rocket, Launch | `Rocket01Icon` | `@hugeicons/core-free-icons` | `text-primary` |
| Cloud, AI | `AiCloud01Icon` | `@hugeicons/core-free-icons` | `text-blue-500` |
| Code, Development | `SourceCodeIcon` | `@hugeicons/core-free-icons` | `text-purple-500` |

### Finding Icons

1. **Check the mapping table above** for common use cases
2. **Browse the package**: Look at `node_modules/@hugeicons/core-free-icons/dist/index.d.ts`
3. **Hugeicons website**: https://hugeicons.com (search and copy icon names)
4. **Naming pattern**: Icons typically end with `Icon` and may have numbers (e.g., `01`, `02`)

### Example: Complete Component

```typescript
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  Loading01Icon,
  Rocket01Icon
} from '@hugeicons/core-free-icons';

export function StatusExample() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  return (
    <div className="space-y-4">
      <Button onClick={() => setStatus('loading')}>
        <HugeiconsIcon icon={Rocket01Icon} className="h-4 w-4 mr-2" />
        Launch
      </Button>

      {status === 'loading' && (
        <Alert>
          <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 animate-spin" />
          <AlertDescription>Processing...</AlertDescription>
        </Alert>
      )}

      {status === 'success' && (
        <Alert>
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
          <AlertDescription>Success!</AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert variant="destructive">
          <HugeiconsIcon icon={Alert02Icon} className="h-4 w-4" />
          <AlertDescription>Something went wrong</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

### Package Versions

- `@hugeicons/react`: v1.1.4
- `@hugeicons/core-free-icons`: v3.1.1

### Troubleshooting

**Error: "Module has no exported member 'XIcon'"**
- Solution: Check the icon name in `@hugeicons/core-free-icons`. Icon names may differ from what you expect (e.g., `CheckmarkCircle02Icon` not `CheckCircleIcon`)

**Error: "Cannot find name 'XIcon'"**
- Solution: You're trying to use an icon directly. Use `<HugeiconsIcon icon={XIcon} />` instead

**Icon not rendering**
- Solution: Verify you imported both `HugeiconsIcon` and the icon definition
- Check that you're using the wrapper pattern correctly

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

### Documentation Rules
- **DEVLOG.md is the single source of truth** - All development progress, fixes, and debugging sessions are documented in DEVLOG.md
- **Do not create separate documentation files** - No standalone fix summaries, debugging guides, or status reports outside DEVLOG.md
- **Document only after verification** - Do not add entries to DEVLOG.md until the fix is confirmed working through testing
- **Exception**: Specs in `.kiro/specs/` are the only other documentation allowed (requirements, design, tasks)

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
