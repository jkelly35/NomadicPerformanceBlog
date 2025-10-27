'use client';

import React from 'react';

export default function NewsletterSignup() {
  return (
    <section style={{ padding: '4rem 5vw', background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)', color: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Stay Updated
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
          Get the latest posts and outdoor performance tips delivered to your inbox.
        </p>
        <form style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="email"
            placeholder="Enter your email"
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1rem',
              borderRadius: '25px',
              border: 'none',
              fontSize: '1rem',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            style={{
              padding: '0.75rem 2rem',
              background: '#fff',
              color: '#1a3a2a',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
