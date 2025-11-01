"use client";

import React from "react";
import Link from "next/link";

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

interface RecentPostsProps {
  posts: PostMeta[];
}

export default function RecentPosts({ posts }: RecentPostsProps) {
  return (
    <section style={{
      padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem)',
      background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 50%, #f9f9f9 100%)',
      textAlign: 'center',
      position: 'relative'
    }}>
      {/* Background Pattern */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'url("data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%231a3a2a" fill-opacity="0.03"%3E%3Cpath d="M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10z"/%3E%3C/g%3E%3C/svg%3E")',
        opacity: 0.5
      }}></div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 800,
          color: '#1a3a2a',
          marginBottom: 'clamp(1rem, 3vw, 2rem)',
          textShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}>
          Recent Posts
        </h2>
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
          color: '#666',
          marginBottom: 'clamp(2rem, 5vw, 3rem)',
          maxWidth: '600px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: '1.6'
        }}>
          Discover expert insights, training tips, and stories from the world of outdoor performance
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(280px, 25vw, 350px), 1fr))',
          gap: 'clamp(1.5rem, 4vw, 2rem)',
          marginBottom: 'clamp(2rem, 5vw, 3rem)'
        }}>
          {posts.slice(0, 3).map((post) => (
            <article key={post.slug} style={{
              background: '#fff',
              borderRadius: 'clamp(12px, 3vw, 16px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.8)',
              position: 'relative'
            }}
            className="hover:transform hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
            >
              {/* Card Header with subtle gradient */}
              <div style={{
                height: 'clamp(4px, 1vw, 6px)',
                background: 'linear-gradient(90deg, #ff6b35 0%, #f7931e 50%, #4ecdc4 100%)'
              }}></div>

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
                  fontWeight: '600'
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
                  paddingRight: 'clamp(3rem, 8vw, 4rem)' // Make room for date badge
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

                <Link href={`/blog/${post.slug}`} style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
                  color: '#ff6b35',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                  transition: 'all 0.2s ease'
                }}
                className="hover:text-[#e55a2b] hover:gap-3"
                >
                  Read More
                  <span style={{
                    transition: 'transform 0.2s ease'
                  }}>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 'clamp(2rem, 5vw, 3rem)' }}>
          <Link href="/blog" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'clamp(0.5rem, 1.5vw, 0.75rem)',
            padding: 'clamp(0.875rem, 3vw, 1.125rem) clamp(1.5rem, 4vw, 2.5rem)',
            fontSize: 'clamp(1rem, 3vw, 1.25rem)',
            fontWeight: 700,
            color: '#fff',
            background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
            borderRadius: 'clamp(2rem, 6vw, 3rem)',
            textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(26,58,42,0.3)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            border: '2px solid transparent'
          }}
          className="hover:transform hover:-translate-y-1 hover:scale-105 hover:shadow-[0_8px_30px_rgba(26,58,42,0.4)]"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #2d5a3d 0%, #1a3a2a 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)';
          }}
          >
            View All Posts
            <span style={{
              transition: 'transform 0.2s ease'
            }}>📚</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
