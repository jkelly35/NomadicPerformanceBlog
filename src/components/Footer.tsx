import React from "react";

export default function Footer() {
  return (
    <footer style={{ background: '#1a3a2a', color: '#fff', padding: '2rem 5vw', textAlign: 'center' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>
            Follow Nomadic Performance
          </h3>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <a href="https://instagram.com/nomadicperformanceco" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
              Instagram
            </a>
            <a href="https://twitter.com/NomadPerformCo" target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'none', fontSize: '1.1rem', fontWeight: 600 }}>
              Twitter
            </a>
          </div>
        </div>
        <div style={{ borderTop: '1px solid #333', paddingTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <a href="/privacy" style={{ color: '#ccc', textDecoration: 'none', fontSize: '0.9rem' }}>
              Privacy Policy
            </a>
          </div>
          <p style={{ fontSize: '0.9rem', margin: 0 }}>
            © 2025 Nomadic Performance. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
