import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";

export const metadata = {
  title: "Login - Nomadic Performance",
  description: "Access your Nomadic Performance account. Login functionality coming soon.",
};

export default function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <NavBar />

      {/* Hero Section */}
      <section style={{
        padding: '6rem 5vw 4rem',
        background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
        color: '#fff',
        textAlign: 'center',
        minHeight: '40vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{
            fontSize: '3.5rem',
            fontWeight: 900,
            marginBottom: '1.5rem',
            letterSpacing: '0.05em'
          }}>
            Welcome Back
          </h1>
          <p style={{
            fontSize: '1.3rem',
            opacity: 0.9,
            lineHeight: '1.6',
            marginBottom: '2rem'
          }}>
            Access your personalized fitness journey and exclusive content
          </p>
        </div>
      </section>

      {/* Login Form Section */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{
          maxWidth: '400px',
          margin: '0 auto',
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '3rem 2rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
              borderRadius: '50%',
              margin: '0 auto 1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(26,58,42,0.3)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" fill="white"/>
              </svg>
            </div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '0.5rem'
            }}>
              Login Coming Soon
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              We&apos;re working hard to bring you a premium member experience
            </p>
          </div>

          {/* Coming Soon Form Placeholder */}
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            padding: '2rem',
            border: '2px dashed #ddd'
          }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="your@email.com"
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  color: '#999',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1a3a2a',
                marginBottom: '0.5rem'
              }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                disabled
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  color: '#999',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <button
              disabled
              style={{
                width: '100%',
                padding: '0.875rem',
                background: '#ccc',
                color: '#666',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'not-allowed',
                transition: 'all 0.2s'
              }}
            >
              Sign In (Coming Soon)
            </button>
          </div>

          {/* Additional Info */}
          <div style={{
            textAlign: 'center',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid #e9ecef'
          }}>
            <p style={{
              fontSize: '0.9rem',
              color: '#666',
              marginBottom: '1rem'
            }}>
              Don&apos;t have an account yet?
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: '#e9ecef',
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#666'
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9M19 9H14V4H19V9Z" fill="currentColor"/>
              </svg>
              Member Registration Also Coming Soon
            </div>
          </div>

          {/* Features Preview */}
          <div style={{
            marginTop: '2rem',
            padding: '1.5rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              What to Expect
            </h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {[
                'Personalized training plans',
                'Progress tracking dashboard',
                'Exclusive video content',
                'Direct messaging with coaches',
                'Custom workout calendars'
              ].map((feature, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  color: '#495057'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    background: '#1a3a2a',
                    borderRadius: '50%',
                    flexShrink: 0
                  }}></div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
