# S09: Workflow Recording - Requirements

## Feature Description
Step-by-step task recording to teach the AI repeatable workflows (without voice narration).

## User Stories

### US1: Record Workflow
**As a** user
**I want** to record my actions step-by-step
**So that** the AI can learn and repeat them

### US2: View Steps
**As a** user
**I want** to see captured screenshots and actions
**So that** I can review what was recorded

### US3: Save as Shortcut
**As a** user
**I want** to save the workflow as a shortcut
**So that** I can replay it later

## Acceptance Criteria

### AC1: Recording Controls
- [ ] Start recording button
- [ ] Stop recording button
- [ ] Cancel recording button
- [ ] Recording indicator

### AC2: Step Capture
- [ ] Capture screenshot on action
- [ ] Record action type (click, type, navigate)
- [ ] Record action details (coordinates, text)
- [ ] Record URL at each step

### AC3: Step Management
- [ ] View all captured steps
- [ ] Delete individual steps
- [ ] Add notes to steps
- [ ] Reorder steps

### AC4: Generate Prompt
- [ ] Summarize workflow into prompt
- [ ] Include step descriptions
- [ ] Include decision criteria
- [ ] Save as shortcut

## Dependencies
- S05: CDP wrapper (screenshots)
- S08: Shortcuts (save result)
