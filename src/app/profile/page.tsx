'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { usePreferences } from '@/context/PreferencesContext'
import NavBar from "../../components/NavBar";
import Footer from "../../components/Footer";
import BackgroundImage from "../../components/BackgroundImage";
import Toggle from "../../components/Toggle";
import WearableIntegrations from "../../components/WearableIntegrations";
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

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
    console.log('Profile page: user loading state:', { user, loading })
    if (!loading && !user) {
      console.log('Profile page: No user, redirecting to login')
      router.push('/login')
    } else if (user && !formData.email) { // Only load if we haven't loaded yet
      console.log('Profile page: User found, loading preferences')
      // Load user preferences from the database
      const loadUserPreferences = async () => {
        console.log('Loading preferences for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('user_preferences')
            .select('*')
            .eq('user_id', user.id)
            .single();

          console.log('Database query result:', { data, error });

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading preferences:', error);
          }

          if (data) {
            console.log('Setting form data from database:', data);
            setFormData({
              email: user.email || '',
              firstName: data.first_name || '',
              lastName: data.last_name || '',
              bio: data.bio || '',
              activities: data.activities || [],
              dietaryPreferences: data.dietary_preferences || []
            });
          } else {
            console.log('No preferences found, setting defaults');
            // No preferences found, set defaults
            setFormData({
              email: user.email || '',
              firstName: '',
              lastName: '',
              bio: '',
              activities: [],
              dietaryPreferences: []
            });
          }
        } catch (error) {
          console.error('Error loading user preferences:', error);
          setFormData({
            email: user.email || '',
            firstName: '',
            lastName: '',
            bio: '',
            activities: [],
            dietaryPreferences: []
          });
        }
      };

      loadUserPreferences();
    }
  }, [user, loading, router, formData.email])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    console.log('Saving dietary preferences:', formData.dietaryPreferences)

    try {
      // Upsert user preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user?.id,
          first_name: formData.firstName,
          last_name: formData.lastName,
          bio: formData.bio,
          activities: formData.activities,
          dietary_preferences: formData.dietaryPreferences
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving profile:', error)
        setMessage(error.message)
      } else {
        console.log('Profile saved successfully')
        setMessage('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
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
              position: 'relative'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                👤 Account Information
              </h2>

              <form onSubmit={handleUpdateProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      background: '#fff'
                    }}
                    disabled
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
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
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        background: '#fff'
                      }}
                    />
                  </div>

                  <div>
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
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        background: '#fff'
                      }}
                    />
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
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      background: '#fff',
                      resize: 'vertical'
                    }}
                  />
                </div>

                {/* Dietary Preferences Section */}
                <div>
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
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {[
                      'Vegetarian', 'Vegan', 'Pescatarian', 'Gluten-Free', 'Dairy-Free',
                      'Nut-Free', 'Egg-Free', 'Soy-Free', 'Low-Carb', 'Keto',
                      'Paleo', 'Mediterranean', 'Halal', 'Kosher', 'Low-Sodium',
                      'High-Protein', 'Low-FODMAP', 'Whole30'
                    ].map((preference) => (
                      <Toggle
                        key={preference}
                        checked={formData.dietaryPreferences.includes(preference)}
                        onChange={(checked) => {
                          const newPreferences = checked
                            ? [...formData.dietaryPreferences, preference]
                            : formData.dietaryPreferences.filter(p => p !== preference);
                          setFormData({ ...formData, dietaryPreferences: newPreferences });
                        }}
                        label={preference}
                        size="sm"
                      />
                    ))}
                  </div>
                </div>

                {message && (
                  <div style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    background: message.includes('success') ? '#d4edda' : '#f8d7da',
                    color: message.includes('success') ? '#155724' : '#721c24',
                    border: `1px solid ${message.includes('success') ? '#c3e6cb' : '#f5c6cb'}`,
                    fontSize: '0.9rem'
                  }}>
                    {message}
                  </div>
                )}

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
                  transition: 'all 0.2s'
                }}
              >
                Sign Out
              </button>
            </div>

            {/* Dashboard Preferences */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative'
            }}>
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#1a3a2a',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                📊 Dashboard Preferences
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[
                  { key: 'main', label: 'Main Dashboard', icon: '📈' },
                  { key: 'nutrition', label: 'Nutrition Dashboard', icon: '🥗' },
                  { key: 'training', label: 'Training Dashboard', icon: '💪' },
                  { key: 'activities', label: 'Activities Dashboard', icon: '🏔️' },
                  { key: 'equipment', label: 'Equipment Dashboard', icon: '🎒' }
                ].map(({ key, label, icon }) => (
                  <Toggle
                    key={key}
                    checked={preferences?.dashboards?.[key as keyof typeof preferences.dashboards] || false}
                    onChange={(checked) => handleDashboardToggle(key as any, checked)}
                    label={label}
                    icon={icon}
                    size="md"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Wearable Device Integrations */}
          <div style={{
            gridColumn: '1 / -1',
            marginTop: '2rem'
          }}>
            <WearableIntegrations />
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
