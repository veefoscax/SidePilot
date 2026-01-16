/**
 * MCP Connector Settings Component
 * 
 * Provides UI for managing the MCP Connector that exposes SidePilot's
 * browser tools to external AI tools like Cline and Aider.
 * 
 * Features:
 * - Enable/disable connector
 * - Select which tools to expose
 * - Display and copy auth token
 * - Regenerate auth token
 * 
 * Requirements: AC4
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Copy01Icon,
  RefreshIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Share01Icon,
  Loading01Icon,
} from '@hugeicons/core-free-icons';

import { MCPConnector, type MCPConnectorConfig } from '@/lib/mcp-connector';
import { toolRegistry } from '@/tools/registry';
import type { ToolDefinition } from '@/tools/types';

/**
 * Main MCP Connector Settings component
 */
export function MCPConnectorSettings() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [config, setConfig] = useState<MCPConnectorConfig | null>(null);
  const [allTools, setAllTools] = useState<ToolDefinition[]>([]);
  const [copied, setCopied] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Load config and tools on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const connector = MCPConnector.getInstance();
        await connector.initialize();
        setConfig(connector.getConfig());
        setAllTools(toolRegistry.getAllTools());
      } catch (error) {
        console.error('Failed to load MCP Connector config:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleToggleEnabled = async (enabled: boolean) => {
    if (!config) return;
    
    const connector = MCPConnector.getInstance();
    await connector.setEnabled(enabled);
    setConfig(connector.getConfig());
  };

  const handleToggleTool = async (toolName: string, checked: boolean) => {
    if (!config) return;
    
    const connector = MCPConnector.getInstance();
    const currentTools = connector.getExposedTools();
    
    let newTools: string[];
    if (checked) {
      newTools = [...currentTools, toolName];
    } else {
      newTools = currentTools.filter(t => t !== toolName);
    }
    
    await connector.setExposedTools(newTools);
    setConfig(connector.getConfig());
  };

  const handleToggleAllTools = async (checked: boolean) => {
    if (!config) return;
    
    const connector = MCPConnector.getInstance();
    const newTools = checked ? allTools.map(t => t.name) : [];
    await connector.setExposedTools(newTools);
    setConfig(connector.getConfig());
  };

  const handleCopyToken = async () => {
    if (!config?.authToken) return;
    
    try {
      await navigator.clipboard.writeText(config.authToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy token:', error);
    }
  };

  const handleRegenerateToken = async () => {
    setIsRegenerating(true);
    try {
      const connector = MCPConnector.getInstance();
      await connector.regenerateAuthToken();
      setConfig(connector.getConfig());
    } catch (error) {
      console.error('Failed to regenerate token:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const exposedCount = config?.exposedTools.length || 0;
  const totalTools = allTools.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <HugeiconsIcon icon={Loading01Icon} className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Share01Icon} className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-medium">MCP Connector</h3>
              <p className="text-sm text-muted-foreground">
                {config?.enabled 
                  ? `${exposedCount} tools exposed`
                  : 'Disabled'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={config?.enabled || false}
              onCheckedChange={handleToggleEnabled}
            />
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm">
                <HugeiconsIcon
                  icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                  className="h-4 w-4"
                />
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent className="space-y-4">
          {/* Description */}
          <p className="text-xs text-muted-foreground">
            Allow external AI tools like Cline and Aider to use SidePilot's browser automation tools.
            Requires a companion proxy for communication.
          </p>

          {/* Auth Token Section */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Authentication Token</Label>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyToken}
                    disabled={!config?.authToken}
                    title="Copy token"
                  >
                    {copied ? (
                      <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-4 w-4 text-green-500" />
                    ) : (
                      <HugeiconsIcon icon={Copy01Icon} className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateToken}
                    disabled={isRegenerating}
                    title="Regenerate token"
                  >
                    <HugeiconsIcon 
                      icon={RefreshIcon} 
                      className={`h-4 w-4 ${isRegenerating ? 'animate-spin' : ''}`} 
                    />
                  </Button>
                </div>
              </div>
              <Input
                type="password"
                value={config?.authToken || ''}
                readOnly
                className="h-8 text-xs font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Use this token to authenticate external connections. Keep it secret!
              </p>
            </CardContent>
          </Card>

          {/* Exposed Tools Section */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Exposed Tools</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {exposedCount}/{totalTools}
                  </span>
                  <Checkbox
                    checked={exposedCount === totalTools && totalTools > 0}
                    onCheckedChange={handleToggleAllTools}
                  />
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {allTools.map(tool => {
                  const isExposed = config?.exposedTools.includes(tool.name) || false;
                  return (
                    <div key={tool.name} className="flex items-start justify-between py-1">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <Label className="text-xs font-medium">{tool.name}</Label>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {tool.description}
                        </p>
                      </div>
                      <Checkbox
                        checked={isExposed}
                        onCheckedChange={(checked) => handleToggleTool(tool.name, checked === true)}
                        className="ml-2"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Connection Status */}
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <HugeiconsIcon 
                  icon={config?.enabled ? CheckmarkCircle02Icon : Cancel01Icon} 
                  className={`h-4 w-4 ${config?.enabled ? 'text-green-500' : 'text-muted-foreground'}`}
                />
                <span className="text-sm">
                  {config?.enabled ? 'Connector is active' : 'Connector is disabled'}
                </span>
              </div>
              {config?.enabled && (
                <p className="text-xs text-muted-foreground mt-2">
                  External tools can connect using the auth token above.
                  See documentation for setup instructions.
                </p>
              )}
            </CardContent>
          </Card>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
