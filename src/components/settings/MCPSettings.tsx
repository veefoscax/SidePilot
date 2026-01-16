/**
 * MCP Settings Component
 * 
 * Provides UI for managing MCP (Model Context Protocol) server connections:
 * - Add/remove MCP servers
 * - View connection status
 * - Enable/disable individual tools
 * - Refresh tool discovery
 * 
 * Requirements: AC6
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Add01Icon,
  Delete01Icon,
  RefreshIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Alert02Icon,
  Loading01Icon,
  PlugIcon
} from '@hugeicons/core-free-icons';

import { useMCPStore, type MCPServerWithTools } from '@/stores/mcp';
import { formatMcpToolName } from '@/lib/mcp';

/**
 * Server status badge component
 */
function ServerStatusBadge({ status }: { status: MCPServerWithTools['status'] }) {
  switch (status) {
    case 'connected':
      return (
        <span className="flex items-center gap-1 text-xs text-green-600">
          <HugeiconsIcon icon={CheckmarkCircle02Icon} className="h-3 w-3" />
          Connected
        </span>
      );
    case 'disconnected':
      return (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <HugeiconsIcon icon={Cancel01Icon} className="h-3 w-3" />
          Disconnected
        </span>
      );
    case 'error':
      return (
        <span className="flex items-center gap-1 text-xs text-red-600">
          <HugeiconsIcon icon={Alert02Icon} className="h-3 w-3" />
          Error
        </span>
      );
  }
}

/**
 * Individual server card component
 */
function ServerCard({ server }: { server: MCPServerWithTools }) {
  const [isToolsExpanded, setIsToolsExpanded] = useState(false);
  const { removeServer, refreshTools, setToolEnabled, setAllToolsEnabled, isToolEnabled, isConnecting } = useMCPStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshTools(server.uuid);
    } catch (error) {
      console.error('Failed to refresh server:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleRemove = async () => {
    try {
      await removeServer(server.uuid);
    } catch (error) {
      console.error('Failed to remove server:', error);
    }
  };

  const handleToggleTool = async (toolName: string, enabled: boolean) => {
    const fullName = formatMcpToolName(server.uuid, toolName);
    await setToolEnabled(fullName, enabled);
  };

  const handleToggleAllTools = async (enabled: boolean) => {
    await setAllToolsEnabled(server.uuid, enabled);
  };

  const enabledCount = server.tools.filter(t => 
    isToolEnabled(formatMcpToolName(server.uuid, t.name))
  ).length;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-3 space-y-3">
        {/* Server Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{server.name}</span>
              <ServerStatusBadge status={server.status} />
            </div>
            <p className="text-xs text-muted-foreground truncate max-w-[200px]" title={server.url}>
              {server.url}
            </p>
            {server.errorMessage && (
              <p className="text-xs text-red-500">{server.errorMessage}</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isConnecting}
              title="Refresh tools"
            >
              <HugeiconsIcon 
                icon={isRefreshing ? Loading01Icon : RefreshIcon} 
                className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              className="text-destructive hover:text-destructive"
              title="Remove server"
            >
              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tools Section */}
        {server.tools.length > 0 && (
          <>
            <Separator />
            <Collapsible open={isToolsExpanded} onOpenChange={setIsToolsExpanded}>
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                    <span className="text-xs text-muted-foreground">
                      {enabledCount}/{server.tools.length} tools enabled
                    </span>
                    <HugeiconsIcon
                      icon={isToolsExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                      className="h-3 w-3 ml-1"
                    />
                  </Button>
                </CollapsibleTrigger>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">All</span>
                  <Switch
                    checked={enabledCount === server.tools.length}
                    onCheckedChange={handleToggleAllTools}
                    className="scale-75"
                  />
                </div>
              </div>
              <CollapsibleContent className="pt-2 space-y-2">
                {server.tools.map(tool => {
                  const fullName = formatMcpToolName(server.uuid, tool.name);
                  const enabled = isToolEnabled(fullName);
                  return (
                    <div key={tool.name} className="flex items-start justify-between py-1">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <Label className="text-xs font-medium">{tool.name}</Label>
                        {tool.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {tool.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => handleToggleTool(tool.name, checked)}
                        className="scale-75 ml-2"
                      />
                    </div>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}

        {server.status === 'connected' && server.tools.length === 0 && (
          <p className="text-xs text-muted-foreground italic">No tools available</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Add server form component
 */
function AddServerForm({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addServer, isConnecting } = useMCPStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url.trim()) {
      setError('Server URL is required');
      return;
    }

    if (!name.trim()) {
      setError('Server name is required');
      return;
    }

    try {
      await addServer(url.trim(), name.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add server');
    }
  };

  return (
    <Card>
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="server-name" className="text-xs">Server Name</Label>
            <Input
              id="server-name"
              placeholder="My MCP Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="server-url" className="text-xs">Server URL</Label>
            <Input
              id="server-url"
              placeholder="http://localhost:3000 or ws://localhost:3000"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <HugeiconsIcon icon={Loading01Icon} className="h-4 w-4 mr-1 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Add Server'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/**
 * Main MCP Settings component
 */
export function MCPSettings() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const { servers, isLoaded, loadFromStorage, refreshAllServers, isConnecting, error, clearError } = useMCPStore();

  // Load MCP data on mount
  useEffect(() => {
    if (!isLoaded) {
      loadFromStorage();
    }
  }, [isLoaded, loadFromStorage]);

  // Auto-refresh servers on load
  useEffect(() => {
    if (isLoaded && servers.length > 0) {
      // Refresh all servers to get current status
      refreshAllServers().catch(console.error);
    }
  }, [isLoaded]);

  const connectedCount = servers.filter(s => s.status === 'connected').length;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={PlugIcon} className="h-4 w-4 text-primary" />
            <div>
              <h3 className="text-base font-medium">MCP Servers</h3>
              <p className="text-sm text-muted-foreground">
                {servers.length === 0 
                  ? 'No servers configured'
                  : `${connectedCount}/${servers.length} connected`
                }
              </p>
            </div>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <HugeiconsIcon
                icon={isExpanded ? ArrowUp01Icon : ArrowDown01Icon}
                className="h-4 w-4"
              />
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent className="space-y-3">
          {/* Error Display */}
          {error && (
            <div className="flex items-center justify-between p-2 bg-red-50 dark:bg-red-950 rounded text-sm text-red-600 dark:text-red-400">
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={clearError}>
                <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Server List */}
          {servers.map(server => (
            <ServerCard key={server.uuid} server={server} />
          ))}

          {/* Add Server Form or Button */}
          {showAddForm ? (
            <AddServerForm onClose={() => setShowAddForm(false)} />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowAddForm(true)}
              disabled={isConnecting}
            >
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 mr-1" />
              Add MCP Server
            </Button>
          )}

          {/* Info Text */}
          <p className="text-xs text-muted-foreground">
            MCP servers expose additional tools that can be used alongside browser automation.
            Tools from connected servers will appear in the AI's tool list.
          </p>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
