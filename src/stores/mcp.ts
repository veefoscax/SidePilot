import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    type MCPServer,
    type MCPTool,
    type MCPToolWithServer,
    createMcpServer,
    formatMcpToolName,
    isValidMcpServerUrl
} from '@/lib/mcp';

// =============================================================================
// State Interface
// =============================================================================

export interface MCPState {
    // Data
    servers: MCPServer[];
    toolsByServer: Record<string, MCPTool[]>;
    enabledTools: Record<string, boolean>; // mcp__<uuid>__<name> -> enabled
    isLoading: boolean;

    // Server Management
    addServer: (url: string, name: string) => Promise<MCPServer>;
    removeServer: (uuid: string) => void;
    updateServerStatus: (uuid: string, status: MCPServer['status'], error?: string) => void;

    // Tool Management
    setToolEnabled: (fullName: string, enabled: boolean) => void;
    refreshTools: (uuid: string) => Promise<void>;
    getAllEnabledTools: () => MCPToolWithServer[];

    // Internal Actions
    _setTools: (uuid: string, tools: MCPTool[]) => void;
}

// =============================================================================
// Client Implementation (Mock for now, will be real in S14)
// =============================================================================

// Placeholder for MCP Client interactions
// In S14 this will be replaced by the actual MCP Protocol Client
class MCPClientAdapter {
    async connect(url: string): Promise<boolean> {
        // Basic connectivity check (fetch endpoint)
        try {
            const response = await fetch(`${url}/health`);
            return response.ok;
        } catch {
            // For now, assume connection if we can parse the URL
            return isValidMcpServerUrl(url);
        }
    }

    async listTools(url: string): Promise<MCPTool[]> {
        try {
            // Try to fetch tools if it's a real HTTP endpoint
            const response = await fetch(`${url}/tools`);
            if (response.ok) {
                const data = await response.json();
                return data.tools || [];
            }
        } catch {
            // Ignore fetch errors
        }

        // Fallback/Mock for testing
        // If not a real endpoint, return no tools instead of erroring
        return [];
    }
}

const client = new MCPClientAdapter();

// =============================================================================
// Store Implementation
// =============================================================================

export const useMCPStore = create<MCPState>()(
    persist(
        (set, get) => ({
            // Initial Data
            servers: [],
            toolsByServer: {},
            enabledTools: {},
            isLoading: false,

            // Add a new MCP server
            addServer: async (url: string, name: string) => {
                if (!isValidMcpServerUrl(url)) {
                    throw new Error('Invalid MCP Server URL');
                }

                const newServer = createMcpServer(url, name);

                // Add to state
                set((state) => ({
                    servers: [...state.servers, newServer],
                    isLoading: true
                }));

                try {
                    // Attempt initial connection and tool discovery
                    await get().refreshTools(newServer.uuid);

                    return newServer;
                } catch (error) {
                    // Update status to error if connection fails
                    get().updateServerStatus(newServer.uuid, 'error', error instanceof Error ? error.message : 'Connection failed');
                    set({ isLoading: false });
                    throw error;
                }
            },

            // Remove a server and its tools
            removeServer: (uuid: string) => {
                set((state) => {
                    const { [uuid]: removedTools, ...remainingTools } = state.toolsByServer;

                    // Cleanup enabled/disabled state for removed tools
                    const updatedEnabledTools = { ...state.enabledTools };
                    Object.keys(state.enabledTools).forEach(key => {
                        if (key.startsWith(`mcp__${uuid}__`)) {
                            delete updatedEnabledTools[key];
                        }
                    });

                    return {
                        servers: state.servers.filter(s => s.uuid !== uuid),
                        toolsByServer: remainingTools,
                        enabledTools: updatedEnabledTools
                    };
                });
            },

            // Update server status
            updateServerStatus: (uuid: string, status: MCPServer['status'], errorMessage?: string) => {
                set((state) => ({
                    servers: state.servers.map(s =>
                        s.uuid === uuid
                            ? {
                                ...s,
                                status,
                                errorMessage,
                                lastConnected: status === 'connected' ? Date.now() : s.lastConnected
                            }
                            : s
                    ),
                    isLoading: false
                }));
            },

            // Enable/Disable a specific tool
            setToolEnabled: (fullName: string, enabled: boolean) => {
                set((state) => ({
                    enabledTools: {
                        ...state.enabledTools,
                        [fullName]: enabled
                    }
                }));
            },

            // Refresh tools for a server
            refreshTools: async (uuid: string) => {
                const server = get().servers.find(s => s.uuid === uuid);
                if (!server) throw new Error('Server not found');

                set({ isLoading: true });
                get().updateServerStatus(uuid, 'disconnected'); // connecting...

                try {
                    // Connect and fetch tools
                    await client.connect(server.url);
                    const tools = await client.listTools(server.url);

                    // Update state
                    get()._setTools(uuid, tools);
                    get().updateServerStatus(uuid, 'connected');

                    // Auto-enable new tools by default
                    set((state) => {
                        const newEnabledTools = { ...state.enabledTools };
                        tools.forEach(tool => {
                            const fullName = formatMcpToolName(uuid, tool.name);
                            if (newEnabledTools[fullName] === undefined) {
                                newEnabledTools[fullName] = true;
                            }
                        });
                        return { enabledTools: newEnabledTools };
                    });

                } catch (error) {
                    get().updateServerStatus(uuid, 'error', error instanceof Error ? error.message : 'Failed to refresh tools');
                } finally {
                    set({ isLoading: false });
                }
            },

            // Internal setter for tools
            _setTools: (uuid: string, tools: MCPTool[]) => {
                set((state) => ({
                    toolsByServer: {
                        ...state.toolsByServer,
                        [uuid]: tools
                    }
                }));
            },

            // Get all enabled tools flattened with metadata
            getAllEnabledTools: () => {
                const state = get();
                const result: MCPToolWithServer[] = [];

                state.servers.forEach(server => {
                    if (server.status !== 'connected') return;

                    const tools = state.toolsByServer[server.uuid] || [];
                    tools.forEach(tool => {
                        const fullName = formatMcpToolName(server.uuid, tool.name);
                        if (state.enabledTools[fullName]) {
                            result.push({
                                ...tool,
                                fullName,
                                serverUuid: server.uuid,
                                serverName: server.name
                            });
                        }
                    });
                });

                return result;
            }
        }),
        {
            name: 'mcp-storage',
            partialize: (state) => ({
                servers: state.servers,
                enabledTools: state.enabledTools
                // Don't persist toolsByServer to force refresh on reload? 
                // Or persist it for offline viewing? Let's not persist to ensure freshness for now.
            })
        }
    )
);
