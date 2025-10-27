import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <NavBar />

      {/* 404 Hero Section */}
      <section style={{
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
        color: '#fff',
        textAlign: 'center',
        padding: '4rem 5vw'
      }}>
        <div style={{ maxWidth: '600px' }}>
          {/* Large 404 Number */}
          <div style={{
            fontSize: '8rem',
            fontWeight: 900,
            marginBottom: '1rem',
            opacity: 0.8,
            letterSpacing: '0.1em'
          }}>
            404
          </div>

          {/* Main Message */}
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            Page Not Found
          </h1>

          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '3rem'
          }}>
            The page you&apos;re looking for seems to have wandered off the trail.
            Don&apos;t worry — let&apos;s get you back on track!
          </p>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <Link
              href="/"
              className="btn-home"
              style={{
                background: '#fff',
                color: '#1a3a2a',
                padding: '1rem 2rem',
                borderRadius: '50px',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.3s',
                display: 'inline-block'
              }}
            >
              🏠 Back to Home
            </Link>

            <Link
              href="/blog"
              className="btn-blog"
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: '#fff',
                padding: '1rem 2rem',
                borderRadius: '50px',
                textDecoration: 'none',
                fontSize: '1.1rem',
                fontWeight: 600,
                transition: 'all 0.3s',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'inline-block'
              }}
            >
              📖 Read Our Blog
            </Link>
          </div>
        </div>
      </section>

      {/* Helpful Navigation Section */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            color: '#1a3a2a',
            marginBottom: '2rem'
          }}>
            Explore Nomadic Performance
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '2rem',
            marginBottom: '3rem'
          }}>
            {/* Popular Pages */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '1rem'
              }}>
                🏔️ Latest Blog Posts
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Discover our newest articles on outdoor fitness and performance.
              </p>
              <Link
                href="/blog"
                className="nav-card"
                style={{
                  background: '#1a3a2a',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-block',
                  transition: 'background 0.3s'
                }}
              >
                View Blog →
              </Link>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '1rem'
              }}>
                👋 About Joe
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Learn about the founder and his journey in physical therapy.
              </p>
              <Link
                href="/about"
                className="nav-card"
                style={{
                  background: '#1a3a2a',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-block',
                  transition: 'background 0.3s'
                }}
              >
                Meet Joe →
              </Link>
            </div>

            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{
                fontSize: '1.3rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '1rem'
              }}>
                📧 Stay Updated
              </h3>
              <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                Get the latest posts and outdoor performance tips.
              </p>
              <Link
                href="/blog"
                className="nav-card"
                style={{
                  background: '#1a3a2a',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-block',
                  transition: 'background 0.3s'
                }}
              >
                Subscribe →
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div style={{
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            padding: '2rem',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 600,
              color: '#1a3a2a',
              marginBottom: '1rem'
            }}>
              Can&apos;t find what you&apos;re looking for?
            </h3>
            <p style={{
              color: '#666',
              marginBottom: '1.5rem',
              lineHeight: '1.6'
            }}>
              If you believe this page should exist or you followed a link from our site,
              please let us know so we can fix it.
            </p>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '1rem',
              flexWrap: 'wrap'
            }}>
              <a
                href="https://instagram.com/nomadicperformanceco"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{
                  background: '#E4405F',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.3s'
                }}
              >
                📷 Instagram
              </a>
              <a
                href="https://twitter.com/NomadPerformCo"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                style={{
                  background: '#1DA1F2',
                  color: '#fff',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '25px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'opacity 0.3s'
                }}
              >
                🐦 Twitter
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
