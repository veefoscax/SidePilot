type MessageHandler = (message: any, sender: chrome.runtime.MessageSender) => Promise<any>;

const handlers = new Map<string, MessageHandler>();

export function registerHandler(type: string, handler: MessageHandler) {
  handlers.set(type, handler);
}

export function sendMessage<T>(type: string, payload?: any): Promise<T> {
  return chrome.runtime.sendMessage({ type, payload });
}

// Initialize message listener for service worker
export function initializeMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers.get(message.type);
    if (handler) {
      handler(message.payload, sender).then(sendResponse);
      return true; // Keep channel open for async response
    }
  });
}