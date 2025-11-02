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
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Wearable Device Integrations
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Connect your favorite fitness devices and apps to automatically sync your health data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {WEARABLE_PROVIDERS.map((provider) => {
          const integration = getIntegrationStatus(provider.id)
          const isConnected = !!integration?.connected
          const isConnecting = connecting === provider.id
          const isSyncing = syncing === provider.id

          return (
            <div key={provider.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${provider.color} text-white text-xl`}>
                  {provider.icon}
                </div>
                {isConnected && (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Connected
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {provider.name}
              </h3>

              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                {provider.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {provider.features.slice(0, 3).map((feature) => (
                  <span key={feature} className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                    {feature}
                  </span>
                ))}
                {provider.features.length > 3 && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs px-2 py-1 rounded">
                    +{provider.features.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                {!isConnected ? (
                  <button
                    onClick={() => connectDevice(provider.id)}
                    disabled={isConnecting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                  >
                    {isConnecting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                        Connecting...
                      </>
                    ) : (
                      'Connect'
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => syncDevice(provider.id)}
                      disabled={isSyncing}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      {isSyncing ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                          Syncing...
                        </>
                      ) : (
                        'Sync Now'
                      )}
                    </button>
                    <button
                      onClick={() => disconnectDevice(provider.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                )}
              </div>

              {integration?.lastSync && (
                <p className="text-xs text-gray-500 mt-2">
                  Last synced: {new Date(integration.lastSync).toLocaleDateString()}
                </p>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Pro Tips
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Connect multiple devices for comprehensive health insights</li>
          <li>• Data syncs automatically every 24 hours when connected</li>
          <li>• Your data is encrypted and stored securely</li>
          <li>• You can disconnect devices at any time</li>
        </ul>
      </div>
    </div>
  )
}
