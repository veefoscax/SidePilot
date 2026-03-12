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

    // Inject styles for animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spPulse {
        0% { transform: scale(0.98); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        50% { transform: scale(1.02); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
      }
      @keyframes spFadeUp {
        from { opacity: 0; transform: translate(-50%, 10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      #sp-comment-container.sp-visible {
        animation: spFadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      }
      .sp-selected.sp-animating {
        animation: spPulse 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      }
    `;
    this.overlay.appendChild(style);

    // Create highlight box (follows mouse)
    this.highlightBox = document.createElement('div');
    this.highlightBox.className = 'sp-highlight';
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      backdrop-filter: blur(1px);
      pointer-events: none;
      display: none;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
      border-radius: 4px;
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
      border-radius: 6px;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
    `;

    // Create comment input container
    const commentContainer = document.createElement('div');
    commentContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(229, 231, 235, 0.8);
      border-radius: 12px;
      padding: 16px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      display: none;
      pointer-events: auto;
      z-index: 2147483647;
      min-width: 320px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // Create comment input
    this.commentInput = document.createElement('input');
    this.commentInput.className = 'sp-comment';
    this.commentInput.type = 'text';
    this.commentInput.placeholder = 'Add instructions for this element...';
    this.commentInput.style.cssText = `
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      margin-bottom: 12px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    `;
    this.commentInput.onfocus = () => { this.commentInput!.style.borderColor = '#3b82f6'; };
    this.commentInput.onblur = () => { this.commentInput!.style.borderColor = '#d1d5db'; };

    // Create done button
    this.doneButton = document.createElement('button');
    this.doneButton.className = 'sp-done';
    this.doneButton.textContent = 'Confirm Selection';
    this.doneButton.style.cssText = `
      width: 100%;
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
    `;
    this.doneButton.onmouseover = () => { this.doneButton!.style.background = '#2563eb'; };
    this.doneButton.onmouseout = () => { this.doneButton!.style.background = '#3b82f6'; };
    this.doneButton.onmousedown = () => { this.doneButton!.style.transform = 'scale(0.98)'; };
    this.doneButton.onmouseup = () => { this.doneButton!.style.transform = 'scale(1)'; };

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

      // Trigger pulse animation
      this.selectedBox.classList.remove('sp-animating');
      void this.selectedBox.offsetWidth; // Trigger reflow
      this.selectedBox.classList.add('sp-animating');
    }

    // Show comment input
    const commentContainer = document.getElementById('sp-comment-container');
    if (commentContainer) {
      commentContainer.style.display = 'block';
      commentContainer.classList.remove('sp-visible');
      void commentContainer.offsetWidth; // Trigger reflow
      commentContainer.classList.add('sp-visible');
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
      this.selectedBox.classList.remove('sp-animating');
    }

    // Hide comment container
    const commentContainer = document.getElementById('sp-comment-container');
    if (commentContainer) {
      commentContainer.style.display = 'none';
      commentContainer.classList.remove('sp-visible');
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
