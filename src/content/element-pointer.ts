/**
 * Element Pointer Content Script
 * 
 * Provides element pointing functionality for S19.
 * Allows users to hover and click elements to get refs for AI agent interaction.
 */

import { refManager } from '../lib/context';
import {
  PointedElement,
  ElementPointerMessageType,
  ElementPointerMessage,
  ElementPointerStatus,
  getElementText
} from '../lib/element-pointer';

/**
 * Element Pointer State
 */
class ElementPointer {
  private active: boolean = false;
  private overlay: HTMLDivElement | null = null;
  private highlightBox: HTMLDivElement | null = null;
  private selectedBox: HTMLDivElement | null = null;
  private commentInput: HTMLInputElement | null = null;
  private doneButton: HTMLButtonElement | null = null;
  private selectedElement: Element | null = null;
  private selectedRef: string | null = null;

  /**
   * Activate element pointer mode
   */
  activate(): void {
    if (this.active) {
      return;
    }

    this.active = true;
    this.injectOverlay();
    this.attachEventListeners();
    
    console.log('🎯 Element pointer activated');
  }

  /**
   * Deactivate element pointer mode
   */
  deactivate(): void {
    if (!this.active) {
      return;
    }

    this.active = false;
    this.removeOverlay();
    this.detachEventListeners();
    this.selectedElement = null;
    this.selectedRef = null;

    console.log('🎯 Element pointer deactivated');
  }

  /**
   * Get current status
   */
  getStatus(): ElementPointerStatus {
    return {
      active: this.active,
      selectedElement: this.getSelectedElementData()
    };
  }

  /**
   * Inject overlay UI
   */
  private injectOverlay(): void {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.id = 'sp-pointer-overlay';
    this.overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2147483647;
      pointer-events: none;
    `;

    // Create highlight box (follows mouse)
    this.highlightBox = document.createElement('div');
    this.highlightBox.className = 'sp-highlight';
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.1);
      pointer-events: none;
      display: none;
      transition: all 0.1s ease;
      box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
    `;

    // Create selected element marker
    this.selectedBox = document.createElement('div');
    this.selectedBox.className = 'sp-selected';
    this.selectedBox.style.cssText = `
      position: absolute;
      border: 3px solid #10b981;
      background: rgba(16, 185, 129, 0.15);
      pointer-events: none;
      display: none;
      box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.4);
    `;

    // Create comment input container
    const commentContainer = document.createElement('div');
    commentContainer.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      display: none;
      pointer-events: auto;
      z-index: 2147483647;
      min-width: 300px;
    `;

    // Create comment input
    this.commentInput = document.createElement('input');
    this.commentInput.className = 'sp-comment';
    this.commentInput.type = 'text';
    this.commentInput.placeholder = 'Add comment (optional)...';
    this.commentInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      font-size: 14px;
      outline: none;
      margin-bottom: 8px;
    `;

    // Create done button
    this.doneButton = document.createElement('button');
    this.doneButton.className = 'sp-done';
    this.doneButton.textContent = 'Done';
    this.doneButton.style.cssText = `
      width: 100%;
      padding: 8px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    `;
    this.doneButton.onmouseover = () => {
      this.doneButton!.style.background = '#2563eb';
    };
    this.doneButton.onmouseout = () => {
      this.doneButton!.style.background = '#3b82f6';
    };

    // Assemble comment container
    commentContainer.appendChild(this.commentInput);
    commentContainer.appendChild(this.doneButton);
    commentContainer.id = 'sp-comment-container';

    // Assemble overlay
    this.overlay.appendChild(this.highlightBox);
    this.overlay.appendChild(this.selectedBox);
    this.overlay.appendChild(commentContainer);

    document.body.appendChild(this.overlay);
  }

  /**
   * Remove overlay UI
   */
  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.highlightBox = null;
      this.selectedBox = null;
      this.commentInput = null;
      this.doneButton = null;
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown);

    if (this.doneButton) {
      this.doneButton.addEventListener('click', this.handleDone);
    }

    if (this.commentInput) {
      this.commentInput.addEventListener('keydown', this.handleCommentKeyDown);
    }
  }

  /**
   * Detach event listeners
   */
  private detachEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown);

    if (this.doneButton) {
      this.doneButton.removeEventListener('click', this.handleDone);
    }

    if (this.commentInput) {
      this.commentInput.removeEventListener('keydown', this.handleCommentKeyDown);
    }
  }

  /**
   * Handle mouse move - highlight element under cursor
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.active || !this.highlightBox || this.selectedElement) {
      return;
    }

    const element = document.elementFromPoint(event.clientX, event.clientY);
    
    if (!element || element === document.body || element === document.documentElement) {
      this.highlightBox.style.display = 'none';
      return;
    }

    // Skip overlay elements
    if (element.closest('#sp-pointer-overlay')) {
      this.highlightBox.style.display = 'none';
      return;
    }

    // Get element bounds
    const rect = element.getBoundingClientRect();
    
    // Position highlight box
    this.highlightBox.style.display = 'block';
    this.highlightBox.style.left = `${rect.left + window.scrollX}px`;
    this.highlightBox.style.top = `${rect.top + window.scrollY}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
  };

  /**
   * Handle click - select element
   */
  private handleClick = (event: MouseEvent): void => {
    if (!this.active) {
      return;
    }

    // If already selected, ignore clicks outside comment container
    if (this.selectedElement) {
      const target = event.target as Element;
      if (!target.closest('#sp-comment-container')) {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    
    if (!element || element === document.body || element === document.documentElement) {
      return;
    }

    // Skip overlay elements
    if (element.closest('#sp-pointer-overlay')) {
      return;
    }

    // Select element
    this.selectElement(element);
  };

  /**
   * Select an element
   */
  private selectElement(element: Element): void {
    this.selectedElement = element;

    // Assign ref using S18 refManager
    this.selectedRef = refManager.getOrCreateRef(element);

    // Hide highlight box
    if (this.highlightBox) {
      this.highlightBox.style.display = 'none';
    }

    // Show selected box
    if (this.selectedBox) {
      const rect = element.getBoundingClientRect();
      this.selectedBox.style.display = 'block';
      this.selectedBox.style.left = `${rect.left + window.scrollX}px`;
      this.selectedBox.style.top = `${rect.top + window.scrollY}px`;
      this.selectedBox.style.width = `${rect.width}px`;
      this.selectedBox.style.height = `${rect.height}px`;
    }

    // Show comment input
    const commentContainer = document.getElementById('sp-comment-container');
    if (commentContainer) {
      commentContainer.style.display = 'block';
    }

    // Focus comment input
    if (this.commentInput) {
      this.commentInput.focus();
    }

    console.log('🎯 Element selected:', this.selectedRef, element);
  }

  /**
   * Handle keydown - Escape to cancel
   */
  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      if (this.selectedElement) {
        // Cancel selection
        this.cancelSelection();
      } else {
        // Deactivate pointer
        this.deactivate();
      }
    }
  };

  /**
   * Handle comment input keydown - Enter to submit
   */
  private handleCommentKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.handleDone();
    }
  };

  /**
   * Handle done button click
   */
  private handleDone = (): void => {
    if (!this.selectedElement || !this.selectedRef) {
      return;
    }

    const comment = this.commentInput?.value.trim() || undefined;
    const pointedElement = this.getSelectedElementData(comment);

    if (pointedElement) {
      // Send message to sidepanel
      chrome.runtime.sendMessage({
        type: ElementPointerMessageType.ELEMENT_POINTED,
        data: pointedElement
      });

      console.log('🎯 Element pointed:', pointedElement);
    }

    // Deactivate
    this.deactivate();
  };

  /**
   * Cancel current selection
   */
  private cancelSelection(): void {
    this.selectedElement = null;
    this.selectedRef = null;

    // Hide selected box
    if (this.selectedBox) {
      this.selectedBox.style.display = 'none';
    }

    // Hide comment container
    const commentContainer = document.getElementById('sp-comment-container');
    if (commentContainer) {
      commentContainer.style.display = 'none';
    }

    // Clear comment input
    if (this.commentInput) {
      this.commentInput.value = '';
    }
  }

  /**
   * Get selected element data
   */
  private getSelectedElementData(comment?: string): PointedElement | null {
    if (!this.selectedElement || !this.selectedRef) {
      return null;
    }

    const rect = this.selectedElement.getBoundingClientRect();
    const text = getElementText(this.selectedElement);
    const tagName = this.selectedElement.tagName.toLowerCase();
    const role = this.selectedElement.getAttribute('role') || undefined;

    return {
      ref: `@${this.selectedRef}`,
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      text,
      comment,
      tagName,
      role
    };
  }
}

// Create global instance
const elementPointer = new ElementPointer();

// Listen for messages from sidepanel
chrome.runtime.onMessage.addListener((message: ElementPointerMessage, sender, sendResponse) => {
  switch (message.type) {
    case ElementPointerMessageType.ACTIVATE:
      elementPointer.activate();
      sendResponse({ success: true });
      break;

    case ElementPointerMessageType.DEACTIVATE:
      elementPointer.deactivate();
      sendResponse({ success: true });
      break;

    case ElementPointerMessageType.STATUS:
      sendResponse(elementPointer.getStatus());
      break;

    default:
      sendResponse({ error: 'Unknown message type' });
  }

  return true; // Keep message channel open for async response
});

console.log('🎯 Element pointer content script loaded');
