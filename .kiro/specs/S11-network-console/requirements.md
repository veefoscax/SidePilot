# S11: Network & Console Tracking - Requirements

## User Stories

### US1: View Network Requests
**As a** user
**I want** to see recent API calls from the page
**So that** the AI can understand backend interactions

### US2: View Console Logs
**As a** user
**I want** to see console output including errors
**So that** the AI can help debug issues

## Acceptance Criteria (EARS Notation)

### AC1: Enable Network Tracking
WHEN the AI enables network tracking for a tab
THE SYSTEM SHALL capture all subsequent HTTP requests
AND store up to 100 most recent requests

### AC2: Get Network Requests
WHEN the AI requests network activity
THE SYSTEM SHALL return request URL, method, and status code
AND optionally filter by URL pattern

### AC3: Enable Console Tracking
WHEN the AI enables console tracking for a tab
THE SYSTEM SHALL capture all console.log, warn, error calls
AND store up to 100 most recent logs

### AC4: Get Console Logs
WHEN the AI requests console logs
THE SYSTEM SHALL return log type, message, and timestamp
AND include exception stack traces when available

## Dependencies
- S05: CDP Wrapper (provides tracking infrastructure)
