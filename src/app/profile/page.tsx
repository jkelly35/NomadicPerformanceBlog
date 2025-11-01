'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    activities: [] as string[]
  })
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        bio: user.user_metadata?.bio || '',
        activities: user.user_metadata?.activities || []
      })
    }
  }, [user, loading, router])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
          activities: formData.activities
        }
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Profile updated successfully!')
      }
    } catch {
      setMessage('An unexpected error occurred')
    } finally {
      setUpdating(false)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <main style={{ minHeight: '100vh', background: '#f9f9f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e9ecef',
            borderTop: '4px solid #1a3a2a',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#666' }}>Loading your profile...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </main>
    )
  }

  if (!user) {
    return null
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
        minHeight: '30vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ maxWidth: '600px' }}>
          <h1 style={{
            fontSize: '3rem',
            fontWeight: 900,
            marginBottom: '1rem',
            letterSpacing: '0.05em'
          }}>
            Your Profile
          </h1>
          <p style={{
            fontSize: '1.2rem',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Manage your account settings and preferences
          </p>
        </div>
      </section>

      {/* Profile Content */}
      <section style={{ padding: '4rem 5vw', background: '#fff' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>

            {/* Account Information */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem'
              }}>
                Account Information
              </h2>

              <div style={{ display: 'grid', gap: '1rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    Email Address
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#666'
                  }}>
                    {user.email}
                  </div>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginTop: '0.25rem'
                  }}>
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    Member Since
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#666'
                  }}>
                    {new Date(user.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    Account Status
                  </label>
                  <div style={{
                    padding: '0.75rem',
                    background: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    color: '#155724',
                    fontWeight: 600
                  }}>
                    ✓ Active Member
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Settings */}
            <div style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              border: '1px solid #e9ecef'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem'
              }}>
                Profile Settings
              </h2>

              <form onSubmit={handleUpdateProfile}>
                {message && (
                  <div style={{
                    background: message.includes('success') ? '#d4edda' : '#f8d7da',
                    color: message.includes('success') ? '#155724' : '#721c24',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`
                  }}>
                    {message}
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
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    placeholder="Enter your first name"
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

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    placeholder="Enter your last name"
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
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      background: '#fff',
                      resize: 'vertical',
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
                    Preferred Activities
                  </label>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginBottom: '1rem'
                  }}>
                    Select the activities you participate in to personalize your dashboard experience.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {['Climbing', 'MTB', 'Running', 'Skiing', 'Snowboarding', 'Cycling'].map((activity) => (
                      <label key={activity} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.5rem',
                        background: '#fff',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem'
                      }}>
                        <input
                          type="checkbox"
                          checked={formData.activities.includes(activity)}
                          onChange={(e) => {
                            const newActivities = e.target.checked
                              ? [...formData.activities, activity]
                              : formData.activities.filter(a => a !== activity);
                            setFormData({ ...formData, activities: newActivities });
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {activity}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  style={{
                    width: '100%',
                    padding: '0.875rem',
                    background: updating ? '#ccc' : 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: updating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    marginBottom: '1rem'
                  }}
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </button>
              </form>

              <button
                onClick={handleSignOut}
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  background: '#dc3545',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c82333'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#dc3545'}
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '12px',
            border: '1px solid #dee2e6',
            textAlign: 'center'
          }}>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#1a3a2a',
              marginBottom: '1rem'
            }}>
              Quick Actions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginTop: '1.5rem'
            }}>
              <Link
                href="/dashboard"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                📊 View Dashboard
              </Link>
              <Link
                href="/blog"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                📖 Browse Content
              </Link>
              <Link
                href="/contact"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: '#fff',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                💬 Contact Support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
