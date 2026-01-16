
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useMCPStore } from '../mcp';
import * as mcpLib from '@/lib/mcp';

// Mock dependencies
vi.mock('@/lib/mcp', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        createMcpServer: vi.fn((url, name) => ({
            uuid: 'test-uuid-123',
            name,
            url,
            status: 'disconnected'
        })),
        isValidMcpServerUrl: vi.fn().mockImplementation((url) => url.startsWith('http'))
    };
});

describe('MCP Store', () => {
    beforeEach(() => {
        // Reset store state before each test
        useMCPStore.setState({
            servers: [],
            toolsByServer: {},
            enabledTools: {},
            isLoading: false
        });
        vi.clearAllMocks();
    });

    describe('Server Management', () => {
        it('should add a valid server', async () => {
            const store = useMCPStore.getState();
            const url = 'http://localhost:3000';
            const name = 'Test Server';

            await store.addServer(url, name);

            const { servers } = useMCPStore.getState();
            expect(servers).toHaveLength(1);
            expect(servers[0].url).toBe(url);
            expect(servers[0].name).toBe(name);
            // Status might be disconnected or connected depending on mock fetch, 
            // but we care that it was added
        });

        it('should reject invalid URLs', async () => {
            const store = useMCPStore.getState();
            // Mock isValidMcpServerUrl to return false for this specific URL
            vi.mocked(mcpLib.isValidMcpServerUrl).mockReturnValueOnce(false);

            await expect(store.addServer('invalid-url', 'Test')).rejects.toThrow('Invalid MCP Server URL');

            const { servers } = useMCPStore.getState();
            expect(servers).toHaveLength(0);
        });

        it('should remove a server', async () => {
            const store = useMCPStore.getState();

            // Setup initial state
            useMCPStore.setState({
                servers: [{ uuid: 'uuid-1', name: 'S1', url: 'u1', status: 'connected' }],
                toolsByServer: { 'uuid-1': [] },
                enabledTools: { 'mcp__uuid-1__tool': true }
            });

            store.removeServer('uuid-1');

            const state = useMCPStore.getState();
            expect(state.servers).toHaveLength(0);
            expect(state.toolsByServer['uuid-1']).toBeUndefined();
            expect(state.enabledTools['mcp__uuid-1__tool']).toBeUndefined();
        });

        it('should update server status', () => {
            const store = useMCPStore.getState();
            useMCPStore.setState({
                servers: [{ uuid: 'uuid-1', name: 'S1', url: 'u1', status: 'disconnected' }]
            });

            store.updateServerStatus('uuid-1', 'connected');

            expect(useMCPStore.getState().servers[0].status).toBe('connected');
            expect(useMCPStore.getState().servers[0].lastConnected).toBeDefined();
        });
    });

    describe('Tool Management', () => {
        it('should toggle tool enabled state', () => {
            const store = useMCPStore.getState();
            const toolName = 'mcp__uuid-1__tool';

            store.setToolEnabled(toolName, true);
            expect(useMCPStore.getState().enabledTools[toolName]).toBe(true);

            store.setToolEnabled(toolName, false);
            expect(useMCPStore.getState().enabledTools[toolName]).toBe(false);
        });

        it('should set tools for a server (internal)', () => {
            const store = useMCPStore.getState();
            const tools = [{ name: 'tool1', description: 'desc', inputSchema: {} }];

            store._setTools('uuid-1', tools as any);

            expect(useMCPStore.getState().toolsByServer['uuid-1']).toEqual(tools);
        });
    });
});
