# S09: Workflow Recording - Tasks

## Implementation Checklist

### 1. Types
- [ ] Create src/lib/workflow.ts
- [ ] Define WorkflowStep interface
- [ ] Define WorkflowRecording interface

### 2. Workflow Store
- [ ] Create src/stores/workflow.ts
- [ ] Implement startRecording
- [ ] Implement captureStep with screenshot
- [ ] Implement stopRecording
- [ ] Implement cancelRecording
- [ ] Implement deleteStep
- [ ] Implement updateStepDescription

### 3. Recording Bar
- [ ] Create src/components/RecordingBar.tsx
- [ ] Show recording indicator
- [ ] Show step count
- [ ] Stop/Cancel buttons

### 4. Step Preview
- [ ] Create src/components/WorkflowStepCard.tsx
- [ ] Show screenshot thumbnail
- [ ] Show action description
- [ ] Edit description
- [ ] Delete step button

### 5. Recording Modal
- [ ] Create src/components/WorkflowEditor.tsx
- [ ] Name input
- [ ] Steps list
- [ ] Save as shortcut button
- [ ] Discard button

### 6. Generate Prompt
- [ ] Implement generateWorkflowPrompt
- [ ] Include all step descriptions
- [ ] Format for AI understanding

### 7. Integration
- [ ] Add to slash menu
- [ ] Hook step capture to CDP actions
- [ ] Save result as shortcut

## Success Criteria
- Recording captures screenshots and actions
- Steps display in preview
- Workflow saves as shortcut
- Generated prompt is clear
