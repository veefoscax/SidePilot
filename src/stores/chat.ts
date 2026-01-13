/**
 * SidePilot Chat Store
 * 
 * Zustand store for managing chat messages, streaming responses, and tool interactions.
 * Persists conversation history to Chrome storage.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Task 1: Define Message, ToolCall, ToolResult interfaces
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
}

interface ToolCall {
  id: string;
  name: string;
  input: object;
  status: 'pending' | 'executing' | 'complete' | 'error';
}

interface ToolResult {
  toolUseId: string;
  output?: string;
  error?: string;
  screenshot?: string;
}

interface ChatState {
  // Message history
  messages: Message[];
  
  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  
  // Error state
  error: string | null;
  
  // Actions
  addUserMessage: (content: string) => string;
  startStreaming: () => void;
  appendStreamContent: (chunk: string) => void;
  endStreaming: (fullContent: string, toolCalls?: ToolCall[]) => void;
  addToolResult: (toolUseId: string, result: ToolResult) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  retryLast: () => void;
}

/**
 * Chrome storage adapter for Zustand persistence
 */
const chromeStorage = createJSONStorage(() => ({
  getItem: async (name: string) => {
    try {
      const result = await chrome.storage.local.get(name);
      return result[name] ?? null;
    } catch (error) {
      console.error('Failed to get from Chrome storage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      await chrome.storage.local.set({ [name]: value });
    } catch (error) {
      console.error('Failed to set Chrome storage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      await chrome.storage.local.remove(name);
    } catch (error) {
      console.error('Failed to remove from Chrome storage:', error);
    }
  },
}));

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      isStreaming: false,
      streamingContent: '',
      error: null,
      
      // Task 2: Implement addUserMessage action
      addUserMessage: (content: string) => {
        const id = crypto.randomUUID();
        set(state => ({
          messages: [...state.messages, {
            id,
            role: 'user',
            content,
            timestamp: Date.now(),
          }],
          error: null, // Clear any previous errors
        }));
        return id;
      },
      
      // Task 3: Implement streaming actions (start, append, end)
      startStreaming: () => {
        set({ 
          isStreaming: true, 
          streamingContent: '',
          error: null 
        });
      },
      
      appendStreamContent: (chunk: string) => {
        set(state => ({
          streamingContent: state.streamingContent + chunk
        }));
      },
      
      endStreaming: (fullContent: string, toolCalls?: ToolCall[]) => {
        set(state => ({
          isStreaming: false,
          streamingContent: '',
          messages: [...state.messages, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullContent,
            toolCalls,
            timestamp: Date.now(),
          }],
        }));
      },
      
      // Task 4: Implement addToolResult action
      addToolResult: (toolUseId: string, result: ToolResult) => {
        set(state => ({
          messages: state.messages.map(message => {
            if (message.role === 'assistant' && message.toolCalls) {
              // Update tool call status
              const updatedToolCalls = message.toolCalls.map(tc => 
                tc.id === toolUseId 
                  ? { ...tc, status: result.error ? 'error' as const : 'complete' as const }
                  : tc
              );
              
              // Add or update tool result
              const existingResults = message.toolResults || [];
              const updatedResults = existingResults.some(r => r.toolUseId === toolUseId)
                ? existingResults.map(r => r.toolUseId === toolUseId ? result : r)
                : [...existingResults, result];
              
              return {
                ...message,
                toolCalls: updatedToolCalls,
                toolResults: updatedResults,
              };
            }
            return message;
          })
        }));
      },
      
      setError: (error: string | null) => {
        set({ error, isStreaming: false });
      },
      
      clearMessages: () => {
        set({ 
          messages: [], 
          isStreaming: false, 
          streamingContent: '', 
          error: null 
        });
      },
      
      retryLast: () => {
        const { messages } = get();
        if (messages.length === 0) return;
        
        // Remove the last assistant message if it exists
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.role === 'assistant') {
          set(state => ({
            messages: state.messages.slice(0, -1),
            error: null,
            isStreaming: false,
            streamingContent: '',
          }));
        }
      },
    }),
    {
      // Task 5: Add persistence with chrome.storage
      name: 'sidepilot-chat-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        messages: state.messages, // Only persist messages, not streaming state
      }),
    }
  )
);

// Export types for use in components
export type { Message, ToolCall, ToolResult };