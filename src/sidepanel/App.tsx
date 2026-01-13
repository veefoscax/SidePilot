import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { HugeiconsIcon } from '@hugeicons/react';
import { Settings02Icon, MessageMultiple01Icon } from '@hugeicons/core-free-icons';
import { initializeTheme } from '@/lib/theme';
import { SettingsPage } from './pages/Settings';
import { Toaster } from 'sonner';

function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'home' | 'settings'>('home');

  useEffect(() => {
    // Initialize theme detection
    initializeTheme().then((detectedTheme) => {
      setTheme(detectedTheme);
      setIsLoading(false);
      
      // Notify service worker of the detected theme to update icons
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'THEME_CHANGED',
          payload: { theme: detectedTheme }
        }).catch(() => {
          // Ignore if service worker is not available
        });
      }
    });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground">Loading SidePilot...</div>
      </div>
    );
  }

  // Show Settings page
  if (currentPage === 'settings') {
    return <SettingsPage onBack={() => setCurrentPage('home')} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="top-center" richColors />
      <div className="max-w-md mx-auto p-6">
        <header className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">SidePilot</h1>
            <p className="text-muted-foreground text-sm">Your AI Co-Pilot in the Browser</p>
          </div>
          
          {/* Navigation */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="default"
              size="sm"
              onClick={() => setCurrentPage('settings')}
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={Settings02Icon} className="h-4 w-4" />
              Settings
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="flex items-center gap-2"
            >
              <HugeiconsIcon icon={MessageMultiple01Icon} className="h-4 w-4" />
              Chat (Soon)
            </Button>
          </div>
        </header>
        
        <main className="space-y-4">
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <h2 className="font-semibold">Extension Active</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              SidePilot scaffold is running successfully. Ready for LLM provider integration.
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4 shadow-sm">
            <h3 className="font-medium mb-3 text-primary">Next Steps</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span className="text-foreground">Configure LLM provider</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentPage('settings')}
                  className="ml-auto text-xs h-6"
                >
                  Open Settings
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span className="text-muted-foreground">Set up browser tools</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span className="text-muted-foreground">Start automating!</span>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-primary">🎨</span>
              <h3 className="font-medium text-primary">Chrome Theme Adaptive</h3>
            </div>
            <p className="text-xs text-primary/80 mb-2">
              Current theme: <span className="font-mono">{theme}</span> • Nova style with Chrome-matched colors
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-3 h-3 rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} border`}></div>
              <span>Follows Chrome's {theme} theme</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App