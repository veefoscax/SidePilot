# Implementation Plan: Network & Console Tracking

## Overview

This implementation plan adds network request and console log tracking capabilities using CDP, enabling AI to monitor page activity and debug issues.

## Tasks

- [x] 1. Verify CDP Integration
  - Confirm cdpWrapper.enableNetworkTracking() works
  - Confirm cdpWrapper.enableConsoleTracking() works
  - Confirm cdpWrapper.getNetworkRequests() returns data
  - Confirm cdpWrapper.getConsoleLogs() returns data
  - Test with real page loads
  - _Requirements: AC1_

- [x] 2. Network Tool Implementation
  - Create src/tools/network.ts
  - Implement tool with filter parameter (url, method, status)
  - Format output as structured JSON
  - Include request/response headers
  - Limit results to MAX_REQUESTS
  - Add to tool registry
  - _Requirements: AC2, AC3_

- [x] 2.1 Write tests for network tool
  - Test filtering by URL pattern
  - Test filtering by HTTP method
  - Test filtering by status code
  - _Requirements: AC2_

- [x] 3. Console Tool Implementation
  - Create src/tools/console.ts
  - Implement tool with type filter (log/warn/error/info)
  - Include stack traces for errors
  - Limit results to MAX_LOGS
  - Format timestamps
  - Add to tool registry
  - _Requirements: AC4, AC5_

- [x] 3.1 Write tests for console tool
  - Test filtering by log type
  - Test stack trace formatting
  - _Requirements: AC4_

- [x] 4. Checkpoint - Test CDP Tracking
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Integration Testing
  - Test network capture on API-heavy page
  - Test console capture with console.log/error
  - Test filtering works correctly
  - Test memory limits respected
  - _Requirements: All_

- [x] 6. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- CDP tracking starts with enableNetworkTracking()/enableConsoleTracking()
- MAX_REQUESTS and MAX_LOGS prevent memory issues
- Network requests include timing information
- Console logs include source location
