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
import BottomNavigation from "../../components/BottomNavigation";
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const { preferences, updatePreferences, loading: preferencesLoading } = usePreferences()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'settings' | 'metrics'>('settings')
  const [updating, setUpdating] = useState(false)
  const [message, setMessage] = useState('')
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false)

  useEffect(() => {
    // Check if this is first-time setup
    const urlParams = new URLSearchParams(window.location.search)
    setIsFirstTimeSetup(urlParams.get('setup') === 'true')
  }, [])
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    bio: '',
    activities: [] as string[],
    dietaryPreferences: [] as string[],
    avatarUrl: '',
    website: '',
    twitterHandle: '',
    instagramHandle: '',
    linkedinUrl: '',
    githubUsername: '',
    fitnessLevel: '',
    goals: [] as string[],
    newsletterSubscription: true,
    publicProfile: true,
    location: '',
    timezone: ''
  })
  const [metricsData, setMetricsData] = useState({
    gender: '',
    weight: '',
    height: '',
    age: '',
    fitnessGoals: [] as string[],
    sportsActivities: [] as string[],
    healthMetrics: {
      restingHeartRate: '',
      maxHeartRate: '',
      bodyFatPercentage: '',
      muscleMass: '',
      boneDensity: '',
      hydrationLevel: '',
      sleepQuality: '',
      stressLevel: ''
    }
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
              dietaryPreferences: data.dietary_preferences || [],
              avatarUrl: data.avatar_url || '',
              website: data.website || '',
              twitterHandle: data.twitter_handle || '',
              instagramHandle: data.instagram_handle || '',
              linkedinUrl: data.linkedin_url || '',
              githubUsername: data.github_username || '',
              fitnessLevel: data.fitness_level || '',
              goals: data.goals || [],
              newsletterSubscription: data.newsletter_subscription ?? true,
              publicProfile: data.public_profile ?? true,
              location: data.location || '',
              timezone: data.timezone || ''
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
              dietaryPreferences: [],
              avatarUrl: '',
              website: '',
              twitterHandle: '',
              instagramHandle: '',
              linkedinUrl: '',
              githubUsername: '',
              fitnessLevel: '',
              goals: [],
              newsletterSubscription: true,
              publicProfile: true,
              location: '',
              timezone: ''
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
            dietaryPreferences: [],
            avatarUrl: '',
            website: '',
            twitterHandle: '',
            instagramHandle: '',
            linkedinUrl: '',
            githubUsername: '',
            fitnessLevel: '',
            goals: [],
            newsletterSubscription: true,
            publicProfile: true,
            location: '',
            timezone: ''
          });
        }
      };

      // Load user metrics from the database
      const loadUserMetrics = async () => {
        console.log('Loading metrics for user:', user.id);
        try {
          const { data, error } = await supabase
            .from('user_metrics')
            .select('*')
            .eq('user_id', user.id)
            .single();

          console.log('Metrics database query result:', { data, error });

          if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Error loading metrics:', error);
          }

          if (data) {
            console.log('Setting metrics data from database:', data);
            setMetricsData({
              gender: data.gender || '',
              weight: data.weight || '',
              height: data.height || '',
              age: data.age || '',
              fitnessGoals: data.fitness_goals || [],
              sportsActivities: data.sports_activities || [],
              healthMetrics: {
                restingHeartRate: data.resting_heart_rate || '',
                maxHeartRate: data.max_heart_rate || '',
                bodyFatPercentage: data.body_fat_percentage || '',
                muscleMass: data.muscle_mass || '',
                boneDensity: data.bone_density || '',
                hydrationLevel: data.hydration_level || '',
                sleepQuality: data.sleep_quality || '',
                stressLevel: data.stress_level || ''
              }
            });
          } else {
            console.log('No metrics found, setting defaults');
            // No metrics found, set defaults
            setMetricsData({
              gender: '',
              weight: '',
              height: '',
              age: '',
              fitnessGoals: [],
              sportsActivities: [],
              healthMetrics: {
                restingHeartRate: '',
                maxHeartRate: '',
                bodyFatPercentage: '',
                muscleMass: '',
                boneDensity: '',
                hydrationLevel: '',
                sleepQuality: '',
                stressLevel: ''
              }
            });
          }
        } catch (error) {
          console.error('Error loading user metrics:', error);
          setMetricsData({
            gender: '',
            weight: '',
            height: '',
            age: '',
            fitnessGoals: [],
            sportsActivities: [],
            healthMetrics: {
              restingHeartRate: '',
              maxHeartRate: '',
              bodyFatPercentage: '',
              muscleMass: '',
              boneDensity: '',
              hydrationLevel: '',
              sleepQuality: '',
              stressLevel: ''
            }
          });
        }
      };

      loadUserPreferences();
      loadUserMetrics();
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
          dietary_preferences: formData.dietaryPreferences,
          avatar_url: formData.avatarUrl,
          website: formData.website,
          twitter_handle: formData.twitterHandle,
          instagram_handle: formData.instagramHandle,
          linkedin_url: formData.linkedinUrl,
          github_username: formData.githubUsername,
          fitness_level: formData.fitnessLevel,
          goals: formData.goals,
          newsletter_subscription: formData.newsletterSubscription,
          public_profile: formData.publicProfile,
          location: formData.location,
          timezone: formData.timezone
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving profile:', error)
        setMessage(error.message)
      } else {
        console.log('Profile saved successfully')
        setMessage('Profile updated successfully!')
        // Redirect to dashboard after first-time setup
        if (isFirstTimeSetup) {
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage('An unexpected error occurred')
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateMetrics = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)
    setMessage('')

    try {
      // Upsert user metrics
      const { error } = await supabase
        .from('user_metrics')
        .upsert({
          user_id: user?.id,
          gender: metricsData.gender,
          weight: metricsData.weight,
          height: metricsData.height,
          age: metricsData.age,
          fitness_goals: metricsData.fitnessGoals,
          sports_activities: metricsData.sportsActivities,
          resting_heart_rate: metricsData.healthMetrics.restingHeartRate,
          max_heart_rate: metricsData.healthMetrics.maxHeartRate,
          body_fat_percentage: metricsData.healthMetrics.bodyFatPercentage,
          muscle_mass: metricsData.healthMetrics.muscleMass,
          bone_density: metricsData.healthMetrics.boneDensity,
          hydration_level: metricsData.healthMetrics.hydrationLevel,
          sleep_quality: metricsData.healthMetrics.sleepQuality,
          stress_level: metricsData.healthMetrics.stressLevel
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error saving metrics:', error)
        setMessage(error.message)
      } else {
        console.log('Metrics saved successfully')
        setMessage('Metrics updated successfully!')
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

          {/* Tab Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '3rem',
            position: 'relative'
          }}>
            <div style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '0.5rem',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              position: 'relative'
            }}>
              <button
                onClick={() => setActiveTab('settings')}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'settings' ? 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)' : 'transparent',
                  color: activeTab === 'settings' ? '#fff' : '#1a3a2a',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                ⚙️ Settings
              </button>
              <button
                onClick={() => setActiveTab('metrics')}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'metrics' ? 'linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%)' : 'transparent',
                  color: activeTab === 'metrics' ? '#fff' : '#1a3a2a',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                📊 Metrics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'settings' && (
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Avatar URL
                      </label>
                      <input
                        type="url"
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        placeholder="https://..."
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
                        Website
                      </label>
                      <input
                        type="url"
                        value={formData.website}
                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                        placeholder="https://..."
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Twitter
                      </label>
                      <input
                        type="text"
                        value={formData.twitterHandle}
                        onChange={(e) => setFormData({ ...formData, twitterHandle: e.target.value })}
                        placeholder="@username"
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
                        Instagram
                      </label>
                      <input
                        type="text"
                        value={formData.instagramHandle}
                        onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                        placeholder="@username"
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
                        GitHub
                      </label>
                      <input
                        type="text"
                        value={formData.githubUsername}
                        onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                        placeholder="username"
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
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData({ ...formData, linkedinUrl: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Fitness Level
                      </label>
                      <select
                        value={formData.fitnessLevel}
                        onChange={(e) => setFormData({ ...formData, fitnessLevel: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          background: '#fff'
                        }}
                      >
                        <option value="">Select level</option>
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="expert">Expert</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="City, Country"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Timezone
                      </label>
                      <input
                        type="text"
                        value={formData.timezone}
                        onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                        placeholder="America/New_York"
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
                        Goals
                      </label>
                      <input
                        type="text"
                        value={formData.goals.join(', ')}
                        onChange={(e) => setFormData({ ...formData, goals: e.target.value.split(',').map(g => g.trim()).filter(g => g) })}
                        placeholder="Weight loss, muscle gain, endurance..."
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

                  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="newsletter"
                        checked={formData.newsletterSubscription}
                        onChange={(e) => setFormData({ ...formData, newsletterSubscription: e.target.checked })}
                        style={{ width: '1rem', height: '1rem' }}
                      />
                      <label htmlFor="newsletter" style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a'
                      }}>
                        Subscribe to newsletter
                      </label>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <input
                        type="checkbox"
                        id="publicProfile"
                        checked={formData.publicProfile}
                        onChange={(e) => setFormData({ ...formData, publicProfile: e.target.checked })}
                        style={{ width: '1rem', height: '1rem' }}
                      />
                      <label htmlFor="publicProfile" style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a'
                      }}>
                        Make profile public
                      </label>
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
          )}

          {activeTab === 'settings' && (
            /* Wearable Device Integrations */
            <div style={{
              gridColumn: '1 / -1',
              marginTop: '2rem'
            }}>
              <WearableIntegrations />
            </div>
          )}

          {activeTab === 'metrics' && (
            <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>

              {/* Basic Metrics */}
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
                  📏 Basic Metrics
                </h2>

                <form onSubmit={handleUpdateMetrics} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Gender
                      </label>
                      <select
                        value={metricsData.gender}
                        onChange={(e) => setMetricsData({ ...metricsData, gender: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '1px solid #ddd',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          background: '#fff'
                        }}
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Age
                      </label>
                      <input
                        type="number"
                        value={metricsData.age}
                        onChange={(e) => setMetricsData({ ...metricsData, age: e.target.value })}
                        placeholder="Years"
                        min="1"
                        max="120"
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

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: '#1a3a2a',
                        marginBottom: '0.5rem'
                      }}>
                        Weight (lbs)
                      </label>
                      <input
                        type="number"
                        value={metricsData.weight}
                        onChange={(e) => setMetricsData({ ...metricsData, weight: e.target.value })}
                        placeholder="150"
                        min="1"
                        step="0.1"
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
                        Height (inches)
                      </label>
                      <input
                        type="number"
                        value={metricsData.height}
                        onChange={(e) => setMetricsData({ ...metricsData, height: e.target.value })}
                        placeholder="70"
                        min="1"
                        step="0.1"
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
                      transition: 'all 0.2s'
                    }}
                  >
                    {updating ? 'Updating...' : 'Update Basic Metrics'}
                  </button>
                </form>
              </div>

              {/* Fitness Goals & Activities */}
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
                  🎯 Fitness Goals & Activities
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1a3a2a',
                      marginBottom: '0.5rem'
                    }}>
                      Fitness Goals
                    </label>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginBottom: '1rem'
                    }}>
                      Select your primary fitness objectives.
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {[
                        'Weight Loss', 'Muscle Gain', 'Endurance', 'Strength',
                        'Flexibility', 'General Fitness', 'Sports Performance',
                        'Injury Recovery', 'Stress Reduction', 'Health Improvement'
                      ].map((goal) => (
                        <Toggle
                          key={goal}
                          checked={metricsData.fitnessGoals.includes(goal)}
                          onChange={(checked) => {
                            const newGoals = checked
                              ? [...metricsData.fitnessGoals, goal]
                              : metricsData.fitnessGoals.filter(g => g !== goal);
                            setMetricsData({ ...metricsData, fitnessGoals: newGoals });
                          }}
                          label={goal}
                          size="sm"
                        />
                      ))}
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
                      Sports & Activities
                    </label>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#666',
                      marginBottom: '1rem'
                    }}>
                      What sports and activities do you participate in?
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '0.75rem'
                    }}>
                      {[
                        'Running', 'Cycling', 'Swimming', 'Hiking', 'Climbing',
                        'Yoga', 'Weightlifting', 'CrossFit', 'Martial Arts',
                        'Tennis', 'Basketball', 'Soccer', 'Skiing', 'Snowboarding',
                        'Surfing', 'Rock Climbing', 'Trail Running', 'Triathlon'
                      ].map((activity) => (
                        <Toggle
                          key={activity}
                          checked={metricsData.sportsActivities.includes(activity)}
                          onChange={(checked) => {
                            const newActivities = checked
                              ? [...metricsData.sportsActivities, activity]
                              : metricsData.sportsActivities.filter(a => a !== activity);
                            setMetricsData({ ...metricsData, sportsActivities: newActivities });
                          }}
                          label={activity}
                          size="sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Health Metrics */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                gridColumn: '1 / -1'
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
                  ❤️ Health Metrics
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: '#1a3a2a',
                      marginBottom: '0.5rem'
                    }}>
                      Resting Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.restingHeartRate}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, restingHeartRate: e.target.value }
                      })}
                      placeholder="60"
                      min="30"
                      max="120"
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
                      Max Heart Rate (bpm)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.maxHeartRate}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, maxHeartRate: e.target.value }
                      })}
                      placeholder="190"
                      min="120"
                      max="220"
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
                      Body Fat (%)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.bodyFatPercentage}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, bodyFatPercentage: e.target.value }
                      })}
                      placeholder="15.5"
                      min="1"
                      max="50"
                      step="0.1"
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
                      Muscle Mass (%)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.muscleMass}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, muscleMass: e.target.value }
                      })}
                      placeholder="45.2"
                      min="1"
                      max="80"
                      step="0.1"
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
                      Bone Density (T-score)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.boneDensity}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, boneDensity: e.target.value }
                      })}
                      placeholder="-1.2"
                      min="-5"
                      max="5"
                      step="0.1"
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
                      Hydration Level (%)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.hydrationLevel}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, hydrationLevel: e.target.value }
                      })}
                      placeholder="65"
                      min="0"
                      max="100"
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
                      Sleep Quality (1-10)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.sleepQuality}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, sleepQuality: e.target.value }
                      })}
                      placeholder="8"
                      min="1"
                      max="10"
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
                      Stress Level (1-10)
                    </label>
                    <input
                      type="number"
                      value={metricsData.healthMetrics.stressLevel}
                      onChange={(e) => setMetricsData({
                        ...metricsData,
                        healthMetrics: { ...metricsData.healthMetrics, stressLevel: e.target.value }
                      })}
                      placeholder="4"
                      min="1"
                      max="10"
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

                <button
                  onClick={handleUpdateMetrics}
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
                    marginTop: '2rem'
                  }}
                >
                  {updating ? 'Updating...' : 'Update Health Metrics'}
                </button>
              </div>

              {/* Dietary Preferences & Restrictions */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                gridColumn: '1 / -1'
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
                  🥗 Dietary Preferences & Restrictions
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#666',
                    marginBottom: '1rem'
                  }}>
                    Select your dietary preferences and restrictions to personalize recipe suggestions and nutrition recommendations.
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

                  <button
                    onClick={handleUpdateProfile}
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
                      transition: 'all 0.2s'
                    }}
                  >
                    {updating ? 'Updating...' : 'Update Dietary Preferences'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      <BottomNavigation />

      <style jsx>{`
        @media (max-width: 768px) {
          main {
            padding-bottom: 80px; /* Space for bottom navigation */
          }
        }
      `}</style>
    </main>
  )
}
