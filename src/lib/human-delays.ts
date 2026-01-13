/**
 * Human-Like Delays for Browser Automation
 * 
 * Provides realistic timing delays to make browser automation feel more human-like
 * and avoid bot detection. Includes randomized delays for typing, mouse movements,
 * and other interactions.
 */

export interface DelayConfig {
  min: number;
  max: number;
  variance?: number; // Additional random variance percentage
}

export interface TypingDelayConfig extends DelayConfig {
  pauseOnPunctuation?: number; // Extra delay after punctuation
  pauseOnSpace?: number; // Extra delay after spaces
}

export interface MouseDelayConfig extends DelayConfig {
  movementDelay?: number; // Delay between mouse movement steps
  clickDelay?: number; // Delay before/after clicks
}

/**
 * Human-like delay generator for browser automation
 */
export class HumanDelays {
  // Predefined delay configurations
  private static readonly TYPING_DELAYS = {
    human: { min: 20, max: 100, variance: 0.3, pauseOnPunctuation: 150, pauseOnSpace: 50 },
    fast: { min: 5, max: 25, variance: 0.2, pauseOnPunctuation: 50, pauseOnSpace: 20 },
    slow: { min: 50, max: 200, variance: 0.4, pauseOnPunctuation: 300, pauseOnSpace: 100 }
  };

  private static readonly MOUSE_DELAYS = {
    human: { min: 50, max: 150, variance: 0.3, movementDelay: 10, clickDelay: 25 },
    fast: { min: 10, max: 50, variance: 0.2, movementDelay: 5, clickDelay: 10 },
    slow: { min: 100, max: 300, variance: 0.4, movementDelay: 20, clickDelay: 50 }
  };

  private static readonly SCROLL_DELAYS = {
    human: { min: 100, max: 300, variance: 0.3 },
    fast: { min: 50, max: 150, variance: 0.2 },
    slow: { min: 200, max: 500, variance: 0.4 }
  };

  /**
   * Generate a random delay within the specified range
   */
  private randomDelay(config: DelayConfig): number {
    const baseDelay = Math.random() * (config.max - config.min) + config.min;
    
    if (config.variance) {
      const variance = baseDelay * config.variance * (Math.random() - 0.5);
      return Math.max(0, Math.round(baseDelay + variance));
    }
    
    return Math.round(baseDelay);
  }

  /**
   * Get typing delay for a character
   */
  getTypingDelay(char: string, mode: 'human' | 'fast' | 'slow' = 'human'): number {
    const config = HumanDelays.TYPING_DELAYS[mode];
    let delay = this.randomDelay(config);

    // Add extra delay for punctuation
    if (config.pauseOnPunctuation && /[.!?;:,]/.test(char)) {
      delay += config.pauseOnPunctuation;
    }

    // Add extra delay for spaces
    if (config.pauseOnSpace && char === ' ') {
      delay += config.pauseOnSpace;
    }

    return delay;
  }

  /**
   * Get mouse movement delay
   */
  getMouseDelay(mode: 'human' | 'fast' | 'slow' = 'human'): number {
    const config = HumanDelays.MOUSE_DELAYS[mode];
    return this.randomDelay(config);
  }

  /**
   * Get mouse movement step delay (for smooth movement)
   */
  getMouseMovementDelay(mode: 'human' | 'fast' | 'slow' = 'human'): number {
    const config = HumanDelays.MOUSE_DELAYS[mode];
    return config.movementDelay || 10;
  }

  /**
   * Get click delay (before/after click)
   */
  getClickDelay(mode: 'human' | 'fast' | 'slow' = 'human'): number {
    const config = HumanDelays.MOUSE_DELAYS[mode];
    return config.clickDelay || 25;
  }

  /**
   * Get scroll delay
   */
  getScrollDelay(mode: 'human' | 'fast' | 'slow' = 'human'): number {
    const config = HumanDelays.SCROLL_DELAYS[mode];
    return this.randomDelay(config);
  }

  /**
   * Generate delays for typing a complete string
   */
  generateTypingDelays(text: string, mode: 'human' | 'fast' | 'slow' = 'human'): number[] {
    return text.split('').map(char => this.getTypingDelay(char, mode));
  }

  /**
   * Calculate total typing time for a string
   */
  calculateTypingTime(text: string, mode: 'human' | 'fast' | 'slow' = 'human'): number {
    return this.generateTypingDelays(text, mode).reduce((total, delay) => total + delay, 0);
  }

  /**
   * Generate bezier curve points for natural mouse movement
   */
  generateMousePath(
    startX: number, 
    startY: number, 
    endX: number, 
    endY: number, 
    steps: number = 20
  ): Array<{ x: number; y: number }> {
    const path: Array<{ x: number; y: number }> = [];
    
    // Generate control points for bezier curve
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    
    // Add some randomness to the control points
    const controlX1 = midX + (Math.random() - 0.5) * 100;
    const controlY1 = midY + (Math.random() - 0.5) * 100;
    const controlX2 = midX + (Math.random() - 0.5) * 100;
    const controlY2 = midY + (Math.random() - 0.5) * 100;

    // Generate points along the bezier curve
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = this.bezierPoint(t, startX, controlX1, controlX2, endX);
      const y = this.bezierPoint(t, startY, controlY1, controlY2, endY);
      path.push({ x: Math.round(x), y: Math.round(y) });
    }

    return path;
  }

  /**
   * Calculate point on cubic bezier curve
   */
  private bezierPoint(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const oneMinusT = 1 - t;
    return (
      oneMinusT * oneMinusT * oneMinusT * p0 +
      3 * oneMinusT * oneMinusT * t * p1 +
      3 * oneMinusT * t * t * p2 +
      t * t * t * p3
    );
  }

  /**
   * Add random jitter to coordinates
   */
  addJitter(x: number, y: number, maxJitter: number = 2): { x: number; y: number } {
    return {
      x: x + (Math.random() - 0.5) * maxJitter * 2,
      y: y + (Math.random() - 0.5) * maxJitter * 2
    };
  }

  /**
   * Wait for a specified delay
   */
  async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait with human-like variance
   */
  async waitHuman(baseMs: number, variance: number = 0.3): Promise<void> {
    const delay = this.randomDelay({ min: baseMs * (1 - variance), max: baseMs * (1 + variance) });
    return this.wait(delay);
  }

  /**
   * Generate realistic pause between actions
   */
  async pauseBetweenActions(mode: 'human' | 'fast' | 'slow' = 'human'): Promise<void> {
    const delays = {
      human: { min: 200, max: 800, variance: 0.4 },
      fast: { min: 50, max: 200, variance: 0.3 },
      slow: { min: 500, max: 1500, variance: 0.5 }
    };

    const delay = this.randomDelay(delays[mode]);
    return this.wait(delay);
  }
}