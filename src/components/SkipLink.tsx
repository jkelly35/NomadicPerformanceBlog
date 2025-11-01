'use client';

import React, { useState, useEffect } from 'react';

export default function SkipLink() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show skip link when Tab is pressed for the first time
      if (e.key === 'Tab' && !isVisible) {
        setIsVisible(true);
      }
    };

    const handleClick = () => {
      setIsVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <a
      href="#main-content"
      className="skip-link"
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        background: '#1a3a2a',
        color: '#fff',
        padding: '8px 16px',
        textDecoration: 'none',
        borderRadius: '4px',
        fontWeight: 'bold',
        zIndex: 9999,
        transform: 'translateY(-100%)',
        transition: 'transform 0.2s ease',
      }}
      onFocus={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.transform = 'translateY(-100%)';
      }}
    >
      Skip to main content
    </a>
  );
}
