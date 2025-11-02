'use client';

import React, { useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface TagFilterProps {
  posts: PostMeta[];
}

type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
};

export default function TagFilter({ posts }: TagFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Extract all unique tags from posts
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  // Derive selected tags from URL params
  const selectedTags = useMemo(() => {
    const tagsParam = searchParams.get('tags');
    return tagsParam ? tagsParam.split(',').filter((tag: string) => tag.trim()) : [];
  }, [searchParams]);

  const handleTagClick = (tag: string) => {
    let newSelectedTags: string[];

    if (selectedTags.includes(tag)) {
      // Remove tag if already selected
      newSelectedTags = selectedTags.filter((t: string) => t !== tag);
    } else {
      // Add tag if not selected
      newSelectedTags = [...selectedTags, tag];
    }

    updateURL(newSelectedTags);
  };

  const clearAllTags = () => {
    updateURL([]);
  };

  const updateURL = (tags: string[]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (tags.length > 0) {
      params.set('tags', tags.join(','));
    } else {
      params.delete('tags');
    }

    // Preserve search query if it exists
    const query = params.get('q');
    const newUrl = query ? `/blog?q=${query}&tags=${tags.join(',')}` : `/blog${tags.length > 0 ? `?tags=${tags.join(',')}` : ''}`;

    router.push(newUrl);
  };

  const handleTagKeyDown = (tag: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleTagClick(tag);
    }
  };

  if (allTags.length === 0) return null;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1a3a2a', marginBottom: '0.5rem' }}>
          Filter by Topic
        </h3>
        <p id="tag-filter-help" style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
          Use Tab to navigate, Enter or Space to select/deselect tags
        </p>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAllTags}
            aria-label={`Clear all filters (${selectedTags.length} selected)`}
            style={{
              background: 'none',
              border: 'none',
              color: '#666',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.9rem',
              padding: '0.25rem 0'
            }}
          >
            Clear all filters ({selectedTags.length})
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label="Article topic filters"
        aria-describedby="tag-filter-help"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          maxWidth: '800px',
          margin: '0 auto'
        }}
      >
        {allTags.map((tag: string) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              onKeyDown={(e) => handleTagKeyDown(tag, e)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? 'Remove' : 'Add'} filter for ${tag}`}
              tabIndex={0}
              style={{
                background: isSelected ? '#1a3a2a' : '#fff',
                color: isSelected ? '#fff' : '#1a3a2a',
                border: `2px solid ${isSelected ? '#1a3a2a' : '#e9ecef'}`,
                padding: '0.5rem 1rem',
                borderRadius: '25px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                textTransform: 'capitalize',
                outline: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#1a3a2a';
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.backgroundColor = '#fff';
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(26,58,42,0.2)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
}
