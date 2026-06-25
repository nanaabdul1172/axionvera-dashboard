/**
 * Error categorization and type definitions for the Axionvera Dashboard
 */

/**
 * Error categories for consistent error handling and recovery strategies
 */
export enum ErrorCategory {
  // Network-related errors
  NETWORK = 'NETWORK',
  TIMEOUT = 'TIMEOUT',
  
  // Client-side errors
  VALIDATION = 'VALIDATION',
  
  // Server-side errors
  SERVER = 'SERVER',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  
  // Contract/Blockchain errors
  CONTRACT = 'CONTRACT',
  BLOCKCHAIN = 'BLOCKCHAIN',
  
  // Application errors
  INTERNAL = 'INTERNAL',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Specific error codes for granular error handling
 */
export enum ErrorCode {
  // Network errors (1000-1999)
  NO_CONNECTION = 'ERR_1001',
  CONNECTION_LOST = 'ERR_1002',
  DNS_RESOLUTION_FAILED = 'ERR_1003',
  
  // Timeout errors (2000-2999)
  REQUEST_TIMEOUT = 'ERR_2001',
  WALLET_CONNECTION_TIMEOUT = 'ERR_2002',
  RPC_TIMEOUT = 'ERR_2003',
  
  // Validation errors (3000-3999)
  INVALID_AMOUNT = 'ERR_3001',
  INVALID_ADDRESS = 'ERR_3002',
  INSUFFICIENT_BALANCE = 'ERR_3003',
  INVALID_INPUT = 'ERR_3004',
  
  // Server errors (4000-4999)
  RATE_LIMITED = 'ERR_4001',
  SERVER_ERROR = 'ERR_4002',
  BAD_REQUEST = 'ERR_4003',
  UNAUTHORIZED = 'ERR_4004',
  
  // Service errors (5000-5999)
  SERVICE_UNAVAILABLE = 'ERR_5001',
  SERVICE_DEGRADED = 'ERR_5002',
  MAINTENANCE = 'ERR_5003',
  
  // Contract errors (6000-6999)
  CONTRACT_CALL_FAILED = 'ERR_6001',
  INSUFFICIENT_FUNDS = 'ERR_6002',
  TRANSACTION_FAILED = 'ERR_6003',
  CONTRACT_VALIDATION_FAILED = 'ERR_6004',
  
  // Blockchain errors (7000-7999)
  BLOCKCHAIN_ERROR = 'ERR_7001',
  TRANSACTION_REJECTED = 'ERR_7002',
  BLOCK_FINALIZATION_FAILED = 'ERR_7003',
  
  // Internal errors (8000-8999)
  INTERNAL_ERROR = 'ERR_8001',
  UNKNOWN_ERROR = 'ERR_8999'
}

/**
 * Retry policy configurations
 */
export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  timeoutMs: number;
  shouldRetry: (error: AppError) => boolean;
}

/**
 * Recovery strategy configuration
 */
export interface RecoveryStrategy {
  category: ErrorCategory;
  retryPolicy: RetryPolicy;
  fallbackAction?: () => Promise<any> | any;
  userMessageOverride?: string;
}

/**
 * Main application error class
 */
export class AppError extends Error {
  readonly category: ErrorCategory;
  readonly code: ErrorCode;
  readonly statusCode?: number;
  readonly originalError?: Error;
  readonly retryCount: number;
  readonly isRecoverable: boolean;
  readonly userFacingMessage: string;
  readonly timestamp: Date;

  constructor(
    message: string,
    options: {
      category?: ErrorCategory;
      code?: ErrorCode;
      statusCode?: number;
      originalError?: Error;
      retryCount?: number;
      isRecoverable?: boolean;
      userFacingMessage?: string;
    } = {}
  ) {
    super(message);
    this.name = 'AppError';
    
    this.category = options.category || ErrorCategory.UNKNOWN;
    this.code = options.code || ErrorCode.UNKNOWN_ERROR;
    this.statusCode = options.statusCode;
    this.originalError = options.originalError;
    this.retryCount = options.retryCount || 0;
    this.isRecoverable = options.isRecoverable !== false;
    this.userFacingMessage = options.userFacingMessage || this.generateDefaultMessage();
    this.timestamp = new Date();

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }

  private generateDefaultMessage(): string {
    const messages: Record<ErrorCategory, string> = {
      [ErrorCategory.NETWORK]: 'Unable to connect to the network. Please check your internet connection.',
      [ErrorCategory.TIMEOUT]: 'The request took too long. Please try again.',
      [ErrorCategory.VALIDATION]: 'Please check your input and try again.',
      [ErrorCategory.SERVER]: 'The server encountered an error. Please try again later.',
      [ErrorCategory.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable. Please try again in a moment.',
      [ErrorCategory.CONTRACT]: 'The transaction encountered an error. Please check your input and try again.',
      [ErrorCategory.BLOCKCHAIN]: 'A blockchain error occurred. Please try again.',
      [ErrorCategory.INTERNAL]: 'An unexpected error occurred. Please try again.',
      [ErrorCategory.UNKNOWN]: 'An unexpected error occurred. Please try again.'
    };
    
    return messages[this.category] || messages[ErrorCategory.UNKNOWN];
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      code: this.code,
      statusCode: this.statusCode,
      userFacingMessage: this.userFacingMessage,
      timestamp: this.timestamp.toISOString(),
      retryCount: this.retryCount,
      isRecoverable: this.isRecoverable
    };
  }
}

/**
 * Network-specific error class
 */
export class NetworkError extends AppError {
  constructor(message: string, options: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, {
      category: ErrorCategory.NETWORK,
      code: options.code || ErrorCode.NO_CONNECTION,
      ...options,
      userFacingMessage: options.userFacingMessage || 
        'Unable to connect to the network. Please check your internet connection and try again.'
    });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Timeout-specific error class
 */
export class TimeoutError extends AppError {
  constructor(message: string, options: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, {
      category: ErrorCategory.TIMEOUT,
      code: options.code || ErrorCode.REQUEST_TIMEOUT,
      ...options,
      userFacingMessage: options.userFacingMessage || 
        'The request took too long. Please try again.'
    });
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

/**
 * Validation-specific error class
 */
export class ValidationError extends AppError {
  constructor(message: string, options: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    super(message, {
      category: ErrorCategory.VALIDATION,
      code: options.code || ErrorCode.INVALID_INPUT,
      isRecoverable: true,
      ...options,
      userFacingMessage: options.userFacingMessage || 
        'Please check your input and try again.'
    });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Contract-specific error class
 */
export class ContractError extends AppError {
  readonly contractAddress?: string;
  readonly functionName?: string;

  constructor(message: string, options: Partial<ConstructorParameters<typeof AppError>[1]> & {
    contractAddress?: string;
    functionName?: string;
  } = {}) {
    super(message, {
      category: ErrorCategory.CONTRACT,
      code: options.code || ErrorCode.CONTRACT_CALL_FAILED,
      ...options,
      userFacingMessage: options.userFacingMessage || 
        'The transaction encountered an error. Please check your input and try again.'
    });
    this.name = 'ContractError';
    this.contractAddress = options.contractAddress;
    this.functionName = options.functionName;
    Object.setPrototypeOf(this, ContractError.prototype);
  }
}

/**
 * Server-specific error class
 */
export class ServerError extends AppError {
  constructor(message: string, statusCode?: number, options: Partial<ConstructorParameters<typeof AppError>[1]> = {}) {
    const category = statusCode === 429 ? ErrorCategory.SERVER : 
                     statusCode && statusCode >= 500 ? ErrorCategory.SERVICE_UNAVAILABLE :
                     ErrorCategory.SERVER;
    
    super(message, {
      category,
      code: statusCode === 429 ? ErrorCode.RATE_LIMITED :
            statusCode === 503 ? ErrorCode.SERVICE_UNAVAILABLE :
            statusCode && statusCode >= 500 ? ErrorCode.SERVER_ERROR :
            ErrorCode.SERVER_ERROR,
      statusCode,
      ...options,
      userFacingMessage: options.userFacingMessage || 
        (statusCode === 429 ? 'Too many requests. Please wait and try again.' :
         statusCode && statusCode >= 500 ? 'The server is experiencing issues. Please try again later.' :
         'A server error occurred. Please try again.')
    });
    this.name = 'ServerError';
    Object.setPrototypeOf(this, ServerError.prototype);
  }
}
