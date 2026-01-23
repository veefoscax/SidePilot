# S19: Element Pointer - Design (Simplified)

## Architecture

```
┌─────────────────────────────────────────────────┐
│                SidePilot Extension               │
├─────────────────────────────────────────────────┤
│  SidePanel          │    Content Script          │
│                     │                            │
│ ┌─────────────────┐ │ ┌────────────────────────┐ │
│ │ Pointer Button  │→│ │  Element Overlay       │ │
│ └─────────────────┘ │ │  - Hover highlight     │ │
│                     │ │  - Click to select     │ │
│ ┌─────────────────┐ │ │  - Comment input       │ │
│ │ Chat Message    │←│ │                        │ │
│ │ with Selection  │ │ └────────────────────────┘ │
│ └─────────────────┘ │                            │
└─────────────────────┴────────────────────────────┘
```

---

## Components

### 1. ElementPointer Content Script

**File**: `src/content/element-pointer.ts`

```typescript
interface PointedElement {
  ref: string;        // S18 ref (@e5)
  x: number;          // Position X
  y: number;          // Position Y
  width: number;      // Element width
  height: number;     // Element height
  text: string;       // Text content (truncated)
  comment?: string;   // User comment
}

// Activate overlay
function activate(): void;

// Deactivate overlay
function deactivate(): void;

// Get pointed element
function getSelection(): PointedElement | null;
```

### 2. Overlay UI (Pure CSS)

```html
<div id="sp-pointer-overlay">
  <div class="sp-highlight" />      <!-- Hover highlight -->
  <div class="sp-selected" />       <!-- Selected element mark -->
  <input class="sp-comment" />      <!-- Comment input -->
  <button class="sp-done">Done</button>
</div>
```

### 3. ElementPointerButton

**File**: `src/components/chat/ElementPointerButton.tsx`

Simple button that sends message to content script to activate.

---

## Message Flow

```
1. User clicks 🎯 button
         ↓
2. sendMessage('ACTIVATE_POINTER')
         ↓
3. Content script injects overlay
         ↓
4. User hovers (element highlighted)
         ↓
5. User clicks (element selected)
         ↓
6. User types comment + Enter
         ↓
7. sendMessage('ELEMENT_POINTED', { ref, position, comment })
         ↓
8. SidePanel adds to chat context
```

---

## S18 Integration

```typescript
import { refManager } from '@/lib/context';

// When user clicks element:
const ref = refManager.assignRef(clickedElement);
// Returns: '@e5'

// Agent can then use:
// click('@e5')
```

---

## Files

```
src/
├── content/
│   └── element-pointer.ts    # Content script
├── lib/
│   └── element-pointer/
│       └── index.ts          # Types + helpers
└── components/
    └── chat/
        └── ElementPointerButton.tsx
```
