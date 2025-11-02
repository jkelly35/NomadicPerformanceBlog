'use client';

import { useEffect, useState } from 'react';

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      setProgress(Math.min(100, Math.max(0, scrollPercent)));
    };

    const handleScroll = () => {
      requestAnimationFrame(updateProgress);
    };

    window.addEventListener('scroll', handleScroll);
    updateProgress(); // Initial calculation

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: `${progress}%`,
        height: '4px',
        background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 100%)',
        zIndex: 1000,
        transition: 'width 0.1s ease-out',
      }}
      aria-hidden="true"
    />
  );
}
