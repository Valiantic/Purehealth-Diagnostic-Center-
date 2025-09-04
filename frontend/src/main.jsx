import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Import debug utility in development
if (import.meta.env.DEV) {
  import('./utils/passkeyDebug.js').then(() => {
    console.log('🔐 Passkey debugging utilities loaded. Use window.passkeyDebug in console.');
  });
  
  // Also import readiness checker
  import('./utils/passkeyReadiness.js').then(() => {
    console.log('🔍 Passkey readiness checker loaded.');
  });
}

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      staleTime: 300000, // 5 minutes
      cacheTime: 600000, // 10 minutes
      retry: 1
    }
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)