'use client';

import { useLayoutEffect } from 'react';

export default function IconLoader() {
  // Use useLayoutEffect to run before paint
  useLayoutEffect(() => {
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
        document.head.insertBefore(link, document.head.firstChild);
        console.log('[IconLoader] Bootstrap Icons stylesheet added');
      } else {
        console.log('[IconLoader] Bootstrap Icons stylesheet already exists');
      }
    };

    // Ensure icons are loaded immediately
    ensureIconsLoaded();

    // Re-check when page becomes visible (after minimize/restore)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[IconLoader] Page visible, ensuring icons loaded');
        ensureIconsLoaded();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}