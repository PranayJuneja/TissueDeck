/**
 * Service Worker for Tissue Deck
 * Provides offline support with progressive caching of all slide images
 * 
 * Version: 7.3
 */

const CACHE_VERSION = 'v7.3';
const CACHE_NAME = `tissue-deck-${CACHE_VERSION}`;

// Core app files to cache immediately on install
const CORE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.png'
];

// Paths that should NEVER be cached (API calls, external resources)
const NEVER_CACHE = [
    '/api/',           // Chat API
    'firestore',       // Firebase
    'firebase',        // Firebase Auth
    'googleapis.com',  // Google APIs
    'google-analytics',// Analytics
    'gtag',            // Google Tag
    'googletagmanager' // Tag Manager
];

// Check if a URL should never be cached
function shouldNeverCache(url) {
    return NEVER_CACHE.some(pattern => url.includes(pattern));
}

// Install event - cache core assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => {
                // Skip waiting to activate immediately
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache core assets:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name.startsWith('tissue-deck-') && name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        }).then(() => {
            // Start progressive caching of slides after a delay
            setTimeout(() => startProgressiveCaching(), 3000);
        })
    );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Never cache certain URLs (APIs, external resources)
    if (shouldNeverCache(event.request.url)) {
        return;
    }

    // Skip cross-origin requests (except for fonts which we want to cache)
    if (url.origin !== location.origin && !event.request.url.includes('fonts.gstatic.com')) {
        return;
    }

    // For slide images - cache first, then network
    if (url.pathname.startsWith('/slides/')) {
        event.respondWith(handleSlideRequest(event.request));
        return;
    }

    // For navigation requests (SPA) - serve index.html
    if (event.request.mode === 'navigate') {
        event.respondWith(handleNavigationRequest(event.request));
        return;
    }

    // For other assets - stale-while-revalidate
    event.respondWith(handleAssetRequest(event.request));
});

// Handle slide image requests - cache first
async function handleSlideRequest(request) {
    const cache = await caches.open(CACHE_NAME);

    // Try cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    // Fallback to network and cache for future
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            // Clone before caching
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Slide fetch failed:', request.url);
        // Return a placeholder or error response
        return new Response('Slide not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Handle navigation requests - serve cached index.html for SPA
async function handleNavigationRequest(request) {
    try {
        // Try network first for navigation
        const networkResponse = await fetch(request);
        return networkResponse;
    } catch (error) {
        // Fallback to cached index.html for offline SPA support
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match('/index.html');
        if (cachedResponse) {
            return cachedResponse;
        }
        return new Response('App not available offline', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

// Handle other assets - stale-while-revalidate
async function handleAssetRequest(request) {
    const cache = await caches.open(CACHE_NAME);

    // Return cached version immediately if available
    const cachedResponse = await cache.match(request);

    // Fetch fresh version in background
    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => null);

    // Return cached if available, otherwise wait for network
    return cachedResponse || fetchPromise || new Response('Not available', { status: 503 });
}

// Progressive caching - fetch all slides in background
async function startProgressiveCaching() {
    console.log('[SW] Starting progressive caching of slides...');

    try {
        // Fetch the slide manifest
        const response = await fetch('/slide-manifest.json');
        if (!response.ok) {
            console.log('[SW] No slide manifest found, skipping progressive caching');
            return;
        }

        const slides = await response.json();
        const cache = await caches.open(CACHE_NAME);

        let cached = 0;
        let skipped = 0;
        let failed = 0;

        for (const slidePath of slides) {
            // Encode the path for URLs with special characters/spaces
            const encodedPath = encodeURI(slidePath);

            // Check if already cached
            const existing = await cache.match(encodedPath);
            if (existing) {
                skipped++;
                continue;
            }

            try {
                const slideResponse = await fetch(encodedPath);
                if (slideResponse.ok) {
                    await cache.put(encodedPath, slideResponse);
                    cached++;

                    // Log progress every 25 slides
                    if (cached % 25 === 0) {
                        console.log(`[SW] Cached ${cached} slides...`);
                    }
                } else {
                    failed++;
                }

                // Small delay between fetches (150ms) to not overwhelm network
                await new Promise(resolve => setTimeout(resolve, 150));

            } catch (err) {
                failed++;
                // Continue with next slide instead of stopping
            }
        }

        console.log(`[SW] Progressive caching complete!`);
        console.log(`[SW]   Cached: ${cached}, Skipped: ${skipped}, Failed: ${failed}`);

        // Notify clients that caching is complete
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({
                    type: 'CACHE_COMPLETE',
                    cached,
                    skipped,
                    failed,
                    total: slides.length
                });
            });
        });

    } catch (error) {
        console.error('[SW] Progressive caching error:', error);
    }
}

// Listen for messages from the app
self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data === 'START_CACHING') {
        startProgressiveCaching();
    }

    if (event.data === 'GET_CACHE_STATUS') {
        getCacheStatus().then((status) => {
            event.ports[0].postMessage(status);
        });
    }
});

// Get cache status for the app
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        const slideCount = keys.filter(req => req.url.includes('/slides/')).length;

        // Estimate storage usage
        let estimatedSize = 0;
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            estimatedSize = estimate.usage || 0;
        }

        return {
            totalCached: keys.length,
            slidesCached: slideCount,
            cacheVersion: CACHE_VERSION,
            estimatedSizeMB: Math.round(estimatedSize / 1024 / 1024)
        };
    } catch (error) {
        return { error: error.message };
    }
}
