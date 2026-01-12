import React from 'react'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-md mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">🚀 SidePilot</h1>
          <p className="text-muted-foreground">Your AI Co-Pilot in the Browser</p>
        </header>
        
        <main className="space-y-4">
          <div className="bg-card border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Welcome to SidePilot!</h2>
            <p className="text-sm text-muted-foreground">
              Extension scaffold is now running. Ready for LLM provider integration.
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-4">
            <h3 className="font-medium mb-2">Next Steps:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Configure LLM provider</li>
              <li>• Set up browser tools</li>
              <li>• Start automating!</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App