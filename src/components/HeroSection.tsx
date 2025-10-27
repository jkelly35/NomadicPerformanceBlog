import React from "react";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      style={{
        minHeight: '80vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: `url('/images/landscapeBackground.png') center center / cover no-repeat`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ...existing hero content... */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(255,255,255,0.15)',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', padding: '4rem 2rem', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', marginBottom: '1.5rem', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
          Welcome to Nomadic Performance
        </h1>
        <p style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '2rem', fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
          Helping outdoor athletes and adventurers stay strong, prevent injuries, and perform at their best—anywhere, anytime.
        </p>
        <Link href="/blog" style={{ display: 'inline-block', padding: '0.75rem 2rem', fontSize: '1.25rem', fontWeight: 700, color: '#1a3a2a', background: '#fff', borderRadius: '2rem', textDecoration: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', transition: 'background 0.2s' }}>
          Explore the Blog
        </Link>
      </div>
      {/* SVG Mountain Accent */}
      <svg viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '120px', zIndex: 2 }}>
        <path fill="#1a3a2a" fillOpacity="0.7" d="M0,224L60,192C120,160,240,96,360,101.3C480,107,600,181,720,218.7C840,256,960,256,1080,229.3C1200,203,1320,149,1380,122.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z" />
      </svg>
    </section>
  );
}
