# Implement Spec

Use this prompt to implement a spec with Kiro.

## Usage
```
/implement-spec S01-extension-scaffold
```

## Instructions

You are implementing a spec from the `.kiro/specs/` directory.

1. **Read the spec files**:
   - `requirements.md` - Understand acceptance criteria (EARS notation)
   - `design.md` - Follow the architecture and code patterns
   - `tasks.md` - Complete each task in order

2. **Check dependencies**:
   - Review specs that this spec depends on
   - Ensure dependent features are already implemented

3. **Implementation approach**:
   - Follow the exact TypeScript interfaces in design.md
   - Use shadcn/ui components as specified
   - Follow project structure in `.kiro/steering/structure.md`

4. **Mark progress**:
   - Update tasks.md checkboxes as you complete items
   - Use `- [x]` for completed, `- [/]` for in-progress

5. **Test after completion**:
   - Verify acceptance criteria are met
   - Check TypeScript has no errors
   - Test in browser if applicable

## Tech Stack Reference
- Build: Vite 5
- UI: React 18 + TypeScript
- Styling: Tailwind + shadcn/ui
- State: Zustand
- Extension: Manifest V3
