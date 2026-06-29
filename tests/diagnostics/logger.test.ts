import {
  logger,
  configureLogger,
  addTransport,
  clearTransports,
  getLogLevel,
  LogEntry,
  LogLevel,
} from '@/logger/logger';

describe('Logger', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    configureLogger({ level: 'debug', enabled: true });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    clearTransports();
  });

  it('should log debug messages when level is debug', () => {
    logger.debug('test debug');
    expect(consoleLogSpy).toHaveBeenCalled();
    const call = consoleLogSpy.mock.calls[0][0];
    const parsed = JSON.parse(call);
    expect(parsed.level).toBe('debug');
    expect(parsed.message).toBe('test debug');
  });

  it('should log info messages', () => {
    logger.info('test info');
    expect(consoleLogSpy).toHaveBeenCalled();
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('test info');
  });

  it('should log warn messages to console.warn', () => {
    logger.warn('test warn');
    expect(consoleWarnSpy).toHaveBeenCalled();
    const parsed = JSON.parse(consoleWarnSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('warn');
  });

  it('should log error messages to console.error', () => {
    logger.error('test error');
    expect(consoleErrorSpy).toHaveBeenCalled();
    const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('error');
  });

  it('should include timestamp, level, and message in every log entry', () => {
    logger.info('test', { key: 'value' }, 'test-module');
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.timestamp).toBeDefined();
    expect(() => new Date(parsed.timestamp)).not.toThrow();
    expect(parsed.message).toBe('test');
    expect(parsed.meta).toEqual({ key: 'value' });
    expect(parsed.module).toBe('test-module');
  });

  it('should respect log level configuration', () => {
    configureLogger({ level: 'error' });
    logger.debug('should not appear');
    logger.info('should not appear');
    logger.warn('should not appear');
    logger.error('should appear');
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('should suppress all logs when disabled', () => {
    configureLogger({ enabled: false });
    logger.debug('x');
    logger.info('x');
    logger.warn('x');
    logger.error('x');
    expect(consoleLogSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it('should call registered transports', () => {
    const transport = jest.fn();
    addTransport(transport);
    logger.info('transport test');
    expect(transport).toHaveBeenCalledTimes(1);
    const entry: LogEntry = transport.mock.calls[0][0];
    expect(entry.message).toBe('transport test');
    expect(entry.level).toBe('info');
  });

  it('should support multiple transports', () => {
    const t1 = jest.fn();
    const t2 = jest.fn();
    addTransport(t1);
    addTransport(t2);
    logger.warn('multi transport');
    expect(t1).toHaveBeenCalledTimes(1);
    expect(t2).toHaveBeenCalledTimes(1);
  });

  it('should clear transports', () => {
    const transport = jest.fn();
    addTransport(transport);
    clearTransports();
    logger.info('after clear');
    expect(transport).not.toHaveBeenCalled();
  });

  it('should track current log level', () => {
    expect(getLogLevel()).toBe('debug');
    configureLogger({ level: 'warn' });
    expect(getLogLevel()).toBe('warn');
  });

  it('should filter debug when level is info', () => {
    configureLogger({ level: 'info' });
    logger.debug('hidden');
    logger.info('visible');
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.level).toBe('info');
  });
});
