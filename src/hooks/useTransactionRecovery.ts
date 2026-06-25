/**
 * Hook for transaction handling with automatic recovery
 */

import { useState, useCallback, useRef } from 'react';
import { ErrorCategory } from '@/errors';
import { useRecovery, type UseRecoveryOptions } from './useRecovery';
import {
  validateTransactionInput,
  detectTransactionError,
  getTransactionRecoveryHandler,
  TransactionState as RecoveryTransactionState,
  type TransactionInput,
  type TransactionError
} from '@/utils/transactionRecovery';

/**
 * Transaction state in hook
 */
export interface TransactionState {
  status: 'idle' | 'pending' | 'processing' | 'success' | 'failed' | 'retrying';
  hash?: string;
  error?: TransactionError;
  attemptCount: number;
  canRetry: boolean;
}

/**
 * Hook for executing transactions with recovery
 */
export function useTransactionRecovery(options: UseRecoveryOptions = {}) {
  const recovery = useRecovery({
    onError: options.onError,
    onRetry: options.onRetry,
    onSuccess: options.onSuccess,
    autoRetryOnNetwork: true
  });

  const [txState, setTxState] = useState<TransactionState>({
    status: 'idle',
    attemptCount: 0,
    canRetry: false
  });

  const currentTxIdRef = useRef<string | null>(null);
  const recoveryHandler = getTransactionRecoveryHandler();

  /**
   * Execute transaction with validation and recovery
   */
  const executeTransaction = useCallback(
    async <T,>(
      transactionFn: () => Promise<T>,
      input: TransactionInput,
      txType: 'deposit' | 'withdraw' | 'claim'
    ): Promise<T | null> => {
      // Validate input first
      const validationError = validateTransactionInput(input);
      if (validationError) {
        recovery.handleError(validationError);
        setTxState(prev => ({
          ...prev,
          status: 'failed',
          error: detectTransactionError(validationError)
        }));
        return null;
      }

      // Generate transaction ID
      const txId = `${txType}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
      currentTxIdRef.current = txId;

      setTxState(prev => ({
        ...prev,
        status: 'pending',
        error: undefined
      }));

      try {
        // Execute with recovery
        const result = await recovery.executeWithRecovery<T>(
          transactionFn,
          ErrorCategory.BLOCKCHAIN
        );

        if (result) {
          recoveryHandler.recordAttempt(txId, txType, RecoveryTransactionState.SUCCESS);
          
          setTxState(prev => ({
            ...prev,
            status: 'success',
            attemptCount: recovery.attemptCount,
            canRetry: false
          }));

          return result;
        }

        // Failed after retries
        recoveryHandler.recordAttempt(
          txId,
          txType,
          RecoveryTransactionState.FAILED,
          recovery.error || undefined
        );

        setTxState(prev => ({
          ...prev,
          status: 'failed',
          error: recovery.error ? detectTransactionError(recovery.error) : undefined,
          attemptCount: recovery.attemptCount,
          canRetry: recovery.canRetry
        }));

        return null;
      } catch (error) {
        recovery.handleError(error, `Transaction ${txType}`);
        
        recoveryHandler.recordAttempt(
          txId,
          txType,
          RecoveryTransactionState.FAILED,
          recovery.error || undefined
        );

        setTxState(prev => ({
          ...prev,
          status: 'failed',
          error: recovery.error ? detectTransactionError(recovery.error) : undefined,
          attemptCount: recovery.attemptCount,
          canRetry: recovery.canRetry
        }));

        return null;
      }
    },
    [recovery, recoveryHandler]
  );

  /**
   * Retry failed transaction
   */
  const retryTransaction = useCallback(async () => {
    if (!txState.canRetry) return null;

    setTxState(prev => ({
      ...prev,
      status: 'retrying'
    }));

    await recovery.retry();
    
    return recovery.lastError === null;
  }, [txState.canRetry, recovery]);

  /**
   * Clear transaction state
   */
  const clearTransactionState = useCallback(() => {
    if (currentTxIdRef.current) {
      recoveryHandler.clearContext(currentTxIdRef.current);
      currentTxIdRef.current = null;
    }
    
    setTxState({
      status: 'idle',
      attemptCount: 0,
      canRetry: false
    });
    
    recovery.clearError();
  }, [recovery, recoveryHandler]);

  return {
    // State
    transactionStatus: txState.status,
    error: txState.error,
    attemptCount: txState.attemptCount,
    canRetry: txState.canRetry,
    isProcessing: txState.status === 'pending' || txState.status === 'processing',
    isRecovering: txState.status === 'retrying',
    
    // Handlers
    executeTransaction,
    retryTransaction,
    clearTransactionState
  };
}
