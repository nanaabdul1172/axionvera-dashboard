export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const elapsed = performance.now() - start;
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[perf] ${label}: ${elapsed.toFixed(2)}ms`);
    }
  }
}

export function trackRender(name: string) {
  if (process.env.NODE_ENV !== 'production') {
    const start = performance.now();
    return () => {
      const elapsed = performance.now() - start;
      console.log(`[render] ${name}: ${elapsed.toFixed(2)}ms`);
    };
  }
  return () => {};
}
