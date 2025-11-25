'use client';

import { useLayoutEffect } from 'react';

export default function IconLoader() {
  // Use useLayoutEffect to run before paint
  useLayoutEffect(() => {
    // Mark icons as loaded since we're using local files
    document.body.classList.add('icons-loaded');
  }, []);

  return null;
}