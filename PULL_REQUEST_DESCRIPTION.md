# Global Error Boundaries & API Resilience Implementation

## Summary
This PR implements a comprehensive error handling and API resilience layer for the Axionvera Dashboard to prevent crashes and provide graceful recovery paths when unexpected errors occur.

## Problem Solved
Previously, unhandled JavaScript exceptions or failed API calls could cause the entire dashboard to crash to a blank white screen, leaving users with no recovery options.

## Solution Overview
Implemented a robust resilience layer with the following components:

### 🛡️ Error Boundary System
- **ErrorBoundary Component**: Higher-order React component based on official React documentation
- **Friendly Fallback UI**: User-friendly error screen with recovery options
- **Root Application Wrapping**: Error boundary wraps the entire application router
- **Development Debug Info**: Enhanced error details in development mode

### 🔧 API Resilience Framework
- **Timeout Protection**: Configurable timeout limits for all API calls (default: 10s)
- **Automatic Retry Logic**: Intelligent retry mechanism with exponential backoff
- **Global Error Handling**: Centralized error logging and context
- **Safe API Wrapper**: Non-throwing API calls with `{ data, error }` return pattern
- **Debouncing**: Prevents rapid successive API calls

### 🎯 Enhanced SDK Integration
- **Refactored contractHelpers**: All SDK methods now use resilience patterns
- **Configurable Options**: Each API call accepts custom timeout and retry settings
- **Fallback Values**: Optional fallback data when API calls fail
- **Error Context**: Enhanced error messages with operation context

### 🎨 User Experience Improvements
- **Secure Reload Action**: Safe application reload that clears corrupted state
- **Go Back Option**: Navigation fallback for error recovery
- **Loading States**: Proper loading indicators during API operations
- **Error Feedback**: Clear error messaging without technical jargon

## Technical Implementation

### Files Added
- `src/components/ErrorBoundary.tsx` - Main error boundary component
- `src/components/ErrorFallback.tsx` - Reusable fallback UI component  
- `src/utils/apiResilience.ts` - API resilience utilities and helpers
- `src/hooks/useApiError.ts` - React hook for component-level error handling

### Files Modified
- `src/pages/_app.tsx` - Wrapped application with ErrorBoundary
- `src/utils/contractHelpers.ts` - Enhanced SDK with resilience patterns

### Key Features
1. **Automatic Error Catching**: Catches all React render errors and unhandled exceptions
2. **API Timeouts**: Prevents hanging requests with configurable timeouts
3. **Retry Logic**: Automatic retries for transient failures
4. **Graceful Degradation**: Fallback values when APIs are unavailable
5. **User Recovery**: Clear paths for users to recover from errors
6. **Development Debugging**: Enhanced error details in development mode

## Configuration Examples

### Basic Usage
```tsx
// Error boundary automatically wraps the entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### API with Custom Options
```tsx
const sdk = createAxionveraVaultSdk();
const result = await sdk.getBalances(args, {
  timeout: 5000,
  retries: 3,
  fallbackValue: { balance: "0", rewards: "0" }
});
```

### Component Error Handling
```tsx
const { error, executeWithErrorHandling } = useApiError();
const result = await executeWithErrorHandling(() => apiCall());
```

## Testing Strategy
- Error boundary catches and displays errors correctly
- API resilience handles timeouts and retries
- Fallback UI renders with proper recovery options
- Application reload clears error state safely

## Benefits
✅ **Prevents White Screen Crashes** - No more blank screens for users  
✅ **Improves User Experience** - Clear error messages and recovery paths  
✅ **Enhances Reliability** - Automatic retry and timeout protection  
✅ **Maintains Performance** - Efficient error handling without overhead  
✅ **Developer Friendly** - Enhanced debugging in development mode  

## Migration Notes
- No breaking changes to existing API interfaces
- Backward compatible with current component usage
- Optional parameters for resilience configuration
- Graceful fallback for existing implementations

## Future Enhancements
- Integration with error monitoring services (Sentry, etc.)
- Network status detection and offline handling
- Progressive retry strategies
- User-specific error reporting preferences
