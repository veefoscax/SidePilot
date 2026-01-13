/**
 * Browser-Use Cloud SDK Client
 * 
 * Wrapper for browser-use.com cloud API to provide advanced browser automation
 * with stealth mode, file system access, and structured output capabilities.
 */

export interface BrowserUseTask {
  id: string;
  description: string;
  url?: string;
  actions?: Array<{
    type: 'click' | 'type' | 'scroll' | 'navigate' | 'screenshot' | 'extract';
    target?: string;
    value?: string;
    options?: any;
  }>;
  extractSchema?: any;
  stealthMode?: boolean;
  timeout?: number;
}

export interface BrowserUseResult {
  success: boolean;
  data?: any;
  screenshots?: string[];
  error?: string;
  executionTime: number;
  steps: Array<{
    action: string;
    result: any;
    timestamp: number;
  }>;
}

export interface BrowserUseConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  retries?: number;
}

/**
 * Browser-Use Cloud SDK client for advanced browser automation
 */
export class BrowserUseClient {
  private config: BrowserUseConfig;
  private activeTasks = new Map<string, any>();

  constructor(config: BrowserUseConfig) {
    this.config = {
      baseUrl: 'https://api.browser-use.com/v1',
      timeout: 60000,
      retries: 3,
      ...config
    };
  }

  /**
   * Validate API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to validate Browser-Use API key:', error);
      return false;
    }
  }

  /**
   * Create a new automation task
   */
  async createTask(task: BrowserUseTask): Promise<string> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...task,
          timeout: task.timeout || this.config.timeout
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create task: ${response.statusText}`);
      }

      const result = await response.json();
      this.activeTasks.set(result.taskId, result);
      
      return result.taskId;
    } catch (error) {
      console.error('Failed to create Browser-Use task:', error);
      throw error;
    }
  }

  /**
   * Execute task and get results
   */
  async executeTask(taskId: string): Promise<BrowserUseResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to execute task: ${response.statusText}`);
      }

      const result = await response.json();
      this.activeTasks.delete(taskId);
      
      return result;
    } catch (error) {
      console.error(`Failed to execute Browser-Use task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Execute task with streaming updates
   */
  async executeTaskWithStreaming(
    taskId: string, 
    onUpdate?: (update: any) => void
  ): Promise<BrowserUseResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}/stream`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to start streaming task: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let finalResult: BrowserUseResult | null = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          // Parse streaming JSON
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim());

          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              
              if (data.type === 'update' && onUpdate) {
                onUpdate(data);
              } else if (data.type === 'complete') {
                finalResult = data.result;
              }
            } catch (parseError) {
              // Ignore malformed JSON lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        this.activeTasks.delete(taskId);
      }

      if (!finalResult) {
        throw new Error('No final result received from streaming task');
      }

      return finalResult;
    } catch (error) {
      console.error(`Failed to execute streaming Browser-Use task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get task status
   */
  async getTaskStatus(taskId: string): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}/status`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get task status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to get Browser-Use task status ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      const response = await fetch(`${this.config.baseUrl}/tasks/${taskId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel task: ${response.statusText}`);
      }

      this.activeTasks.delete(taskId);
    } catch (error) {
      console.error(`Failed to cancel Browser-Use task ${taskId}:`, error);
      throw error;
    }
  }

  /**
   * Get account usage and limits
   */
  async getUsage(): Promise<any> {
    try {
      const response = await fetch(`${this.config.baseUrl}/account/usage`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get usage: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get Browser-Use usage:', error);
      throw error;
    }
  }

  /**
   * List available browser environments
   */
  async getBrowserEnvironments(): Promise<any[]> {
    try {
      const response = await fetch(`${this.config.baseUrl}/environments`, {
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get environments: ${response.statusText}`);
      }

      const result = await response.json();
      return result.environments || [];
    } catch (error) {
      console.error('Failed to get Browser-Use environments:', error);
      throw error;
    }
  }

  /**
   * Create a simple automation task
   */
  async automateTask(description: string, options: {
    url?: string;
    stealthMode?: boolean;
    extractSchema?: any;
    timeout?: number;
  } = {}): Promise<BrowserUseResult> {
    const task: BrowserUseTask = {
      id: `task_${Date.now()}`,
      description,
      ...options
    };

    const taskId = await this.createTask(task);
    return await this.executeTask(taskId);
  }

  /**
   * Get active tasks
   */
  getActiveTasks(): string[] {
    return Array.from(this.activeTasks.keys());
  }

  /**
   * Clear all active tasks
   */
  clearActiveTasks(): void {
    this.activeTasks.clear();
  }
}