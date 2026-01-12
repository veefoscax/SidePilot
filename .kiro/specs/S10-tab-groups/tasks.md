# S10: Tab Groups - Tasks

## Implementation Checklist

### 1. Core Implementation
- [ ] Create `src/lib/tab-groups.ts` <!-- id: 0 -->
- [ ] Implement `TabGroupManager` class <!-- id: 1 -->
- [ ] Implement `createGroup()` method <!-- id: 2 -->
- [ ] Implement `updateGroup()` method <!-- id: 3 -->
- [ ] Implement `ungroupTabs()` method <!-- id: 4 -->
- [ ] Implement `listGroups()` method <!-- id: 5 -->

### 2. Tool Integration
- [ ] Create `src/tools/tab-groups.ts` <!-- id: 6 -->
- [ ] Define tool parameters and schema <!-- id: 7 -->
- [ ] Implement execute function for all actions <!-- id: 8 -->
- [ ] Add to tool registry <!-- id: 9 -->

### 3. Testing
- [ ] Test create group with multiple tabs <!-- id: 10 -->
- [ ] Test update group color and title <!-- id: 11 -->
- [ ] Test collapse/expand group <!-- id: 12 -->
- [ ] Test ungroup tabs <!-- id: 13 -->
- [ ] Test list all groups <!-- id: 14 -->

### 4. Automated Testing (Playwright)
- [ ] Install Playwright dependencies <!-- id: 15 -->
- [ ] Create static build verification tests (verify dist/ output size & content) <!-- id: 16 -->
- [ ] Create integration tests for UI/Logic <!-- id: 17 -->
- [ ] Add test script to package.json <!-- id: 18 -->
- [ ] Update DEVLOG with test results and screenshots <!-- id: 19 -->
