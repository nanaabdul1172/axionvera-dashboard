import type { ErrorInfo } from 'react';
import { AppError, ErrorCategory, ErrorCode } from './types';
import { toAppError } from './detection';

export type RecoveryActionType = 'retry' | 'reset' | 'navigate-back' | 'dismiss';

export interface RecoveryDiagnostic {
  id: string;
  error: ReturnType<AppError['toJSON']>;
  componentStack?: string;
  boundaryName?: string;
  route?: string;
  userAgent?: string;
  lifecycle: string[];
  capturedAt: string;
}

export interface RuntimeRecoveryState {
  diagnostic: RecoveryDiagnostic;
  canRetry: boolean;
  retryCount: number;
  maxRetries: number;
}

const diagnostics: RecoveryDiagnostic[] = [];

function getRoute(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function getUserAgent(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  return navigator.userAgent;
}

export function createRecoveryDiagnostic(
  error: unknown,
  errorInfo?: ErrorInfo,
  boundaryName = 'DashboardErrorBoundary'
): RecoveryDiagnostic {
  const appError = error instanceof AppError
    ? error
    : new AppError(error instanceof Error ? error.message : 'Runtime dashboard failure', {
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
        originalError: error instanceof Error ? error : undefined,
        isRecoverable: true,
      });

  return {
    id: `recovery-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    error: appError.toJSON(),
    componentStack: errorInfo?.componentStack ?? undefined,
    boundaryName,
    route: getRoute(),
    userAgent: getUserAgent(),
    lifecycle: ['captured'],
    capturedAt: new Date().toISOString(),
  };
}

export function recordRecoveryDiagnostic(diagnostic: RecoveryDiagnostic): RecoveryDiagnostic {
  diagnostics.push(diagnostic);
  return diagnostic;
}

export function updateRecoveryLifecycle(diagnostic: RecoveryDiagnostic, event: string): RecoveryDiagnostic {
  diagnostic.lifecycle = [...diagnostic.lifecycle, event];
  return diagnostic;
}

export function getRecoveryDiagnostics(): RecoveryDiagnostic[] {
  return [...diagnostics];
}

export function clearRecoveryDiagnostics(): void {
  diagnostics.length = 0;
}

export function buildRuntimeRecoveryState(
  error: unknown,
  errorInfo?: ErrorInfo,
  boundaryName?: string,
  maxRetries = 3
): RuntimeRecoveryState {
  const appError = toAppError(error, 'Runtime dashboard failure');
  const diagnostic = recordRecoveryDiagnostic(createRecoveryDiagnostic(appError, errorInfo, boundaryName));

  return {
    diagnostic,
    canRetry: appError.isRecoverable,
    retryCount: 0,
    maxRetries,
  };
}
