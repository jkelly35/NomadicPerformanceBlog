'use client';

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function NavBar() {
  return (
    <nav style={{ width: '100vw', maxWidth: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.5rem 5vw', background: '#111', boxShadow: '0 2px 8px rgba(0,0,0,0.10)', borderBottom: '1px solid #222', position: 'sticky', top: 0, zIndex: 10 }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '1rem', textDecoration: 'none' }}>
        <Image src="/images/NPLogo.png" alt="Nomadic Performance Logo" width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(33,77,54,0.10)', border: '2px solid #1a3a2a', background: '#fff' }} />
        <span style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
          Nomadic Performance
        </span>
      </Link>
      <div>
        <Link href="/about" style={{ margin: '0 1rem', fontSize: '1.1rem', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ccc'} onMouseOut={(e) => e.currentTarget.style.color = '#fff'}>About Me</Link>
        <Link href="/blog" style={{ margin: '0 1rem', fontSize: '1.1rem', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ccc'} onMouseOut={(e) => e.currentTarget.style.color = '#fff'}>Blog</Link>
        <Link href="/login" style={{ margin: '0 1rem', fontSize: '1.1rem', color: '#fff', textDecoration: 'none', fontWeight: 600, transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#ccc'} onMouseOut={(e) => e.currentTarget.style.color = '#fff'}>Log In</Link>
      </div>
    </nav>
  );
}
