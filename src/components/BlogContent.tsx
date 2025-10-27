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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const searchParams = useSearchParams();

  // Initialize search term and selected tags from URL params
  useEffect(() => {
    const query = searchParams.get('q');
    const tagsParam = searchParams.get('tags');

    if (query) {
      setSearchTerm(query);
    } else {
      setSearchTerm('');
    }

    if (tagsParam) {
      const tags = tagsParam.split(',').filter(tag => tag.trim());
      setSelectedTags(tags);
    } else {
      setSelectedTags([]);
    }
  }, [searchParams]);

  // Filter posts based on search term and selected tags
  const filteredPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(term) ||
        post.excerpt.toLowerCase().includes(term) ||
        (post.tags && post.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(post =>
        post.tags && selectedTags.some(selectedTag =>
          post.tags!.some(postTag => postTag.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    return filtered;
  }, [posts, searchTerm, selectedTags]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    // This will trigger the useEffect to update URL params
  };

  const getFilterDescription = () => {
    if (searchTerm && selectedTags.length > 0) {
      return `Search results for &quot;${searchTerm}&quot; in ${selectedTags.join(', ')}`;
    } else if (searchTerm) {
      return `Search Results for &quot;${searchTerm}&quot;`;
    } else if (selectedTags.length > 0) {
      return `Articles tagged with: ${selectedTags.join(', ')}`;
    }
    return 'Latest Articles';
  };

  const hasActiveFilters = searchTerm || selectedTags.length > 0;

  return (
    <section style={{ padding: '4rem 5vw', background: '#fff', position: 'relative' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#1a3a2a', marginBottom: '1rem' }}>
            {getFilterDescription()}
          </h2>
          <p style={{ fontSize: '1.1rem', color: '#666' }}>
            {hasActiveFilters ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} found` : 'Stay updated with our newest content'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: '1rem',
                background: 'none',
                border: 'none',
                color: '#1a3a2a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '0.9rem'
              }}
            >
              Clear all filters
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
          {filteredPosts.map((p) => (
            <PostCard key={p.slug} post={p} />
          ))}
        </div>
        {filteredPosts.length === 0 && hasActiveFilters && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>
              No articles found {searchTerm && `for &quot;${searchTerm}&quot;`}
              {searchTerm && selectedTags.length > 0 && ' in '}
              {selectedTags.length > 0 && selectedTags.join(', ')}
            </p>
            <p>Try different keywords or <button
              onClick={clearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a3a2a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >clear your filters</button> to see all articles.</p>
          </div>
        )}
        {posts.length === 0 && !hasActiveFilters && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No posts yet</p>
            <p>Check back soon for new content!</p>
          </div>
        )}
      </div>
    </section>
  );
}
