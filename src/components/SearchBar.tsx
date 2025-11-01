'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  enableSearchParams?: boolean;
}

export default function SearchBar({ placeholder = "Search articles...", className = "", enableSearchParams = true }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => enableSearchParams ? searchParams.get('q') || '' : '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/blog?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/blog');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    router.push('/blog');
  };

  return (
    <form
      onSubmit={handleSearch}
      role="search"
      aria-label="Search articles"
      className={`search-bar ${className}`}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        maxWidth: '300px',
        width: '100%'
      }}
    >
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder={placeholder}
        aria-label="Search articles"
        style={{
          width: '100%',
          padding: '0.5rem 2.5rem 0.5rem 1rem',
          border: '2px solid #e9ecef',
          borderRadius: '25px',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          background: '#fff'
        }}
        onFocus={(e) => e.target.style.borderColor = '#1a3a2a'}
        onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
      />
      {searchTerm && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '35px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#666',
            fontSize: '1.2rem',
            padding: '0.2rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '20px',
            height: '20px'
          }}
        >
          ×
        </button>
      )}
      <button
        type="submit"
        aria-label="Submit search"
        style={{
          position: 'absolute',
          right: '8px',
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1a3a2a',
          fontSize: '1.1rem',
          padding: '0.3rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '24px',
          height: '24px',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
      >
        🔍
      </button>
    </form>
  );
}
