'use client';

import { useEffect } from 'react';

export default function IconLoader() {
  useEffect(() => {
    // Ensure Bootstrap Icons stylesheet is loaded
    const ensureIconsLoaded = () => {
      const iconLink = document.querySelector('link[href*="bootstrap-icons"]');

      if (!iconLink) {
        console.log('[IconLoader] Bootstrap Icons not found, adding stylesheet');
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css';
        link.crossOrigin = 'anonymous';
        link.type = 'text/css';
        link.media = 'all';
        document.head.appendChild(link);
        console.log('[IconLoader] Bootstrap Icons stylesheet added');
      } else {
        console.log('[IconLoader] Bootstrap Icons stylesheet already exists');
      }
    };

    // Ensure icons are loaded immediately
    ensureIconsLoaded();

    // Also ensure it on next frame in case DOM hasn't fully loaded
    requestAnimationFrame(() => {
      ensureIconsLoaded();
    });

    // Re-check after a short delay
    const timeoutId = setTimeout(() => {
      ensureIconsLoaded();
    }, 100);

    // Re-check when page becomes visible (after minimize/restore)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[IconLoader] Page visible, ensuring icons loaded');
        ensureIconsLoaded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}