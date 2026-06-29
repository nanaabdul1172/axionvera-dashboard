# Dashboard Error Recovery Lifecycle

The dashboard recovery framework isolates render-time failures inside React error boundaries and recovers without forcing a full page refresh.

1. **Capture**: `ErrorBoundary` catches a runtime failure and converts it into an `AppError` diagnostic payload.
2. **Diagnose**: the framework records category, code, route, user agent, timestamp, and React component stack for troubleshooting.
3. **Present options**: users are shown retry, reset, dismiss, and back-navigation actions depending on recoverability.
4. **Recover**: retry/remount increments the boundary key so the failed dashboard subtree is recreated in place.
5. **Restore**: successful rendering clears the visible error while retained diagnostics remain available for reporting.

Retryable operation failures should use `useRecovery` or `executeWithRetry`; render failures should be isolated with `ErrorBoundary`.
