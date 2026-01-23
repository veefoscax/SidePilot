# S19: Element Pointer (Simplified)

## Overview

Simple element pointing for AI agent interaction. User clicks elements, agent gets refs.

**Scope**: Browser only, minimal complexity for hackathon.

---

## User Story

**As a** user  
**I want to** point at elements on a web page  
**So that** the AI agent knows which element I'm referring to

---

## Acceptance Criteria

- AC1: Click "🎯" button to activate element pointer mode
- AC2: Hovering highlights element with border
- AC3: Clicking element selects it and assigns S18 ref
- AC4: Optional comment input appears after selection
- AC5: "Done" or Enter sends selection to chat
- AC6: Agent receives: ref (@e5), position, comment

---

## Agent Context Format

```
User pointed at element:
- Ref: @e5
- Position: (245, 380)
- Size: 120x40
- Text: "Submit"
- Comment: "click this button"
```

Agent can then use: `click('@e5')`

---

## Technical Requirements

| ID | Requirement |
|----|-------------|
| TR1 | Uses S18 refManager for element refs |
| TR2 | Content script for overlay |
| TR3 | No external dependencies |
| TR4 | Browser tab only (no desktop) |

---

## Out of Scope (Hackathon)

- ❌ Desktop capture
- ❌ Multi-element selection
- ❌ Text selection
- ❌ Complex output formats
- ❌ Selector generation for grep
