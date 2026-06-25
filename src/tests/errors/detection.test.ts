/**
 * Tests for error detection and categorization
 */

import {
  AppError,
  NetworkError,
  TimeoutError,
  ValidationError,
  ContractError,
  ServerError,
  ErrorCategory,
  ErrorCode,
  categorizeHttpError,
  detectErrorType,
  toAppError,
  isNetworkError,
  isTimeoutError,
  isValidationError,
  shouldRetryError
} from '@/errors';

describe('Error Types', () => {
  describe('AppError', () => {
    it('should create an AppError with defaults', () => {
      const error = new AppError('Test error');
      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.isRecoverable).toBe(true);
      expect(error.retryCount).toBe(0);
    });

    it('should create an AppError with options', () => {
      const error = new AppError('Test error', {
        category: ErrorCategory.NETWORK,
        code: ErrorCode.NO_CONNECTION,
        retryCount: 2,
        isRecoverable: true,
        userFacingMessage: 'Custom message'
      });
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.code).toBe(ErrorCode.NO_CONNECTION);
      expect(error.retryCount).toBe(2);
      expect(error.userFacingMessage).toBe('Custom message');
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', {
        category: ErrorCategory.VALIDATION,
        code: ErrorCode.INVALID_AMOUNT
      });
      const json = error.toJSON();
      expect(json.message).toBe('Test error');
      expect(json.category).toBe(ErrorCategory.VALIDATION);
      expect(json.code).toBe(ErrorCode.INVALID_AMOUNT);
    });
  });

  describe('NetworkError', () => {
    it('should create a NetworkError', () => {
      const error = new NetworkError('Connection failed');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.code).toBe(ErrorCode.NO_CONNECTION);
      expect(error instanceof AppError).toBe(true);
    });

    it('should use custom user message', () => {
      const error = new NetworkError('Connection failed', {
        userFacingMessage: 'Check your internet connection'
      });
      expect(error.userFacingMessage).toBe('Check your internet connection');
    });
  });

  describe('TimeoutError', () => {
    it('should create a TimeoutError', () => {
      const error = new TimeoutError('Request timed out');
      expect(error.category).toBe(ErrorCategory.TIMEOUT);
      expect(error.code).toBe(ErrorCode.REQUEST_TIMEOUT);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError', () => {
      const error = new ValidationError('Invalid input');
      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.code).toBe(ErrorCode.INVALID_INPUT);
    });

    it('should be recoverable', () => {
      const error = new ValidationError('Invalid input');
      expect(error.isRecoverable).toBe(true);
    });
  });

  describe('ServerError', () => {
    it('should categorize rate limit (429)', () => {
      const error = new ServerError('Too many requests', 429);
      expect(error.code).toBe(ErrorCode.RATE_LIMITED);
    });

    it('should categorize 5xx errors', () => {
      const error = new ServerError('Server error', 500);
      expect(error.statusCode).toBe(500);
    });

    it('should categorize 503 as service unavailable', () => {
      const error = new ServerError('Service unavailable', 503);
      expect(error.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    });
  });
});

describe('Error Detection and Categorization', () => {
  describe('categorizeHttpError', () => {
    it('should categorize 429 as rate limited', () => {
      const result = categorizeHttpError(429);
      expect(result.code).toBe(ErrorCode.RATE_LIMITED);
    });

    it('should categorize 5xx as service unavailable', () => {
      const result = categorizeHttpError(500);
      expect(result.category).toBe(ErrorCategory.SERVICE_UNAVAILABLE);
    });

    it('should categorize 503 correctly', () => {
      const result = categorizeHttpError(503);
      expect(result.code).toBe(ErrorCode.SERVICE_UNAVAILABLE);
    });

    it('should categorize 4xx as server error', () => {
      const result = categorizeHttpError(400);
      expect(result.code).toBe(ErrorCode.BAD_REQUEST);
    });
  });

  describe('detectErrorType', () => {
    it('should detect network errors', () => {
      const error = new TypeError('fetch error');
      const result = detectErrorType(error);
      expect(result.category).toBe(ErrorCategory.NETWORK);
      expect(result.isRecoverable).toBe(true);
    });

    it('should detect timeout errors', () => {
      const error = new Error('timeout');
      const result = detectErrorType(error);
      expect(result.category).toBe(ErrorCategory.TIMEOUT);
    });

    it('should detect AbortError as timeout', () => {
      const error = new Error('Aborted');
      error.name = 'AbortError';
      const result = detectErrorType(error);
      expect(result.category).toBe(ErrorCategory.TIMEOUT);
    });

    it('should detect validation errors', () => {
      const error = new Error('validation failed');
      const result = detectErrorType(error);
      expect(result.category).toBe(ErrorCategory.VALIDATION);
    });
  });

  describe('toAppError', () => {
    it('should convert TypeError to NetworkError', () => {
      const error = new TypeError('fetch failed');
      const appError = toAppError(error);
      expect(appError instanceof NetworkError).toBe(true);
      expect(appError.category).toBe(ErrorCategory.NETWORK);
    });

    it('should pass through AppError', () => {
      const original = new NetworkError('Connection failed');
      const result = toAppError(original);
      expect(result).toBe(original);
    });

    it('should convert generic error', () => {
      const error = new Error('Unknown error');
      const appError = toAppError(error);
      expect(appError instanceof AppError).toBe(true);
    });
  });

  describe('Error checks', () => {
    it('should identify network errors', () => {
      const error = new NetworkError('Failed');
      expect(isNetworkError(error)).toBe(true);
    });

    it('should identify timeout errors', () => {
      const error = new TimeoutError('Timed out');
      expect(isTimeoutError(error)).toBe(true);
    });

    it('should identify validation errors', () => {
      const error = new ValidationError('Invalid');
      expect(isValidationError(error)).toBe(true);
    });

    it('should check if error should be retried', () => {
      const networkError = new NetworkError('Failed');
      expect(shouldRetryError(networkError)).toBe(true);

      const validationError = new ValidationError('Invalid');
      expect(shouldRetryError(validationError)).toBe(true);
    });
  });
});

describe('Error Subclasses', () => {
  it('should maintain proper prototype chain', () => {
    const networkError = new NetworkError('Failed');
    expect(networkError instanceof NetworkError).toBe(true);
    expect(networkError instanceof AppError).toBe(true);
    expect(networkError instanceof Error).toBe(true);
  });

  it('should generate default user messages for each category', () => {
    const categories = [
      [ErrorCategory.NETWORK, NetworkError],
      [ErrorCategory.TIMEOUT, TimeoutError],
      [ErrorCategory.VALIDATION, ValidationError]
    ] as const;

    for (const [category, ErrorClass] of categories) {
      const error = new ErrorClass('Test');
      expect(error.userFacingMessage).toBeTruthy();
      expect(error.userFacingMessage.length > 0).toBe(true);
    }
  });
});
