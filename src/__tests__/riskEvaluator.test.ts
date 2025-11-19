import { describe, it, expect, spyOn, afterEach, beforeEach } from 'bun:test';
import { riskEvaluator } from '../plugins/mental-health/riskEvaluator';
import { elizaLogger, ModelType } from '@elizaos/core';

// Suppress logger output during tests
spyOn(elizaLogger, 'info').mockImplementation(() => {});
spyOn(elizaLogger, 'error').mockImplementation(() => {});
spyOn(elizaLogger, 'warn').mockImplementation(() => {});

// Mock the global cache and lock variables from the module
let riskCache: Map<string, string>;
let riskLock: Promise<any> | null;
let lastCall: number;

// We need to import the module to spy on its internals if they were exported,
// but since they are not, we will have to reset them manually or trust the logic.
// For the purpose of this test, we will assume the logic is correct and test the observable behavior.

describe('riskEvaluator', () => {
  let useModelMock: ReturnType<typeof spyOn>;

  const createMockRuntime = (history: any[] = []) => {
    const services: Record<string, any> = {
      memory: {
        getSessionSummaries: async (roomId: string) => {
          return roomId ? Promise.resolve(history) : Promise.resolve([]);
        },
      },
    };

    const runtime = {
      getService: (serviceName: string) => services[serviceName] || null,
      useModel: async () => {}, // This will be spied on
    } as any;

    useModelMock = spyOn(runtime, 'useModel');

    return runtime;
  };
  
  const createFailingMockRuntime = () => {
    return {
      getService: (serviceName: string) => {
        if (serviceName === 'memory') {
          return {
            getSessionSummaries: async () => { throw new Error('Memory Error'); },
          };
        }
        return null;
      },
      useModel: async () => {},
    } as any;
  };

  // I cannot reset the cache from here as it is not exported.
  // The tests will have to be independent and use different messages.

  afterEach(() => {
    if (useModelMock) {
      useModelMock.mockRestore();
    }
  });

  const mockMessage = (text: string) => ({
    content: { text },
  });
  const mockState = {
    room: { id: 'test-room' },
  };

  it('should return "high" for high-risk conversation history', async () => {
    const runtime = createMockRuntime([], 'high');
    useModelMock.mockResolvedValue('high');
    
    const result = await riskEvaluator.handler(runtime, mockMessage('Eu quero morrer'), mockState);

    expect(useModelMock).toHaveBeenCalled();
    expect(result.success).toBe(true);
    expect(result.data.level).toBe('high');
  });

  it('should return "medium" for medium-risk conversation history', async () => {
    const runtime = createMockRuntime([], 'medium');
    useModelMock.mockResolvedValue('medium');

    const result = await riskEvaluator.handler(runtime, mockMessage('Eu me sinto muito triste'), mockState);

    expect(result.success).toBe(true);
    expect(result.data.level).toBe('medium');
  });

  it('should use cache on second call with same message', async () => {
    const runtime = createMockRuntime([], 'low');
    useModelMock.mockResolvedValue('low');
    const message = mockMessage('Mensagem em cache');

    const result1 = await riskEvaluator.handler(runtime, message, mockState);
    expect(result1.success).toBe(true);
    expect(result1.data.level).toBe('low');
    expect(useModelMock).toHaveBeenCalledTimes(1);

    // Second call
    const result2 = await riskEvaluator.handler(runtime, message, mockState);
    expect(result2.success).toBe(true);
    expect(result2.data.level).toBe('low');
    // Should not have been called again
    expect(useModelMock).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 error and then succeed', async () => {
    const runtime = createMockRuntime([]);
    const apiError429 = {
      status: 429,
      message: 'Rate limit exceeded',
      details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '1s' }]
    };
    
    useModelMock
      .mockRejectedValueOnce(apiError429)
      .mockResolvedValueOnce('high');

    const result = await riskEvaluator.handler(runtime, mockMessage('teste retry'), mockState);

    expect(result.success).toBe(true);
    expect(result.data.level).toBe('high');
    expect(useModelMock).toHaveBeenCalledTimes(2);
  });
  
  it('should fail after max retries', async () => {
    const runtime = createMockRuntime([]);
    const apiError429 = { status: 429, message: 'Rate limit', details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '1s' }] };

    useModelMock
      .mockRejectedValueOnce(apiError429)
      .mockRejectedValueOnce(apiError429)
      .mockRejectedValueOnce(apiError429);

    const result = await riskEvaluator.handler(runtime, mockMessage('teste max retries'), mockState);
    
    expect(result.success).toBe(true); // The handler itself does not fail
    expect(result.data.level).toBe('medium'); // It returns 'medium' as fallback
    expect(useModelMock).toHaveBeenCalledTimes(3);
  });
});
