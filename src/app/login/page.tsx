'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { createClient } from '@/lib/supabase'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const successMessage = searchParams.get('message')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

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
              Sign In
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#666',
              lineHeight: '1.5'
            }}>
              Access your premium member experience
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            {successMessage && (
              <div style={{
                background: '#d4edda',
                color: '#155724',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                border: '1px solid #c3e6cb'
              }}>
                {successMessage}
              </div>
            )}

            {error && (
              <div style={{
                background: '#fee',
                color: '#c33',
                padding: '0.75rem',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
                border: '1px solid #fcc'
              }}>
                {error}
              </div>
            )}

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  background: '#fff',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a3a2a'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  background: '#fff',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#1a3a2a'}
                onBlur={(e) => e.target.style.borderColor = '#ddd'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: '1.5rem'
              }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>

            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '1rem'
              }}>
                Don't have an account?{' '}
                <a
                  href="/signup"
                  style={{
                    color: '#1a3a2a',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Sign up here
                </a>
              </p>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
