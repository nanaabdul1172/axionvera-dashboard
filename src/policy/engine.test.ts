import {
  PolicyEngine,
  AllowAllPolicy,
  DenyAllPolicy,
  OperationWhitelistPolicy,
  ActorRestrictionPolicy,
  TimeWindowPolicy
} from './index';
import type { PolicyContext } from './types';

describe('PolicyEngine', () => {
  let engine: PolicyEngine;
  const mockContext: PolicyContext = {
    timestamp: Date.now(),
    actor: 'test-actor',
    operation: 'test-operation',
    metadata: {}
  };

  beforeEach(() => {
    engine = new PolicyEngine();
  });

  describe('policy management', () => {
    test('adds and retrieves a policy', () => {
      const policy = new AllowAllPolicy();
      engine.addPolicy(policy);

      expect(engine.getPolicy(policy.id)).toBe(policy);
      expect(engine.getAllPolicies()).toHaveLength(1);
    });

    test('removes a policy', () => {
      const policy = new AllowAllPolicy();
      engine.addPolicy(policy);

      const removed = engine.removePolicy(policy.id);
      expect(removed).toBe(true);
      expect(engine.getPolicy(policy.id)).toBeUndefined();
    });
  });

  describe('evaluation', () => {
    test('allow all policy evaluates to allow', async () => {
      engine.addPolicy(new AllowAllPolicy());
      const result = await engine.evaluate(mockContext);
      expect(result.result).toBe('allow');
      expect(result.violations).toHaveLength(0);
    });

    test('deny all policy evaluates to deny', async () => {
      engine.addPolicy(new DenyAllPolicy());
      const result = await engine.evaluate(mockContext);
      expect(result.result).toBe('deny');
      expect(result.violations).toHaveLength(1);
    });

    test('operation whitelist policy allows whitelisted operations', async () => {
      const policy = new OperationWhitelistPolicy({
        id: 'whitelist-1',
        name: 'Test Whitelist',
        allowedOperations: ['allowed-op']
      });
      engine.addPolicy(policy);

      const allowedContext: PolicyContext = {
        ...mockContext,
        operation: 'allowed-op'
      };
      const allowedResult = await engine.evaluate(allowedContext);
      expect(allowedResult.result).toBe('allow');

      const deniedResult = await engine.evaluate(mockContext);
      expect(deniedResult.result).toBe('deny');
    });

    test('actor restriction policy allows specified actors', async () => {
      const policy = new ActorRestrictionPolicy({
        id: 'actor-restriction',
        name: 'Test Actor Restriction',
        allowedActors: ['allowed-actor']
      });
      engine.addPolicy(policy);

      const allowedContext: PolicyContext = {
        ...mockContext,
        actor: 'allowed-actor'
      };
      const allowedResult = await engine.evaluate(allowedContext);
      expect(allowedResult.result).toBe('allow');

      const deniedResult = await engine.evaluate(mockContext);
      expect(deniedResult.result).toBe('deny');
    });

    test('time window policy allows operations during window', async () => {
      const now = new Date();
      const currentHour = now.getHours();
      
      const policy = new TimeWindowPolicy({
        id: 'time-window',
        name: 'Test Time Window',
        startHour: currentHour,
        endHour: currentHour + 1
      });
      engine.addPolicy(policy);

      const result = await engine.evaluate(mockContext);
      expect(result.result).toBe('allow');
    });

    test('multiple policies with one deny results in deny', async () => {
      engine.addPolicy(new AllowAllPolicy());
      engine.addPolicy(new DenyAllPolicy());

      const result = await engine.evaluate(mockContext);
      expect(result.result).toBe('deny');
    });

    test('disabled policies are not evaluated', async () => {
      const denyPolicy = new DenyAllPolicy();
      denyPolicy.enabled = false;
      engine.addPolicy(denyPolicy);

      const result = await engine.evaluate(mockContext);
      expect(result.result).toBe('allow');
    });
  });

  describe('events', () => {
    test('emits policy added event', () => {
      const handler = jest.fn();
      engine.subscribe(handler);

      const policy = new AllowAllPolicy();
      engine.addPolicy(policy);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'policy.added'
        })
      );
    });

    test('emits policy evaluated event', async () => {
      const handler = jest.fn();
      engine.subscribe(handler);
      engine.addPolicy(new AllowAllPolicy());

      await engine.evaluate(mockContext);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'policy.evaluated'
        })
      );
    });

    test('unsubscribes handler', () => {
      const handler = jest.fn();
      const unsubscribe = engine.subscribe(handler);
      
      const policy = new AllowAllPolicy();
      engine.addPolicy(policy);
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      
      engine.addPolicy(new DenyAllPolicy());
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
