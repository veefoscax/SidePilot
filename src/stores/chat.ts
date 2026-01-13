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
  reasoning?: string; // For models that provide reasoning/thinking
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: number;
  isReverted?: boolean; // For revert functionality
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

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  model?: string;
  provider?: string;
}

interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  initialMessages: Omit<Message, 'id' | 'timestamp'>[];
  tags?: string[];
}

interface ChatState {
  // Current conversation
  messages: Message[];
  currentConversationId: string | null;
  
  // Streaming state
  isStreaming: boolean;
  streamingContent: string;
  streamingReasoning: string; // For reasoning/thinking content
  
  // Message queue for handling multiple requests
  messageQueue: string[];
  
  // Error state
  error: string | null;
  
  // Conversation management
  savedConversations: Conversation[];
  conversationTemplates: ConversationTemplate[];
  
  // Actions
  addUserMessage: (content: string) => string;
  queueMessage: (content: string) => void; // Queue message while streaming
  startStreaming: () => void;
  appendStreamContent: (chunk: string) => void;
  appendStreamReasoning: (chunk: string) => void; // For reasoning content
  endStreaming: (fullContent: string, toolCalls?: ToolCall[], reasoning?: string) => void;
  cancelStreaming: () => void; // Cancel current response
  revertLastMessage: () => void; // Revert last assistant message
  processNextQueuedMessage: () => string | null; // Process next queued message
  addToolResult: (toolUseId: string, result: ToolResult) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
  retryLast: () => void;
  
  // Conversation management actions
  saveConversation: (title?: string) => string;
  loadConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  updateConversationTitle: (conversationId: string, title: string) => void;
  exportConversation: (conversationId: string) => string;
  importConversation: (data: string) => void;
  
  // Template management
  saveAsTemplate: (name: string, description: string) => void;
  loadTemplate: (templateId: string) => void;
  deleteTemplate: (templateId: string) => void;
  
  // Utility actions
  generateConversationTitle: () => string;
  searchConversations: (query: string) => Conversation[];
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
      currentConversationId: null,
      isStreaming: false,
      streamingContent: '',
      streamingReasoning: '',
      messageQueue: [],
      error: null,
      savedConversations: [],
      conversationTemplates: [
        // Default templates
        {
          id: 'web-automation',
          name: 'Web Automation',
          description: 'Template for browser automation tasks',
          initialMessages: [
            {
              role: 'user',
              content: 'Help me automate a web task. I need you to navigate to a website and perform some actions.',
            }
          ],
          tags: ['automation', 'browser']
        },
        {
          id: 'data-extraction',
          name: 'Data Extraction',
          description: 'Template for extracting data from web pages',
          initialMessages: [
            {
              role: 'user',
              content: 'I need to extract data from a website. Please help me scrape the information I need.',
            }
          ],
          tags: ['scraping', 'data']
        },
        {
          id: 'testing',
          name: 'Website Testing',
          description: 'Template for testing website functionality',
          initialMessages: [
            {
              role: 'user',
              content: 'Help me test a website by checking various elements and functionality.',
            }
          ],
          tags: ['testing', 'qa']
        }
      ],
      
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

      // Queue message while streaming
      queueMessage: (content: string) => {
        set(state => ({
          messageQueue: [...state.messageQueue, content]
        }));
      },

      // Process next queued message
      processNextQueuedMessage: () => {
        const state = get();
        if (state.messageQueue.length > 0) {
          const [nextMessage, ...remainingQueue] = state.messageQueue;
          set({ messageQueue: remainingQueue });
          return nextMessage;
        }
        return null;
      },
      
      // Task 3: Implement streaming actions (start, append, end)
      startStreaming: () => {
        set({ 
          isStreaming: true, 
          streamingContent: '',
          streamingReasoning: '',
          error: null 
        });
      },
      
      appendStreamContent: (chunk: string) => {
        set(state => ({
          streamingContent: state.streamingContent + chunk
        }));
      },

      appendStreamReasoning: (chunk: string) => {
        set(state => ({
          streamingReasoning: state.streamingReasoning + chunk
        }));
      },
      
      endStreaming: (fullContent: string, toolCalls?: ToolCall[], reasoning?: string) => {
        set(state => ({
          isStreaming: false,
          streamingContent: '',
          streamingReasoning: '',
          messages: [...state.messages, {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: fullContent || 'No response received',
            reasoning,
            toolCalls,
            timestamp: Date.now(),
          }],
        }));
      },

      cancelStreaming: () => {
        set({
          isStreaming: false,
          streamingContent: '',
          streamingReasoning: '',
          error: null,
        });
      },

      revertLastMessage: () => {
        set(state => {
          const messages = [...state.messages];
          if (messages.length > 0 && messages[messages.length - 1].role === 'assistant') {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              isReverted: true,
            };
          }
          return { messages };
        });
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
          streamingReasoning: '',
          messageQueue: [],
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
            streamingReasoning: '',
          }));
        }
      },
      
      // Conversation management actions
      saveConversation: (title?: string) => {
        const { messages, currentConversationId, savedConversations } = get();
        if (messages.length === 0) return '';
        
        const conversationTitle = title || get().generateConversationTitle();
        const now = Date.now();
        
        if (currentConversationId) {
          // Update existing conversation
          set(state => ({
            savedConversations: state.savedConversations.map(conv =>
              conv.id === currentConversationId
                ? { ...conv, messages, title: conversationTitle, updatedAt: now }
                : conv
            )
          }));
          return currentConversationId;
        } else {
          // Create new conversation
          const newConversation: Conversation = {
            id: crypto.randomUUID(),
            title: conversationTitle,
            messages: [...messages],
            createdAt: now,
            updatedAt: now,
          };
          
          set(state => ({
            savedConversations: [...state.savedConversations, newConversation],
            currentConversationId: newConversation.id,
          }));
          
          return newConversation.id;
        }
      },
      
      loadConversation: (conversationId: string) => {
        const { savedConversations } = get();
        const conversation = savedConversations.find(c => c.id === conversationId);
        
        if (conversation) {
          set({
            messages: [...conversation.messages],
            currentConversationId: conversationId,
            isStreaming: false,
            streamingContent: '',
            error: null,
          });
        }
      },
      
      deleteConversation: (conversationId: string) => {
        set(state => ({
          savedConversations: state.savedConversations.filter(c => c.id !== conversationId),
          currentConversationId: state.currentConversationId === conversationId ? null : state.currentConversationId,
        }));
      },
      
      updateConversationTitle: (conversationId: string, title: string) => {
        set(state => ({
          savedConversations: state.savedConversations.map(conv =>
            conv.id === conversationId
              ? { ...conv, title, updatedAt: Date.now() }
              : conv
          )
        }));
      },
      
      exportConversation: (conversationId: string) => {
        const { savedConversations } = get();
        const conversation = savedConversations.find(c => c.id === conversationId);
        
        if (conversation) {
          return JSON.stringify({
            version: '1.0',
            type: 'sidepilot-conversation',
            data: conversation,
            exportedAt: Date.now(),
          }, null, 2);
        }
        
        return '';
      },
      
      importConversation: (data: string) => {
        try {
          const parsed = JSON.parse(data);
          
          if (parsed.type === 'sidepilot-conversation' && parsed.data) {
            const conversation: Conversation = {
              ...parsed.data,
              id: crypto.randomUUID(), // Generate new ID to avoid conflicts
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };
            
            set(state => ({
              savedConversations: [...state.savedConversations, conversation],
            }));
          }
        } catch (error) {
          console.error('Failed to import conversation:', error);
          set({ error: 'Failed to import conversation. Invalid format.' });
        }
      },
      
      // Template management
      saveAsTemplate: (name: string, description: string) => {
        const { messages } = get();
        if (messages.length === 0) return;
        
        const template: ConversationTemplate = {
          id: crypto.randomUUID(),
          name,
          description,
          initialMessages: messages.map(({ id, timestamp, ...msg }) => msg),
          tags: [],
        };
        
        set(state => ({
          conversationTemplates: [...state.conversationTemplates, template],
        }));
      },
      
      loadTemplate: (templateId: string) => {
        const { conversationTemplates } = get();
        const template = conversationTemplates.find(t => t.id === templateId);
        
        if (template) {
          const messages: Message[] = template.initialMessages.map(msg => ({
            ...msg,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
          }));
          
          set({
            messages,
            currentConversationId: null,
            isStreaming: false,
            streamingContent: '',
            error: null,
          });
        }
      },
      
      deleteTemplate: (templateId: string) => {
        set(state => ({
          conversationTemplates: state.conversationTemplates.filter(t => t.id !== templateId),
        }));
      },
      
      // Utility actions
      generateConversationTitle: () => {
        const { messages } = get();
        if (messages.length === 0) return 'New Conversation';
        
        const firstUserMessage = messages.find(m => m.role === 'user');
        if (firstUserMessage) {
          // Extract first few words from the first user message
          const words = firstUserMessage.content.split(' ').slice(0, 6);
          return words.join(' ') + (firstUserMessage.content.split(' ').length > 6 ? '...' : '');
        }
        
        return `Conversation ${new Date().toLocaleDateString()}`;
      },
      
      searchConversations: (query: string) => {
        const { savedConversations } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return savedConversations.filter(conversation =>
          conversation.title.toLowerCase().includes(lowercaseQuery) ||
          conversation.messages.some(message =>
            message.content.toLowerCase().includes(lowercaseQuery)
          ) ||
          conversation.tags?.some(tag =>
            tag.toLowerCase().includes(lowercaseQuery)
          )
        );
      },
    }),
    {
      // Task 5: Add persistence with chrome.storage
      name: 'sidepilot-chat-storage',
      storage: chromeStorage,
      partialize: (state) => ({
        messages: state.messages,
        currentConversationId: state.currentConversationId,
        savedConversations: state.savedConversations,
        conversationTemplates: state.conversationTemplates,
      }),
    }
  )
);

// Export types for use in components
export type { Message, ToolCall, ToolResult, Conversation, ConversationTemplate };