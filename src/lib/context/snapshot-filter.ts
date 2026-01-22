/**
 * Snapshot Filter - Configurable filtering to reduce accessibility tree output
 * 
 * Provides various filtering options to reduce token usage:
 * - Interactive-only mode
 * - Depth limiting
 * - Selector scoping
 * - Compact mode (remove empty nodes)
 */

import {
  SnapshotFilterOptions,
  FilteredSnapshot,
  RefMetadata,
  INTERACTIVE_ROLES,
  INTERACTIVE_TAGS
} from './types';

/**
 * Accessibility tree node structure
 */
interface AccessibilityNode {
  tagName: string;
  role: string;
  name?: string;
  children: AccessibilityNode[];
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  visible?: boolean;
  ref?: string;
  textContent?: string;
  attributes?: Record<string, string>;
}

/**
 * SnapshotFilter handles filtering of accessibility trees to reduce output size
 */
export class SnapshotFilter {
  private options: Required<SnapshotFilterOptions>;

  constructor(options: SnapshotFilterOptions = {}) {
    this.options = {
      interactive: options.interactive ?? false,
      depth: options.depth ?? Infinity,
      scope: options.scope ?? '',
      compact: options.compact ?? false,
      includeRefs: options.includeRefs ?? true,
      maxElements: options.maxElements ?? Infinity,
      includeVisibility: options.includeVisibility ?? false
    };
  }

  /**
   * Filter accessibility tree based on configured options
   */
  filter(tree: AccessibilityNode): FilteredSnapshot {
    const originalNodeCount = this.countNodes(tree);
    const refs: Record<string, RefMetadata> = {};
    
    // Apply scope filter first if specified
    let rootNode = tree;
    if (this.options.scope) {
      const scopedNode = this.findNodeBySelector(tree, this.options.scope);
      if (scopedNode) {
        rootNode = scopedNode;
      }
    }

    // Filter the tree
    const filteredTree = this.filterNode(rootNode, 0, refs);
    const filteredNodeCount = filteredTree ? this.countNodes(filteredTree) : 0;

    // Convert to string representation
    const treeString = filteredTree ? this.nodeToString(filteredTree) : '';

    return {
      tree: treeString,
      refs,
      stats: {
        originalNodes: originalNodeCount,
        filteredNodes: filteredNodeCount,
        reduction: Math.round((1 - filteredNodeCount / originalNodeCount) * 100)
      }
    };
  }

  /**
   * Estimate token reduction percentage for given tree
   */
  estimateReduction(original: AccessibilityNode): number {
    const filtered = this.filter(original);
    return filtered.stats.reduction;
  }

  /**
   * Filter a single node and its children
   */
  private filterNode(
    node: AccessibilityNode, 
    depth: number, 
    refs: Record<string, RefMetadata>
  ): AccessibilityNode | null {
    // Check depth limit
    if (depth > this.options.depth) {
      return null;
    }

    // Check if node should be included
    if (!this.shouldIncludeNode(node, depth)) {
      return null;
    }

    // Create filtered node
    const filteredNode: AccessibilityNode = {
      tagName: node.tagName,
      role: node.role,
      children: []
    };

    // Add optional properties
    if (node.name) {
      filteredNode.name = node.name;
    }

    if (node.bounds) {
      filteredNode.bounds = { ...node.bounds };
    }

    if (node.visible !== undefined) {
      filteredNode.visible = node.visible;
    }

    if (node.textContent) {
      filteredNode.textContent = node.textContent;
    }

    if (node.attributes) {
      filteredNode.attributes = { ...node.attributes };
    }

    // Add ref if available and refs are enabled
    if (node.ref && this.options.includeRefs) {
      filteredNode.ref = node.ref;
      
      // Store ref metadata
      refs[node.ref] = {
        ref: node.ref,
        role: node.role,
        tagName: node.tagName,
        interactable: this.isInteractive(node),
        name: node.name
      };
    }

    // Filter children
    let includedChildren = 0;
    for (const child of node.children) {
      if (includedChildren >= this.options.maxElements) {
        break;
      }

      const filteredChild = this.filterNode(child, depth + 1, refs);
      if (filteredChild) {
        filteredNode.children.push(filteredChild);
        includedChildren++;
      }
    }

    return filteredNode;
  }

  /**
   * Determine if a node should be included in the filtered output
   */
  private shouldIncludeNode(node: AccessibilityNode, depth: number): boolean {
    // Always include root node
    if (depth === 0) {
      return true;
    }

    // Apply interactive filter
    if (this.options.interactive && !this.isInteractive(node)) {
      return false;
    }

    // Apply compact filter - skip empty/structural nodes
    if (this.options.compact && this.isEmptyStructural(node)) {
      return false;
    }

    // Apply visibility filter
    if (this.options.includeVisibility && node.visible === false) {
      return false;
    }

    return true;
  }

  /**
   * Check if node represents an interactive element
   */
  private isInteractive(node: AccessibilityNode): boolean {
    const tagName = node.tagName.toLowerCase();
    const role = node.role;

    // Check interactive tags
    if (INTERACTIVE_TAGS.includes(tagName as any)) {
      return true;
    }

    // Check interactive roles
    if (INTERACTIVE_ROLES.includes(role as any)) {
      return true;
    }

    // Check for interactive attributes
    if (node.attributes) {
      if (node.attributes.onclick || 
          node.attributes.tabindex || 
          node.attributes.contenteditable === 'true') {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if node is empty/structural and should be skipped in compact mode
   */
  private isEmptyStructural(node: AccessibilityNode): boolean {
    const tagName = node.tagName.toLowerCase();
    
    // Structural tags that are often empty
    const structuralTags = ['div', 'span', 'section', 'article', 'aside', 'header', 'footer', 'main'];
    
    if (!structuralTags.includes(tagName)) {
      return false;
    }

    // Check if node has meaningful content
    const hasText = node.textContent && node.textContent.trim().length > 0;
    const hasInteractiveChildren = this.hasInteractiveChildren(node);
    
    // Empty if no text content and no interactive children
    return !hasText && !hasInteractiveChildren;
  }

  /**
   * Check if node has interactive children
   */
  private hasInteractiveChildren(node: AccessibilityNode): boolean {
    for (const child of node.children) {
      if (this.isInteractive(child) || this.hasInteractiveChildren(child)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Find node by CSS selector (simplified implementation)
   */
  private findNodeBySelector(tree: AccessibilityNode, selector: string): AccessibilityNode | null {
    // This is a simplified implementation
    // In a real implementation, you'd parse the CSS selector properly
    
    // Handle simple ID selector
    if (selector.startsWith('#')) {
      const id = selector.slice(1);
      return this.findNodeById(tree, id);
    }

    // Handle simple class selector
    if (selector.startsWith('.')) {
      const className = selector.slice(1);
      return this.findNodeByClass(tree, className);
    }

    // Handle simple tag selector
    return this.findNodeByTag(tree, selector);
  }

  /**
   * Find node by ID
   */
  private findNodeById(node: AccessibilityNode, id: string): AccessibilityNode | null {
    if (node.attributes?.id === id) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findNodeById(child, id);
      if (found) return found;
    }

    return null;
  }

  /**
   * Find node by class name
   */
  private findNodeByClass(node: AccessibilityNode, className: string): AccessibilityNode | null {
    const nodeClasses = node.attributes?.class?.split(' ') || [];
    if (nodeClasses.includes(className)) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findNodeByClass(child, className);
      if (found) return found;
    }

    return null;
  }

  /**
   * Find node by tag name
   */
  private findNodeByTag(node: AccessibilityNode, tagName: string): AccessibilityNode | null {
    if (node.tagName.toLowerCase() === tagName.toLowerCase()) {
      return node;
    }

    for (const child of node.children) {
      const found = this.findNodeByTag(child, tagName);
      if (found) return found;
    }

    return null;
  }

  /**
   * Count total nodes in tree
   */
  private countNodes(node: AccessibilityNode): number {
    let count = 1;
    for (const child of node.children) {
      count += this.countNodes(child);
    }
    return count;
  }

  /**
   * Convert node to string representation
   */
  private nodeToString(node: AccessibilityNode, indent: number = 0): string {
    const lines: string[] = [];
    const prefix = '  '.repeat(indent);
    
    // Build node description
    const parts: string[] = [];
    
    // Add role or tag name
    if (node.role && node.role !== 'generic') {
      parts.push(node.role);
    } else {
      parts.push(node.tagName.toLowerCase());
    }

    // Add name if available
    if (node.name) {
      parts.push(`"${node.name}"`);
    }

    // Add ref if available
    if (node.ref) {
      parts.push(`[ref=${node.ref}]`);
    }

    // Add bounds if available
    if (node.bounds) {
      parts.push(`[${node.bounds.x},${node.bounds.y} ${node.bounds.width}x${node.bounds.height}]`);
    }

    // Add visibility if specified
    if (node.visible !== undefined && !node.visible) {
      parts.push('[hidden]');
    }

    lines.push(prefix + parts.join(' '));

    // Add children
    for (const child of node.children) {
      lines.push(this.nodeToString(child, indent + 1));
    }

    return lines.join('\n');
  }
}

/**
 * Create a snapshot filter with the given options
 */
export function createSnapshotFilter(options: SnapshotFilterOptions = {}): SnapshotFilter {
  return new SnapshotFilter(options);
}

/**
 * Quick filter function for common use cases
 */
export function filterSnapshot(
  tree: AccessibilityNode, 
  options: SnapshotFilterOptions = {}
): FilteredSnapshot {
  const filter = new SnapshotFilter(options);
  return filter.filter(tree);
}