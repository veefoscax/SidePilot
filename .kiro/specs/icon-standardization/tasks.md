# Implementation Plan: Icon Standardization

## Overview

Standardize icon usage across SidePilot by updating tech.md steering documentation, fixing all components to use the correct Hugeicons pattern, and establishing clear guidelines for future development.

## Tasks

- [x] 1. Update tech.md steering file with icon guidelines
  - Add "Icon Usage with Hugeicons" section to tech.md
  - Include correct import pattern examples
  - Include correct rendering pattern examples
  - Add icon mapping reference table
  - Add DO/DON'T examples
  - Document why wrapper pattern is required
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 2. Fix BrowserAutomationSettings component
  - [x] 2.1 Update import statements
    - Replace incorrect icon imports with HugeiconsIcon wrapper
    - Import all icon definitions from @hugeicons/core-free-icons
    - Remove unused React import
    - _Requirements: 2.1, 2.2_
  
  - [x] 2.2 Replace all icon usages in Built-in CDP section
    - Replace RocketIcon with HugeiconsIcon wrapper
    - Replace all CheckCircleIcon with CheckmarkCircle02Icon
    - Replace all ExclamationTriangleIcon with Alert02Icon
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.3 Replace all icon usages in Cloud section
    - Replace CloudIcon with AiCloud01Icon
    - Replace ExternalLinkIcon with LinkExternal02Icon
    - Replace all CheckCircleIcon instances
    - Replace all ExclamationTriangleIcon instances
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.4 Replace all icon usages in Native Backend section
    - Replace CodeIcon with SourceCodeIcon
    - Replace all CheckCircleIcon instances
    - Replace all ExclamationTriangleIcon instances
    - Replace InfoIcon with InformationCircleIcon
    - Replace DownloadIcon with Download01Icon
    - _Requirements: 2.3, 2.5_
  
  - [x] 2.5 Verify TypeScript compilation
    - Run `npm run build` to check for errors
    - Fix any remaining TypeScript errors
    - _Requirements: 2.4_

- [x] 3. Audit codebase for icon usage
  - [x] 3.1 Search for legacy icon patterns
    - Search for imports from '@hugeicons/react' (excluding HugeiconsIcon)
    - Search for direct icon component usage (e.g., `<RocketIcon`)
    - Create list of files needing updates
    - _Requirements: 3.1_
  
  - [x] 3.2 Verify icon definitions exist
    - Check each icon used against @hugeicons/core-free-icons exports
    - Document any icons needing alternative mappings
    - _Requirements: 3.4, 3.5_

- [x] 4. Fix remaining components (if any found in audit)
  - [x] 4.1 Update each component's imports
    - Follow same pattern as BrowserAutomationSettings
    - _Requirements: 3.2_
  
  - [x] 4.2 Update each component's icon usages
    - Replace all legacy patterns with standard pattern
    - _Requirements: 3.2_
  
  - [x] 4.3 Verify each component compiles
    - Check TypeScript errors for each file
    - _Requirements: 3.3_

- [x] 5. Final verification and testing
  - [x] 5.1 Run full TypeScript build
    - Execute `npm run build`
    - Verify zero icon-related errors
    - _Requirements: 3.3_
  
  - [x] 5.2 Test UI rendering
    - Load extension in Chrome
    - Navigate to Settings > Browser Automation
    - Verify all icons render correctly
    - Check other affected components
    - _Requirements: 2.5_
  
  - [x] 5.3 Update DEVLOG
    - Document changes made
    - Note time spent and credits used
    - List all files modified

- [x] 6. Checkpoint - Verify all changes complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- This refactoring improves code maintainability and prevents future TypeScript errors
- The tech.md steering file will serve as the source of truth for icon usage
- All future components should follow the documented pattern
- The icon mapping table makes it easy to find the right icon for any use case
