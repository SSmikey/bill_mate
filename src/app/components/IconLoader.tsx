'use client';

import { useEffect, useState } from 'react';

export default function IconLoader() {
  const [iconsLoaded, setIconsLoaded] = useState(false);

  useEffect(() => {
    // Check if Bootstrap Icons CSS is already loaded
    const checkIconsLoaded = () => {
      const testElement = document.createElement('i');
      testElement.className = 'bi bi-house';
      testElement.style.display = 'none';
      document.body.appendChild(testElement);
      
      const styles = window.getComputedStyle(testElement);
      const isLoaded = styles.fontFamily.includes('bootstrap-icons');
      
      document.body.removeChild(testElement);
      return isLoaded;
    };

    // Load Bootstrap Icons if not already loaded
    if (!checkIconsLoaded()) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css';
      link.crossOrigin = 'anonymous';
      link.onload = () => setIconsLoaded(true);
      document.head.appendChild(link);
    } else {
      setIconsLoaded(true);
    }
  }, []);

  return null;
}