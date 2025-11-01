// src/components/BackgroundImage.tsx
'use client';

import React from 'react';
import Image from 'next/image';

interface BackgroundImageProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  style?: React.CSSProperties;
}

export default function BackgroundImage({
  src,
  alt,
  className = '',
  children,
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  style = {},
}: BackgroundImageProps) {
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={style}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        style={{
          objectFit: 'cover',
          objectPosition: 'center',
        }}
        sizes="100vw"
      />
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

// Hook for generating blur placeholder
export function useBlurPlaceholder(src: string) {
  // For now, return a simple blur placeholder
  // In a real implementation, you might want to generate blur data URLs
  return `data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z`;
}
