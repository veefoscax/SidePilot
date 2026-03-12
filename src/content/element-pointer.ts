/**
 * Element Pointer Content Script
 * 
 * Provides element pointing functionality for S19.
 * Allows users to hover and click elements to get refs for AI agent interaction.
 * Enhanced with Multi-Element Selection (S27).
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
  private commentInput: HTMLInputElement | null = null;
  private doneButton: HTMLButtonElement | null = null;
  
  // Multi-selection state
  private selectionMap: Map<Element, HTMLDivElement> = new Map();
  private elementRefs: Map<Element, string> = new Map();

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
    
    console.log('🎯 Element pointer activated (Multi-select mode)');
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
    this.selectionMap.clear();
    this.elementRefs.clear();

    console.log('🎯 Element pointer deactivated');
  }

  /**
   * Get current status
   */
  getStatus(): ElementPointerStatus {
    const selectedElements = Array.from(this.selectionMap.keys()).map(el => this.getElementData(el));
    return {
      active: this.active,
      selectedElement: selectedElements[0] || null,
      selectedElements
    };
  }

  /**
   * Inject overlay UI
   */
  private injectOverlay(): void {
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
      .sp-ref-badge {
        position: absolute;
        top: -24px;
        left: 0;
        background: #10b981;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        pointer-events: none;
        white-space: nowrap;
      }
    `;
    this.overlay.appendChild(style);

    this.highlightBox = document.createElement('div');
    this.highlightBox.className = 'sp-highlight';
    this.highlightBox.style.cssText = `
      position: absolute;
      border: 2px solid #3b82f6;
      background: rgba(59, 130, 246, 0.15);
      backdrop-filter: blur(1px);
      pointer-events: none;
      display: none;
      transition: all 0.1s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
      border-radius: 4px;
    `;

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
      min-width: 340px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    this.commentInput = document.createElement('input');
    this.commentInput.className = 'sp-comment';
    this.commentInput.type = 'text';
    this.commentInput.placeholder = 'Add instructions for selected elements...';
    this.commentInput.style.cssText = `
      width: 100%;
      padding: 10px 14px;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 14px;
      outline: none;
      margin-bottom: 12px;
      box-sizing: border-box;
    `;

    this.doneButton = document.createElement('button');
    this.doneButton.className = 'sp-done';
    this.doneButton.textContent = 'Confirm Selection (0)';
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
    `;

    commentContainer.appendChild(this.commentInput);
    commentContainer.appendChild(this.doneButton);
    commentContainer.id = 'sp-comment-container';

    this.overlay.appendChild(this.highlightBox);
    this.overlay.appendChild(commentContainer);
    document.body.appendChild(this.overlay);
  }

  private removeOverlay(): void {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
      this.highlightBox = null;
    }
  }

  private attachEventListeners(): void {
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('scroll', this.syncMarkers);
    window.addEventListener('resize', this.syncMarkers);
  }

  private detachEventListeners(): void {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('scroll', this.syncMarkers);
    window.removeEventListener('resize', this.syncMarkers);
  }

  private handleMouseMove = (event: MouseEvent): void => {
    if (!this.active || !this.highlightBox) return;

    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element === document.body || element === document.documentElement || element.closest('#sp-pointer-overlay')) {
      this.highlightBox.style.display = 'none';
      return;
    }

    const rect = element.getBoundingClientRect();
    this.highlightBox.style.display = 'block';
    this.highlightBox.style.left = `${rect.left + window.scrollX}px`;
    this.highlightBox.style.top = `${rect.top + window.scrollY}px`;
    this.highlightBox.style.width = `${rect.width}px`;
    this.highlightBox.style.height = `${rect.height}px`;
  };

  private handleClick = (event: MouseEvent): void => {
    if (!this.active) return;

    const target = event.target as Element;
    if (target.closest('#sp-comment-container')) return;

    event.preventDefault();
    event.stopPropagation();

    const element = document.elementFromPoint(event.clientX, event.clientY);
    if (!element || element === document.body || element === document.documentElement || element.closest('#sp-pointer-overlay')) return;

    if (this.selectionMap.has(element)) {
      this.removeElement(element);
    } else {
      this.addElement(element);
    }
  };

  private addElement(element: Element): void {
    const ref = refManager.getOrCreateRef(element);
    const box = document.createElement('div');
    box.className = 'sp-selected sp-animating';
    
    const badge = document.createElement('div');
    badge.className = 'sp-ref-badge';
    badge.textContent = `@${ref}`;
    box.appendChild(badge);

    const rect = element.getBoundingClientRect();
    box.style.cssText = `
      position: absolute;
      border: 3px solid #10b981;
      background: rgba(16, 185, 129, 0.15);
      pointer-events: none;
      border-radius: 6px;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
      left: ${rect.left + window.scrollX}px;
      top: ${rect.top + window.scrollY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      z-index: 2147483646;
    `;

    this.overlay?.appendChild(box);
    this.selectionMap.set(element, box);
    this.elementRefs.set(element, ref);
    this.updateUI();
  }

  private removeElement(element: Element): void {
    const box = this.selectionMap.get(element);
    box?.remove();
    this.selectionMap.delete(element);
    this.elementRefs.delete(element);
    this.updateUI();
  }

  private updateUI(): void {
    const container = document.getElementById('sp-comment-container');
    if (container) {
      container.style.display = this.selectionMap.size > 0 ? 'block' : 'none';
      if (this.selectionMap.size > 0 && !container.classList.contains('sp-visible')) {
        container.classList.add('sp-visible');
      }
    }
    if (this.doneButton) {
      this.doneButton.textContent = `Confirm Selection (${this.selectionMap.size})`;
    }
  }

  private syncMarkers = (): void => {
    this.selectionMap.forEach((box, element) => {
      const rect = element.getBoundingClientRect();
      box.style.left = `${rect.left + window.scrollX}px`;
      box.style.top = `${rect.top + window.scrollY}px`;
      box.style.width = `${rect.width}px`;
      box.style.height = `${rect.height}px`;
    });
  };

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.selectionMap.size > 0 ? this.clearSelection() : this.deactivate();
    }
  };

  private clearSelection(): void {
    this.selectionMap.forEach(box => box.remove());
    this.selectionMap.clear();
    this.elementRefs.clear();
    this.updateUI();
  }

  private handleDone = (): void => {
    const comment = this.commentInput?.value.trim() || undefined;
    const pointedElements = Array.from(this.selectionMap.keys()).map(el => this.getElementData(el, comment));

    if (pointedElements.length > 0) {
      chrome.runtime.sendMessage({
        type: ElementPointerMessageType.ELEMENT_POINTED,
        data: pointedElements
      });
    }
    this.deactivate();
  };

  private getElementData(element: Element, comment?: string): PointedElement {
    const rect = element.getBoundingClientRect();
    const ref = this.elementRefs.get(element) || 'unknown';
    return {
      ref: `@${ref}`,
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      text: getElementText(element),
      comment,
      tagName: element.tagName.toLowerCase(),
      role: element.getAttribute('role') || undefined
    };
  }

  private attachHandlers(): void {
    if (this.doneButton) this.doneButton.onclick = this.handleDone;
    if (this.commentInput) {
      this.commentInput.onkeydown = (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.handleDone(); }
      };
    }
  }
}

const elementPointer = new ElementPointer();
chrome.runtime.onMessage.addListener((message: ElementPointerMessage, sender, sendResponse) => {
  if (message.type === ElementPointerMessageType.ACTIVATE) elementPointer.activate();
  else if (message.type === ElementPointerMessageType.DEACTIVATE) elementPointer.deactivate();
  else if (message.type === ElementPointerMessageType.STATUS) sendResponse(elementPointer.getStatus());
  return true;
});
