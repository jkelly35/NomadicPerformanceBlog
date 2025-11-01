// src/components/OptimizedImage.tsx
'use client';

import React from 'react';
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  sizes,
  fill = false,
  style = {},
  onLoad,
  onError,
}: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      quality={quality}
      placeholder={placeholder}
      blurDataURL={blurDataURL}
      sizes={sizes}
      className={className}
      style={style}
      onLoad={onLoad}
      onError={onError}
    />
  );
}

// Pre-configured components for common use cases
export const LogoImage = ({ className = '', ...props }: Omit<OptimizedImageProps, 'src' | 'alt' | 'width' | 'height'>) => (
  <OptimizedImage
    src="/images/NPLogo.png"
    alt="Nomadic Performance Logo"
    width={48}
    height={48}
    quality={90}
    {...props}
  />
);

export const HeroImage = ({ src, alt, className = '', ...props }: OptimizedImageProps) => (
  <OptimizedImage
    src={src}
    alt={alt}
    priority={true}
    quality={85}
    placeholder="blur"
    className={className}
    {...props}
  />
);

export const ContentImage = ({ src, alt, className = '', ...props }: OptimizedImageProps) => (
  <OptimizedImage
    src={src}
    alt={alt}
    quality={80}
    placeholder="blur"
    className={className}
    {...props}
  />
);
