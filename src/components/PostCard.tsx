'use client';

import React from 'react';
import Link from 'next/link';

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
  return (
    <article
      className="post-card"
      style={{
        background: '#fff',
        borderRadius: 'clamp(12px, 3vw, 16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        border: '1px solid rgba(255,255,255,0.8)',
        position: 'relative'
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
            {new Date(post.date).toLocaleDateString('en-US', {
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
