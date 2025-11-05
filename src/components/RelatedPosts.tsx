'use client';

import { useMemo } from 'react';
import Link from 'next/link';

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

interface RelatedPostsProps {
  currentPost: PostMeta;
  allPosts: PostMeta[];
  limit?: number;
}

export default function RelatedPosts({ currentPost, allPosts, limit = 3 }: RelatedPostsProps) {
  const relatedPosts = useMemo(() => {
    // Filter out current post and find posts with matching tags
    const otherPosts = allPosts.filter(post => post.slug !== currentPost.slug);

    // Score posts based on tag matches
    const scoredPosts = otherPosts.map(post => {
      const matchingTags = post.tags?.filter(tag =>
        currentPost.tags?.includes(tag)
      ) || [];

      return {
        ...post,
        score: matchingTags.length,
        matchCount: matchingTags.length
      };
    });

    // Sort by score (tag matches) and then by date
    scoredPosts.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return scoredPosts.slice(0, limit);
  }, [currentPost, allPosts, limit]);

  if (relatedPosts.length === 0) return null;

  return (
    <section style={{
      marginTop: '4rem',
      padding: '2rem 0',
      borderTop: '1px solid #e9ecef'
    }}>
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 700,
        color: '#1a3a2a',
        marginBottom: '1.5rem',
        textAlign: 'center'
      }}>
        Related Articles
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.5rem',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {relatedPosts.map((post) => (
          <article
            key={post.slug}
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '1.5rem',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
            }}
          >
            <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <h4 style={{
                fontSize: '1.1rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '0.75rem',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {post.title}
              </h4>

              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem',
                lineHeight: '1.5',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {post.excerpt}
              </p>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{
                  fontSize: '0.8rem',
                  color: '#999',
                  fontWeight: '500'
                }}>
                  {new Date(post.date || '').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>

                {post.matchCount > 0 && (
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#ff6b35',
                    fontWeight: '600',
                    background: 'rgba(255,107,53,0.1)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '12px'
                  }}>
                    {post.matchCount} matching topic{post.matchCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
