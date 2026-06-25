/**
 * Enhanced error handling and recovery hook
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  AppError,
  ErrorCategory,
  toAppError,
  getRecoveryStrategy,
  executeWithRetry,
  type RetryExecutorResult
} from '@/errors';

/**
 * Recovery state
 */
export interface RecoveryState {
  error: AppError | null;
  isLoading: boolean;
  isRecovering: boolean;
  attemptCount: number;
  lastError: AppError | null;
  canRetry: boolean;
}

/**
 * Recovery handlers
 */
export interface RecoveryHandlers {
  clearError: () => void;
  retry: () => Promise<void>;
  execute: <T>(fn: () => Promise<T>) => Promise<T | null>;
  executeWithRecovery: <T>(
    fn: () => Promise<T>,
    category?: ErrorCategory
  ) => Promise<T | null>;
  handleError: (error: any, context?: string) => void;
}

/**
 * Complete recovery hook return value
 */
export interface UseRecoveryReturn extends RecoveryState, RecoveryHandlers {}

/**
 * Options for recovery hook
 */
export interface UseRecoveryOptions {
  onError?: (error: AppError) => void;
  onRetry?: (attempt: number, error: AppError) => void;
  onSuccess?: (result: any) => void;
  autoRetryOnNetwork?: boolean;
  maxAutoRetries?: number;
}

/**
 * Enhanced error handling and recovery hook
 */
export function useRecovery(options: UseRecoveryOptions = {}): UseRecoveryReturn {
  const {
    onError,
    onRetry,
    onSuccess,
    autoRetryOnNetwork = true,
    maxAutoRetries = 3
  } = options;

  const [state, setState] = useState<RecoveryState>({
    error: null,
    isLoading: false,
    isRecovering: false,
    attemptCount: 0,
    lastError: null,
    canRetry: false
  });

  const currentFnRef = useRef<(() => Promise<any>) | null>(null);
  const autoRetryCountRef = useRef(0);

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
      canRetry: false
    }));
  }, []);

  /**
   * Handle error with recovery
   */
  const handleError = useCallback((error: any, context?: string) => {
    const appError = toAppError(error, context);
    
    setState(prev => ({
      ...prev,
      error: appError,
      lastError: appError,
      isLoading: false,
      isRecovering: false,
      canRetry: appError.isRecoverable
    }));

    if (onError) {
      onError(appError);
    }

    // Log error
    console.error(`[${context || 'Recovery'}] Error:`, appError.toJSON());
  }, [onError]);

  /**
   * Retry last failed operation
   */
  const retry = useCallback(async () => {
    if (!currentFnRef.current || !state.canRetry) {
      return;
    }

    setState(prev => ({
      ...prev,
      isRecovering: true,
      attemptCount: prev.attemptCount + 1
    }));

    try {
      const result = await currentFnRef.current();
      
      setState(prev => ({
        ...prev,
        error: null,
        isRecovering: false,
        canRetry: false
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error: any) {
      handleError(error, 'Retry attempt');
    }
  }, [state.canRetry, onSuccess, handleError]);

  /**
   * Execute with basic error handling (no retry)
   */
  const execute = useCallback(async <T,>(fn: () => Promise<T>): Promise<T | null> => {
    currentFnRef.current = fn;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const result = await fn();
      
      setState(prev => ({
        ...prev,
        isLoading: false
      }));

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error: any) {
      handleError(error, 'Execute');
      return null;
    }
  }, [onSuccess, handleError]);

  /**
   * Execute with automatic recovery
   */
  const executeWithRecovery = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      category: ErrorCategory = ErrorCategory.UNKNOWN
    ): Promise<T | null> => {
      currentFnRef.current = fn;

      setState(prev => ({
        ...prev,
        isLoading: true,
        error: null,
        attemptCount: 0
      }));

      autoRetryCountRef.current = 0;

      try {
        const result = await executeWithRetry<T>(fn, category, {
          onRetry: (attempt, error, nextDelayMs) => {
            autoRetryCountRef.current = attempt;

            setState(prev => ({
              ...prev,
              isRecovering: true,
              attemptCount: attempt,
              lastError: error
            }));

            if (onRetry) {
              onRetry(attempt, error);
            }

            console.warn(
              `[Recovery] Retry attempt ${attempt}, next in ${nextDelayMs}ms`,
              error.code
            );
          },
          onSuccess: (data, attempts) => {
            setState(prev => ({
              ...prev,
              isLoading: false,
              isRecovering: false,
              error: null,
              canRetry: false
            }));

            if (onSuccess) {
              onSuccess(data);
            }
          },
          onFailure: (error) => {
            handleError(error, 'Recovery execution');
          }
        });

        if (result.success) {
          return result.data as T;
        }

        return null;
      } catch (error: any) {
        handleError(error, 'executeWithRecovery');
        return null;
      }
    },
    [onRetry, onSuccess, handleError]
  );

  return {
    // State
    error: state.error,
    isLoading: state.isLoading,
    isRecovering: state.isRecovering,
    attemptCount: state.attemptCount,
    lastError: state.lastError,
    canRetry: state.canRetry,
    
    // Handlers
    clearError,
    retry,
    execute,
    executeWithRecovery,
    handleError
  };
}

/**
 * Simpler API error hook with automatic recovery
 */
export interface UseApiErrorOptions {
  onError?: (error: AppError) => void;
}

/**
 * Simpler version of useRecovery for basic API error handling
 */
export function useApiErrorRecovery(options: UseApiErrorOptions = {}) {
  const recovery = useRecovery({
    onError: options.onError,
    autoRetryOnNetwork: true
  });

  return {
    error: recovery.error,
    isLoading: recovery.isLoading,
    isRecovering: recovery.isRecovering,
    clearError: recovery.clearError,
    handleError: recovery.handleError,
    execute: recovery.execute,
    executeWithRecovery: recovery.executeWithRecovery
  };
}
