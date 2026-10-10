'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register service worker after window loads for optimal initial paint performance
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[KisanSense PWA] Service worker registered successfully:', registration.scope);
          })
          .catch((error) => {
            console.warn('[KisanSense PWA] Service worker registration failed:', error);
          });
      });
    }
  }, []);

  return null;
}
