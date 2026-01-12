# S15: Model Capabilities - Requirements

## User Stories

### US1: Capability Visibility
**As a** user
**I want** to see what my selected model supports
**So that** I understand feature limitations

### US2: Feature Warnings
**As a** user
**I want** to be warned when features won't work
**So that** I don't get confused by failures

## Acceptance Criteria (EARS Notation)

### AC1: Capability Badges
WHEN a model is selected
THE SYSTEM SHALL display capability badges (Vision, Tools, Streaming)
WITH appropriate colors and icons

### AC2: No Tools Warning
WHEN a model doesn't support tools
THE SYSTEM SHALL display a prominent warning
THAT browser automation will not work

### AC3: No Vision Fallback
WHEN a model doesn't support vision
THE SYSTEM SHALL use accessibility snapshot instead of screenshots
AND inform the user of this fallback

### AC4: No Streaming Notice
WHEN a model doesn't support streaming
THE SYSTEM SHALL disable the thinking indicator
AND show responses all at once

## Dependencies
- S02: Provider Factory (model capabilities)
- S03: Settings UI (display badges)
