import { logger } from '../logger';

describe('logger', () => {
  let logs: unknown[];

  beforeEach(() => {
    logs = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => { logs.push(args); });
    jest.spyOn(console, 'warn').mockImplementation((...args) => { logs.push(args); });
    jest.spyOn(console, 'error').mockImplementation((...args) => { logs.push(args); });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should log info message as JSON', () => {
    logger.info('hello');
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0] as string);
    expect(parsed.level).toBe('info');
    expect(parsed.message).toBe('hello');
    expect(parsed.timestamp).toBeDefined();
  });

  it('should include metadata', () => {
    logger.info('test', { userId: '123' });
    const parsed = JSON.parse(logs[0] as string);
    expect(parsed.userId).toBe('123');
  });

  it('should log error with console.error', () => {
    logger.error('oops');
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0] as string);
    expect(parsed.level).toBe('error');
  });

  it('should log warn with console.warn', () => {
    logger.warn('caution');
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0] as string);
    expect(parsed.level).toBe('warn');
  });

  it('should log debug with console.log', () => {
    logger.debug('verbose');
    expect(logs).toHaveLength(1);
    const parsed = JSON.parse(logs[0] as string);
    expect(parsed.level).toBe('debug');
  });
});
