/**
 * Central retry mechanism with configurable policies and logging
 */

import {
  AppError,
  ErrorCategory,
  type RetryPolicy
} from './types';
import {
  DEFAULT_RETRY_POLICIES,
  RECOVERY_STRATEGIES,
  calculateBackoffDelay,
  sleep
} from './recovery';
import {
  toAppError,
  shouldRetryError,
  formatErrorForLogging
} from './detection';

/**
 * Options for retry execution
 */
export interface RetryExecutorOptions {
  onRetry?: (attempt: number, error: AppError, nextDelayMs: number) => void;
  onSuccess?: (result: any, attempts: number) => void;
  onFailure?: (error: AppError) => void;
}

/**
 * Result of a retry execution
 */
export interface RetryExecutorResult<T> {
  success: boolean;
  data?: T;
  error?: AppError;
  attempts: number;
  totalTimeMs: number;
}

/**
 * Main retry executor class
 */
export class RetryExecutor {
  private policy: RetryPolicy;
  private attemptCount: number = 0;
  private startTime: number = 0;

  constructor(policy: RetryPolicy) {
    this.policy = policy;
  }

  /**
   * Execute a function with automatic retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    options: RetryExecutorOptions = {}
  ): Promise<RetryExecutorResult<T>> {
    this.startTime = Date.now();
    this.attemptCount = 0;
    let lastError: AppError | null = null;

    while (this.attemptCount < this.policy.maxAttempts) {
      try {
        const result = await this.executeWithTimeout(fn);
        this.attemptCount++;

        if (options.onSuccess) {
          options.onSuccess(result, this.attemptCount);
        }

        return {
          success: true,
          data: result,
          attempts: this.attemptCount,
          totalTimeMs: Date.now() - this.startTime
        };
      } catch (error: any) {
        const appError = toAppError(error);
        this.attemptCount++;
        lastError = appError;

        // Check if we should retry
        if (!this.shouldRetry(appError)) {
          if (options.onFailure) {
            options.onFailure(appError);
          }

          return {
            success: false,
            error: appError,
            attempts: this.attemptCount,
            totalTimeMs: Date.now() - this.startTime
          };
        }

        // Calculate backoff delay
        const nextDelayMs = calculateBackoffDelay(this.attemptCount - 1, this.policy);

        // Log retry attempt
        if (options.onRetry) {
          options.onRetry(this.attemptCount, appError, nextDelayMs);
        } else {
          console.warn(
            `Retry attempt ${this.attemptCount}/${this.policy.maxAttempts} after ${nextDelayMs}ms`,
            formatErrorForLogging(appError)
          );
        }

        // Wait before next attempt
        if (nextDelayMs > 0) {
          await sleep(nextDelayMs);
        }
      }
    }

    // All retries exhausted
    if (options.onFailure && lastError) {
      options.onFailure(lastError);
    }

    return {
      success: false,
      error: lastError || new AppError('Max retry attempts reached'),
      attempts: this.attemptCount,
      totalTimeMs: Date.now() - this.startTime
    };
  }

  /**
   * Execute function with timeout
   */
  private executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Operation timed out after ${this.policy.timeoutMs}ms`)),
          this.policy.timeoutMs
        )
      )
    ]);
  }

  /**
   * Check if error should be retried
   */
  private shouldRetry(error: AppError): boolean {
    // Check if max attempts exceeded
    if (this.attemptCount >= this.policy.maxAttempts) {
      return false;
    }

    // Use policy's shouldRetry function
    return this.policy.shouldRetry(error);
  }
}

/**
 * Get retry executor for specific error category
 */
export function getRetryExecutor(category: ErrorCategory): RetryExecutor {
  const policy = DEFAULT_RETRY_POLICIES[category];
  return new RetryExecutor(policy);
}

/**
 * Execute with automatic retry based on error
 */
export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  defaultCategory: ErrorCategory = ErrorCategory.UNKNOWN,
  options: RetryExecutorOptions = {}
): Promise<RetryExecutorResult<T>> {
  const executor = getRetryExecutor(defaultCategory);
  return executor.execute(fn, options);
}

/**
 * Legacy helper: Simple retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt < maxAttempts - 1) {
        const delayMs = initialDelayMs * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  throw lastError || new Error('Max retry attempts reached');
}
