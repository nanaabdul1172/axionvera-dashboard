/**
 * Transaction-specific error handling and recovery
 */

import {
  AppError,
  ErrorCategory,
  ErrorCode,
  ValidationError,
  ContractError,
  toAppError
} from '@/errors';

/**
 * Transaction states
 */
export enum TransactionState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
  RETRYING = 'retrying'
}

/**
 * Transaction error types
 */
export enum TransactionErrorType {
  VALIDATION = 'validation',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  CONTRACT_ERROR = 'contract_error',
  UNKNOWN = 'unknown'
}

/**
 * Transaction error information
 */
export interface TransactionError {
  type: TransactionErrorType;
  code: ErrorCode;
  message: string;
  userMessage: string;
  isRecoverable: boolean;
  suggestedAction?: string;
  retryable: boolean;
}

/**
 * Detect transaction error type
 */
export function detectTransactionError(error: any): TransactionError {
  const appError = error instanceof AppError ? error : toAppError(error);

  let type: TransactionErrorType;
  let suggestedAction: string | undefined;

  // Categorize by error type
  if (appError.category === ErrorCategory.VALIDATION) {
    if (appError.code === ErrorCode.INSUFFICIENT_BALANCE) {
      type = TransactionErrorType.INSUFFICIENT_BALANCE;
      suggestedAction = 'Please deposit more funds and try again.';
    } else {
      type = TransactionErrorType.VALIDATION;
      suggestedAction = 'Please check your input and try again.';
    }
  } else if (appError.category === ErrorCategory.NETWORK) {
    type = TransactionErrorType.NETWORK;
    suggestedAction = 'Check your internet connection and try again.';
  } else if (appError.category === ErrorCategory.TIMEOUT) {
    type = TransactionErrorType.TIMEOUT;
    suggestedAction = 'The network is slow. Please try again.';
  } else if (appError.category === ErrorCategory.CONTRACT) {
    type = TransactionErrorType.CONTRACT_ERROR;
    suggestedAction = 'The transaction was rejected. Please try again.';
  } else {
    type = TransactionErrorType.UNKNOWN;
  }

  return {
    type,
    code: appError.code,
    message: appError.message,
    userMessage: appError.userFacingMessage,
    isRecoverable: appError.isRecoverable,
    suggestedAction,
    retryable: type === TransactionErrorType.NETWORK ||
               type === TransactionErrorType.TIMEOUT
  };
}

/**
 * Validate transaction input
 */
export interface TransactionInput {
  walletAddress?: string;
  amount?: string;
  network?: string;
}

/**
 * Validate transaction before submission
 */
export function validateTransactionInput(input: TransactionInput): AppError | null {
  if (!input.walletAddress) {
    return new ValidationError('Wallet address is required', {
      code: ErrorCode.INVALID_ADDRESS,
      userFacingMessage: 'Please connect your wallet first.'
    });
  }

  if (!input.amount || parseFloat(input.amount) <= 0) {
    return new ValidationError('Invalid amount', {
      code: ErrorCode.INVALID_AMOUNT,
      userFacingMessage: 'Please enter a valid amount greater than zero.'
    });
  }

  if (!input.network) {
    return new ValidationError('Network is required', {
      code: ErrorCode.INVALID_INPUT,
      userFacingMessage: 'Please select a network.'
    });
  }

  return null;
}

/**
 * Transaction recovery context
 */
export interface TransactionRecoveryContext {
  transactionId: string;
  type: 'deposit' | 'withdraw' | 'claim';
  status: TransactionState;
  error?: TransactionError;
  lastAttempt?: Date;
  attemptCount: number;
  maxRetries: number;
}

/**
 * Create transaction recovery context
 */
export function createTransactionRecoveryContext(
  transactionId: string,
  type: 'deposit' | 'withdraw' | 'claim'
): TransactionRecoveryContext {
  return {
    transactionId,
    type,
    status: TransactionState.PENDING,
    attemptCount: 0,
    maxRetries: 3
  };
}

/**
 * Transaction recovery handler
 */
export class TransactionRecoveryHandler {
  private contexts: Map<string, TransactionRecoveryContext> = new Map();

  /**
   * Record transaction attempt
   */
  recordAttempt(
    transactionId: string,
    type: 'deposit' | 'withdraw' | 'claim',
    status: TransactionState,
    error?: AppError
  ): TransactionRecoveryContext {
    let context = this.contexts.get(transactionId);

    if (!context) {
      context = createTransactionRecoveryContext(transactionId, type);
      this.contexts.set(transactionId, context);
    }

    context.status = status;
    context.attemptCount++;
    context.lastAttempt = new Date();

    if (error) {
      context.error = detectTransactionError(error);
    }

    return context;
  }

  /**
   * Check if transaction can be retried
   */
  canRetry(transactionId: string): boolean {
    const context = this.contexts.get(transactionId);
    if (!context) return false;

    return Boolean(
      context.status === TransactionState.FAILED &&
      context.error?.retryable &&
      context.attemptCount < context.maxRetries
    );
  }

  /**
   * Get transaction context
   */
  getContext(transactionId: string): TransactionRecoveryContext | undefined {
    return this.contexts.get(transactionId);
  }

  /**
   * Clear transaction context
   */
  clearContext(transactionId: string): void {
    this.contexts.delete(transactionId);
  }

  /**
   * Get all failed transactions that can be recovered
   */
  getRecoverableTransactions(): TransactionRecoveryContext[] {
    const recoverable: TransactionRecoveryContext[] = [];

    for (const context of this.contexts.values()) {
      if (this.canRetry(context.transactionId)) {
        recoverable.push(context);
      }
    }

    return recoverable;
  }
}

/**
 * Global transaction recovery handler instance
 */
let globalHandler: TransactionRecoveryHandler;

/**
 * Get global transaction recovery handler
 */
export function getTransactionRecoveryHandler(): TransactionRecoveryHandler {
  if (!globalHandler) {
    globalHandler = new TransactionRecoveryHandler();
  }
  return globalHandler;
}
