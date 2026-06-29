export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVELS: Record<LogLevel, number> = {
  debug: 0, info: 1, warn: 2, error: 3,
};

export type LogTransport = (entry: LogEntry) => void;

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module?: string;
  meta?: Record<string, unknown>;
}

const DEFAULT_LEVEL: LogLevel =
  process.env.NODE_ENV === 'production' ? 'info' : 'debug';

let currentLevel: LogLevel = DEFAULT_LEVEL;
let transports: LogTransport[] = [];
let enabled: boolean = true;

export function configureLogger(options: {
  level?: LogLevel;
  enabled?: boolean;
}): void {
  if (options.level !== undefined) currentLevel = options.level;
  if (options.enabled !== undefined) enabled = options.enabled;
}

export function addTransport(transport: LogTransport): void {
  transports.push(transport);
}

export function clearTransports(): void {
  transports = [];
}

export function getLogLevel(): LogLevel {
  return currentLevel;
}

function shouldLog(level: LogLevel): boolean {
  return enabled && LEVELS[level] >= LEVELS[currentLevel];
}

function log(level: LogLevel, message: string, meta?: Record<string, unknown>, module?: string) {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    module,
    meta,
  };

  const consoleOutput = JSON.stringify(entry);

  switch (level) {
    case 'error':
      console.error(consoleOutput);
      break;
    case 'warn':
      console.warn(consoleOutput);
      break;
    default:
      console.log(consoleOutput);
  }

  transports.forEach(t => t(entry));
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>, module?: string) =>
    log('debug', message, meta, module),
  info: (message: string, meta?: Record<string, unknown>, module?: string) =>
    log('info', message, meta, module),
  warn: (message: string, meta?: Record<string, unknown>, module?: string) =>
    log('warn', message, meta, module),
  error: (message: string, meta?: Record<string, unknown>, module?: string) =>
    log('error', message, meta, module),
};
