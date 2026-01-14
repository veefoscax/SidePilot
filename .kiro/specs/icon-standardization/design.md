# Design Document: Icon Standardization

## Overview

This design establishes a standardized approach for using Hugeicons across the SidePilot codebase. The solution involves updating the tech.md steering file with clear guidelines, fixing all existing components to use the correct pattern, and providing a comprehensive reference for developers.

## Architecture

### Current State (Problematic)

```typescript
// ❌ INCORRECT - Direct icon imports (doesn't exist in package)
import { RocketIcon, CheckCircleIcon } from '@hugeicons/react';

// ❌ INCORRECT - Direct usage
<RocketIcon className="h-5 w-5" />
```

### Target State (Correct)

```typescript
// ✅ CORRECT - Import wrapper and definitions separately
import { HugeiconsIcon } from '@hugeicons/react';
import { Rocket01Icon, CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';

// ✅ CORRECT - Use wrapper with icon definition
<HugeiconsIcon icon={Rocket01Icon} className="h-5 w-5" />
```

## Components and Interfaces

### Icon Usage Pattern

**Standard Import Block:**
```typescript
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Rocket01Icon,
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
  // ... other icons as needed
} from '@hugeicons/core-free-icons';
```

**Standard Rendering Pattern:**
```typescript
<HugeiconsIcon 
  icon={Rocket01Icon} 
  className="h-5 w-5 text-primary" 
/>
```

### Icon Mapping Utility (Optional Enhancement)

For frequently used icons, we could create a utility:

```typescript
// src/lib/icons.ts
import { HugeiconsIcon } from '@hugeicons/react';
import {
  CheckmarkCircle02Icon,
  Alert02Icon,
  InformationCircleIcon,
  Loading01Icon,
} from '@hugeicons/core-free-icons';

export const Icons = {
  Success: CheckmarkCircle02Icon,
  Error: Alert02Icon,
  Warning: Alert02Icon,
  Info: InformationCircleIcon,
  Loading: Loading01Icon,
} as const;

// Usage:
// <HugeiconsIcon icon={Icons.Success} className="..." />
```

## Data Models

### Icon Mapping Reference

| Category | Icon Name | Use Case | Color Guidance |
|----------|-----------|----------|----------------|
| **Status** | CheckmarkCircle02Icon | Success states, completed actions | text-green-500 |
| | Alert02Icon | Errors, warnings, alerts | text-red-500 (error), text-yellow-500 (warning) |
| | InformationCircleIcon | Info messages, help text | text-blue-500 |
| | Loading01Icon | Loading states | animate-spin |
| **Actions** | Add01Icon | Add/create actions | - |
| | Edit02Icon | Edit actions | - |
| | Delete01Icon | Delete actions | text-destructive |
| | Download01Icon | Download actions | - |
| **Navigation** | LinkExternal02Icon | External links | text-primary |
| | DragDropVerticalIcon | Drag handles | text-muted-foreground |
| **Branding** | Rocket01Icon | Performance, speed, launch | text-primary |
| | AiCloud01Icon | Cloud services, AI features | text-blue-500 |
| | SourceCodeIcon | Code-related features | text-purple-500 |

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do.*

### Property 1: Icon Import Consistency
*For any* React component file that uses icons, the imports should follow the standard pattern with HugeiconsIcon from @hugeicons/react and icon definitions from @hugeicons/core-free-icons.
**Validates: Requirements 1.2, 1.3**

### Property 2: Icon Rendering Pattern
*For any* icon rendered in the UI, it should use the `<HugeiconsIcon icon={IconDefinition} />` wrapper pattern rather than direct icon component usage.
**Validates: Requirements 2.3**

### Property 3: Zero TypeScript Errors
*For any* component using icons, when compiled with TypeScript, there should be zero errors related to icon imports or usage.
**Validates: Requirements 2.4, 3.3**

### Property 4: Icon Definition Existence
*For any* icon used in the codebase, the icon definition should exist in the @hugeicons/core-free-icons package.
**Validates: Requirements 3.4**

### Property 5: Documentation Completeness
*For any* common icon use case, there should be a corresponding entry in the tech.md mapping table with the correct Hugeicons icon name.
**Validates: Requirements 4.2, 4.3**

## Error Handling

### Missing Icon Definitions

If an icon doesn't exist in @hugeicons/core-free-icons:
1. Search the Hugeicons documentation for alternatives
2. Document the mapping in tech.md
3. If no alternative exists, consider using a similar icon or creating a custom SVG

### TypeScript Errors

Common errors and solutions:
- **"Module has no exported member"**: Icon name is incorrect or doesn't exist
  - Solution: Check @hugeicons/core-free-icons exports, use correct name
- **"Cannot find name"**: Using icon directly without wrapper
  - Solution: Use `<HugeiconsIcon icon={IconName} />` pattern

## Testing Strategy

### Manual Testing
1. Build the project: `npm run build`
2. Verify zero TypeScript errors related to icons
3. Load extension in Chrome
4. Navigate to Settings > Browser Automation
5. Verify all icons render correctly
6. Check browser console for any icon-related warnings

### Automated Testing
- TypeScript compilation serves as the primary test
- No runtime tests needed for icon rendering (visual verification sufficient)

### Verification Checklist
- [ ] All icon imports use correct pattern
- [ ] All icon usages use HugeiconsIcon wrapper
- [ ] Zero TypeScript errors
- [ ] tech.md updated with guidelines
- [ ] Icon mapping table complete
- [ ] All components render icons correctly

## Implementation Plan

### Phase 1: Documentation (Priority: High)
1. Update `.kiro/steering/tech.md` with icon usage guidelines
2. Add icon mapping reference table
3. Include DO/DON'T examples

### Phase 2: Fix BrowserAutomationSettings (Priority: High)
1. Update imports to use correct pattern
2. Replace all icon usages with HugeiconsIcon wrapper
3. Verify TypeScript compilation
4. Test UI rendering

### Phase 3: Codebase Audit (Priority: Medium)
1. Search for all files importing from @hugeicons
2. Identify files using legacy patterns
3. Create list of files needing updates

### Phase 4: Fix Remaining Components (Priority: Medium)
1. Update each component identified in audit
2. Follow same pattern as BrowserAutomationSettings
3. Verify each component individually

### Phase 5: Verification (Priority: High)
1. Run full TypeScript build
2. Test all affected UI components
3. Update DEVLOG with changes

## Migration Guide for Developers

### Before (Incorrect)
```typescript
import { CheckCircleIcon, ExternalLinkIcon } from '@hugeicons/react';

function MyComponent() {
  return (
    <div>
      <CheckCircleIcon className="h-4 w-4" />
      <ExternalLinkIcon className="h-3 w-3" />
    </div>
  );
}
```

### After (Correct)
```typescript
import { HugeiconsIcon } from '@hugeicons/react';
import { CheckmarkCircle02Icon, LinkExternal02Icon } from '@hugeicons/core-free-icons';

function MyComponent() {
  return (
    <div>
      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4" />
      <HugeiconsIcon icon={LinkExternal02Icon} className="h-3 w-3" />
    </div>
  );
}
```

## References

- Hugeicons React: https://www.npmjs.com/package/@hugeicons/react
- Hugeicons Core Free Icons: https://www.npmjs.com/package/@hugeicons/core-free-icons
- Hugeicons Documentation: https://hugeicons.com/docs
