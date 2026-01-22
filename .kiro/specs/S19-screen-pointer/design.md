# S19: Screen Pointer & Annotation - Design

## Architecture Overview

```
┌───────────────────────────────────────────────────────────────┐
│                      SidePilot Extension                       │
├───────────────────┬───────────────────┬───────────────────────┤
│   Capture Layer   │ Annotation Layer  │    Export Layer       │
│                   │                   │                       │
│ ┌───────────────┐ │ ┌───────────────┐ │ ┌───────────────────┐ │
│ │ScreenCapture  │ │ │AnnotationCanvas│ │ │AnnotationExporter│ │
│ │   Service     │ │ │  (Fabric.js)  │ │ │                   │ │
│ └───────────────┘ │ └───────────────┘ │ └───────────────────┘ │
│                   │ ┌───────────────┐ │                       │
│ getDisplayMedia   │ │  ToolPalette  │ │  PNG + JSON Export   │
│ desktopCapture    │ │               │ │                       │
└───────────────────┴───────────────────┴───────────────────────┘
```

---

## Module Design

### 1. ScreenCaptureService

**File**: `src/lib/screen-capture/capture-service.ts`

```typescript
interface CaptureOptions {
  type: 'screen' | 'window' | 'tab';
  audio?: boolean;
  resolution?: { width: number; height: number };
}

interface CaptureResult {
  stream: MediaStream;
  displaySurface: string;
  frameRate: number;
}

class ScreenCaptureService {
  // Request screen capture permission
  requestCapture(options: CaptureOptions): Promise<CaptureResult>;
  
  // Capture single frame as ImageData
  captureFrame(): Promise<ImageBitmap>;
  
  // Stop ongoing capture
  stopCapture(): void;
  
  // Check if capture is active
  isCapturing(): boolean;
}
```

**Implementation Details**:
- Uses `navigator.mediaDevices.getDisplayMedia()` for web
- Supports desktop, window, and tab selection
- Extracts frames using `<video>` + canvas

---

### 2. AnnotationCanvas

**File**: `src/lib/screen-capture/annotation-canvas.ts`

```typescript
interface Annotation {
  id: string;
  type: 'arrow' | 'circle' | 'rectangle' | 'freehand' | 'highlight';
  coordinates: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    points?: { x: number; y: number }[];
  };
  color: string;
  label?: string;
  timestamp: number;
}

interface AnnotationCanvasOptions {
  width: number;
  height: number;
  backgroundImage?: string;
}

class AnnotationCanvas {
  // Initialize Fabric.js canvas
  constructor(container: HTMLElement, options: AnnotationCanvasOptions);
  
  // Set background from captured screenshot
  setBackground(image: ImageBitmap | string): Promise<void>;
  
  // Drawing tools
  setTool(tool: AnnotationType): void;
  setColor(color: string): void;
  
  // Undo/redo
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
  
  // Export
  getAnnotations(): Annotation[];
  toDataURL(format?: 'png' | 'jpeg'): string;
  toJSON(): object;
  
  // Clear
  clear(): void;
  
  // Cleanup
  dispose(): void;
}
```

**Fabric.js Integration**:
- Arrow: Custom arrow shape with head
- Circle: `fabric.Circle` with transparent fill
- Rectangle: `fabric.Rect` with transparent fill
- Freehand: `fabric.PencilBrush`
- Highlight: Semi-transparent `fabric.Rect`

---

### 3. React Components

#### ScreenPointer Component
**File**: `src/components/screen/ScreenPointer.tsx`

```tsx
interface ScreenPointerProps {
  onCapture: (annotatedImage: Blob, annotations: Annotation[]) => void;
  onCancel: () => void;
}

function ScreenPointer({ onCapture, onCancel }: ScreenPointerProps): JSX.Element;
```

Main overlay component that:
- Contains ToolPalette and AnnotationOverlay
- Handles capture flow
- Exports annotated result

#### ToolPalette Component
**File**: `src/components/screen/ToolPalette.tsx`

```tsx
interface ToolPaletteProps {
  selectedTool: AnnotationType;
  onToolChange: (tool: AnnotationType) => void;
  selectedColor: string;
  onColorChange: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onClear: () => void;
  onDone: () => void;
  onCancel: () => void;
}
```

Floating toolbar with:
- Tool buttons (Arrow, Circle, Rectangle, Freehand, Highlight)
- Color picker
- Undo/Redo buttons
- Clear, Done, Cancel buttons

---

### 4. Integration with Chat

**Workflow**:
1. User clicks "Screen Pointer" button in InputArea
2. ScreenPointer overlay opens
3. getDisplayMedia permission requested
4. User selects screen/window/tab
5. Screenshot displayed in annotation canvas
6. User draws annotations
7. User clicks "Send to AI"
8. Annotated image + coordinates attached to message
9. LLM receives image with annotation context

**Context for LLM**:
```json
{
  "type": "screen_annotation",
  "image": "<base64_png>",
  "annotations": [
    {
      "type": "arrow",
      "from": { "x": 0.2, "y": 0.3 },
      "to": { "x": 0.5, "y": 0.4 },
      "color": "#ff0000",
      "label": "User pointed here"
    }
  ]
}
```

---

## File Structure

```
src/
├── lib/
│   └── screen-capture/
│       ├── capture-service.ts    # getDisplayMedia wrapper
│       ├── annotation-canvas.ts  # Fabric.js wrapper
│       ├── types.ts              # Type definitions
│       └── index.ts              # Exports
│
└── components/
    └── screen/
        ├── ScreenPointer.tsx     # Main overlay component
        ├── ToolPalette.tsx       # Tool selection UI
        ├── AnnotationOverlay.tsx # Fabric canvas wrapper
        ├── ColorPicker.tsx       # Color selection
        └── index.ts              # Exports
```

---

## Dependencies

```json
{
  "dependencies": {
    "fabric": "^6.0.0"
  },
  "devDependencies": {
    "@types/fabric": "^5.3.0"
  }
}
```

---

## Performance Considerations

1. **Image Sizing**: Max 1920x1080 for LLM efficiency
2. **Canvas Rendering**: Use `fabric.Canvas` with retina scaling
3. **Memory**: Dispose canvas on component unmount
4. **Live Mode**: Delta detection, max 5 fps

---

## Testing Strategy

### Unit Tests
- AnnotationCanvas: Draw, undo, redo, export
- ScreenCaptureService: Mock MediaStream
- Coordinate normalization

### Integration Tests
- Full capture → annotate → export flow
- Permission handling
- Canvas resize on different screens

### E2E Tests
- Browser automation with Playwright
- Permission dialog handling (mock)
