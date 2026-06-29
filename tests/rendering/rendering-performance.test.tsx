import React from 'react';
import { render } from '@testing-library/react';
import { RenderBoundary } from '../../src/rendering/RenderBoundary';
import { performanceMonitor } from '../../src/utils/performance';

// Mock performanceMonitor
jest.mock('../../src/utils/performance', () => ({
  performanceMonitor: {
    start: jest.fn(),
    end: jest.fn(),
  },
  MetricType: {
    RENDER: 'render',
  }
}));

describe('RenderBoundary Performance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should only re-render when dependencies change', () => {
    const Child = jest.fn(() => <div>Child</div>);

    const { rerender } = render(
      <RenderBoundary name="test-boundary" dependencies={[1]}>
        <Child />
      </RenderBoundary>
    );

    expect(Child).toHaveBeenCalledTimes(1);

    // Rerender with same dependencies
    rerender(
      <RenderBoundary name="test-boundary" dependencies={[1]}>
        <Child />
      </RenderBoundary>
    );

    // Should NOT have been called again due to memoization
    expect(Child).toHaveBeenCalledTimes(1);

    // Rerender with different dependencies
    rerender(
      <RenderBoundary name="test-boundary" dependencies={[2]}>
        <Child />
      </RenderBoundary>
    );

    // Should HAVE been called again
    expect(Child).toHaveBeenCalledTimes(2);
  });

  it('should track performance when name is provided', () => {
    const { rerender } = render(
      <RenderBoundary name="tracked-boundary" dependencies={[1]}>
        <div>Content</div>
      </RenderBoundary>
    );

    expect(performanceMonitor.start).toHaveBeenCalledWith('tracked-boundary-render', expect.anything(), expect.anything());
    expect(performanceMonitor.end).toHaveBeenCalledWith('tracked-boundary-render', expect.anything());
  });
});
