# S10: Tab Groups - Tasks

## Implementation Checklist

### 1. Core Implementation
- [ ] Create `src/lib/tab-groups.ts`
- [ ] Implement `TabGroupManager` class
- [ ] Implement `createGroup()` method
- [ ] Implement `updateGroup()` method
- [ ] Implement `ungroupTabs()` method
- [ ] Implement `listGroups()` method

### 2. Tool Integration
- [ ] Create `src/tools/tab-groups.ts`
- [ ] Define tool parameters and schema
- [ ] Implement execute function for all actions
- [ ] Add to tool registry

### 3. Testing
- [ ] Test create group with multiple tabs
- [ ] Test update group color and title
- [ ] Test collapse/expand group
- [ ] Test ungroup tabs
- [ ] Test list all groups
