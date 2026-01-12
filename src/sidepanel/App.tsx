function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-md mx-auto p-6">
        <header className="text-center mb-8">
          <div className="mb-4">
            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-lg flex items-center justify-center mb-3">
              <span className="text-2xl">🚀</span>
            </div>
            <h1 className="text-2xl font-bold text-primary mb-2">SidePilot</h1>
            <p className="text-muted-foreground text-sm">Your AI Co-Pilot in the Browser</p>
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
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                <span className="text-muted-foreground">Configure LLM provider</span>
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
              <span className="text-primary">✨</span>
              <h3 className="font-medium text-primary">Nova Theme Active</h3>
            </div>
            <p className="text-xs text-primary/80">
              Using shadcn/ui Nova style with Cyan theme and Figtree font
            </p>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App