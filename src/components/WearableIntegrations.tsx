'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { WearableIntegration } from '@/lib/fitness-data'

interface WearableProvider {
  id: string
  name: string
  description: string
  icon: string
  color: string
  features: string[]
}

const WEARABLE_PROVIDERS: WearableProvider[] = [
  {
    id: 'google-fit',
    name: 'Google Fit',
    description: 'Comprehensive health tracking from Android devices',
    icon: '🎯',
    color: 'bg-blue-500',
    features: ['Heart Rate', 'Steps', 'Calories', 'Sleep', 'Weight', 'Body Fat']
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    description: 'Popular fitness tracker with detailed health metrics',
    icon: '🏃',
    color: 'bg-green-500',
    features: ['Heart Rate', 'Steps', 'Sleep', 'Active Zone Minutes']
  },
  {
    id: 'oura',
    name: 'Oura Ring',
    description: 'Advanced sleep and recovery tracking',
    icon: '🌙',
    color: 'bg-purple-500',
    features: ['Sleep Quality', 'HRV', 'Body Temperature', 'Readiness Score']
  },
  {
    id: 'whoop',
    name: 'WHOOP',
    description: 'Strain, recovery, and performance optimization',
    icon: '⚡',
    color: 'bg-orange-500',
    features: ['Strain Score', 'Recovery', 'Sleep Performance', 'HRV']
  },
  {
    id: 'garmin',
    name: 'Garmin Connect',
    description: 'Outdoor and multisport activity tracking',
    icon: '📈',
    color: 'bg-teal-500',
    features: ['GPS Activities', 'Training Load', 'Sleep', 'Heart Rate']
  },
  {
    id: 'polar',
    name: 'Polar',
    description: 'Professional-grade training and recovery metrics',
    icon: '❤️',
    color: 'bg-red-500',
    features: ['Nightly Recharge', 'Training Load', 'Sleep', 'HRV']
  },
  {
    id: 'withings',
    name: 'Withings',
    description: 'Smart scales and health monitors',
    icon: '📱',
    color: 'bg-indigo-500',
    features: ['Weight', 'Body Composition', 'Blood Pressure', 'Sleep']
  },
  {
    id: 'strava',
    name: 'Strava',
    description: 'Social fitness network for activities and performance',
    icon: '🏃',
    color: 'bg-pink-500',
    features: ['GPS Activities', 'Performance Metrics', 'Heart Rate Zones']
  },
  {
    id: 'myfitnesspal',
    name: 'MyFitnessPal',
    description: 'Nutrition and calorie tracking',
    icon: '🍎',
    color: 'bg-yellow-500',
    features: ['Calorie Tracking', 'Macronutrients', 'Food Database']
  }
]

export default function WearableIntegrations() {
  const { user } = useAuth()
  const [integrations, setIntegrations] = useState<WearableIntegration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadIntegrations()
    }
  }, [user])

  const loadIntegrations = async () => {
    try {
      const response = await fetch('/api/wearables/integrations')
      if (response.ok) {
        const data = await response.json()
        setIntegrations(data)
      }
    } catch (error) {
      console.error('Error loading integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const connectDevice = async (providerId: string) => {
    setConnecting(providerId)
    try {
      const response = await fetch('/api/wearables/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: providerId })
      })

      const data = await response.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        alert(data.error || 'Failed to connect device')
      }
    } catch (error) {
      console.error('Error connecting device:', error)
      alert('Failed to connect device')
    } finally {
      setConnecting(null)
    }
  }

  const syncDevice = async (providerId: string) => {
    setSyncing(providerId)
    try {
      const response = await fetch('/api/wearables/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', provider: providerId })
      })

      const data = await response.json()

      if (data.success) {
        alert(`Successfully synced ${data.dataPoints?.length || 0} data points`)
        loadIntegrations() // Refresh the list
      } else {
        alert(data.error || 'Failed to sync device')
      }
    } catch (error) {
      console.error('Error syncing device:', error)
      alert('Failed to sync device')
    } finally {
      setSyncing(null)
    }
  }

  const disconnectDevice = async (providerId: string) => {
    if (!confirm('Are you sure you want to disconnect this device?')) return

    try {
      const response = await fetch('/api/wearables/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', provider: providerId })
      })

      const data = await response.json()

      if (data.success) {
        loadIntegrations() // Refresh the list
      } else {
        alert(data.error || 'Failed to disconnect device')
      }
    } catch (error) {
      console.error('Error disconnecting device:', error)
      alert('Failed to disconnect device')
    }
  }

  const getIntegrationStatus = (providerId: string) => {
    return integrations.find(integration => integration.provider === providerId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <span className="text-2xl">📱</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Wearable Device Integrations
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
            Connect your favorite fitness devices and apps to automatically sync your health data and unlock powerful insights
          </p>
        </div>
      </div>

      {/* Device Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {WEARABLE_PROVIDERS.map((provider) => {
          const integration = getIntegrationStatus(provider.id)
          const isConnected = !!integration?.connected
          const isConnecting = connecting === provider.id
          const isSyncing = syncing === provider.id

          return (
            <div
              key={provider.id}
              className="group relative overflow-hidden bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
            >
              {/* Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${provider.color} opacity-5 group-hover:opacity-10 transition-opacity duration-500`}></div>

              {/* Animated Border */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-[1px]">
                <div className="w-full h-full bg-white/90 dark:bg-gray-800/90 rounded-2xl"></div>
              </div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${provider.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <span className="text-2xl">{provider.icon}</span>
                  </div>
                  {isConnected && (
                    <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>Connected</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                      {provider.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                      {provider.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="flex flex-wrap gap-2">
                    {provider.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={feature}
                        className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 text-blue-700 dark:text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 font-medium"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        {feature}
                      </span>
                    ))}
                    {provider.features.length > 3 && (
                      <span className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 text-purple-700 dark:text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 font-medium">
                        +{provider.features.length - 3} more
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    {!isConnected ? (
                      <button
                        onClick={() => connectDevice(provider.id)}
                        disabled={isConnecting}
                        className="flex-1 relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:transform-none disabled:shadow-none"
                      >
                        <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                        <span className="relative flex items-center justify-center">
                          {isConnecting ? (
                            <>
                              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                              Connecting...
                            </>
                          ) : (
                            <>
                              <span className="mr-2">🔗</span>
                              Connect
                            </>
                          )}
                        </span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => syncDevice(provider.id)}
                          disabled={isSyncing}
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                        >
                          {isSyncing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2 inline-block"></div>
                              Syncing...
                            </>
                          ) : (
                            <>
                              <span className="mr-1">🔄</span>
                              Sync Now
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => disconnectDevice(provider.id)}
                          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg text-sm"
                        >
                          <span className="mr-1">❌</span>
                          Disconnect
                        </button>
                      </>
                    )}
                  </div>

                  {/* Last Sync Info */}
                  {integration?.lastSync && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span className="mr-2">🕒</span>
                      Last synced: {new Date(integration.lastSync).toLocaleDateString()} at {new Date(integration.lastSync).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
            </div>
          )
        })}
      </div>

      {/* Pro Tips Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 rounded-3xl blur-3xl"></div>
        <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="flex items-center justify-center mb-6">
            <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
              <span className="text-2xl">💡</span>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-center bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-6">
            Pro Tips
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Connect multiple devices for comprehensive health insights and data validation</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">2</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Data syncs automatically every 24 hours when connected</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center">
                  <span className="text-pink-600 dark:text-pink-400 font-bold">3</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">Your data is encrypted and stored securely with privacy-first design</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">4</span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">You can disconnect devices at any time with one click</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
