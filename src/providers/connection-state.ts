/**
 * Connection State Management
 * 
 * Manages provider connection health, caching, and retry logic
 */

import { ConnectionStatus, ProviderError } from './types';

export class ConnectionState {
  private lastTestTime: Date | null = null;
  private lastTestResult: boolean = false;
  private consecutiveFailures: number = 0;
  private isHealthy: boolean = true;
  private lastError: ProviderError | null = null;

  markSuccess(): void {
    this.lastTestTime = new Date();
    this.lastTestResult = true;
    this.consecutiveFailures = 0;
    this.isHealthy = true;
    this.lastError = null;
  }

  markFailure(error: ProviderError): void {
    this.lastTestTime = new Date();
    this.lastTestResult = false;
    this.consecutiveFailures++;
    this.lastError = error;
    
    // Mark as unhealthy after 3 consecutive failures
    if (this.consecutiveFailures >= 3) {
      this.isHealthy = false;
    }
  }

  shouldRetry(): boolean {
    if (!this.lastTestTime) return true;
    
    const timeSinceLastTest = Date.now() - this.lastTestTime.getTime();
    const backoffTime = Math.min(1000 * Math.pow(2, this.consecutiveFailures), 30000);
    
    return timeSinceLastTest > backoffTime;
  }

  getStatus(): ConnectionStatus {
    if (!this.lastTestTime) return 'untested';
    if (this.isHealthy && this.lastTestResult) return 'healthy';
    if (!this.isHealthy) return 'unhealthy';
    return 'degraded';
  }

  getLastError(): ProviderError | null {
    return this.lastError;
  }

  getConsecutiveFailures(): number {
    return this.consecutiveFailures;
  }

  getLastTestTime(): Date | null {
    return this.lastTestTime;
  }

  reset(): void {
    this.lastTestTime = null;
    this.lastTestResult = false;
    this.consecutiveFailures = 0;
    this.isHealthy = true;
    this.lastError = null;
  }
}