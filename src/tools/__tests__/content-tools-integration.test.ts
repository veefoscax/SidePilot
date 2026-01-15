/**
 * Integration test for content extraction tools
 * Verifies that page-content and execute-script tools are properly registered
 */

import { describe, it, expect } from 'vitest';
import { toolRegistry } from '../registry';

describe('Content Tools Integration', () => {
  it('should have page_content tool registered', () => {
    const tool = toolRegistry.getTool('page_content');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('page_content');
    expect(tool?.description).toBeTruthy();
  });

  it('should have execute_script tool registered', () => {
    const tool = toolRegistry.getTool('execute_script');
    expect(tool).toBeDefined();
    expect(tool?.name).toBe('execute_script');
    expect(tool?.description).toBeTruthy();
  });

  it('should include content tools in getAllTools', () => {
    const allTools = toolRegistry.getAllTools();
    const toolNames = allTools.map(t => t.name);
    
    expect(toolNames).toContain('page_content');
    expect(toolNames).toContain('execute_script');
  });

  it('should include content tools in Anthropic schemas', () => {
    const schemas = toolRegistry.getAnthropicSchemas();
    const schemaNames = schemas.map(s => s.name);
    
    expect(schemaNames).toContain('page_content');
    expect(schemaNames).toContain('execute_script');
  });

  it('should include content tools in OpenAI schemas', () => {
    const schemas = toolRegistry.getOpenAISchemas();
    const schemaNames = schemas.map(s => s.function.name);
    
    expect(schemaNames).toContain('page_content');
    expect(schemaNames).toContain('execute_script');
  });

  it('should have correct tool count', () => {
    const allTools = toolRegistry.getAllTools();
    
    // We should have at least: computer, navigation, tabs, tab-groups, page_content, execute_script
    expect(allTools.length).toBeGreaterThanOrEqual(6);
  });
});
