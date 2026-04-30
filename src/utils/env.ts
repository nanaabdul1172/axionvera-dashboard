/**
 * Utility to access environment variables.
 * In production/deployment, these are injected into window._env_ by env.sh.
 * In local dev, they come from process.env.
 */
export const getEnv = (key: string): string | undefined => {
  // Check window._env_ first (injected at runtime in Docker/containers)
  if (typeof window !== 'undefined' && (window as any)._env_ && (window as any)._env_[key]) {
    return (window as any)._env_[key];
  }
  
  // Fall back to process.env (build-time variables, local development)
  if (typeof process !== 'undefined' && (process as any).env) {
    return (process as any).env[key];
  }
  
  return undefined;
};
