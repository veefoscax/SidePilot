/**
 * Unit Tests for ZAI Provider Configuration
 * 
 * Tests ZAI-specific functionality including plan type support,
 * coding endpoint usage, and GLM model loading.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { createProvider } from '../factory';
import { ZAIProvider } from '../zai';
import { getProviderPlanTypes, supportsMultiplePlans } from '../provider-configs';

describe('ZAI Provider Configuration', () => {
  
  describe('Plan Type Support', () => {
    test('should support multiple plan types', () => {
      expect(supportsMultiplePlans('zai')).toBe(true);
      
      const planTypes = getProviderPlanTypes('zai');
      expect(planTypes).toBeDefined();
      expect(planTypes).toHaveProperty('general');
      expect(planTypes).toHaveProperty('coding');
    });

    test('should have correct plan configurations', () => {
      const planTypes = getProviderPlanTypes('zai')!;
      
      // General plan
      expect(planTypes.general.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
      expect(planTypes.general.description).toContain('General ZAI plan');
      expect(planTypes.general.defaultModels).toContain('glm-4-plus');
      
      // Coding plan
      expect(planTypes.coding.baseUrl).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(planTypes.coding.description).toContain('Coding plan');
      expect(planTypes.coding.defaultModels).toContain('glm-4.7');
    });
  });

  describe('Provider Creation with Plan Types', () => {
    test('should create provider with coding plan', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      });
      
      expect(provider).toBeInstanceOf(ZAIProvider);
      expect(provider.config.baseUrl).toBe('https://api.z.ai/api/coding/paas/v4');
      expect(provider.type).toBe('zai');
    });

    test('should create provider with general plan', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      });
      
      expect(provider).toBeInstanceOf(ZAIProvider);
      expect(provider.config.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
      expect(provider.type).toBe('zai');
    });

    test('should default to general plan when no plan type specified', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key'
      });
      
      expect(provider).toBeInstanceOf(ZAIProvider);
      expect(provider.config.baseUrl).toBe('https://open.bigmodel.cn/api/paas/v4');
    });

    test('should allow custom base URL to override plan type', () => {
      const customUrl = 'https://custom.zai.example.com/v1';
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding',
        baseUrl: customUrl
      });
      
      expect(provider.config.baseUrl).toBe(customUrl);
    });
  });

  describe('GLM Model Loading', () => {
    test('should provide coding models for coding plan', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      const models = provider['getDefaultModels']();
      
      expect(models).toHaveLength(3);
      expect(models.map(m => m.id)).toEqual(['glm-4.7', 'glm-4.6', 'glm-4.5']);
      expect(models[0].name).toBe('GLM-4.7 (Coding)');
      expect(models[0].provider).toBe('zai');
    });

    test('should provide general models for general plan', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      }) as ZAIProvider;
      
      const models = provider['getDefaultModels']();
      
      expect(models).toHaveLength(4);
      expect(models.map(m => m.id)).toEqual(['glm-4-plus', 'glm-4-flash', 'glm-4v-plus', 'glm-4-long']);
      expect(models[0].name).toBe('GLM-4 Plus');
      expect(models[2].capabilities.supportsVision).toBe(true); // glm-4v-plus
    });

    test('should set correct default model for each plan', () => {
      const codingProvider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      const generalProvider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      }) as ZAIProvider;
      
      expect(codingProvider['getDefaultModel']()).toBe('glm-4.7');
      expect(generalProvider['getDefaultModel']()).toBe('glm-4-plus');
    });
  });

  describe('Model Capabilities', () => {
    test('should have correct capabilities for coding models', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      const models = provider['getDefaultModels']();
      
      for (const model of models) {
        expect(model.capabilities.supportsTools).toBe(true);
        expect(model.capabilities.supportsStreaming).toBe(true);
        expect(model.capabilities.supportsVision).toBe(false); // Coding models don't support vision
        expect(model.capabilities.contextWindow).toBe(128000);
      }
    });

    test('should have vision support for glm-4v-plus', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      }) as ZAIProvider;
      
      const models = provider['getDefaultModels']();
      const visionModel = models.find(m => m.id === 'glm-4v-plus');
      
      expect(visionModel).toBeDefined();
      expect(visionModel!.capabilities.supportsVision).toBe(true);
    });

    test('should have large context for glm-4-long', () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      }) as ZAIProvider;
      
      const models = provider['getDefaultModels']();
      const longModel = models.find(m => m.id === 'glm-4-long');
      
      expect(longModel).toBeDefined();
      expect(longModel!.capabilities.contextWindow).toBe(1000000); // 1M context
      expect(longModel!.capabilities.maxOutputTokens).toBe(8192);
    });
  });

  describe('ZAI-Specific Error Messages', () => {
    test('should handle insufficient balance error', async () => {
      const provider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      // Mock a response that simulates insufficient balance
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            code: '1113',
            message: 'Insufficient balance or no resource package. Please recharge.'
          }
        })
      } as Response;
      
      try {
        await provider['handleErrorResponse'](mockResponse);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('Insufficient balance');
        expect(error.message).toContain('recharge your ZAI coding plan');
        expect(error.message).toContain('https://open.bigmodel.cn/usercenter/apikeys');
      }
    });

    test('should handle authentication error', async () => {
      const provider = createProvider('zai', {
        apiKey: 'invalid-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({
          error: {
            message: 'Invalid API key'
          }
        })
      } as Response;
      
      try {
        await provider['handleErrorResponse'](mockResponse);
        expect.fail('Should have thrown an error');
      } catch (error: any) {
        expect(error.message).toContain('ZAI Authentication Error');
        expect(error.message).toContain('verify your ZAI API key');
        expect(error.message).toContain('coding plan');
      }
    });
  });

  describe('Connection Testing', () => {
    test('should use correct model for connection test', async () => {
      const codingProvider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'coding'
      }) as ZAIProvider;
      
      const generalProvider = createProvider('zai', {
        apiKey: 'test-key',
        planType: 'general'
      }) as ZAIProvider;
      
      // Mock the makeRequest method to capture the request
      let capturedRequest: any = null;
      codingProvider['makeRequest'] = async (path: string, options: any) => {
        capturedRequest = JSON.parse(options.body);
        return { ok: true } as Response;
      };
      
      await codingProvider['performConnectionTest']();
      expect(capturedRequest.model).toBe('glm-4.7');
      
      // Reset for general provider test
      capturedRequest = null;
      generalProvider['makeRequest'] = async (path: string, options: any) => {
        capturedRequest = JSON.parse(options.body);
        return { ok: true } as Response;
      };
      
      await generalProvider['performConnectionTest']();
      expect(capturedRequest.model).toBe('glm-4-plus');
    });
  });
});