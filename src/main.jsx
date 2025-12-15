import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { injectSpeedInsights } from '@vercel/speed-insights'
import './styles/global.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext'

// Initialize Vercel Speed Insights (client-side only)
injectSpeedInsights()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)
