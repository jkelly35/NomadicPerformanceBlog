'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import BackgroundImage from "../../components/BackgroundImage";
import { createClient } from '@/lib/supabase'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { preferences, updatePreferences, loading: preferencesLoading } = usePreferences()
  const router = useRouter()
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    activities: [] as string[],
    dietaryPreferences: [] as string[]
  })
  const supabase = createClient()

  const handleDashboardToggle = async (dashboard: 'main' | 'nutrition' | 'training' | 'activities' | 'equipment', enabled: boolean) => {
    if (!preferences) return

    const newPreferences = {
      ...preferences,
      dashboards: {
        ...preferences.dashboards,
        [dashboard]: enabled
      }
    }
    await updatePreferences(newPreferences)
  }

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    } else if (user) {
      setFormData({
        email: user.email || '',
        firstName: user.user_metadata?.first_name || '',
        lastName: user.user_metadata?.last_name || '',
        bio: user.user_metadata?.bio || '',
        activities: user.user_metadata?.activities || [],
        dietaryPreferences: user.user_metadata?.dietary_preferences || []
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
          activities: formData.activities,
          dietary_preferences: formData.dietaryPreferences
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
      <BackgroundImage
        src="/images/landscapeBackground.png"
        alt="Utah landscape background"
        className="min-h-[50vh] w-full flex flex-col items-center justify-center relative overflow-hidden"
        priority={true}
        quality={85}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/40 z-10" />

        {/* Hero Content */}
        <div className="relative z-20 text-center p-4 sm:p-6 md:p-8 bg-black/30 rounded-xl max-w-4xl mx-auto backdrop-blur-sm border border-white/10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 sm:mb-6 drop-shadow-2xl leading-tight">
            Your Profile
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white mb-6 sm:mb-8 font-medium drop-shadow-lg leading-relaxed max-w-3xl mx-auto">
            Manage your account settings and preferences
          </p>
        </div>

        {/* SVG Mountain Accent */}
        <svg
          viewBox="0 0 1440 320"
          className="absolute bottom-0 left-0 w-full h-24 sm:h-32 z-20"
        >
          <path
            fill="#1a3a2a"
            fillOpacity="0.8"
            d="M0,224L60,192C120,160,240,96,360,101.3C480,107,600,181,720,218.7C840,256,960,256,1080,229.3C1200,203,1320,149,1380,122.7L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
        </svg>
      </BackgroundImage>

      {/* Profile Content */}
      <section style={{ padding: '4rem 5vw', background: '#fff', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>

            {/* Account Information */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1a3a2a 0%, #2d5a3d 100%)'
              }}></div>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1a3a2a 0%, #2d5a3d 100%)'
              }}></div>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 800,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
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

                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#1a3a2a',
                    marginBottom: '0.5rem'
                  }}>
                    Dietary Preferences & Restrictions
                  </label>
                  <p style={{
                    fontSize: '0.8rem',
                    color: '#666',
                    marginBottom: '1rem'
                  }}>
                    Select your dietary preferences and restrictions to personalize recipe suggestions.
                  </p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {[
                      'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 
                      'Nut-Free', 'Low-Carb', 'Keto', 'Paleo', 'Mediterranean',
                      'Halal', 'Kosher', 'Low-Sodium', 'High-Protein'
                    ].map((preference) => (
                      <label key={preference} style={{
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
                          checked={formData.dietaryPreferences.includes(preference)}
                          onChange={(e) => {
                            const newPreferences = e.target.checked
                              ? [...formData.dietaryPreferences, preference]
                              : formData.dietaryPreferences.filter(p => p !== preference);
                            setFormData({ ...formData, dietaryPreferences: newPreferences });
                          }}
                          style={{ marginRight: '0.5rem' }}
                        />
                        {preference}
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

          {/* Dashboard Preferences */}
          {preferencesLoading ? (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1a3a2a 0%, #2d5a3d 100%)'
              }}></div>
              <p style={{ color: '#666', margin: 0, fontWeight: 600 }}>Loading dashboard preferences...</p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #1a3a2a 0%, #2d5a3d 100%)'
              }}></div>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#1a3a2a',
                marginBottom: '1rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                Dashboard Preferences
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: '#666',
                marginBottom: '2rem'
              }}>
                Customize your dashboard experience by enabling or disabling specific sections
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem'
              }}>
                {[
                  {
                    id: 'nutrition' as const,
                    title: 'Nutrition Dashboard',
                    description: 'Meal logging, macro tracking, and nutrition goals',
                    icon: '🥗'
                  },
                  {
                    id: 'training' as const,
                    title: 'Training Dashboard',
                    description: 'Strength training plans, workout logging, and performance tracking',
                    icon: '💪'
                  },
                  {
                    id: 'activities' as const,
                    title: 'Activities Dashboard',
                    description: 'Climbing sends, MTB rides, and outdoor activity tracking',
                    icon: '🏔️'
                  },
                  {
                    id: 'equipment' as const,
                    title: 'Equipment Dashboard',
                    description: 'Gear management, maintenance tracking, and equipment organization',
                    icon: '🎒'
                  }
                ].map((dashboard) => (
                  <div key={dashboard.id} style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: '12px',
                    padding: '1.5rem',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onClick={() => handleDashboardToggle(dashboard.id, !preferences?.dashboards?.[dashboard.id])}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#1a3a2a';
                    e.currentTarget.style.boxShadow = '0 8px 32px rgba(26, 58, 42, 0.15)';
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                  }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '1.5rem' }}>{dashboard.icon}</span>
                        <h4 style={{
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: '#1a3a2a',
                          margin: 0
                        }}>
                          {dashboard.title}
                        </h4>
                      </div>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '50px',
                        height: '25px'
                      }}>
                        <input
                          type="checkbox"
                          checked={preferences?.dashboards?.[dashboard.id] ?? true}
                          onChange={() => handleDashboardToggle(dashboard.id, !preferences?.dashboards?.[dashboard.id])}
                          style={{
                            opacity: 0,
                            width: 0,
                            height: 0
                          }}
                        />
                        <span style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          backgroundColor: (preferences?.dashboards?.[dashboard.id] ?? true) ? '#1a3a2a' : '#ccc',
                          transition: '0.4s',
                          borderRadius: '25px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '17px',
                            width: '17px',
                            left: '4px',
                            bottom: '4px',
                            backgroundColor: 'white',
                            transition: '0.4s',
                            borderRadius: '50%',
                            transform: (preferences?.dashboards?.[dashboard.id] ?? true) ? 'translateX(25px)' : 'translateX(0px)'
                          }}></span>
                        </span>
                      </label>
                    </div>
                    <p style={{
                      fontSize: '0.9rem',
                      color: '#666',
                      margin: 0,
                      lineHeight: '1.5'
                    }}>
                      {dashboard.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div style={{
            marginTop: '3rem',
            padding: '2rem',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            textAlign: 'center',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '4px',
              background: 'linear-gradient(90deg, #1a3a2a 0%, #2d5a3d 100%)'
            }}></div>
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#1a3a2a',
              marginBottom: '1rem',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(26, 58, 42, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              >
                📊 View Dashboard
              </Link>
              <Link
                href="/blog"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(26, 58, 42, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
              >
                📖 Browse Content
              </Link>
              <Link
                href="/contact"
                style={{
                  display: 'block',
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  color: '#1a3a2a',
                  fontWeight: 600,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(26, 58, 42, 0.15)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                }}
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
