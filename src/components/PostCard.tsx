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
    <article className="post-card" style={{ background: '#f9f9f9', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', transition: 'transform 0.2s', cursor: 'pointer' }}>
      <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '0.5rem' }}>
            {post.title}
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
            {new Date(post.date).toLocaleDateString()}
          </p>
          <p style={{ fontSize: '1rem', color: '#333', lineHeight: '1.5' }}>
            {post.excerpt}
          </p>
        </div>
      </Link>
    </article>
  );
}
