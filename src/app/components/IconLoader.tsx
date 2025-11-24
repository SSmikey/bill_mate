'use client';

import { useEffect } from 'react';

export default function IconLoader() {
  useEffect(() => {
    // Bootstrap Icons should be loaded from layout.tsx head tag
    // This component is a safety fallback to ensure the CSS is available
    const ensureIconsLoaded = () => {
      // Check if stylesheet exists
      const iconLink = document.querySelector('link[href*="bootstrap-icons"]');
      if (!iconLink) {
        // If not found, add it
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css';
        link.crossOrigin = 'anonymous';
        link.type = 'text/css';
        document.head.appendChild(link);
      }
    };

    // Run on mount and also on visibility change (page becomes visible after refresh)
    ensureIconsLoaded();

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        ensureIconsLoaded();
      }
    });

    return () => {
      document.removeEventListener('visibilitychange', () => {});
    };
  }, []);

  return null;
}