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
      padding: '4rem 5vw',
      background: '#f9f9f9',
      textAlign: 'center'
    }}>
      <h2 style={{
        fontSize: 'clamp(2rem, 5vw, 2.5rem)',
        fontWeight: 800,
        color: '#1a3a2a',
        marginBottom: '2rem'
      }}>
        Recent Posts
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {posts.slice(0, 3).map((post) => (
          <div key={post.slug} style={{
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
            transition: 'transform 0.2s'
          }}>
            <div style={{ padding: '1.5rem' }}>
              <h3 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '0.5rem',
                lineHeight: '1.3'
              }}>
                {post.title}
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                {new Date(post.date).toLocaleDateString()}
              </p>
              <p style={{
                fontSize: '1rem',
                color: '#333',
                marginBottom: '1.5rem',
                lineHeight: '1.5'
              }}>
                {post.excerpt}
              </p>
              <Link href={`/blog/${post.slug}`} style={{
                color: '#1a3a2a',
                fontWeight: 600,
                textDecoration: 'none'
              }}>
                Read More →
              </Link>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: '3rem' }}>
        <Link href="/blog" style={{
          display: 'inline-block',
          padding: '0.75rem 2rem',
          fontSize: 'clamp(1rem, 3vw, 1.25rem)',
          fontWeight: 700,
          color: '#fff',
          background: '#1a3a2a',
          borderRadius: '2rem',
          textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(33,77,54,0.10)',
          transition: 'background 0.2s'
        }}>
          View All Posts
        </Link>
      </div>
    </section>
  );
}
