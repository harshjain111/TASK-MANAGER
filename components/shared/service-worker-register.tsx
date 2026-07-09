'use client';

import { useEffect } from 'react';

/** Registers the offline-fallback service worker (P35). Renders nothing. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Non-fatal — the app works fully online without it.
      });
    }
  }, []);

  return null;
}
