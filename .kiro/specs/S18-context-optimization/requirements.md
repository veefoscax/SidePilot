# S18: Context Optimization & Smart Navigation

## Overview

Optimize browser automation token usage through ref-based element targeting, snapshot filtering, incremental updates, and context budget management. Inspired by [Vercel agent-browser](https://github.com/vercel-labs/agent-browser) patterns.

## Problem Statement

Current SidePilot browser automation is token-inefficient:
- Full accessibility tree sent every time (~2000-5000 tokens)
- Full CSS selectors in each tool call (~50-200 tokens)
- No caching between tool calls
- No incremental updates for unchanged DOM

**Goal: Reduce token usage by 60-90% per browser task**

---

## User Stories

### US1: Ref-Based Element Targeting
**As an** AI agent  
**I want** a ref-based targeting system  
**So that** I can reference elements with minimal tokens (@e1 instead of full CSS selectors)

### US2: Filtered Snapshots
**As a** user  
**I want** filtered page snapshots  
**So that** the AI doesn't waste context on irrelevant elements

### US3: Incremental Updates
**As an** AI agent  
**I want** incremental DOM updates  
**So that** I don't resend unchanged context on every tool call

### US4: Context Budget Awareness
**As a** power user  
**I want** context budget tracking  
**So that** tasks don't fail mid-execution due to limit overflow

### US5: Smart Action Suggestions
**As an** AI  
**I want** page-aware action suggestions  
**So that** I can complete tasks faster with fewer iterations

---

## Acceptance Criteria

### AC1: Ref System
- **AC1.1**: Every interactive element gets a short ref (e1, e2, e3...)
- **AC1.2**: Refs persist during page session until navigation
- **AC1.3**: All interaction tools (click, fill, etc.) accept @ref format
- **AC1.4**: Ref lookup is O(1) via WeakMap cache
- **AC1.5**: Refs are assigned deterministically (same DOM = same refs)

### AC2: Snapshot Filtering
- **AC2.1**: Interactive-only mode filters to buttons, links, inputs, selects, textareas
- **AC2.2**: Depth limit option (e.g., depth=3)
- **AC2.3**: Selector scope option (e.g., scope="#main")
- **AC2.4**: Compact mode removes empty/structural nodes
- **AC2.5**: Filtering reduces output by 60%+ on average pages

### AC3: Incremental Updates
- **AC3.1**: Hash-based change detection for DOM sections
- **AC3.2**: Delta format shows only mutations since last snapshot
- **AC3.3**: Smart refresh triggers on navigation, significant DOM mutation
- **AC3.4**: Delta mode reduces repeated snapshots by 80%+

### AC4: Context Budget
- **AC4.1**: Token counting utility for tool outputs (tiktoken or estimate)
- **AC4.2**: Automatic compression at 70% budget threshold
- **AC4.3**: Progressive detail reduction: full → interactive → clickable → summary
- **AC4.4**: Warning callback when approaching limit

### AC5: Smart Suggestions
- **AC5.1**: Page type detection (form, list, article, dashboard)
- **AC5.2**: Form detection → suggest fill/submit actions
- **AC5.3**: List/table detection → suggest scroll/pagination
- **AC5.4**: Login detection → suggest authentication flow
- **AC5.5**: Suggestions included in snapshot output

---

## Technical Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| TR1 | Ref resolution latency | <5ms |
| TR2 | Snapshot filter reduction | 60%+ average |
| TR3 | Delta update reduction | 80%+ on stable pages |
| TR4 | Token estimation accuracy | ±10% of actual |
| TR5 | No breaking changes | Existing tools remain compatible |
| TR6 | Memory overhead | <1MB for ref cache |

---

## Non-Goals (Future Work)

- Server-side ref caching (for now, client-only)
- Visual diff of pages
- Cross-tab ref sharing
- Automatic retry optimization
