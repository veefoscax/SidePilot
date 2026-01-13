/**
 * Browser-Use Native Host Client
 * 
 * Communicates with local browser-use Python installation via Chrome Native Messaging
 * to provide full browser automation capabilities with file system access.
 */

export interface NativeHostConfig {
  hostName: string;
  pythonPath?: string;
  browserUsePath?: string;
  autoInstall?: boolean;
}

export interface NativeHostMessage {
  type: 'execute' | 'install' | 'status' | 'ping';
  data?: any;
  id?: string;
}

export interface NativeHostResponse {
  success: boolean;
  data?: any;
  error?: string;
  id?: string;
}

export interface PythonEnvironment {
  pythonPath: string;
  version: string;
  hasBrowserUse: boolean;
  browserUseVersion?: string;
}

/**
 * Native host client for browser-use Python integration
 */
export class NativeHostClient {
  private config: NativeHostConfig;
  private port: chrome.runtime.Port | null = null;
  private messageHandlers = new Map<string, (response: NativeHostResponse) => void>();
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error' = 'disconnected';

  constructor(config: NativeHostConfig) {
    this.config = {
      hostName: 'com.sidepilot.browseruse',
      ...config
    };
  }

  /**
   * Connect to native host
   */
  async connect(): Promise<boolean> {
    if (this.port && this.connectionStatus === 'connected') {
      return true;
    }

    try {
      this.connectionStatus = 'connecting';
      
      this.port = chrome.runtime.connectNative(this.config.hostName);
      
      this.port.onMessage.addListener((message: NativeHostResponse) => {
        this.handleMessage(message);
      });

      this.port.onDisconnect.addListener(() => {
        console.log('Native host disconnected:', chrome.runtime.lastError?.message);
        this.connectionStatus = 'disconnected';
        this.port = null;
      });

      // Test connection with ping
      const pingResponse = await this.sendMessage({ type: 'ping' });
      
      if (pingResponse.success) {
        this.connectionStatus = 'connected';
        return true;
      } else {
        this.connectionStatus = 'error';
        return false;
      }

    } catch (error) {
      console.error('Failed to connect to native host:', error);
      this.connectionStatus = 'error';
      return false;
    }
  }

  /**
   * Disconnect from native host
   */
  disconnect(): void {
    if (this.port) {
      this.port.disconnect();
      this.port = null;
    }
    this.connectionStatus = 'disconnected';
    this.messageHandlers.clear();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionStatus === 'connected' && this.port !== null;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): string {
    return this.connectionStatus;
  }

  /**
   * Send message to native host
   */
  private async sendMessage(message: NativeHostMessage): Promise<NativeHostResponse> {
    if (!this.port) {
      throw new Error('Not connected to native host');
    }

    return new Promise((resolve, reject) => {
      const messageId = `msg_${Date.now()}_${Math.random()}`;
      message.id = messageId;

      // Set up response handler
      this.messageHandlers.set(messageId, (response) => {
        this.messageHandlers.delete(messageId);
        resolve(response);
      });

      // Send message
      try {
        this.port!.postMessage(message);
      } catch (error) {
        this.messageHandlers.delete(messageId);
        reject(error);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.messageHandlers.has(messageId)) {
          this.messageHandlers.delete(messageId);
          reject(new Error('Native host message timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: NativeHostResponse): void {
    if (message.id && this.messageHandlers.has(message.id)) {
      const handler = this.messageHandlers.get(message.id)!;
      handler(message);
    }
  }

  /**
   * Check Python environment status
   */
  async checkPythonEnvironment(): Promise<PythonEnvironment | null> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      const response = await this.sendMessage({
        type: 'status',
        data: { check: 'python' }
      });

      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to check Python environment:', error);
      return null;
    }
  }

  /**
   * Install browser-use via pip
   */
  async installBrowserUse(): Promise<boolean> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      const response = await this.sendMessage({
        type: 'install',
        data: { 
          package: 'browser-use',
          pythonPath: this.config.pythonPath 
        }
      });

      return response.success;
    } catch (error) {
      console.error('Failed to install browser-use:', error);
      return false;
    }
  }

  /**
   * Execute browser automation task
   */
  async executeTask(task: any): Promise<any> {
    try {
      if (!this.isConnected()) {
        await this.connect();
      }

      const response = await this.sendMessage({
        type: 'execute',
        data: task
      });

      if (!response.success) {
        throw new Error(response.error || 'Task execution failed');
      }

      return response.data;
    } catch (error) {
      console.error('Failed to execute native task:', error);
      throw error;
    }
  }

  /**
   * Get browser-use version
   */
  async getBrowserUseVersion(): Promise<string | null> {
    try {
      const env = await this.checkPythonEnvironment();
      return env?.browserUseVersion || null;
    } catch (error) {
      console.error('Failed to get browser-use version:', error);
      return null;
    }
  }

  /**
   * Test native host connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      const connected = await this.connect();
      
      if (!connected) {
        return {
          success: false,
          error: 'Failed to connect to native host'
        };
      }

      const env = await this.checkPythonEnvironment();
      
      if (!env) {
        return {
          success: false,
          error: 'Failed to check Python environment'
        };
      }

      if (!env.hasBrowserUse) {
        return {
          success: false,
          error: 'browser-use not installed',
          details: env
        };
      }

      return {
        success: true,
        details: env
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate native messaging host manifest
   */
  static generateManifest(config: {
    hostName: string;
    description: string;
    path: string;
    allowedOrigins: string[];
  }): any {
    return {
      name: config.hostName,
      description: config.description,
      path: config.path,
      type: 'stdio',
      allowed_origins: config.allowedOrigins
    };
  }

  /**
   * Get manifest installation paths for different platforms
   */
  static getManifestPaths(): { [platform: string]: string } {
    return {
      windows: '%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\',
      macos: '~/Library/Application Support/Google/Chrome/NativeMessagingHosts/',
      linux: '~/.config/google-chrome/NativeMessagingHosts/'
    };
  }

  /**
   * Create installation script for native host
   */
  static createInstallScript(platform: 'windows' | 'macos' | 'linux'): string {
    const hostName = 'com.sidepilot.browseruse';
    const manifestPaths = NativeHostClient.getManifestPaths();
    
    switch (platform) {
      case 'windows':
        return `
@echo off
echo Installing SidePilot Native Host...

REM Install browser-use
pip install browser-use

REM Create manifest directory
mkdir "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\" 2>nul

REM Create manifest file
echo {> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   "name": "${hostName}",>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   "description": "SidePilot Browser-Use Native Host",>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   "path": "sidepilot-native-host.exe",>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   "type": "stdio",>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   "allowed_origins": [>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo     "chrome-extension://YOUR_EXTENSION_ID/">> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo   ]>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"
echo }>> "%APPDATA%\\..\\Local\\Google\\Chrome\\User Data\\NativeMessagingHosts\\${hostName}.json"

echo Installation complete!
pause
        `;

      case 'macos':
        return `
#!/bin/bash
echo "Installing SidePilot Native Host..."

# Install browser-use
pip3 install browser-use

# Create manifest directory
mkdir -p ~/Library/Application\\ Support/Google/Chrome/NativeMessagingHosts/

# Create manifest file
cat > ~/Library/Application\\ Support/Google/Chrome/NativeMessagingHosts/${hostName}.json << EOF
{
  "name": "${hostName}",
  "description": "SidePilot Browser-Use Native Host",
  "path": "/usr/local/bin/sidepilot-native-host",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
EOF

echo "Installation complete!"
        `;

      case 'linux':
        return `
#!/bin/bash
echo "Installing SidePilot Native Host..."

# Install browser-use
pip3 install browser-use

# Create manifest directory
mkdir -p ~/.config/google-chrome/NativeMessagingHosts/

# Create manifest file
cat > ~/.config/google-chrome/NativeMessagingHosts/${hostName}.json << EOF
{
  "name": "${hostName}",
  "description": "SidePilot Browser-Use Native Host",
  "path": "/usr/local/bin/sidepilot-native-host",
  "type": "stdio",
  "allowed_origins": [
    "chrome-extension://YOUR_EXTENSION_ID/"
  ]
}
EOF

echo "Installation complete!"
        `;

      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}