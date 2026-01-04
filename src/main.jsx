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

// Register Service Worker for offline support (production only)
const isProduction = window.location.hostname !== 'localhost' &&
  !window.location.hostname.includes('127.0.0.1');

if ('serviceWorker' in navigator && isProduction) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service Worker registered:', registration.scope);

        // Handle updates - when new SW is available
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available, refresh for updates
                  console.log('[App] New content available, refresh to update');
                }
              }
            };
          }
        };

        // Check for updates periodically (every 30 minutes)
        setInterval(() => {
          registration.update();
        }, 30 * 60 * 1000);
      })
      .catch((error) => {
        console.log('[App] Service Worker registration failed:', error);
      });
  });

  // Listen for messages from Service Worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.type === 'CACHE_COMPLETE') {
      console.log(`[App] Offline caching complete! ${event.data.cached} slides cached.`);
    }
  });
}

