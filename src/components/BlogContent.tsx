'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import PostCard from './PostCard';

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

interface BlogContentProps {
  posts: PostMeta[];
}

export default function BlogContent({ posts }: BlogContentProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const searchParams = useSearchParams();

  // Initialize search term from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  // Filter posts based on search term
  const filteredPosts = useMemo(() => {
    if (!searchTerm.trim()) {
      return posts;
    }

    const term = searchTerm.toLowerCase().trim();
    return posts.filter(post =>
      post.title.toLowerCase().includes(term) ||
      post.excerpt.toLowerCase().includes(term) ||
      (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }, [posts, searchTerm]);

  return (
    <section style={{ padding: '4rem 5vw', background: '#fff', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
            {searchTerm ? `Search Results for &quot;${searchTerm}&quot;` : 'Latest Articles'}
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            {searchTerm ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} found` : 'Stay updated with our newest content'}
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {filteredPosts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
        {filteredPosts.length === 0 && searchTerm && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No articles found for &quot;{searchTerm}&quot;</p>
            <p>Try different keywords or <button
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a3a2a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >clear your search</button> to see all articles.</p>
          </div>
        )}
        {posts.length === 0 && !searchTerm && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No posts yet</p>
            <p>Check back soon for new content!</p>
          </div>
        )}
      </div>
    </section>
  );
}
