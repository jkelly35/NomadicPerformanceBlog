'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

interface PostCardProps {
  post: PostMeta;
}

export default function PostCard({ post }: PostCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <article
      ref={cardRef}
      className="post-card"
      style={{
        background: '#fff',
        borderRadius: 'clamp(12px, 3vw, 16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.8)',
        position: 'relative',
        opacity: isVisible ? 1 : 0.7,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease, all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.12)';
      }}
    >
      {/* Card Header with subtle gradient */}
      <div style={{
        height: 'clamp(4px, 1vw, 6px)',
        background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 50%, #4ecdc4 100%)'
      }}></div>

      {/* Featured Image Area */}
      <div style={{
        height: 'clamp(120px, 20vw, 180px)',
        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {/* Placeholder content - can be replaced with actual images later */}
        <div style={{
          fontSize: 'clamp(2rem, 8vw, 3rem)',
          opacity: 0.3,
          color: '#6c757d'
        }}>
          📝
        </div>
        {/* Subtle pattern overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.5
        }}></div>
      </div>

      <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{
          padding: 'clamp(1.5rem, 4vw, 2rem)',
          position: 'relative'
        }}>
          {/* Date badge */}
          <div style={{
            position: 'absolute',
            top: 'clamp(1rem, 3vw, 1.5rem)',
            right: 'clamp(1rem, 3vw, 1.5rem)',
            background: '#1a3a2a',
            color: '#fff',
            padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
            fontWeight: '600',
            zIndex: 2
          }}>
            {new Date(post.date || '').toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric'
            })}
          </div>

          <h3 style={{
            fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
            fontWeight: 700,
            color: '#1a3a2a',
            marginBottom: 'clamp(0.75rem, 2vw, 1rem)',
            lineHeight: '1.3',
            paddingRight: 'clamp(3rem, 8vw, 4rem)', // Make room for date badge
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {post.title}
          </h3>

          <p style={{
            fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
            color: '#666',
            marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
            lineHeight: '1.6',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {post.excerpt}
          </p>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              marginBottom: 'clamp(1rem, 3vw, 1.5rem)'
            }}>
              {post.tags.slice(0, 2).map((tag) => (
                <span key={tag} style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: 'clamp(0.25rem, 1vw, 0.5rem) clamp(0.5rem, 1.5vw, 0.75rem)',
                  borderRadius: 'clamp(12px, 3vw, 16px)',
                  fontSize: 'clamp(0.7rem, 2vw, 0.8rem)',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Read More Link */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{
              color: '#ff6b35',
              fontWeight: 600,
              fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e55a2b';
              e.currentTarget.style.gap = 'clamp(0.75rem, 2vw, 1rem)';
              const arrow = e.currentTarget.querySelector('.arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(4px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#ff6b35';
              e.currentTarget.style.gap = 'clamp(0.5rem, 1.5vw, 0.75rem)';
              const arrow = e.currentTarget.querySelector('.arrow') as HTMLElement;
              if (arrow) arrow.style.transform = 'translateX(0)';
            }}
            >
              Read More
              <span className="arrow" style={{
                transition: 'transform 0.2s ease',
                display: 'inline-block'
              }}>→</span>
            </span>

            {/* Reading time estimate */}
            <span style={{
              fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
              color: '#999',
              fontWeight: '500'
            }}>
              {Math.ceil(post.excerpt.split(' ').length / 200)} min read
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
