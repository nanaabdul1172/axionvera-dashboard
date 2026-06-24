import { measureAsync, trackRender } from '../performance';

describe('performance', () => {
  describe('measureAsync', () => {
    it('should return the result of the async function', async () => {
      const result = await measureAsync('test', async () => 42);
      expect(result).toBe(42);
    });

    it('should propagate errors', async () => {
      await expect(
        measureAsync('fail', async () => { throw new Error('boom'); }),
      ).rejects.toThrow('boom');
    });
  });

  describe('trackRender', () => {
    it('should return a cleanup function', () => {
      const cleanup = trackRender('Test');
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });
});
