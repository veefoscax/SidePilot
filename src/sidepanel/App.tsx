/**
 * SidePilot App - Main Entry Point
 * 
 * Uses page-based routing to organize functionality:
 * - ChatPage: Main chat interface with voice controls
 * - SettingsPage: LLM provider and voice configuration
 * - GeneralSettings: Theme and language settings
 */

import { useEffect, useState } from 'react';
import { initializeTheme } from '@/lib/theme';
import { useSettingsStore } from '@/stores/settings';
import { useShortcutsStore } from '@/stores/shortcuts';
import { notifications } from '@/lib/notifications';

// Pages
import { ChatPage } from './pages/Chat';
import { SettingsPage } from './pages/Settings';
import { GeneralSettings } from './pages/GeneralSettings';

// Global UI components
import { ConnectedPermissionDialog } from '@/components/PermissionDialog';
import { Toaster } from 'sonner';

type Page = 'chat' | 'settings' | 'general-settings';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('chat');

  const { loadShortcuts, initializeDefaults } = useShortcutsStore();

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize theme from settings store
        const settingsTheme = useSettingsStore.getState().theme;

        // Initialize theme detection for system theme changes
        const detectedTheme = await initializeTheme();

        // Initialize shortcuts store
        await loadShortcuts();
        await initializeDefaults();

        // Initialize notification manager
        await notifications.loadConfig();

        setIsLoading(false);

        // Notify service worker of the detected theme to update icons
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            type: 'THEME_CHANGED',
            payload: { theme: settingsTheme === 'system' ? detectedTheme : settingsTheme }
          }).catch(() => {
            // Ignore if service worker is not available
          });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    initializeApp();
  }, [loadShortcuts, initializeDefaults]);

  // Navigation handlers
  const navigateTo = (page: Page) => setCurrentPage(page);
  const navigateBack = () => setCurrentPage('chat');

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading SidePilot...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Page Routing */}
      {currentPage === 'chat' && (
        <ChatPage
          onBack={() => { }}
          onSettings={() => navigateTo('settings')}
        />
      )}

      {currentPage === 'settings' && (
        <SettingsPage
          onBack={navigateBack}
        />
      )}

      {currentPage === 'general-settings' && (
        <GeneralSettings />
      )}

      {/* Global Components */}
      <ConnectedPermissionDialog />
      <Toaster
        position="top-right"
        theme="system"
        richColors
        closeButton
      />
    </div>
  );
}

export default App;