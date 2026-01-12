# S09: Workflow Recording - Tasks

## Implementation Checklist

### 1. Types
- [ ] Create src/lib/workflow.ts <!-- id: 0 -->
- [ ] Define WorkflowStep interface <!-- id: 1 -->
- [ ] Define WorkflowRecording interface <!-- id: 2 -->

### 2. Workflow Store
- [ ] Create src/stores/workflow.ts <!-- id: 3 -->
- [ ] Implement startRecording <!-- id: 4 -->
- [ ] Implement captureStep with screenshot <!-- id: 5 -->
- [ ] Implement stopRecording <!-- id: 6 -->
- [ ] Implement cancelRecording <!-- id: 7 -->
- [ ] Implement deleteStep <!-- id: 8 -->
- [ ] Implement updateStepDescription <!-- id: 9 -->

### 3. Recording Bar
- [ ] Create src/components/RecordingBar.tsx <!-- id: 10 -->
- [ ] Show recording indicator <!-- id: 11 -->
- [ ] Show step count <!-- id: 12 -->
- [ ] Stop/Cancel buttons <!-- id: 13 -->

### 4. Step Preview
- [ ] Create src/components/WorkflowStepCard.tsx <!-- id: 14 -->
- [ ] Show screenshot thumbnail <!-- id: 15 -->
- [ ] Show action description <!-- id: 16 -->
- [ ] Edit description <!-- id: 17 -->
- [ ] Delete step button <!-- id: 18 -->

### 5. Recording Modal
- [ ] Create src/components/WorkflowEditor.tsx <!-- id: 19 -->
- [ ] Name input <!-- id: 20 -->
- [ ] Steps list <!-- id: 21 -->
- [ ] Save as shortcut button <!-- id: 22 -->
- [ ] Discard button <!-- id: 23 -->

### 6. Generate Prompt
- [ ] Implement generateWorkflowPrompt <!-- id: 24 -->
- [ ] Include all step descriptions <!-- id: 25 -->
- [ ] Format for AI understanding <!-- id: 26 -->

### 7. Integration
- [ ] Add to slash menu <!-- id: 27 -->
- [ ] Hook step capture to CDP actions <!-- id: 28 -->
- [ ] Save result as shortcut <!-- id: 29 -->

## Success Criteria
- Recording captures screenshots and actions
- Steps display in preview
- Workflow saves as shortcut
- Generated prompt is clear
