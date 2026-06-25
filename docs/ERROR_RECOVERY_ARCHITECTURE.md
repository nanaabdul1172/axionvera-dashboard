# Error Handling and Recovery Architecture

## Overview

The Axionvera Dashboard implements a comprehensive, centralized error handling and recovery system designed to improve reliability and user experience during network connectivity issues and transaction failures.

## Architecture

### 1. Error Categorization System

The system categorizes errors into distinct categories for consistent handling:

```
ErrorCategory {
  NETWORK                 - Network connectivity issues
  TIMEOUT                 - Request timeouts
  VALIDATION              - Input validation errors
  SERVER                  - Server errors (4xx)
  SERVICE_UNAVAILABLE     - Service errors (5xx)
  CONTRACT                - Smart contract errors
  BLOCKCHAIN              - Blockchain-related errors
  INTERNAL                - Application internal errors
  UNKNOWN                 - Uncategorized errors
}
```

### 2. Error Classes Hierarchy

```
Error (JavaScript Built-in)
  └── AppError (Base application error)
      ├── NetworkError
      ├── TimeoutError
      ├── ValidationError
      ├── ContractError
      └── ServerError
```

Each error class includes:
- **category**: ErrorCategory for classification
- **code**: ErrorCode for specific error identification
- **statusCode**: HTTP status (if applicable)
- **userFacingMessage**: User-friendly message for UI display
- **isRecoverable**: Boolean indicating if error can be recovered
- **retryCount**: Number of retry attempts

### 3. Error Detection and Conversion

The `detection.ts` module provides utilities to:

1. **Detect error types** from various sources
2. **Categorize HTTP errors** by status code
3. **Convert any error** to AppError with proper classification
4. **Check error properties** (isNetworkError, isTimeoutError, etc.)

### 4. Retry Strategies

#### Retry Policies

Each error category has a default retry policy defining:

```typescript
interface RetryPolicy {
  maxAttempts: number;          // Maximum retry attempts
  initialDelayMs: number;        // Initial backoff delay
  maxDelayMs: number;            // Maximum backoff delay
  backoffMultiplier: number;     // Exponential backoff multiplier
  timeoutMs: number;             // Request timeout duration
  shouldRetry: (error: AppError) => boolean; // Retry condition
}
```

#### Example Policies

| Category | Max Attempts | Initial Delay | Max Delay | Notes |
|----------|-------------|---------------|-----------|-------|
| NETWORK | 5 | 1s | 30s | Aggressive retries for connectivity |
| TIMEOUT | 4 | 500ms | 10s | Increase timeout on retry |
| VALIDATION | 1 | 0ms | 0ms | No retry for validation errors |
| SERVER | 3 | 2s | 15s | Moderate retries |
| SERVICE_UNAVAILABLE | 5 | 5s | 60s | Long wait for service recovery |
| CONTRACT | 2 | 1s | 5s | Limited retries for contract errors |

#### Exponential Backoff Calculation

```
delay = Math.min(initialDelay * (multiplier ^ attemptNumber), maxDelay)
```

This provides increasingly longer delays between retries while respecting the maximum delay limit.

### 5. Recovery Executor

The `RetryExecutor` class manages retry logic:

```typescript
class RetryExecutor {
  execute<T>(
    fn: () => Promise<T>,
    options?: RetryExecutorOptions
  ): Promise<RetryExecutorResult<T>>
}
```

**Lifecycle**:
1. Attempt execution with timeout
2. On failure: Check if error is retryable
3. If yes: Calculate backoff delay and call onRetry callback
4. After delay: Retry (repeat from step 1)
5. On success or max retries: Return result

### 6. Recovery Workflows

Recovery workflows provide step-by-step recovery procedures for specific error scenarios:

#### Workflow Execution

```
Error Occurs
    ↓
Detect Error Category
    ↓
Find Matching Workflow
    ↓
Execute Steps (if conditions met)
    ├── Wait and Retry
    ├── Check Connectivity
    ├── Clear Cache
    └── Notify User
    ↓
Return Result (Success/Failure)
```

#### Available Workflows

1. **Network Recovery**
   - Steps: Wait → Retry → Check connectivity
   - For: Network connectivity issues

2. **Timeout Recovery**
   - Steps: Increase timeout → Retry → Notify user
   - For: Request timeouts

3. **Server Recovery**
   - Steps: Exponential backoff → Clear cache → Retry
   - For: Server errors (429, 5xx)

4. **Contract Recovery**
   - Steps: Validate input → Check balance → Retry
   - For: Smart contract execution failures

### 7. Hooks for React Components

#### `useRecovery`

Complete error handling and recovery hook:

```typescript
const {
  error,                           // Current error
  isLoading,                       // Loading state
  isRecovering,                    // Recovering state
  attemptCount,                    // Number of attempts
  canRetry,                        // Can retry failed operation
  
  clearError,                      // Clear error
  retry,                          // Retry failed operation
  execute,                        // Execute without retry
  executeWithRecovery,            // Execute with automatic recovery
  handleError                     // Handle error manually
} = useRecovery({
  onError: (error) => {},
  onRetry: (attempt, error) => {},
  onSuccess: (result) => {}
});
```

#### `useTransactionRecovery`

Transaction-specific recovery hook:

```typescript
const {
  transactionStatus,              // Current transaction status
  error,                          // Transaction error
  attemptCount,                   // Retry attempts
  canRetry,                       // Can retry transaction
  isProcessing,                   // Transaction processing
  isRecovering,                   // Transaction recovering
  
  executeTransaction,             // Execute transaction with validation
  retryTransaction,              // Retry failed transaction
  clearTransactionState           // Clear transaction state
} = useTransactionRecovery();
```

### 8. UI Components

#### `RecoveryUI`

Displays errors with retry options:

```typescript
<RecoveryUI
  error={error}
  isRecovering={isRecovering}
  canRetry={canRetry}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  showDetails={isDev}
  compact={isMobile}
/>
```

#### Fallback Components

- `FallbackBalanceCard`: Shows loading state for balance
- `FallbackChart`: Shows loading state for charts
- `FallbackList`: Shows loading state for lists
- `FallbackTable`: Shows loading state for tables
- `DataUnavailable`: Generic data unavailable message
- `RetryFallback`: Retry button with loading state

## Usage Examples

### Basic Error Handling

```typescript
import { useRecovery, ErrorCategory } from '@/hooks/useRecovery';

function MyComponent() {
  const recovery = useRecovery({
    onError: (error) => console.error(error.userFacingMessage),
    autoRetryOnNetwork: true
  });

  const handleFetch = async () => {
    const data = await recovery.executeWithRecovery(
      () => fetch('/api/data').then(r => r.json()),
      ErrorCategory.NETWORK
    );
  };

  return (
    <div>
      {recovery.error && (
        <RecoveryUI
          error={recovery.error}
          canRetry={recovery.canRetry}
          onRetry={recovery.retry}
        />
      )}
      <button onClick={handleFetch} disabled={recovery.isLoading}>
        Fetch Data
      </button>
    </div>
  );
}
```

### Transaction Handling

```typescript
import { useTransactionRecovery } from '@/hooks/useTransactionRecovery';
import { validateTransactionInput } from '@/utils/transactionRecovery';

function TransactionForm() {
  const {
    transactionStatus,
    error,
    canRetry,
    executeTransaction,
    retryTransaction
  } = useTransactionRecovery();

  const handleDeposit = async (amount: string) => {
    await executeTransaction(
      () => vaultService.deposit({ amount }),
      { amount },
      'deposit'
    );
  };

  return (
    <div>
      {error && (
        <RecoveryUI
          error={error}
          canRetry={canRetry}
          onRetry={retryTransaction}
        />
      )}
      <button onClick={() => handleDeposit('100')} disabled={transactionStatus === 'pending'}>
        Deposit
      </button>
    </div>
  );
}
```

### Enhanced API Client

```typescript
import { getApiClient, EnhancedRequestConfig } from '@/utils/enhancedApiClient';

const apiClient = getApiClient();

const response = await apiClient.request('/api/balances', {
  timeout: 15000,
  retryPolicy: 'aggressive',
  fallbackData: { balance: '0', rewards: '0' },
  context: 'Fetch balances'
});

if (response.success) {
  console.log(response.data);
} else {
  console.error(response.error.userFacingMessage);
}
```

## Testing

### Error Detection Tests

```typescript
import { detectErrorType, toAppError } from '@/errors';

test('should detect network errors', () => {
  const error = new TypeError('fetch error');
  const result = detectErrorType(error);
  expect(result.category).toBe(ErrorCategory.NETWORK);
});
```

### Retry Tests

```typescript
import { RetryExecutor } from '@/errors';

test('should retry and succeed', async () => {
  const executor = new RetryExecutor(policy);
  const fn = jest.fn()
    .mockRejectedValueOnce(new Error())
    .mockResolvedValueOnce('success');
    
  const result = await executor.execute(fn);
  expect(result.success).toBe(true);
  expect(fn).toHaveBeenCalledTimes(2);
});
```

### Workflow Tests

```typescript
import { getRecoveryWorkflow, executeRecoveryWorkflow } from '@/features/recovery';

test('should execute recovery workflow', async () => {
  const error = new NetworkError('Connection failed');
  const result = await executeRecoveryWorkflow(error);
  expect(result?.state).toBeDefined();
});
```

## File Structure

```
src/
├── errors/
│   ├── types.ts          # Error classes and interfaces
│   ├── detection.ts      # Error detection utilities
│   ├── recovery.ts       # Retry policies and strategies
│   ├── retry.ts          # Retry execution logic
│   └── index.ts          # Central exports
├── features/
│   └── recovery/
│       ├── workflows.ts  # Recovery workflows
│       └── index.ts      # Exports
├── hooks/
│   ├── useRecovery.ts    # General recovery hook
│   └── useTransactionRecovery.ts  # Transaction-specific hook
├── components/
│   ├── RecoveryUI.tsx    # Error display component
│   └── FallbackStates.tsx # Fallback UI components
├── utils/
│   ├── enhancedApiClient.ts # Enhanced API client
│   └── transactionRecovery.ts # Transaction utilities
└── tests/
    ├── errors/
    │   ├── detection.test.ts
    │   └── retry.test.ts
    ├── features/
    │   └── recovery.test.ts
    └── utils/
        └── transactionRecovery.test.ts
```

## Key Features

✅ **Centralized Error Handling**: All errors categorized consistently  
✅ **Automatic Retry**: Context-aware retry strategies  
✅ **Exponential Backoff**: Intelligent delay between retries  
✅ **Recovery Workflows**: Step-by-step recovery procedures  
✅ **User-Friendly Messages**: Technical errors converted to user messages  
✅ **Transaction Tracking**: Track transaction state and recovery  
✅ **Graceful Fallbacks**: UI remains stable during failures  
✅ **Comprehensive Testing**: Full test coverage for all modules  
✅ **React Integration**: Hooks for easy component integration  
✅ **TypeScript Support**: Fully typed for development safety  

## Error Recovery Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Operation Initiated                                         │
└────────────┬────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│ Execute Operation                                           │
│ (with timeout & signal handling)                            │
└────────────┬────────────────────────────────────────────────┘
             │
        ┌────┴────┐
        │          │
        ▼          ▼
    SUCCESS    ERROR
        │          │
        │          ├─────────────┐
        │          │             │
        │          ▼             ▼
        │      Convert to    Network/Timeout?
        │      AppError          │
        │          │          YES│  NO
        │          │          ┌──┴──┐
        │          │          ▼      ▼
        │          │       Retry  Return Error
        │          │          │      │
        │          │      ┌───┴──────┘
        │          ▼      ▼
        │      Return Result
        │          │
        └──────────┴─────────────────────┐
                                         │
                                         ▼
                    ┌────────────────────────────────┐
                    │ Update Component State         │
                    │ & UI                           │
                    └────────────────────────────────┘
```

## Best Practices

1. **Use `useRecovery` for API calls** with automatic retry
2. **Use `useTransactionRecovery` for transactions** with validation
3. **Always provide user-facing messages** for errors
4. **Show fallback UI** during recovery attempts
5. **Log errors** for debugging and monitoring
6. **Test error scenarios** in components
7. **Limit retry attempts** to prevent infinite loops
8. **Implement timeout** to prevent hanging operations

## Monitoring and Debugging

### Development Mode

Enable detailed error information:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(error.toJSON());
}
```

### Error Logging

```typescript
import { formatErrorForLogging } from '@/errors';

console.error('Error occurred:', formatErrorForLogging(error));
```

### Recovery Tracking

```typescript
const { attemptCount } = useRecovery();
console.log(`Recovery attempt ${attemptCount}`);
```

## Performance Considerations

- **Backoff delays**: Prevent overwhelming server
- **Timeout values**: Balanced between responsiveness and reliability
- **Max retries**: Limited to prevent infinite loops
- **Memory**: Errors cleaned up after handling
- **UI updates**: Minimal re-renders during recovery

## Future Enhancements

- Circuit breaker pattern for cascading failures
- Metrics collection for error analytics
- Configurable error handling per route
- Error event streaming for monitoring
- Dynamic retry policy adjustment based on server load
- Persistent retry queue for offline scenarios
