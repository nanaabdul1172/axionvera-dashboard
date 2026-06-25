/**
 * Central error handling module
 * Exports all error types, utilities, and recovery mechanisms
 */

// Error types and definitions
export {
  ErrorCategory,
  ErrorCode,
  type RetryPolicy,
  type RecoveryStrategy,
  AppError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ContractError,
  ServerError
} from './types';

// Recovery strategies and policies
export {
  DEFAULT_RETRY_POLICIES,
  RECOVERY_STRATEGIES,
  getRecoveryStrategy,
  getRetryPolicy,
  calculateBackoffDelay,
  sleep
} from './recovery';

// Error detection and categorization
export {
  categorizeHttpError,
  detectErrorType,
  toAppError,
  isNetworkError,
  isTimeoutError,
  isValidationError,
  shouldRetryError,
  getErrorStatusCode,
  formatErrorForLogging
} from './detection';

// Retry execution
export {
  RetryExecutor,
  getRetryExecutor,
  executeWithRetry,
  retryWithBackoff,
  type RetryExecutorOptions,
  type RetryExecutorResult
} from './retry';
