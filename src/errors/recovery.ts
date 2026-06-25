/**
 * Default recovery strategies for different error categories
 */

import { 
  AppError, 
  NetworkError, 
  TimeoutError, 
  ServerError,
  ErrorCategory, 
  ErrorCode,
  type RetryPolicy,
  type RecoveryStrategy
} from './types';

/**
 * Default retry policies for different error categories
 */
export const DEFAULT_RETRY_POLICIES: Record<ErrorCategory, RetryPolicy> = {
  [ErrorCategory.NETWORK]: {
    maxAttempts: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
    timeoutMs: 15000,
    shouldRetry: (error: AppError) => 
      error.category === ErrorCategory.NETWORK && 
      error.retryCount < 5
  },
  
  [ErrorCategory.TIMEOUT]: {
    maxAttempts: 4,
    initialDelayMs: 500,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    timeoutMs: 20000,
    shouldRetry: (error: AppError) => 
      error.category === ErrorCategory.TIMEOUT && 
      error.retryCount < 4
  },
  
  [ErrorCategory.VALIDATION]: {
    maxAttempts: 1,
    initialDelayMs: 0,
    maxDelayMs: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000,
    shouldRetry: () => false // Don't retry validation errors
  },
  
  [ErrorCategory.SERVER]: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 15000,
    backoffMultiplier: 2,
    timeoutMs: 15000,
    shouldRetry: (error: AppError) => 
      error.statusCode !== 429 && 
      error.retryCount < 3
  },
  
  [ErrorCategory.SERVICE_UNAVAILABLE]: {
    maxAttempts: 5,
    initialDelayMs: 5000,
    maxDelayMs: 60000,
    backoffMultiplier: 2,
    timeoutMs: 20000,
    shouldRetry: (error: AppError) => 
      error.retryCount < 5
  },
  
  [ErrorCategory.CONTRACT]: {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    timeoutMs: 30000,
    shouldRetry: (error: AppError) => 
      error.retryCount < 2
  },
  
  [ErrorCategory.BLOCKCHAIN]: {
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    timeoutMs: 30000,
    shouldRetry: (error: AppError) => 
      error.retryCount < 3
  },
  
  [ErrorCategory.INTERNAL]: {
    maxAttempts: 1,
    initialDelayMs: 0,
    maxDelayMs: 0,
    backoffMultiplier: 1,
    timeoutMs: 5000,
    shouldRetry: () => false
  },
  
  [ErrorCategory.UNKNOWN]: {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
    timeoutMs: 10000,
    shouldRetry: (error: AppError) => 
      error.retryCount < 2
  }
};

/**
 * Recovery strategies for different error categories
 */
export const RECOVERY_STRATEGIES: Record<ErrorCategory, RecoveryStrategy> = {
  [ErrorCategory.NETWORK]: {
    category: ErrorCategory.NETWORK,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.NETWORK],
    userMessageOverride: 'Connection issue detected. Retrying...'
  },
  
  [ErrorCategory.TIMEOUT]: {
    category: ErrorCategory.TIMEOUT,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.TIMEOUT],
    userMessageOverride: 'Request timed out. Retrying with longer timeout...'
  },
  
  [ErrorCategory.VALIDATION]: {
    category: ErrorCategory.VALIDATION,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.VALIDATION]
  },
  
  [ErrorCategory.SERVER]: {
    category: ErrorCategory.SERVER,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.SERVER],
    userMessageOverride: 'Server is busy. Retrying...'
  },
  
  [ErrorCategory.SERVICE_UNAVAILABLE]: {
    category: ErrorCategory.SERVICE_UNAVAILABLE,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.SERVICE_UNAVAILABLE],
    userMessageOverride: 'Service temporarily unavailable. Will retry shortly...'
  },
  
  [ErrorCategory.CONTRACT]: {
    category: ErrorCategory.CONTRACT,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.CONTRACT],
    userMessageOverride: 'Retrying transaction...'
  },
  
  [ErrorCategory.BLOCKCHAIN]: {
    category: ErrorCategory.BLOCKCHAIN,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.BLOCKCHAIN],
    userMessageOverride: 'Blockchain is busy. Retrying...'
  },
  
  [ErrorCategory.INTERNAL]: {
    category: ErrorCategory.INTERNAL,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.INTERNAL]
  },
  
  [ErrorCategory.UNKNOWN]: {
    category: ErrorCategory.UNKNOWN,
    retryPolicy: DEFAULT_RETRY_POLICIES[ErrorCategory.UNKNOWN]
  }
};

/**
 * Get the recovery strategy for a given error
 */
export function getRecoveryStrategy(error: AppError | Error): RecoveryStrategy {
  if (error instanceof AppError) {
    return RECOVERY_STRATEGIES[error.category];
  }
  return RECOVERY_STRATEGIES[ErrorCategory.UNKNOWN];
}

/**
 * Get the retry policy for a given error category
 */
export function getRetryPolicy(category: ErrorCategory): RetryPolicy {
  return DEFAULT_RETRY_POLICIES[category];
}

/**
 * Calculate backoff delay based on attempt number
 */
export function calculateBackoffDelay(
  attempt: number,
  policy: RetryPolicy
): number {
  const exponentialDelay = policy.initialDelayMs * Math.pow(policy.backoffMultiplier, attempt);
  return Math.min(exponentialDelay, policy.maxDelayMs);
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
