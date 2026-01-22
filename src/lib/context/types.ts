/**
 * Type definitions for S18 Context Optimization
 * Provides ref-based element targeting, snapshot filtering, incremental updates, and context budget management
 */

// ============================================================================
// Ref Manager Types
// ============================================================================

/**
 * Maps refs to elements and elements to refs for O(1) lookup
 */
export interface RefMap {
  /** Map from ref string (e.g., "e1") to Element (using WeakRef internally if available) */
  refToElement: Map<string, Element>;
  /** Map from Element to ref string for reverse lookup */
  elementToRef: WeakMap<Element, string>;
  /** Page identifier - invalidates refs on navigation */
  pageId: string;
}

/**
 * Metadata about a ref-assigned element
 */
export interface RefMetadata {
  /** The ref identifier (e.g., "e1") */
  ref: string;
  /** ARIA role or inferred role */
  role: string;
  /** Accessible name (aria-label, text content, etc.) */
  name?: string;
  /** HTML tag name */
  tagName: string;
  /** Whether element is interactable */
  interactable: boolean;
  /** Element type for inputs */
  type?: string;
  /** Current value for form elements */
  value?: string;
  /** Whether element is currently visible */
  visible?: boolean;
}

/**
 * Configuration options for RefManager
 */
export interface RefManagerOptions {
  /** Prefix for ref IDs (default: 'e') */
  prefix?: string;
  /** Whether refs persist across navigation (default: false) */
  persistAcrossNavigation?: boolean;
  /** Maximum number of refs to assign (default: 1000) */
  maxRefs?: number;
}

/**
 * Result of ref assignment operation
 */
export interface RefAssignment {
  /** The assigned ref */
  ref: string;
  /** The target element */
  element: Element;
  /** Element metadata */
  metadata: RefMetadata;
}

// ============================================================================
// Snapshot Filter Types
// ============================================================================

/**
 * Configuration for filtering accessibility tree snapshots
 */
export interface SnapshotFilterOptions {
  /** Only include interactive elements (buttons, links, inputs) */
  interactive?: boolean;
  /** Maximum tree depth to include (default: unlimited) */
  depth?: number;
  /** CSS selector to scope snapshot to specific area */
  scope?: string;
  /** Remove empty/structural nodes */
  compact?: boolean;
  /** Include ref annotations in output (default: true) */
  includeRefs?: boolean;
  /** Hard limit on number of elements returned */
  maxElements?: number;
  /** Include element values (for form fields) */
  includeValues?: boolean;
  /** Include visibility information */
  includeVisibility?: boolean;
}

/**
 * Result of snapshot filtering operation
 */
export interface FilteredSnapshot {
  /** Filtered accessibility tree as formatted string */
  tree: string;
  /** Map of refs to their metadata */
  refs: Record<string, RefMetadata>;
  /** Statistics about the filtering operation */
  stats: {
    /** Number of nodes in original tree */
    originalNodes: number;
    /** Number of nodes after filtering */
    filteredNodes: number;
    /** Percentage reduction (0-100) */
    reduction: number;
    /** Estimated token count */
    estimatedTokens: number;
  };
  /** Page analysis and suggestions */
  analysis?: PageAnalysis;
}

// ============================================================================
// Delta Detection Types
// ============================================================================

/**
 * Represents the state of a page at a point in time
 */
export interface DeltaState {
  /** Hash of the page content for change detection */
  hash: string;
  /** Timestamp when state was captured */
  timestamp: number;
  /** Ref metadata at time of capture */
  refs: Record<string, RefMetadata>;
  /** The snapshot content */
  snapshot: string;
  /** Page URL at time of capture */
  url?: string;
}

/**
 * Result of delta detection operation
 */
export interface DeltaResult {
  /** Type of result */
  type: 'full' | 'delta' | 'unchanged';
  /** Content (full snapshot or delta description) */
  content?: string;
  /** Detailed changes (only for delta type) */
  changes?: {
    /** Newly added elements */
    added: RefMetadata[];
    /** Removed element refs */
    removed: string[];
    /** Modified elements */
    modified: RefMetadata[];
  };
  /** Current content hash */
  hash: string;
  /** Timestamp of this result */
  timestamp: number;
  /** Statistics about the delta */
  stats?: {
    /** Number of changes detected */
    changeCount: number;
    /** Token savings compared to full snapshot */
    tokenSavings: number;
  };
}

// ============================================================================
// Budget Manager Types
// ============================================================================

/**
 * Configuration for context budget management
 */
export interface BudgetOptions {
  /** Maximum tokens allowed in context */
  maxTokens: number;
  /** Warn when usage exceeds this percentage (default: 70) */
  warningThreshold?: number;
  /** Auto-compress when usage exceeds this percentage (default: 85) */
  compressionThreshold?: number;
  /** Callback when warning threshold is reached */
  onWarning?: (usage: BudgetUsage) => void;
  /** Callback when compression threshold is reached */
  onCompressionNeeded?: (usage: BudgetUsage) => void;
}

/**
 * Current budget usage information
 */
export interface BudgetUsage {
  /** Tokens currently used */
  used: number;
  /** Tokens remaining */
  remaining: number;
  /** Usage as percentage (0-100) */
  percentage: number;
  /** Breakdown by category */
  breakdown: {
    /** System prompt tokens */
    systemPrompt: number;
    /** Conversation history tokens */
    conversation: number;
    /** Tool result tokens */
    toolResults: number;
    /** Other/miscellaneous tokens */
    other: number;
  };
  /** Whether warning threshold is exceeded */
  warningExceeded: boolean;
  /** Whether compression is needed */
  compressionNeeded: boolean;
}

/**
 * Levels of compression available
 */
export type CompressionLevel = 'none' | 'interactive' | 'clickable' | 'summary';

/**
 * Token tracking entry
 */
export interface TokenEntry {
  /** Category of tokens */
  category: string;
  /** Number of tokens */
  tokens: number;
  /** Timestamp when tracked */
  timestamp: number;
  /** Optional description */
  description?: string;
}

// ============================================================================
// Smart Suggester Types
// ============================================================================

/**
 * Analysis of page structure and suggested actions
 */
export interface PageAnalysis {
  /** Detected page type */
  type: 'form' | 'list' | 'article' | 'dashboard' | 'login' | 'search' | 'navigation' | 'unknown';
  /** Confidence in page type detection (0-1) */
  confidence: number;
  /** Suggested actions for this page */
  suggestedActions: SuggestedAction[];
  /** Key elements identified */
  keyElements?: {
    /** Primary action button */
    primaryAction?: string;
    /** Main form */
    mainForm?: string;
    /** Search input */
    searchInput?: string;
    /** Navigation elements */
    navigation?: string[];
  };
}

/**
 * A suggested action for the current page
 */
export interface SuggestedAction {
  /** Action type (e.g., "fill", "click", "scroll") */
  action: string;
  /** Target element ref or description */
  target?: string;
  /** Human-readable description */
  description: string;
  /** Priority level (1-10, higher is more important) */
  priority: number;
  /** Expected parameters for the action */
  parameters?: Record<string, any>;
  /** Reason why this action is suggested */
  reason?: string;
}

/**
 * Page pattern indicators for type detection
 */
export interface PagePattern {
  /** Keywords that indicate this page type */
  keywords: string[];
  /** Required element roles/types */
  requiredElements?: string[];
  /** Minimum confidence threshold */
  minConfidence?: number;
}

// ============================================================================
// Accessibility Tree Types
// ============================================================================

/**
 * Represents a node in the accessibility tree
 */
export interface AccessibilityNode {
  /** Node role */
  role: string;
  /** Accessible name */
  name?: string;
  /** Node value */
  value?: string;
  /** HTML tag name */
  tagName?: string;
  /** Child nodes */
  children?: AccessibilityNode[];
  /** Whether node is focusable */
  focusable?: boolean;
  /** Whether node is visible */
  visible?: boolean;
  /** Bounding rectangle */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Additional properties */
  properties?: Record<string, any>;
}

// ============================================================================
// Tool Integration Types
// ============================================================================

/**
 * Enhanced parameters for get_page_content tool
 */
export interface GetPageContentParams {
  // Existing parameters
  /** Include links in output */
  includeLinks?: boolean;
  
  // New filtering options
  /** Only include interactive elements */
  interactive?: boolean;
  /** Maximum tree depth */
  depth?: number;
  /** CSS selector to scope snapshot */
  scope?: string;
  /** Remove empty/structural nodes */
  compact?: boolean;
  
  // Delta mode
  /** Only return changes since last snapshot */
  delta?: boolean;
  
  // Output options
  /** Include ref annotations (default: true) */
  includeRefs?: boolean;
  /** Include smart action suggestions */
  includeSuggestions?: boolean;
  /** Include element values */
  includeValues?: boolean;
  /** Include visibility information */
  includeVisibility?: boolean;
}

/**
 * Result from get_page_content tool
 */
export interface PageContentResult {
  /** The page content (tree or delta) */
  content: string;
  /** Ref metadata */
  refs?: Record<string, RefMetadata>;
  /** Page analysis */
  analysis?: PageAnalysis;
  /** Content statistics */
  stats?: {
    nodeCount: number;
    tokenCount: number;
    reduction?: number;
  };
  /** Delta information (if delta mode) */
  delta?: {
    type: 'full' | 'delta' | 'unchanged';
    changeCount?: number;
    tokenSavings?: number;
  };
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * Context optimization specific errors
 */
export class ContextOptimizationError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ContextOptimizationError';
  }
}

/**
 * Ref resolution errors
 */
export class RefResolutionError extends ContextOptimizationError {
  constructor(ref: string, reason: string) {
    super(`Failed to resolve ref ${ref}: ${reason}`, 'REF_RESOLUTION_ERROR', { ref, reason });
  }
}

/**
 * Budget exceeded errors
 */
export class BudgetExceededError extends ContextOptimizationError {
  constructor(usage: BudgetUsage) {
    super(`Context budget exceeded: ${usage.percentage}%`, 'BUDGET_EXCEEDED', { usage });
  }
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Interactive element roles for filtering
 */
export const INTERACTIVE_ROLES = [
  'button', 'link', 'textbox', 'checkbox', 'radio',
  'combobox', 'listbox', 'menuitem', 'tab', 'slider',
  'searchbox', 'spinbutton', 'switch', 'option',
  'menuitemcheckbox', 'menuitemradio', 'treeitem'
] as const;

/**
 * Interactive HTML tags
 */
export const INTERACTIVE_TAGS = [
  'a', 'button', 'input', 'select', 'textarea',
  'details', 'summary', 'area', 'audio', 'video'
] as const;

/**
 * Page type patterns for detection
 */
export const PAGE_PATTERNS: Record<string, PagePattern> = {
  login: {
    keywords: ['password', 'sign in', 'log in', 'username', 'email', 'login'],
    requiredElements: ['textbox', 'button'],
    minConfidence: 0.7
  },
  form: {
    keywords: ['submit', 'save', 'continue', 'next', 'form'],
    requiredElements: ['textbox', 'button'],
    minConfidence: 0.6
  },
  search: {
    keywords: ['search', 'filter', 'find', 'query'],
    requiredElements: ['searchbox', 'textbox'],
    minConfidence: 0.8
  },
  list: {
    keywords: ['showing', 'results', 'items per page', 'next page', 'previous'],
    minConfidence: 0.5
  },
  navigation: {
    keywords: ['menu', 'nav', 'navigation', 'home', 'about', 'contact'],
    requiredElements: ['link'],
    minConfidence: 0.6
  }
};

/**
 * Token estimation constants
 */
export const TOKEN_ESTIMATION = {
  /** Average characters per token for English text */
  CHARS_PER_TOKEN: 4,
  /** Overhead tokens for tool call structure */
  TOOL_CALL_OVERHEAD: 50,
  /** Overhead tokens for ref annotations */
  REF_ANNOTATION_OVERHEAD: 5
} as const;