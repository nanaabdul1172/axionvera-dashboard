/**
 * Tests for transaction error handling and recovery
 */

import {
  detectTransactionError,
  validateTransactionInput,
  getTransactionRecoveryHandler,
  createTransactionRecoveryContext,
  TransactionRecoveryHandler,
  TransactionState,
  TransactionErrorType
} from '@/utils/transactionRecovery';
import {
  AppError,
  NetworkError,
  ValidationError,
  ErrorCode,
  ErrorCategory
} from '@/errors';

describe('Transaction Error Detection', () => {
  it('should detect network errors as retryable', () => {
    const error = new NetworkError('Connection failed');
    const txError = detectTransactionError(error);

    expect(txError.type).toBe(TransactionErrorType.NETWORK);
    expect(txError.retryable).toBe(true);
    expect(txError.isRecoverable).toBe(true);
  });

  it('should detect validation errors', () => {
    const error = new ValidationError('Invalid amount', {
      code: ErrorCode.INVALID_AMOUNT
    });
    const txError = detectTransactionError(error);

    expect(txError.type).toBe(TransactionErrorType.VALIDATION);
    expect(txError.retryable).toBe(false);
  });

  it('should detect insufficient balance', () => {
    const error = new ValidationError('Insufficient balance', {
      code: ErrorCode.INSUFFICIENT_BALANCE
    });
    const txError = detectTransactionError(error);

    expect(txError.type).toBe(TransactionErrorType.INSUFFICIENT_BALANCE);
    expect(txError.suggestedAction).toBeTruthy();
  });

  it('should provide suggested actions', () => {
    const error = new NetworkError('Connection failed');
    const txError = detectTransactionError(error);

    expect(txError.suggestedAction).toBeDefined();
    expect(txError.suggestedAction?.length).toBeGreaterThan(0);
  });

  it('should extract error message', () => {
    const error = new AppError('Transaction failed', {
      userFacingMessage: 'Custom user message'
    });
    const txError = detectTransactionError(error);

    expect(txError.userMessage).toBe('Custom user message');
  });
});

describe('Transaction Input Validation', () => {
  it('should accept valid transaction input', () => {
    const input = {
      walletAddress: 'G123456789',
      amount: '100',
      network: 'mainnet'
    };
    const error = validateTransactionInput(input);

    expect(error).toBeNull();
  });

  it('should reject missing wallet address', () => {
    const input = {
      amount: '100',
      network: 'mainnet'
    };
    const error = validateTransactionInput(input);

    expect(error).not.toBeNull();
    expect(error?.code).toBe(ErrorCode.INVALID_ADDRESS);
  });

  it('should reject invalid amount', () => {
    const input = {
      walletAddress: 'G123456789',
      amount: '-100',
      network: 'mainnet'
    };
    const error = validateTransactionInput(input);

    expect(error).not.toBeNull();
    expect(error?.code).toBe(ErrorCode.INVALID_AMOUNT);
  });

  it('should reject zero amount', () => {
    const input = {
      walletAddress: 'G123456789',
      amount: '0',
      network: 'mainnet'
    };
    const error = validateTransactionInput(input);

    expect(error).not.toBeNull();
  });

  it('should reject missing network', () => {
    const input = {
      walletAddress: 'G123456789',
      amount: '100'
    };
    const error = validateTransactionInput(input);

    expect(error).not.toBeNull();
  });

  it('should provide user-friendly error messages', () => {
    const input = { amount: '-100' };
    const error = validateTransactionInput(input);

    expect(error?.userFacingMessage).toBeTruthy();
    expect(error?.userFacingMessage?.length).toBeGreaterThan(0);
  });
});

describe('TransactionRecoveryContext', () => {
  it('should create context with defaults', () => {
    const context = createTransactionRecoveryContext('tx-123', 'deposit');

    expect(context.transactionId).toBe('tx-123');
    expect(context.type).toBe('deposit');
    expect(context.status).toBe(TransactionState.PENDING);
    expect(context.attemptCount).toBe(0);
    expect(context.maxRetries).toBe(3);
  });

  it('should track multiple transaction types', () => {
    const deposit = createTransactionRecoveryContext('tx-1', 'deposit');
    const withdraw = createTransactionRecoveryContext('tx-2', 'withdraw');
    const claim = createTransactionRecoveryContext('tx-3', 'claim');

    expect(deposit.type).toBe('deposit');
    expect(withdraw.type).toBe('withdraw');
    expect(claim.type).toBe('claim');
  });
});

describe('TransactionRecoveryHandler', () => {
  let handler: TransactionRecoveryHandler;

  beforeEach(() => {
    handler = new TransactionRecoveryHandler();
  });

  it('should record transaction attempt', () => {
    const result = handler.recordAttempt('tx-123', 'deposit', TransactionState.PROCESSING);

    expect(result.transactionId).toBe('tx-123');
    expect(result.type).toBe('deposit');
    expect(result.status).toBe(TransactionState.PROCESSING);
    expect(result.attemptCount).toBe(1);
  });

  it('should increment attempt count on multiple records', () => {
    handler.recordAttempt('tx-123', 'deposit', TransactionState.PROCESSING);
    const result = handler.recordAttempt('tx-123', 'deposit', TransactionState.FAILED);

    expect(result.attemptCount).toBe(2);
  });

  it('should record errors with transactions', () => {
    const error = new NetworkError('Connection failed');
    const result = handler.recordAttempt('tx-123', 'deposit', TransactionState.FAILED, error);

    expect(result.error).toBeDefined();
    expect(result.error?.type).toBe(TransactionErrorType.NETWORK);
  });

  it('should check if transaction can be retried', () => {
    const error = new NetworkError('Connection failed');
    handler.recordAttempt('tx-123', 'deposit', TransactionState.FAILED, error);

    const canRetry = handler.canRetry('tx-123');
    expect(canRetry).toBe(true);
  });

  it('should not allow retry after max attempts', () => {
    const error = new NetworkError('Connection failed');

    for (let i = 0; i < 3; i++) {
      handler.recordAttempt('tx-123', 'deposit', TransactionState.FAILED, error);
    }

    const canRetry = handler.canRetry('tx-123');
    expect(canRetry).toBe(false);
  });

  it('should not allow retry for non-retryable errors', () => {
    const error = new ValidationError('Invalid amount');
    handler.recordAttempt('tx-123', 'deposit', TransactionState.FAILED, error);

    const canRetry = handler.canRetry('tx-123');
    expect(canRetry).toBe(false);
  });

  it('should get transaction context', () => {
    handler.recordAttempt('tx-123', 'deposit', TransactionState.PROCESSING);
    const context = handler.getContext('tx-123');

    expect(context).toBeDefined();
    expect(context?.transactionId).toBe('tx-123');
  });

  it('should return undefined for unknown transaction', () => {
    const context = handler.getContext('unknown');
    expect(context).toBeUndefined();
  });

  it('should clear transaction context', () => {
    handler.recordAttempt('tx-123', 'deposit', TransactionState.PROCESSING);
    handler.clearContext('tx-123');

    const context = handler.getContext('tx-123');
    expect(context).toBeUndefined();
  });

  it('should get recoverable transactions', () => {
    const error = new NetworkError('Connection failed');
    
    handler.recordAttempt('tx-1', 'deposit', TransactionState.FAILED, error);
    handler.recordAttempt('tx-2', 'withdraw', TransactionState.SUCCESS);
    
    const recoverable = handler.getRecoverableTransactions();

    expect(Array.isArray(recoverable)).toBe(true);
    expect(recoverable.some(t => t.transactionId === 'tx-1')).toBe(true);
    expect(recoverable.some(t => t.transactionId === 'tx-2')).toBe(false);
  });

  it('should track last attempt timestamp', () => {
    const before = new Date();
    handler.recordAttempt('tx-123', 'deposit', TransactionState.PROCESSING);
    const after = new Date();

    const context = handler.getContext('tx-123');
    expect(context?.lastAttempt).toBeDefined();
    expect(context!.lastAttempt!.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(context!.lastAttempt!.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});

describe('Global Transaction Recovery Handler', () => {
  it('should return singleton instance', () => {
    const handler1 = getTransactionRecoveryHandler();
    const handler2 = getTransactionRecoveryHandler();

    expect(handler1).toBe(handler2);
  });

  it('should work with global instance', () => {
    const handler = getTransactionRecoveryHandler();
    
    handler.recordAttempt('tx-global', 'deposit', TransactionState.PROCESSING);
    const context = handler.getContext('tx-global');

    expect(context?.transactionId).toBe('tx-global');
  });
});
