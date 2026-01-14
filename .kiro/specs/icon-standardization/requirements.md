# Requirements Document: Icon Standardization

## Introduction

Standardize icon usage across the SidePilot codebase to use the Hugeicons library consistently with the correct wrapper pattern. This will eliminate TypeScript errors, improve maintainability, and establish a clear pattern documented in our tech steering.

## Glossary

- **Hugeicons**: Icon library used in SidePilot (v3.1.1 for core-free-icons, v1.1.4 for react wrapper)
- **Icon_Wrapper**: The `HugeiconsIcon` component from `@hugeicons/react` that renders icon definitions
- **Icon_Definition**: Icon constants from `@hugeicons/core-free-icons` (e.g., `Rocket01Icon`, `CheckmarkCircle02Icon`)
- **Legacy_Pattern**: Direct icon component usage (incorrect pattern we're replacing)
- **Standard_Pattern**: Using HugeiconsIcon wrapper with icon definitions (correct pattern)

## Requirements

### Requirement 1: Establish Icon Usage Standard

**User Story:** As a developer, I want a clear, documented standard for using icons, so that I can write consistent code without TypeScript errors.

#### Acceptance Criteria

1. THE System SHALL define a standard icon usage pattern in tech.md steering file
2. THE Standard SHALL specify importing HugeiconsIcon from @hugeicons/react
3. THE Standard SHALL specify importing icon definitions from @hugeicons/core-free-icons
4. THE Standard SHALL provide example code showing correct usage
5. THE Standard SHALL include a mapping table for commonly used icons

### Requirement 2: Fix BrowserAutomationSettings Component

**User Story:** As a developer, I want the BrowserAutomationSettings component to use icons correctly, so that there are no TypeScript errors and the UI renders properly.

#### Acceptance Criteria

1. WHEN the component imports icons THEN it SHALL use HugeiconsIcon wrapper from @hugeicons/react
2. WHEN the component imports icon definitions THEN it SHALL use @hugeicons/core-free-icons
3. WHEN rendering an icon THEN it SHALL use the pattern `<HugeiconsIcon icon={IconName} className="..." />`
4. WHEN the component is compiled THEN there SHALL be zero TypeScript errors related to icons
5. THE Component SHALL replace all legacy icon usages with the standard pattern

### Requirement 3: Audit and Fix All Components

**User Story:** As a developer, I want all components in the codebase to use icons consistently, so that the entire application follows the same pattern.

#### Acceptance Criteria

1. WHEN auditing the codebase THEN the system SHALL identify all files using legacy icon patterns
2. WHEN a legacy pattern is found THEN it SHALL be replaced with the standard pattern
3. WHEN all fixes are complete THEN there SHALL be zero TypeScript errors related to icon imports
4. THE System SHALL verify all icon definitions exist in @hugeicons/core-free-icons
5. THE System SHALL document any icons that need alternative mappings

### Requirement 4: Create Icon Mapping Reference

**User Story:** As a developer, I want a reference guide for icon mappings, so that I know which Hugeicons icon to use for common UI elements.

#### Acceptance Criteria

1. THE System SHALL create a mapping table in tech.md for common icon use cases
2. THE Mapping SHALL include icons for: success, error, warning, info, loading, external links, downloads, code, cloud, rocket
3. THE Mapping SHALL specify the exact icon name from @hugeicons/core-free-icons
4. THE Mapping SHALL include visual descriptions of when to use each icon
5. THE Mapping SHALL be easily searchable and scannable

### Requirement 5: Prevent Future Regressions

**User Story:** As a developer, I want to prevent incorrect icon usage in the future, so that we don't reintroduce the same errors.

#### Acceptance Criteria

1. THE tech.md steering file SHALL include clear "DO NOT" examples showing incorrect patterns
2. THE tech.md steering file SHALL include clear "DO" examples showing correct patterns
3. THE Documentation SHALL explain why the wrapper pattern is required
4. THE Documentation SHALL link to Hugeicons documentation for reference
5. THE Documentation SHALL be included in the workspace steering rules

## Icon Mapping Table (Reference)

| Use Case | Legacy Name | Hugeicons Name | Import From |
|----------|-------------|----------------|-------------|
| Success/Check | CheckCircleIcon | CheckmarkCircle02Icon | @hugeicons/core-free-icons |
| Error/Cancel | ExclamationTriangleIcon | Alert02Icon | @hugeicons/core-free-icons |
| Warning | ExclamationTriangleIcon | Alert02Icon | @hugeicons/core-free-icons |
| Info | InfoIcon | InformationCircleIcon | @hugeicons/core-free-icons |
| Loading | LoadingIcon | Loading01Icon | @hugeicons/core-free-icons |
| External Link | ExternalLinkIcon | LinkExternal02Icon | @hugeicons/core-free-icons |
| Download | DownloadIcon | Download01Icon | @hugeicons/core-free-icons |
| Code | CodeIcon | SourceCodeIcon | @hugeicons/core-free-icons |
| Cloud | CloudIcon | AiCloud01Icon | @hugeicons/core-free-icons |
| Rocket | RocketIcon | Rocket01Icon | @hugeicons/core-free-icons |
| Delete | DeleteIcon | Delete01Icon | @hugeicons/core-free-icons |
| Edit | EditIcon | Edit02Icon | @hugeicons/core-free-icons |
| Add | AddIcon | Add01Icon | @hugeicons/core-free-icons |
| Drag Handle | DragIcon | DragDropVerticalIcon | @hugeicons/core-free-icons |

## Files Requiring Updates

Based on initial audit:
1. `src/components/settings/BrowserAutomationSettings.tsx` - Multiple icon usage errors
2. Other components TBD during comprehensive audit

## Success Criteria

- Zero TypeScript errors related to icon imports across entire codebase
- All components use the standard HugeiconsIcon wrapper pattern
- tech.md steering file includes comprehensive icon usage documentation
- Developers can easily find and use the correct icon for any use case
