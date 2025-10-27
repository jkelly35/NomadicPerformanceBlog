'use client';

import React, { useState } from 'react';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setStatus('error');
      setMessage('Please enter your email address');
      return;
    }

    setStatus('loading');

    try {
      // Formspree endpoint for newsletter subscriptions
      const response = await fetch('https://formspree.io/f/xldodoyk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          _subject: 'New Newsletter Subscription',
          _template: 'table',
        }),
      });

      if (response.ok) {
        setStatus('success');
        setMessage('Thanks for subscribing! Check your email for confirmation.');
        setEmail('');
      } else {
        throw new Error('Failed to subscribe');
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      setStatus('error');
      setMessage('Something went wrong. Please try again later.');
    }
  };

  return (
    <section style={{ padding: '4rem 5vw', background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)', color: '#fff', textAlign: 'center' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
          Stay Updated
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
          Get the latest posts and outdoor performance tips delivered to your inbox.
        </p>

        {status === 'success' && (
          <div style={{
            background: '#4CAF50',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            {message}
          </div>
        )}

        {status === 'error' && (
          <div style={{
            background: '#f44336',
            color: '#fff',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            fontWeight: 500
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '1rem', maxWidth: '400px', margin: '0 auto', flexWrap: 'wrap', justifyContent: 'center' }}>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === 'loading'}
            style={{
              flex: 1,
              minWidth: '200px',
              padding: '0.75rem 1rem',
              borderRadius: '25px',
              border: 'none',
              fontSize: '1rem',
              outline: 'none',
              opacity: status === 'loading' ? 0.7 : 1
            }}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            style={{
              padding: '0.75rem 2rem',
              background: status === 'loading' ? '#ccc' : '#fff',
              color: '#1a3a2a',
              border: 'none',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: status === 'loading' ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
              opacity: status === 'loading' ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (status !== 'loading') {
                e.currentTarget.style.background = '#f0f0f0';
              }
            }}
            onMouseOut={(e) => {
              if (status !== 'loading') {
                e.currentTarget.style.background = '#fff';
              }
            }}
          >
            {status === 'loading' ? 'Subscribing...' : 'Subscribe'}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '1.5rem' }}>
          No spam, unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
