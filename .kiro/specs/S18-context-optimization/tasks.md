# S18: Context Optimization & Smart Navigation - Tasks

> **Reference Workflow**: See `.kiro/steering/workflow.md` for execution guidelines.

## Overview

Implement token-efficient browser automation through ref-based targeting, snapshot filtering, incremental updates, and context budget management.

**Expected Impact**: 60-90% reduction in tokens per browser task.

---

## Phase 1: Ref System (OPUS-PAUSE)

- [x] 1. Context Types Definition
  - Create `src/lib/context/types.ts`
  - Define RefMap, RefMetadata, RefManagerOptions interfaces
  - Define SnapshotFilterOptions, FilteredSnapshot types
  - Define DeltaState, DeltaResult interfaces
  - Define BudgetOptions, BudgetUsage types
  - _Requirements: TR5_

- [x] 2. Ref Manager Implementation
  - Create `src/lib/context/ref-manager.ts`
  - Implement ref assignment with deterministic ordering
  - Implement WeakMap-based element → ref cache
  - Implement ref resolution (string → Element)
  - Add navigation detection for cache invalidation
  - _Requirements: AC1.1, AC1.2, AC1.4, AC1.5, TR1_

- [x] 3. Tool Ref Resolution
  - Update click, fill, hover, etc. to accept @ref format
  - Add ref resolution before element lookup
  - Handle stale ref errors gracefully
  - Maintain backward compatibility with CSS selectors
  - _Requirements: AC1.3, TR5_

## Phase 2: Snapshot Filtering (OPUS-PAUSE)

- [x] 4. Snapshot Filter Implementation
  - Create `src/lib/context/snapshot-filter.ts`
  - Implement interactive-only filter (button, link, input, etc.)
  - Implement depth limiting
  - Implement selector scoping
  - Implement compact mode (remove empty nodes)
  - _Requirements: AC2.1, AC2.2, AC2.3, AC2.4_

- [x] 5. Filter Integration
  - Update `get_page_content` tool with filter options
  - Add ref annotations to output
  - Measure and log reduction statistics
  - Verify 60%+ reduction target
  - _Requirements: AC2.5, TR2_

- [ ] 6. Context Module Index
  - Create `src/lib/context/index.ts`
  - Export all public APIs
  - Add usage examples in comments

## Phase 3: Incremental Updates (OPUS-RECOMMENDED)

- [x] 7. Delta Detector Implementation
  - Create `src/lib/context/delta-detector.ts`
  - Implement hash-based change detection
  - Implement delta format (added, removed, modified)
  - Add smart refresh triggers
  - _Requirements: AC3.1, AC3.2, AC3.3_

- [x] 8. Delta Mode Integration
  - Add `delta` option to `get_page_content`
  - Return delta format when no significant changes
  - Handle navigation-triggered full refresh
  - Verify 80%+ reduction for stable pages
  - _Requirements: AC3.4, TR3_

## Phase 4: Budget Management (OPUS-RECOMMENDED)

- [x] 9. Budget Manager Implementation
  - Create `src/lib/context/budget-manager.ts`
  - Implement token estimation (chars/4 heuristic)
  - Implement usage tracking by category
  - Implement compression level determination
  - _Requirements: AC4.1, AC4.3_

- [x] 10. Automatic Compression
  - Integrate budget manager with snapshot output
  - Trigger compression at configurable thresholds
  - Add warning callbacks for approaching limits
  - Progressive detail reduction (full → interactive → summary)
  - _Requirements: AC4.2, AC4.4, TR4_

## Phase 5: Smart Suggestions (AUTO-OK)

- [x] 11. Page Type Detection
  - Create `src/lib/context/smart-suggester.ts`
  - Implement page type detection (login, form, list, search)
  - Confidence scoring based on indicator matches
  - _Requirements: AC5.1_

- [x] 12. Action Suggestions
  - Implement suggestion generation per page type
  - Form → suggest fill/submit
  - List → suggest scroll/pagination
  - Login → suggest auth flow
  - _Requirements: AC5.2, AC5.3, AC5.4_

- [x] 13. Suggestions Integration
  - Add `includeSuggestions` option to snapshot
  - Output suggestions with priority ranking
  - _Requirements: AC5.5_

## Phase 6: Testing & Documentation (AUTO-OK)

- [ ] 14. Unit Tests
  - Test ref assignment determinism
  - Test filter accuracy
  - Test delta detection
  - Test token estimation
  - Create test fixtures for common page patterns

- [ ] 15. Integration Tests
  - End-to-end ref workflow
  - Tool calls with refs
  - Budget warning triggers
  - Performance benchmarks

- [ ] 16. Documentation
  - Update tool documentation
  - Add examples for ref-based workflow
  - Document filter options
  - Add context optimization guide

---

## Checkpoints

### After Phase 1 (Task 3)
- [ ] Refs assigned to interactive elements
- [ ] Tools accept @ref format
- [ ] Backward compatible with CSS selectors

### After Phase 2 (Task 6)
- [ ] Filter options working
- [ ] 60%+ reduction measured
- [ ] Ref annotations in output

### After Phase 3 (Task 8)
- [ ] Delta mode working
- [ ] 80%+ reduction for stable pages
- [ ] Navigation triggers full refresh

### After Phase 4 (Task 10)
- [ ] Token tracking functional
- [ ] Auto-compression at thresholds
- [ ] Warning callbacks firing

### Final (Task 16)
- [ ] All tests passing
- [ ] Performance targets met
- [ ] Documentation complete

---

## Notes

- Phase 1 is most critical for token savings - prioritize ref system
- Test with real-world pages (forms, dashboards, lists)
- Monitor memory usage of ref cache on long sessions
- Consider lazy ref assignment for large pages
