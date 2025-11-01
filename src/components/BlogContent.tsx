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
    <section style={{
      padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem)',
      background: '#fff',
      position: 'relative'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: 'clamp(2rem, 5vw, 3rem)'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: 700,
            color: '#1a3a2a',
            marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
            textShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}>
            {getFilterDescription()}
          </h2>
          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#666',
            marginBottom: hasActiveFilters ? 'clamp(0.5rem, 2vw, 1rem)' : '0'
          }}>
            {hasActiveFilters ? `${filteredPosts.length} article${filteredPosts.length !== 1 ? 's' : ''} found` : 'Stay updated with our newest content'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                marginTop: 'clamp(0.5rem, 2vw, 1rem)',
                background: 'none',
                border: 'none',
                color: '#1a3a2a',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                fontWeight: '500',
                padding: 'clamp(0.5rem, 2vw, 1rem)',
                borderRadius: 'clamp(6px, 2vw, 8px)',
                transition: 'all 0.2s ease',
                minHeight: '44px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(26,58,42,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              Clear all filters ✕
            </button>
          )}
        </div>

        {isLoading ? (
          <GridSkeleton count={6} SkeletonComponent={BlogCardSkeleton} />
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 30vw, 380px), 1fr))',
            gap: 'clamp(1.5rem, 4vw, 2rem)',
            alignItems: 'start'
          }}>
            {filteredPosts.map((p: PostMeta) => (
              <PostCard key={p.slug} post={p} />
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && hasActiveFilters && (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem)',
            color: '#666',
            background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            margin: 'clamp(2rem, 5vw, 3rem) 0'
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 8vw, 4rem)',
              marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
              opacity: 0.5
            }}>🔍</div>
            <p style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              fontWeight: '600'
            }}>
              No articles found {searchTerm && `for "${searchTerm}"`}
              {searchTerm && selectedTags.length > 0 && ' in '}
              {selectedTags.length > 0 && selectedTags.join(', ')}
            </p>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.1rem)',
              marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
            }}>
              Try different keywords or <button
                onClick={clearFilters}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1a3a2a',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: 'inherit',
                  fontWeight: '600',
                  padding: '0.25rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(26,58,42,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'none';
                }}
              >clear your filters</button> to see all articles.
            </p>
          </div>
        )}
        {!isLoading && posts.length === 0 && !hasActiveFilters && (
          <div style={{
            textAlign: 'center',
            padding: 'clamp(3rem, 8vw, 5rem) clamp(1rem, 5vw, 2rem)',
            color: '#666',
            background: 'linear-gradient(135deg, #f9f9f9 0%, #e8f4f8 100%)',
            borderRadius: 'clamp(12px, 3vw, 16px)',
            margin: 'clamp(2rem, 5vw, 3rem) 0'
          }}>
            <div style={{
              fontSize: 'clamp(3rem, 8vw, 4rem)',
              marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
              opacity: 0.5
            }}>📝</div>
            <p style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              marginBottom: 'clamp(0.5rem, 2vw, 1rem)',
              fontWeight: '600'
            }}>No posts yet</p>
            <p style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.1rem)'
            }}>Check back soon for new content!</p>
          </div>
        )}
      </div>
    </section>
  );
}
