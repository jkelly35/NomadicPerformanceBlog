'use client';

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from '@/context/AuthContext';
import { usePreferences } from '@/context/PreferencesContext';
import { createClient } from '@/lib/supabase';

export default function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const pathname = usePathname();
  const supabase = createClient();

  const showPublicLinks = !user || ["/", "/about", "/contact", "/blog"].includes(pathname);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsMenuOpen(false);
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        width: '100vw',
        maxWidth: '100%',
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 5vw',
        background: '#111',
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
        borderBottom: '1px solid #222',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <Link
        href="/"
        aria-label="Nomadic Performance - Go to homepage"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          textDecoration: 'none'
        }}
      >
        <Image
          src="/images/NPLogo.png"
          alt="Nomadic Performance Logo"
          width={48}
          height={48}
          style={{
            borderRadius: '50%',
            objectFit: 'cover',
            boxShadow: '0 2px 8px rgba(33,77,54,0.10)',
            border: '2px solid #1a3a2a',
            background: '#fff'
          }}
        />
        <span style={{
          fontSize: '2rem',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '0.05em'
        }}>
          Nomadic Performance
        </span>
      </Link>

      {/* Desktop Navigation */}
      <div
        role="menubar"
        style={{
          display: 'none',
          alignItems: 'center',
          gap: '1rem'
        }}
        className="desktop-nav"
      >
        {showPublicLinks ? (
          <>
            <Link href="/about" style={{
              margin: '0 1rem',
              fontSize: '1.1rem',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s'
            }} className="nav-link">About Me</Link>
            <Link href="/blog" style={{
              margin: '0 1rem',
              fontSize: '1.1rem',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s'
            }} className="nav-link">Blog</Link>
            <Link href="/contact" style={{
              margin: '0 1rem',
              fontSize: '1.1rem',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s'
            }} className="nav-link">Contact</Link>
          </>
        ) : null}
        {user ? (
          <>
            {preferences.dashboards.main && (
              <Link href="/dashboard" style={{
                margin: '0 1rem',
                fontSize: '1.1rem',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s'
              }} className="nav-link">Dashboard</Link>
            )}
            <Link href="/analytics" style={{
              margin: '0 1rem',
              fontSize: '1.1rem',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s'
            }} className="nav-link">Analytics</Link>
            <Link href="/profile" style={{
              margin: '0 1rem',
              fontSize: '1.1rem',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
              transition: 'color 0.2s'
            }} className="nav-link">Profile</Link>
            <button
              onClick={handleSignOut}
              style={{
                margin: '0 1rem',
                fontSize: '1.1rem',
                color: '#fff',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'color 0.2s'
              }}
              className="nav-link"
            >
              Sign Out
            </button>
          </>
        ) : (
          <Link href="/login" style={{
            margin: '0 1rem',
            fontSize: '1.1rem',
            color: '#fff',
            textDecoration: 'none',
            fontWeight: 600,
            transition: 'color 0.2s'
          }} className="nav-link">Log In</Link>
        )}
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-navigation"
        aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
        style={{
          display: 'block',
          background: 'none',
          border: 'none',
          color: '#fff',
          fontSize: '1.5rem',
          cursor: 'pointer',
          padding: '0.5rem'
        }}
        className="mobile-menu-btn"
      >
        {isMenuOpen ? '✕' : '☰'}
      </button>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div
          id="mobile-navigation"
          role="menu"
          aria-label="Mobile navigation menu"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: '#111',
            borderTop: '1px solid #222',
            padding: '1rem 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem'
          }}
          className="mobile-nav"
        >
          {showPublicLinks ? (
            <>
              <Link
                href="/about"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                About Me
              </Link>
              <Link
                href="/blog"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                Blog
              </Link>
              <Link
                href="/contact"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
            </>
          ) : null}
          {user ? (
            <>
              {preferences.dashboards.main && (
                <Link
                  href="/dashboard"
                  style={{
                    color: 'var(--nav-text, #fff)',
                    textDecoration: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    padding: '0.5rem 1rem',
                    width: '100%',
                    textAlign: 'center'
                  }}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <Link
                href="/profile"
                style={{
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'center'
                }}
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleSignOut}
                style={{
                  color: '#fff',
                  background: 'none',
                  border: 'none',
                  fontSize: '1.2rem',
                  fontWeight: 600,
                  padding: '0.5rem 1rem',
                  width: '100%',
                  textAlign: 'center',
                  cursor: 'pointer'
                }}
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/login"
              style={{
                color: '#fff',
                textDecoration: 'none',
                fontSize: '1.2rem',
                fontWeight: 600,
                padding: '0.5rem 1rem',
                width: '100%',
                textAlign: 'center'
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Log In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
