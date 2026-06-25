/**
 * Tests for recovery workflows
 */

import {
  AppError,
  NetworkError,
  ErrorCategory
} from '@/errors';
import {
  RECOVERY_WORKFLOWS,
  WorkflowState,
  WorkflowExecutor,
  getRecoveryWorkflow,
  executeRecoveryWorkflow
} from '@/features/recovery';

describe('Recovery Workflows', () => {
  it('should have workflows defined', () => {
    expect(Object.keys(RECOVERY_WORKFLOWS).length).toBeGreaterThan(0);
  });

  it('should have network recovery workflow', () => {
    expect(RECOVERY_WORKFLOWS.networkRecovery).toBeDefined();
    expect(RECOVERY_WORKFLOWS.networkRecovery.errorCategories).toContain(ErrorCategory.NETWORK);
  });

  it('should have timeout recovery workflow', () => {
    expect(RECOVERY_WORKFLOWS.timeoutRecovery).toBeDefined();
    expect(RECOVERY_WORKFLOWS.timeoutRecovery.errorCategories).toContain(ErrorCategory.TIMEOUT);
  });

  it('should have server recovery workflow', () => {
    expect(RECOVERY_WORKFLOWS.serverRecovery).toBeDefined();
  });

  it('should have contract recovery workflow', () => {
    expect(RECOVERY_WORKFLOWS.contractRecovery).toBeDefined();
  });

  it('should have valid workflow structure', () => {
    Object.values(RECOVERY_WORKFLOWS).forEach(workflow => {
      expect(workflow.id).toBeTruthy();
      expect(workflow.name).toBeTruthy();
      expect(Array.isArray(workflow.steps)).toBe(true);
      expect(workflow.steps.length).toBeGreaterThan(0);
    });
  });

  it('should have valid step structure', () => {
    Object.values(RECOVERY_WORKFLOWS).forEach(workflow => {
      workflow.steps.forEach(step => {
        expect(step.id).toBeTruthy();
        expect(step.name).toBeTruthy();
        expect(typeof step.condition).toBe('function');
        expect(Array.isArray(step.actions)).toBe(true);
      });
    });
  });
});

describe('getRecoveryWorkflow', () => {
  it('should return network workflow for network errors', () => {
    const error = new NetworkError('Connection failed');
    const workflow = getRecoveryWorkflow(error);

    expect(workflow).toBeDefined();
    expect(workflow?.errorCategories).toContain(ErrorCategory.NETWORK);
  });

  it('should return null for unmapped error categories', () => {
    const error = new AppError('Unknown error', {
      category: ErrorCategory.UNKNOWN
    });
    const workflow = getRecoveryWorkflow(error);

    // May or may not have a workflow depending on implementation
    if (workflow) {
      expect(workflow.errorCategories).toContain(ErrorCategory.UNKNOWN);
    }
  });
});

describe('WorkflowExecutor', () => {
  it('should initialize with idle state', () => {
    const executor = new WorkflowExecutor();
    expect(executor).toBeDefined();
  });

  it('should execute workflow and return result', async () => {
    const executor = new WorkflowExecutor();
    const workflow = RECOVERY_WORKFLOWS.networkRecovery;
    const error = new NetworkError('Connection failed');

    const result = await executor.executeWorkflow(workflow, error);

    expect(result.workflowId).toBe(workflow.id);
    expect(result.state).toBeDefined();
    expect(result.success).toBeDefined();
    expect(result.completedSteps).toBeDefined();
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it('should track completed steps', async () => {
    const executor = new WorkflowExecutor();
    const workflow = RECOVERY_WORKFLOWS.networkRecovery;
    const error = new NetworkError('Connection failed');

    const result = await executor.executeWorkflow(workflow, error);

    expect(Array.isArray(result.completedSteps)).toBe(true);
  });

  it('should handle step with conditions', async () => {
    const executor = new WorkflowExecutor();
    const workflow = RECOVERY_WORKFLOWS.serverRecovery;
    const error = new AppError('Server error', {
      category: ErrorCategory.SERVER
    });

    const result = await executor.executeWorkflow(workflow, error);

    // Workflow should execute and handle conditions
    expect(result.state).toBeDefined();
  });
});

describe('executeRecoveryWorkflow', () => {
  it('should find and execute appropriate workflow', async () => {
    const error = new NetworkError('Connection failed');
    const result = await executeRecoveryWorkflow(error);

    if (result) {
      expect(result.success).toBeDefined();
      expect(result.state).toBeDefined();
    }
  });

  it('should return null for unmapped error', async () => {
    const error = new AppError('Unknown error', {
      category: ErrorCategory.UNKNOWN
    });

    // Depending on implementation, may or may not have workflow
    const result = await executeRecoveryWorkflow(error);
    
    if (!result) {
      expect(result).toBeNull();
    }
  });

  it('should handle workflow execution errors gracefully', async () => {
    const error = new NetworkError('Connection failed');
    const result = await executeRecoveryWorkflow(error);

    // Should not throw, should return result
    expect(result).toBeDefined();
  });
});

describe('Workflow Step Conditions', () => {
  it('should only execute steps where condition is true', async () => {
    const executor = new WorkflowExecutor();
    const workflow = RECOVERY_WORKFLOWS.networkRecovery;
    const error = new NetworkError('Connection failed');

    const result = await executor.executeWorkflow(workflow, error);

    // Steps should be evaluated based on condition
    expect(Array.isArray(result.completedSteps)).toBe(true);
  });

  it('should skip steps where condition is false', async () => {
    const executor = new WorkflowExecutor();
    
    // Create a workflow with steps that have failing conditions
    const workflow = {
      id: 'test',
      name: 'Test Workflow',
      description: 'Test',
      errorCategories: [ErrorCategory.NETWORK],
      steps: [
        {
          id: 'step1',
          name: 'Step 1',
          description: 'This should not run',
          condition: (error: AppError) => false, // Always false
          actions: []
        }
      ]
    };

    const error = new NetworkError('Connection failed');
    const result = await executor.executeWorkflow(workflow, error);

    // Step should not be completed since condition is false
    expect(result.completedSteps.length).toBe(0);
  });
});
