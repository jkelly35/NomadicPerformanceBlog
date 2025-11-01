'use client';

import { useEffect } from 'react';

export default function WebVitals() {
  useEffect(() => {
    // Web Vitals tracking - simplified version
    const loadWebVitals = async () => {
      try {
        const webVitals = await import('web-vitals');
        // Use the modern web-vitals API
        if (webVitals.onCLS) webVitals.onCLS(console.log);
        if (webVitals.onFID) webVitals.onFID(console.log);
        if (webVitals.onFCP) webVitals.onFCP(console.log);
        if (webVitals.onLCP) webVitals.onLCP(console.log);
        if (webVitals.onTTFB) webVitals.onTTFB(console.log);
      } catch (error) {
        console.warn('Web Vitals tracking failed to load:', error);
      }
    };

    loadWebVitals();
  }, []);

  return null;
}
