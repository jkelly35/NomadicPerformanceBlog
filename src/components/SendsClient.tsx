'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import {
  Send,
  Equipment,
  createSend,
  getRecentSends,
  getUserEquipment,
  getSendStats,
  getRecentWorkouts,
  getActiveGoals,
  getWeeklyWorkoutStats
} from '@/lib/fitness-data'

interface SendsData {
  sends: Send[]
  equipment: Equipment[]
  stats: {
    totalSends: number
    sendsBySport: { sport: string; count: number }[]
    recentActivity: { date: string; count: number }[]
  }
  workouts: any[]
  goals: any[]
  weeklyStats: {
    count: number
    totalMinutes: number
  }
}

interface SendsClientProps {
  initialData: SendsData
}

export default function SendsClient({ initialData }: SendsClientProps) {
  const [sends] = useState<Send[]>(initialData.sends)
  const [equipment] = useState<Equipment[]>(initialData.equipment)
  const [stats] = useState(initialData.stats)
  const [workouts] = useState(initialData.workouts)
  const [goals] = useState(initialData.goals)
  const [weeklyStats] = useState(initialData.weeklyStats)

  const [selectedSport, setSelectedSport] = useState<string>('climbing')
  const [showSendModal, setShowSendModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [sendData, setSendData] = useState({
    // General fields
    activity_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    notes: '',
    rating: '',
    weather_conditions: '',
    partners: '',

    // Climbing specific
    climb_type: '',
    climb_name: '',
    climb_grade: '',
    climb_location: '',

    // MTB specific
    trail_name: '',
    trail_level: '',
    trail_time: '',
    trail_distance: '',

    // Skiing/Snowboarding specific
    mountain_name: '',
    vertical_feet: '',
    runs_completed: '',

    // Running specific
    run_distance: '',
    run_time: '',
    run_pace: '',
    run_elevation_gain: '',

    // Equipment used
    equipment_used: [] as string[]
  })

  const { user } = useAuth()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/login')
    }
  }, [user, router])

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport)
    // Reset sport-specific fields when changing sports
    setSendData(prev => ({
      ...prev,
      // Reset all sport-specific fields
      climb_type: '',
      climb_name: '',
      climb_grade: '',
      climb_location: '',
      trail_name: '',
      trail_level: '',
      trail_time: '',
      trail_distance: '',
      mountain_name: '',
      vertical_feet: '',
      runs_completed: '',
      run_distance: '',
      run_time: '',
      run_pace: '',
      run_elevation_gain: '',
      equipment_used: []
    }))
  }

  const handleEquipmentToggle = (equipmentId: string) => {
    setSendData(prev => ({
      ...prev,
      equipment_used: prev.equipment_used.includes(equipmentId)
        ? prev.equipment_used.filter(id => id !== equipmentId)
        : [...prev.equipment_used, equipmentId]
    }))
  }

  const handleLogSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const sendPayload = {
        sport: selectedSport,
        activity_date: sendData.activity_date,
        duration_minutes: sendData.duration_minutes ? parseInt(sendData.duration_minutes) : undefined,

        // Climbing specific
        climb_type: sendData.climb_type || undefined,
        climb_name: sendData.climb_name || undefined,
        climb_grade: sendData.climb_grade || undefined,
        climb_location: sendData.climb_location || undefined,

        // MTB specific
        trail_name: sendData.trail_name || undefined,
        trail_level: sendData.trail_level || undefined,
        trail_time: sendData.trail_time || undefined,
        trail_distance: sendData.trail_distance ? parseFloat(sendData.trail_distance) : undefined,

        // Skiing/Snowboarding specific
        mountain_name: sendData.mountain_name || undefined,
        vertical_feet: sendData.vertical_feet ? parseInt(sendData.vertical_feet) : undefined,
        runs_completed: sendData.runs_completed ? parseInt(sendData.runs_completed) : undefined,

        // Running specific
        run_distance: sendData.run_distance ? parseFloat(sendData.run_distance) : undefined,
        run_time: sendData.run_time || undefined,
        run_pace: sendData.run_pace || undefined,
        run_elevation_gain: sendData.run_elevation_gain ? parseInt(sendData.run_elevation_gain) : undefined,

        // Equipment and general fields
        equipment_used: sendData.equipment_used,
        notes: sendData.notes || undefined,
        rating: sendData.rating ? parseInt(sendData.rating) : undefined,
        weather_conditions: sendData.weather_conditions || undefined,
        partners: sendData.partners || undefined
      }

      const result = await createSend(sendPayload)

      if (result.success) {
        setSendData({
          activity_date: new Date().toISOString().split('T')[0],
          duration_minutes: '',
          notes: '',
          rating: '',
          weather_conditions: '',
          partners: '',
          climb_type: '',
          climb_name: '',
          climb_grade: '',
          climb_location: '',
          trail_name: '',
          trail_level: '',
          trail_time: '',
          trail_distance: '',
          mountain_name: '',
          vertical_feet: '',
          runs_completed: '',
          run_distance: '',
          run_time: '',
          run_pace: '',
          run_elevation_gain: '',
          equipment_used: []
        })
        setShowSendModal(false)
        // Refresh the page to get updated data
        window.location.reload()
      } else {
        alert('Failed to log activity: ' + result.error)
      }
    } catch (error) {
      console.error('Failed to log activity:', error)
      alert('Failed to log activity. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getSportIcon = (sport: string) => {
    switch (sport) {
      case 'climbing': return '🧗‍♂️'
      case 'mtb': return '🚵‍♂️'
      case 'skiing': return '🎿'
      case 'snowboarding': return '🏂'
      case 'running': return '🏃‍♂️'
      default: return '💪'
    }
  }

  const getSportDisplayName = (sport: string) => {
    switch (sport) {
      case 'climbing': return 'Climbing'
      case 'mtb': return 'Mountain Biking'
      case 'skiing': return 'Skiing'
      case 'snowboarding': return 'Snowboarding'
      case 'running': return 'Running'
      default: return sport.charAt(0).toUpperCase() + sport.slice(1)
    }
  }

  const renderSportSpecificFields = () => {
    const relevantEquipment = equipment.filter(eq =>
      eq.category?.sport === selectedSport || eq.category?.sport === 'general'
    )

    switch (selectedSport) {
      case 'climbing':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Climb Type
                </label>
                <select
                  value={sendData.climb_type}
                  onChange={(e) => setSendData({ ...sendData, climb_type: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select type</option>
                  <option value="bouldering">Bouldering</option>
                  <option value="sport">Sport Climbing</option>
                  <option value="trad">Traditional</option>
                  <option value="alpine">Alpine</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Grade
                </label>
                <input
                  type="text"
                  value={sendData.climb_grade}
                  onChange={(e) => setSendData({ ...sendData, climb_grade: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="V5, 5.10a, etc."
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Climb Name
                </label>
                <input
                  type="text"
                  value={sendData.climb_name}
                  onChange={(e) => setSendData({ ...sendData, climb_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Route name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={sendData.climb_location}
                  onChange={(e) => setSendData({ ...sendData, climb_location: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Crag or area"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'mtb':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Trail Name
                </label>
                <input
                  type="text"
                  value={sendData.trail_name}
                  onChange={(e) => setSendData({ ...sendData, trail_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Trail name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Difficulty Level
                </label>
                <select
                  value={sendData.trail_level}
                  onChange={(e) => setSendData({ ...sendData, trail_level: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={sendData.trail_time}
                  onChange={(e) => setSendData({ ...sendData, trail_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="01:23:45"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sendData.trail_distance}
                  onChange={(e) => setSendData({ ...sendData, trail_distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="12.5"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'skiing':
      case 'snowboarding':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mountain/Resort
                </label>
                <input
                  type="text"
                  value={sendData.mountain_name}
                  onChange={(e) => setSendData({ ...sendData, mountain_name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mountain name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vertical Feet
                </label>
                <input
                  type="number"
                  value={sendData.vertical_feet}
                  onChange={(e) => setSendData({ ...sendData, vertical_feet: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2000"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Runs Completed
              </label>
              <input
                type="number"
                value={sendData.runs_completed}
                onChange={(e) => setSendData({ ...sendData, runs_completed: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="15"
              />
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      case 'running':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Distance (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={sendData.run_distance}
                  onChange={(e) => setSendData({ ...sendData, run_distance: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Time (HH:MM:SS)
                </label>
                <input
                  type="text"
                  value={sendData.run_time}
                  onChange={(e) => setSendData({ ...sendData, run_time: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="00:25:30"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pace (min/km)
                </label>
                <input
                  type="text"
                  value={sendData.run_pace}
                  onChange={(e) => setSendData({ ...sendData, run_pace: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="5:00"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Elevation Gain (ft)
                </label>
                <input
                  type="number"
                  value={sendData.run_elevation_gain}
                  onChange={(e) => setSendData({ ...sendData, run_elevation_gain: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="500"
                />
              </div>
            </div>
            {relevantEquipment.length > 0 && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Equipment Used
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {relevantEquipment.map((eq) => (
                    <label key={eq.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={sendData.equipment_used.includes(eq.id)}
                        onChange={() => handleEquipmentToggle(eq.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm">{eq.equipment_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <NavBar />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">🎯 Sends Dashboard</h1>
                <p className="text-blue-100 text-lg">Track your successful sends and achievements across all sports</p>
                <div className="flex items-center mt-4 space-x-4">
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">🏆 Total Sends: {stats.totalSends}</span>
                  </div>
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">📅 This Week: {weeklyStats.count} activities</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl">🏔️</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Sends</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalSends}</p>
                <p className="text-sm text-gray-500">All activities</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">This Week</p>
                <p className="text-3xl font-bold text-green-600">{weeklyStats.count}</p>
                <p className="text-sm text-gray-500">Activities completed</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active Goals</p>
                <p className="text-3xl font-bold text-purple-600">{goals.length}</p>
                <p className="text-sm text-gray-500">Goals in progress</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Equipment</p>
                <p className="text-3xl font-bold text-orange-600">{equipment.length}</p>
                <p className="text-sm text-gray-500">Items tracked</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-full">
                <span className="text-2xl">🛠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sport Selection and Log Activity Button */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <span className="mr-2">🎯</span>
                Log an Activity
              </h3>
              <button
                onClick={() => setShowSendModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="flex items-center">
                  <span className="mr-2">➕</span>
                  Log Activity
                </span>
              </button>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {['climbing', 'mtb', 'skiing', 'snowboarding', 'running'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => handleSportChange(sport)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedSport === sport
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">{getSportIcon(sport)}</div>
                    <div className="text-sm font-medium">{getSportDisplayName(sport)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Sends */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center">
              <span className="mr-2">📅</span>
              Recent Sends
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {sends.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="text-gray-500 text-lg">No sends logged yet.</p>
                  <p className="text-gray-400">Start by logging your first successful send above!</p>
                </div>
              ) : (
                sends.map((send) => (
                  <div key={send.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="text-2xl mr-3">{getSportIcon(send.sport)}</span>
                          <h4 className="text-lg font-semibold text-gray-900">{getSportDisplayName(send.sport)}</h4>
                          {send.rating && (
                            <span className="ml-2 text-yellow-500">
                              {'★'.repeat(send.rating)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center">
                            <span className="mr-1">📅</span>
                            {new Date(send.activity_date).toLocaleDateString()}
                          </span>
                          {send.duration_minutes && (
                            <span className="flex items-center">
                              <span className="mr-1">⏱️</span>
                              {send.duration_minutes} min
                            </span>
                          )}
                        </div>

                        {/* Sport-specific details */}
                        {send.sport === 'climbing' && send.climb_name && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>{send.climb_name}</strong> {send.climb_grade && `(${send.climb_grade})`}
                            {send.climb_location && ` at ${send.climb_location}`}
                          </div>
                        )}

                        {send.sport === 'mtb' && send.trail_name && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>{send.trail_name}</strong>
                            {send.trail_level && ` (${send.trail_level})`}
                            {send.trail_distance && ` - ${send.trail_distance}km`}
                            {send.trail_time && ` in ${send.trail_time}`}
                          </div>
                        )}

                        {(send.sport === 'skiing' || send.sport === 'snowboarding') && send.mountain_name && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>{send.mountain_name}</strong>
                            {send.vertical_feet && ` - ${send.vertical_feet}ft vertical`}
                            {send.runs_completed && ` - ${send.runs_completed} runs`}
                          </div>
                        )}

                        {send.sport === 'running' && send.run_distance && (
                          <div className="text-sm text-gray-700 mb-2">
                            <strong>{send.run_distance}km</strong>
                            {send.run_time && ` in ${send.run_time}`}
                            {send.run_pace && ` (${send.run_pace}/km)`}
                          </div>
                        )}

                        {send.notes && (
                          <p className="text-gray-600 text-sm italic mb-2">"{send.notes}"</p>
                        )}

                        {send.equipment_used && send.equipment_used.length > 0 && (
                          <div className="text-sm text-blue-600">
                            <span className="font-medium">Equipment:</span> {send.equipment_used.length} items used
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Send Modal */}
        {showSendModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Log {getSportDisplayName(selectedSport)} Send
                  </h3>
                  <button
                    onClick={() => setShowSendModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">×</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleLogSend} className="p-6 space-y-6">
                {/* Sport-specific fields */}
                {renderSportSpecificFields()}

                {/* General fields */}
                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Date
                      </label>
                      <input
                        type="date"
                        value={sendData.activity_date}
                        onChange={(e) => setSendData({ ...sendData, activity_date: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={sendData.duration_minutes}
                        onChange={(e) => setSendData({ ...sendData, duration_minutes: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        min="1"
                        placeholder="Total time spent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Rating (1-5 stars)
                      </label>
                      <select
                        value={sendData.rating}
                        onChange={(e) => setSendData({ ...sendData, rating: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select rating</option>
                        <option value="1">⭐ - Poor</option>
                        <option value="2">⭐⭐ - Below Average</option>
                        <option value="3">⭐⭐⭐ - Average</option>
                        <option value="4">⭐⭐⭐⭐ - Good</option>
                        <option value="5">⭐⭐⭐⭐⭐ - Excellent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Weather Conditions
                      </label>
                      <input
                        type="text"
                        value={sendData.weather_conditions}
                        onChange={(e) => setSendData({ ...sendData, weather_conditions: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Sunny, cloudy, etc."
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Partners/Company
                    </label>
                    <input
                      type="text"
                      value={sendData.partners}
                      onChange={(e) => setSendData({ ...sendData, partners: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Who did you go with?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={sendData.notes}
                      onChange={(e) => setSendData({ ...sendData, notes: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="How did it feel? Any observations?"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging Activity...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <span className="mr-2">🎯</span>
                        Log Activity
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
