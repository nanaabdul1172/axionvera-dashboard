/**
 * Error detection and categorization utilities
 */

import {
  AppError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ContractError,
  ServerError,
  ErrorCategory,
  ErrorCode
} from './types';

/**
 * Detect and categorize errors from fetch responses
 */
export function categorizeHttpError(
  status: number,
  statusText?: string
): { category: ErrorCategory; code: ErrorCode } {
  // 429 = Rate Limited
  if (status === 429) {
    return {
      category: ErrorCategory.SERVER,
      code: ErrorCode.RATE_LIMITED
    };
  }

  // 4xx errors (Client errors)
  if (status >= 400 && status < 500) {
    if (status === 401) {
      return {
        category: ErrorCategory.SERVER,
        code: ErrorCode.UNAUTHORIZED
      };
    }
    if (status === 400) {
      return {
        category: ErrorCategory.SERVER,
        code: ErrorCode.BAD_REQUEST
      };
    }
    return {
      category: ErrorCategory.SERVER,
      code: ErrorCode.SERVER_ERROR
    };
  }

  // 5xx errors (Server errors)
  if (status >= 500) {
    if (status === 503) {
      return {
        category: ErrorCategory.SERVICE_UNAVAILABLE,
        code: ErrorCode.SERVICE_UNAVAILABLE
      };
    }
    return {
      category: ErrorCategory.SERVICE_UNAVAILABLE,
      code: ErrorCode.SERVER_ERROR
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    code: ErrorCode.UNKNOWN_ERROR
  };
}

/**
 * Detect error type from error object or message
 */
export function detectErrorType(error: any): {
  category: ErrorCategory;
  code: ErrorCode;
  isRecoverable: boolean;
} {
  // Network error detection
  if (error instanceof TypeError) {
    if (error.message.includes('fetch')) {
      return {
        category: ErrorCategory.NETWORK,
        code: ErrorCode.NO_CONNECTION,
        isRecoverable: true
      };
    }
  }

  // Timeout error detection
  if (error.name === 'AbortError' || error.message?.includes('timeout')) {
    return {
      category: ErrorCategory.TIMEOUT,
      code: ErrorCode.REQUEST_TIMEOUT,
      isRecoverable: true
    };
  }

  // Validation error detection
  if (error.name === 'ValidationError' || error.message?.includes('validation')) {
    return {
      category: ErrorCategory.VALIDATION,
      code: ErrorCode.INVALID_INPUT,
      isRecoverable: true
    };
  }

  // Contract error detection
  if (error.name === 'ContractError' || error.message?.includes('contract')) {
    return {
      category: ErrorCategory.CONTRACT,
      code: ErrorCode.CONTRACT_CALL_FAILED,
      isRecoverable: true
    };
  }

  // Server error detection
  if (error.status && error.status >= 400) {
    const { category, code } = categorizeHttpError(error.status);
    return {
      category,
      code,
      isRecoverable: category !== ErrorCategory.VALIDATION && category !== ErrorCategory.INTERNAL
    };
  }

  return {
    category: ErrorCategory.UNKNOWN,
    code: ErrorCode.UNKNOWN_ERROR,
    isRecoverable: true
  };
}

/**
 * Convert any error to AppError
 */
export function toAppError(error: any, context?: string): AppError {
  // If already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Detect error type
  const { category, code, isRecoverable } = detectErrorType(error);

  // Create appropriate error subclass
  switch (category) {
    case ErrorCategory.NETWORK:
      return new NetworkError(
        error.message || 'Network connection failed',
        {
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );

    case ErrorCategory.TIMEOUT:
      return new TimeoutError(
        error.message || 'Request timed out',
        {
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );

    case ErrorCategory.VALIDATION:
      return new ValidationError(
        error.message || 'Validation failed',
        {
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );

    case ErrorCategory.CONTRACT:
      return new ContractError(
        error.message || 'Contract call failed',
        {
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );

    case ErrorCategory.SERVER:
    case ErrorCategory.SERVICE_UNAVAILABLE:
      return new ServerError(
        error.message || 'Server error',
        error.status,
        {
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );

    default:
      return new AppError(
        error.message || context || 'An unknown error occurred',
        {
          category,
          code,
          originalError: error instanceof Error ? error : undefined,
          isRecoverable
        }
      );
  }
}

/**
 * Check if an error is network-related
 */
export function isNetworkError(error: any): boolean {
  if (error instanceof NetworkError) return true;
  if (error instanceof TypeError && error.message.includes('fetch')) return true;
  return error.isNetworkError === true;
}

/**
 * Check if an error is a timeout
 */
export function isTimeoutError(error: any): boolean {
  if (error instanceof TimeoutError) return true;
  if (error.name === 'AbortError') return true;
  if (error.isTimeout === true) return true;
  return error.message?.includes('timeout') || false;
}

/**
 * Check if an error is a validation error
 */
export function isValidationError(error: any): boolean {
  if (error instanceof ValidationError) return true;
  if (error.message?.includes('validation')) return true;
  return error.category === ErrorCategory.VALIDATION;
}

/**
 * Check if an error should be retried
 */
export function shouldRetryError(error: any): boolean {
  if (error instanceof AppError) {
    return error.isRecoverable;
  }
  const { isRecoverable } = detectErrorType(error);
  return isRecoverable;
}

/**
 * Extract HTTP status code from various error types
 */
export function getErrorStatusCode(error: any): number | undefined {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  if (typeof error.status === 'number') {
    return error.status;
  }
  if (typeof error.statusCode === 'number') {
    return error.statusCode;
  }
  return undefined;
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: any): Record<string, any> {
  const appError = error instanceof AppError ? error : toAppError(error);
  return {
    name: appError.name,
    message: appError.message,
    category: appError.category,
    code: appError.code,
    statusCode: appError.statusCode,
    retryCount: appError.retryCount,
    isRecoverable: appError.isRecoverable,
    timestamp: appError.timestamp.toISOString(),
    originalError: appError.originalError?.message
  };
}
