import { AppError, ErrorCategory, ErrorCode } from '@/errors/types';
import {
  buildRuntimeRecoveryState,
  clearRecoveryDiagnostics,
  createRecoveryDiagnostic,
  getRecoveryDiagnostics,
  recordRecoveryDiagnostic,
  updateRecoveryLifecycle,
} from '@/errors/diagnostics';

describe('runtime recovery diagnostics', () => {
  beforeEach(() => {
    clearRecoveryDiagnostics();
  });

  it('captures diagnostic data for runtime failures', () => {
    const diagnostic = createRecoveryDiagnostic(
      new AppError('render failed', {
        category: ErrorCategory.INTERNAL,
        code: ErrorCode.INTERNAL_ERROR,
      }),
      { componentStack: '\n    at Widget' },
      'WidgetBoundary'
    );

    expect(diagnostic.id).toMatch(/^recovery-/);
    expect(diagnostic.error.message).toBe('render failed');
    expect(diagnostic.error.category).toBe(ErrorCategory.INTERNAL);
    expect(diagnostic.componentStack).toContain('Widget');
    expect(diagnostic.boundaryName).toBe('WidgetBoundary');
    expect(diagnostic.lifecycle).toEqual(['captured']);
  });

  it('records lifecycle transitions for recovery actions', () => {
    const diagnostic = recordRecoveryDiagnostic(createRecoveryDiagnostic(new Error('boom')));

    updateRecoveryLifecycle(diagnostic, 'retry');
    updateRecoveryLifecycle(diagnostic, 'restored');

    expect(getRecoveryDiagnostics()).toHaveLength(1);
    expect(getRecoveryDiagnostics()[0].lifecycle).toEqual(['captured', 'retry', 'restored']);
  });

  it('builds retryable runtime recovery state', () => {
    const state = buildRuntimeRecoveryState(new Error('boom'), undefined, 'DashboardBoundary', 2);

    expect(state.canRetry).toBe(true);
    expect(state.retryCount).toBe(0);
    expect(state.maxRetries).toBe(2);
    expect(state.diagnostic.boundaryName).toBe('DashboardBoundary');
    expect(getRecoveryDiagnostics()).toHaveLength(1);
  });
});
