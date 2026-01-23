/**
 * Element Pointer Types and Utilities
 * 
 * Provides types and utilities for the element pointer feature (S19).
 * Allows users to point at elements on a web page and get refs for AI agent interaction.
 */

/**
 * Represents a pointed element with its metadata
 */
export interface PointedElement {
  /** S18 ref (e.g., @e5) */
  ref: string;
  /** Position X coordinate */
  x: number;
  /** Position Y coordinate */
  y: number;
  /** Element width */
  width: number;
  /** Element height */
  height: number;
  /** Text content (truncated to 50 chars) */
  text: string;
  /** Optional user comment */
  comment?: string;
  /** HTML tag name */
  tagName?: string;
  /** Element role */
  role?: string;
}

/**
 * Message types for element pointer communication
 */
export enum ElementPointerMessageType {
  ACTIVATE = 'ELEMENT_POINTER_ACTIVATE',
  DEACTIVATE = 'ELEMENT_POINTER_DEACTIVATE',
  ELEMENT_POINTED = 'ELEMENT_POINTED',
  STATUS = 'ELEMENT_POINTER_STATUS'
}

/**
 * Message for activating element pointer
 */
export interface ActivateMessage {
  type: ElementPointerMessageType.ACTIVATE;
}

/**
 * Message for deactivating element pointer
 */
export interface DeactivateMessage {
  type: ElementPointerMessageType.DEACTIVATE;
}

/**
 * Message sent when element is pointed
 */
export interface ElementPointedMessage {
  type: ElementPointerMessageType.ELEMENT_POINTED;
  data: PointedElement;
}

/**
 * Message for status query
 */
export interface StatusMessage {
  type: ElementPointerMessageType.STATUS;
}

/**
 * Union type for all element pointer messages
 */
export type ElementPointerMessage = 
  | ActivateMessage 
  | DeactivateMessage 
  | ElementPointedMessage 
  | StatusMessage;

/**
 * Status response
 */
export interface ElementPointerStatus {
  active: boolean;
  selectedElement: PointedElement | null;
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number = 50): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength) + '...';
}

/**
 * Get text content from element
 */
export function getElementText(element: Element): string {
  // Get text content, excluding script and style tags
  const clone = element.cloneNode(true) as Element;
  const scripts = clone.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  
  const text = clone.textContent || '';
  return truncateText(text);
}

/**
 * Format pointed element for chat context
 */
export function formatPointedElementForChat(pointed: PointedElement): string {
  const lines = [
    'User pointed at element:',
    `- Ref: ${pointed.ref}`,
    `- Position: (${pointed.x}, ${pointed.y})`,
    `- Size: ${pointed.width}x${pointed.height}`
  ];

  if (pointed.text) {
    lines.push(`- Text: "${pointed.text}"`);
  }

  if (pointed.tagName) {
    lines.push(`- Tag: ${pointed.tagName}`);
  }

  if (pointed.role) {
    lines.push(`- Role: ${pointed.role}`);
  }

  if (pointed.comment) {
    lines.push(`- Comment: "${pointed.comment}"`);
  }

  return lines.join('\n');
}
