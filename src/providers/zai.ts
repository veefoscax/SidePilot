/**
 * ZAI (智谱 Zhipu AI) Provider
 * 
 * Implements ZAI's GLM models with support for both general and coding plans.
 * Based on PROVIDER_LIST.md documentation.
 */

import { OpenAIProvider } from './openai';
import { ModelInfo } from './types';
import { getDefaultModelsForPlan } from './provider-configs';

export class ZAIProvider extends OpenAIProvider {
  protected getDefaultModels(): ModelInfo[] {
    // Determine if this is a coding plan based on base URL
    const isCodingPlan = this.config.baseUrl?.includes('api.z.ai/api/coding');
    
    if (isCodingPlan) {
      return [
        {
          id: 'glm-4.7',
          name: 'GLM-4.7 (Coding)',
          provider: this.type,
          capabilities: {
            supportsVision: false,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: false,
            supportsPromptCache: false,
            contextWindow: 128000,
            maxOutputTokens: 4096,
          },
        },
        {
          id: 'glm-4.6',
          name: 'GLM-4.6 (Coding)',
          provider: this.type,
          capabilities: {
            supportsVision: false,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: false,
            supportsPromptCache: false,
            contextWindow: 128000,
            maxOutputTokens: 4096,
          },
        },
        {
          id: 'glm-4.5',
          name: 'GLM-4.5 (Coding)',
          provider: this.type,
          capabilities: {
            supportsVision: false,
            supportsTools: true,
            supportsStreaming: true,
            supportsReasoning: false,
            supportsPromptCache: false,
            contextWindow: 128000,
            maxOutputTokens: 4096,
          },
        },
      ];
    }
    
    // General plan models
    return [
      {
        id: 'glm-4-plus',
        name: 'GLM-4 Plus',
        provider: this.type,
        capabilities: {
          supportsVision: false,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
      },
      {
        id: 'glm-4-flash',
        name: 'GLM-4 Flash',
        provider: this.type,
        capabilities: {
          supportsVision: false,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
      },
      {
        id: 'glm-4v-plus',
        name: 'GLM-4V Plus',
        provider: this.type,
        capabilities: {
          supportsVision: true,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 128000,
          maxOutputTokens: 4096,
        },
      },
      {
        id: 'glm-4-long',
        name: 'GLM-4 Long',
        provider: this.type,
        capabilities: {
          supportsVision: false,
          supportsTools: true,
          supportsStreaming: true,
          supportsReasoning: false,
          supportsPromptCache: false,
          contextWindow: 1000000, // 1M context
          maxOutputTokens: 8192,
        },
      },
    ];
  }

  protected getDefaultModel(): string {
    const isCodingPlan = this.config.baseUrl?.includes('api.z.ai/api/coding');
    return isCodingPlan ? 'glm-4.7' : 'glm-4-plus';
  }

  /**
   * ZAI-specific connection test
   * Uses the same endpoint as actual chat requests
   */
  protected async performConnectionTest(): Promise<{ models: ModelInfo[] }> {
    try {
      const defaultModel = this.getDefaultModel();
      
      // Test with minimal chat request to verify endpoint
      const response = await this.makeRequest('/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          model: defaultModel,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        }),
      });

      if (response.ok) {
        return { models: this.getDefaultModels() };
      }

      // If that fails, try to get models from API
      const models = await this.fetchModelsFromAPI();
      return { models };
    } catch (error) {
      // Fallback to default models
      return { models: this.getDefaultModels() };
    }
  }

  /**
   * Enhanced error handling for ZAI-specific issues
   */
  protected async handleErrorResponse(response: Response): Promise<never> {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.error?.message) {
        errorMessage = errorData.error.message;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    // ZAI-specific error handling
    if (response.status === 401 || response.status === 403) {
      if (errorMessage.includes('balance') || errorMessage.includes('resource package')) {
        throw new Error(
          `ZAI API Error: Insufficient balance or no resource package. Please recharge your ZAI coding plan.\n\n` +
          `Visit https://open.bigmodel.cn/usercenter/apikeys to manage your account.`
        );
      }
      
      throw new Error(
        `ZAI Authentication Error: ${errorMessage}\n\n` +
        `Please verify your ZAI API key and ensure it has access to the coding plan.\n` +
        `Get your API key from: https://open.bigmodel.cn/usercenter/apikeys`
      );
    }

    // Call parent error handler for other cases
    return super.handleErrorResponse(response);
  }
}