'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import PostCard from './PostCard';
import { BlogCardSkeleton, GridSkeleton } from './SkeletonLoaders';

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

interface BlogContentProps {
  posts: PostMeta[];
  isLoading?: boolean;
}

export default function BlogContent({ posts, isLoading = false }: BlogContentProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Derive search term and selected tags from URL params
  const searchTerm = searchParams.get('q') || '';
  const selectedTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter((tag: string) => tag.trim()) : [];
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
        post.tags && selectedTags.some((selectedTag: string) =>
          post.tags!.some(postTag => postTag.toLowerCase() === selectedTag.toLowerCase())
        )
      );
    }

    return filtered;
  }, [posts, searchTerm, selectedTags]);

  const clearFilters = () => {
    router.push(pathname);
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

        {isLoading ? (
          <GridSkeleton count={6} SkeletonComponent={BlogCardSkeleton} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
            {filteredPosts.map((p: PostMeta) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && hasActiveFilters && (
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
        {!isLoading && posts.length === 0 && !hasActiveFilters && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#666' }}>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>No posts yet</p>
            <p>Check back soon for new content!</p>
          </div>
        )}
      </div>
    </section>
  );
}
