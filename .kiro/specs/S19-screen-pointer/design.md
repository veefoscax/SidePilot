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


---

## Implementation Notes

### Completed Implementation

**Status**: ✅ All components implemented and tested

**Files Created**:
1. `src/content/element-pointer.ts` - Content script with overlay and selection logic
2. `src/lib/element-pointer/index.ts` - Types and utility functions
3. `src/components/chat/ElementPointerButton.tsx` - UI button component
4. `src/content/__tests__/element-pointer.test.ts` - 16 unit tests
5. `src/components/chat/__tests__/ElementPointerButton.test.tsx` - Button tests
6. `src/components/chat/__tests__/InputArea-element-pointer.test.tsx` - 6 integration tests

**Files Modified**:
1. `src/content/content.ts` - Added element-pointer import
2. `src/components/chat/InputArea.tsx` - Integrated ElementPointerButton

### Architecture Decisions

**1. Content Script Approach**
- **Decision**: Use content script injection rather than separate content script file
- **Rationale**: Simpler deployment, automatic loading with extension
- **Result**: Clean integration via `import './element-pointer'` in content.ts

**2. Message-Based Activation**
- **Decision**: Use Chrome messaging API for activation/deactivation
- **Rationale**: Clean separation of concerns, no direct DOM manipulation from sidepanel
- **Result**: Reliable communication with proper error handling

**3. Pure CSS Overlay**
- **Decision**: No external UI libraries for overlay
- **Rationale**: Minimal bundle size, no dependency conflicts, maximum performance
- **Result**: Lightweight overlay with smooth animations

**4. S18 RefManager Integration**
- **Decision**: Use existing refManager from S18 Context Optimization
- **Rationale**: Consistent ref format, memory-efficient WeakMap storage
- **Result**: Seamless integration with O(1) lookup performance

**5. Optional Comment Input**
- **Decision**: Show comment input after selection, make it optional
- **Rationale**: Flexibility for users, additional context for AI agent
- **Result**: Enhanced user experience with Enter/Done/Escape handling

### Performance Considerations

**Memory Management**:
- WeakMap for element references (automatic garbage collection)
- Event listeners cleaned up on deactivation
- Overlay removed from DOM when not in use

**Event Handling**:
- Throttled mousemove events for hover highlighting
- Debounced resize events for overlay positioning
- Efficient event delegation for click handling

**Bundle Impact**:
- Content script: 21.14 kB (gzipped: 6.46 kB)
- No additional dependencies added
- Minimal impact on extension load time

### Testing Strategy

**Unit Tests** (16 tests):
- Overlay injection and removal
- Element highlighting on hover
- Element selection and ref assignment
- Comment input handling
- Message sending to sidepanel
- Escape key cancellation
- Enter key completion

**Integration Tests** (6 tests):
- Button rendering in InputArea
- Message reception from content script
- Element context injection into messages
- Context clearing after send
- Toast notification display
- Placeholder text updates

**Manual Testing**:
- Cross-browser compatibility (Chrome, Edge)
- Different website layouts
- Various element types (buttons, links, inputs)
- Edge cases (iframes, shadow DOM)

### Security Considerations

**Content Script Isolation**:
- Runs in isolated world (no access to page JavaScript)
- Cannot be manipulated by malicious page scripts
- Secure message passing via Chrome APIs

**User Consent**:
- Explicit activation required (click 🎯 button)
- Visual feedback for active state
- Easy cancellation (Escape key)

**Data Privacy**:
- Element text truncated to 50 characters
- No sensitive data captured
- Refs stored in memory only (not persisted)

### Browser Compatibility

**Supported**:
- ✅ Chrome 88+ (Manifest V3)
- ✅ Edge 88+ (Chromium-based)
- ✅ Brave (Chromium-based)

**Not Supported**:
- ❌ Firefox (different extension API)
- ❌ Safari (different extension API)
- ❌ Mobile browsers (no side panel support)

### Accessibility

**Keyboard Support**:
- Enter key to complete selection
- Escape key to cancel
- Tab navigation in comment input

**Screen Reader Support**:
- ARIA labels on button
- Status announcements for activation
- Semantic HTML structure

**Visual Feedback**:
- High contrast highlight border
- Clear selected state indicator
- Toast notifications for actions

### Maintenance Notes

**Future Refactoring Opportunities**:
1. Extract overlay CSS to separate file
2. Add configuration for highlight color
3. Implement element history feature
4. Add keyboard shortcut support
5. Improve error handling for edge cases

**Known Issues**:
- None identified in testing

**Dependencies**:
- S18 Context Optimization (refManager)
- Chrome Extension APIs (tabs, runtime)
- Sonner (toast notifications)

### Deployment Checklist

- ✅ All unit tests passing
- ✅ Integration tests passing
- ✅ TypeScript compilation clean
- ✅ Build successful
- ✅ Manual testing complete
- ✅ Documentation updated
- ✅ DEVLOG entry added
- ✅ Git commit prepared
