'use client'

import { useState, useEffect } from 'react'
import { ReadinessMetric, createOrUpdateReadinessMetrics } from '@/lib/fitness-data'
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

interface ReadinessData {
  latestReadiness: ReadinessMetric | null
  readinessHistory: ReadinessMetric[]
  todayMetrics: ReadinessMetric | null
}

interface ReadinessClientProps {
  initialData: ReadinessData
}

export default function ReadinessClient({ initialData }: ReadinessClientProps) {
  const [data, setData] = useState<ReadinessData>(initialData)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'input' | 'history'>('overview')

  // Form state for readiness input
  const [formData, setFormData] = useState<Partial<ReadinessMetric>>({
    recorded_date: new Date().toISOString().split('T')[0],
    hrv: undefined,
    resting_hr: undefined,
    sleep_hours: undefined,
    sleep_quality: undefined,
    fatigue: undefined,
    soreness: undefined,
    mood: undefined,
    stress: undefined,
    energy_intake: undefined,
    energy_burn: undefined,
    hydration_ml: undefined,
    training_load: undefined,
    temperature: undefined,
    altitude: undefined,
    illness: false,
    travel: false,
    notes: ''
  })

  // Update form data when today's metrics exist
  useEffect(() => {
    if (data.todayMetrics) {
      setFormData(prev => ({
        ...prev,
        ...data.todayMetrics
      }))
    }
  }, [data.todayMetrics])

  const handleInputChange = (field: keyof ReadinessMetric, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await createOrUpdateReadinessMetrics(formData)
      if (result) {
        // Refresh data
        setData(prev => ({
          ...prev,
          todayMetrics: result,
          latestReadiness: result.overall_readiness ? result : prev.latestReadiness
        }))
        setActiveTab('overview')
      }
    } catch (error) {
      console.error('Error saving readiness metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getReadinessColor = (score: number | undefined) => {
    if (!score) return '#e5e7eb'
    if (score >= 85) return '#10b981' // green
    if (score >= 65) return '#f59e0b' // yellow
    if (score >= 45) return '#f97316' // orange
    return '#ef4444' // red
  }

  const getReadinessLabel = (score: number | undefined) => {
    if (!score) return 'No Data'
    if (score >= 85) return 'Ready to Perform'
    if (score >= 65) return 'Moderate Load'
    if (score >= 45) return 'Recovery Day'
    return 'Rest'
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <NavBar />

      {/* Hero Section */}
      <section className="py-16 px-6 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white text-center min-h-[40vh] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10"></div>
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
              ⚡
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-wide">
            Athlete Readiness Dashboard
          </h1>
          <p className="text-lg md:text-xl opacity-90 leading-relaxed mb-6">
            Optimize your performance with data-driven recovery and training insights
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-white/20">
              🏃‍♂️ Performance Tracking
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-white/20">
              💚 Recovery Monitoring
            </div>
            <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold border border-white/20">
              📊 Data-Driven Insights
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-xl p-1 shadow-lg border border-stone-200">
            <nav className="flex space-x-1">
              {[
                { id: 'overview', label: 'Overview', icon: '📊' },
                { id: 'input', label: 'Daily Input', icon: '📝' },
                { id: 'history', label: 'History', icon: '📈' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Readiness Dial */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900 mb-2">Today's Readiness</h3>
              <p className="text-stone-600">Your performance readiness score</p>
            </div>
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#f1f5f9"
                    strokeWidth="16"
                  />
                  {/* Progress circle */}
                  {data.todayMetrics?.overall_readiness && (
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={getReadinessColor(data.todayMetrics.overall_readiness)}
                      strokeWidth="16"
                      strokeDasharray={`${(data.todayMetrics.overall_readiness / 100) * 502.4} 502.4`}
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  )}
                  {/* Center text */}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fontSize="28"
                    fontWeight="bold"
                    fill="#1f2937"
                    className="transform rotate-90"
                  >
                    {data.todayMetrics?.overall_readiness ? Math.round(data.todayMetrics.overall_readiness) : '--'}
                  </text>
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                    className="transform rotate-90"
                  >
                    /100
                  </text>
                </svg>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getReadinessColor(data.todayMetrics?.overall_readiness) }}
                />
                <span className="text-sm font-semibold text-stone-700">
                  {getReadinessLabel(data.todayMetrics?.overall_readiness)}
                </span>
              </div>
            </div>
          </div>

          {/* Category Scores */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-2xl font-bold text-stone-900 mb-6">Category Breakdown</h3>
            <div className="space-y-4">
              {[
                { name: 'Recovery', score: data.todayMetrics?.recovery_score, color: 'from-green-400 to-emerald-500', icon: '💚', weight: '45%' },
                { name: 'Load', score: data.todayMetrics?.load_score, color: 'from-blue-400 to-cyan-500', icon: '🏋️‍♂️', weight: '20%' },
                { name: 'Wellness', score: data.todayMetrics?.wellness_score, color: 'from-purple-400 to-pink-500', icon: '😊', weight: '20%' },
                { name: 'Fueling', score: data.todayMetrics?.fueling_score, color: 'from-orange-400 to-red-500', icon: '🍎', weight: '10%' },
                { name: 'Context', score: data.todayMetrics?.context_score, color: 'from-gray-400 to-stone-500', icon: '🌍', weight: '5%' }
              ].map((category) => (
                <div key={category.name} className="flex items-center justify-between p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${category.color} rounded-full flex items-center justify-center text-white font-bold shadow-md`}>
                      {category.icon}
                    </div>
                    <div>
                      <span className="font-semibold text-stone-800">{category.name}</span>
                      <div className="text-xs text-stone-500">{category.weight} weight</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-stone-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full bg-gradient-to-r ${category.color} transition-all duration-500`}
                        style={{ width: `${category.score || 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-stone-700 min-w-[2rem] text-right">
                      {category.score ? Math.round(category.score) : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Card */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                💡
              </div>
              <h3 className="text-2xl font-bold text-stone-900">Performance Insights</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {data.todayMetrics?.overall_readiness ? (
                <>
                  {data.todayMetrics.overall_readiness >= 85 && (
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-green-600 font-bold">✅</span>
                        <span className="font-semibold text-green-800">Optimal Performance</span>
                      </div>
                      <p className="text-sm text-green-700">You're in peak condition for high-intensity training.</p>
                    </div>
                  )}
                  {data.todayMetrics.recovery_score && data.todayMetrics.recovery_score < 60 && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-red-600 font-bold">⚠️</span>
                        <span className="font-semibold text-red-800">Recovery Focus</span>
                      </div>
                      <p className="text-sm text-red-700">Prioritize rest and recovery activities today.</p>
                    </div>
                  )}
                  {data.todayMetrics.fueling_score && data.todayMetrics.fueling_score < 70 && (
                    <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-orange-600 font-bold">🍽️</span>
                        <span className="font-semibold text-orange-800">Nutrition Priority</span>
                      </div>
                      <p className="text-sm text-orange-700">Focus on proper fueling to optimize performance.</p>
                    </div>
                  )}
                  {data.todayMetrics.wellness_score && data.todayMetrics.wellness_score < 65 && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-purple-600 font-bold">🧘‍♀️</span>
                        <span className="font-semibold text-purple-800">Wellness Check</span>
                      </div>
                      <p className="text-sm text-purple-700">Address stress, mood, or fatigue concerns.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 md:col-span-2 lg:col-span-3">
                  <div className="text-center">
                    <span className="text-4xl mb-4 block">📊</span>
                    <h4 className="font-semibold text-stone-800 mb-2">No Data Available</h4>
                    <p className="text-stone-600">Complete your daily readiness assessment to see personalized insights.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
              📝
            </div>
            <div>
              <h3 className="text-2xl font-bold text-stone-900">Daily Readiness Input</h3>
              <p className="text-stone-600">Track your metrics for personalized insights</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Recovery Metrics */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  💚
                </div>
                <h4 className="text-lg font-semibold text-stone-900">Recovery Metrics</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">HRV (ms)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hrv || ''}
                    onChange={(e) => handleInputChange('hrv', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 45.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={formData.resting_hr || ''}
                    onChange={(e) => handleInputChange('resting_hr', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 55"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.sleep_hours || ''}
                    onChange={(e) => handleInputChange('sleep_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 7.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Sleep Quality (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.sleep_quality || ''}
                    onChange={(e) => handleInputChange('sleep_quality', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 85"
                  />
                </div>
              </div>
            </div>

            {/* Subjective Wellness */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  😊
                </div>
                <h4 className="text-lg font-semibold text-stone-900">Subjective Wellness (1-5 scale)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Fatigue (1=Very energetic, 5=Very tired)</label>
                  <select
                    value={formData.fatigue || ''}
                    onChange={(e) => handleInputChange('fatigue', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Soreness (1=No soreness, 5=Severe)</label>
                  <select
                    value={formData.soreness || ''}
                    onChange={(e) => handleInputChange('soreness', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Mood (1=Very bad, 5=Excellent)</label>
                  <select
                    value={formData.mood || ''}
                    onChange={(e) => handleInputChange('mood', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Stress (1=No stress, 5=Extreme)</label>
                  <select
                    value={formData.stress || ''}
                    onChange={(e) => handleInputChange('stress', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Fueling and Hydration */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  🍎
                </div>
                <h4 className="text-lg font-semibold text-stone-900">Fueling & Hydration</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Energy Intake (kcal)</label>
                  <input
                    type="number"
                    value={formData.energy_intake || ''}
                    onChange={(e) => handleInputChange('energy_intake', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Energy Burned (kcal)</label>
                  <input
                    type="number"
                    value={formData.energy_burn || ''}
                    onChange={(e) => handleInputChange('energy_burn', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 2800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Hydration (ml)</label>
                  <input
                    type="number"
                    value={formData.hydration_ml || ''}
                    onChange={(e) => handleInputChange('hydration_ml', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 3200"
                  />
                </div>
              </div>
            </div>

            {/* Training Load */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  🏋️‍♂️
                </div>
                <h4 className="text-lg font-semibold text-stone-900">Training Load</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Training Load (RPE × duration)</label>
                  <input
                    type="number"
                    value={formData.training_load || ''}
                    onChange={(e) => handleInputChange('training_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 240"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">7-day Acute Load</label>
                  <input
                    type="number"
                    value={formData.acute_load || ''}
                    onChange={(e) => handleInputChange('acute_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">28-day Chronic Load</label>
                  <input
                    type="number"
                    value={formData.chronic_load || ''}
                    onChange={(e) => handleInputChange('chronic_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Factors */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-stone-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  🌍
                </div>
                <h4 className="text-lg font-semibold text-stone-900">Environmental Factors</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature || ''}
                    onChange={(e) => handleInputChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 22.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-stone-800 mb-2">Altitude (m)</label>
                  <input
                    type="number"
                    value={formData.altitude || ''}
                    onChange={(e) => handleInputChange('altitude', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white"
                    placeholder="e.g., 1500"
                  />
                </div>
                <div className="flex items-center space-x-6 pt-8">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.illness || false}
                      onChange={(e) => handleInputChange('illness', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-stone-100 border-stone-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-semibold text-stone-800">Illness</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.travel || false}
                      onChange={(e) => handleInputChange('travel', e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-stone-100 border-stone-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="ml-3 text-sm font-semibold text-stone-800">Travel</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-stone-50 rounded-lg p-6 border border-stone-200">
              <label className="block text-sm font-semibold text-stone-800 mb-2">Additional Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={4}
                className="block w-full px-4 py-3 border border-stone-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 bg-white resize-none"
                placeholder="Any additional notes about your day, training, or how you're feeling..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="mr-2">💾</span>
                    Save Readiness Data
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-8">
          {/* Trend Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                📈
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-900">Readiness Trend</h3>
                <p className="text-stone-600">Last 30 days performance tracking</p>
              </div>
            </div>
            {data.readinessHistory.length > 0 ? (
              <div className="h-80 bg-stone-50 rounded-lg p-4 border border-stone-200">
                <svg width="100%" height="100%" viewBox="0 0 800 300" className="rounded-lg">
                  {/* Background gradient */}
                  <defs>
                    <linearGradient id="chartBg" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#f8fafc', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#e2e8f0', stopOpacity: 1 }} />
                    </linearGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#chartBg)" rx="8" />

                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(value => (
                    <g key={value}>
                      <line
                        x1="80"
                        y1={260 - (value / 100) * 200}
                        x2="750"
                        y2={260 - (value / 100) * 200}
                        stroke="#e2e8f0"
                        strokeWidth="1"
                        strokeDasharray="2,2"
                      />
                      <text
                        x="70"
                        y={265 - (value / 100) * 200}
                        textAnchor="end"
                        fontSize="12"
                        fill="#64748b"
                        fontWeight="500"
                      >
                        {value}
                      </text>
                    </g>
                  ))}

                  {/* Data points and line */}
                  {data.readinessHistory
                    .filter(entry => entry.overall_readiness !== undefined)
                    .slice(-30) // Last 30 days
                    .map((entry, index, arr) => {
                      const x = 80 + (index / (arr.length - 1)) * 670
                      const y = 260 - ((entry.overall_readiness || 0) / 100) * 200
                      const color = getReadinessColor(entry.overall_readiness)

                      return (
                        <g key={entry.id}>
                          {/* Line to next point */}
                          {index < arr.length - 1 && (
                            <line
                              x1={x}
                              y1={y}
                              x2={80 + ((index + 1) / (arr.length - 1)) * 670}
                              y2={260 - ((arr[index + 1].overall_readiness || 0) / 100) * 200}
                              stroke="#3b82f6"
                              strokeWidth="3"
                              strokeLinecap="round"
                            />
                          )}
                          {/* Data point */}
                          <circle
                            cx={x}
                            cy={y}
                            r="6"
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth="3"
                            className="hover:r-8 transition-all duration-200 cursor-pointer"
                          />
                          {/* Date label for every 5th point */}
                          {index % 5 === 0 && (
                            <text
                              x={x}
                              y="285"
                              textAnchor="middle"
                              fontSize="11"
                              fill="#64748b"
                              fontWeight="500"
                            >
                              {new Date(entry.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                          )}
                        </g>
                      )
                    })}

                  {/* Y-axis label */}
                  <text
                    x="25"
                    y="160"
                    textAnchor="middle"
                    fontSize="13"
                    fill="#374151"
                    fontWeight="600"
                    transform="rotate(-90 25 160)"
                  >
                    Readiness Score
                  </text>
                </svg>
              </div>
            ) : (
              <div className="h-80 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-6xl mb-4 block">📊</span>
                  <h4 className="text-lg font-semibold text-stone-800 mb-2">No Data Available</h4>
                  <p className="text-stone-600">Start tracking your readiness to see trends over time.</p>
                </div>
              </div>
            )}
          </div>

          {/* History List */}
          <div className="bg-white rounded-xl shadow-lg border border-stone-200 p-8 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                📋
              </div>
              <div>
                <h3 className="text-2xl font-bold text-stone-900">Detailed History</h3>
                <p className="text-stone-600">Complete readiness records and insights</p>
              </div>
            </div>
            {data.readinessHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.readinessHistory.map((entry) => (
                  <div key={entry.id} className="bg-stone-50 rounded-lg p-6 border border-stone-200 hover:bg-stone-100 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getReadinessColor(entry.overall_readiness) }}
                        />
                        <h4 className="text-lg font-semibold text-stone-900">
                          {new Date(entry.recorded_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </h4>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-stone-800">
                          {entry.overall_readiness ? Math.round(entry.overall_readiness) : '--'}
                        </div>
                        <div className="text-sm text-stone-500">Readiness Score</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm mb-4">
                      <div className="bg-white p-3 rounded-lg border border-stone-200">
                        <div className="text-stone-500 font-medium">Recovery</div>
                        <div className="text-lg font-bold text-stone-800">{entry.recovery_score ? Math.round(entry.recovery_score) : '--'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-stone-200">
                        <div className="text-stone-500 font-medium">Load</div>
                        <div className="text-lg font-bold text-stone-800">{entry.load_score ? Math.round(entry.load_score) : '--'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-stone-200">
                        <div className="text-stone-500 font-medium">Wellness</div>
                        <div className="text-lg font-bold text-stone-800">{entry.wellness_score ? Math.round(entry.wellness_score) : '--'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-stone-200">
                        <div className="text-stone-500 font-medium">Fueling</div>
                        <div className="text-lg font-bold text-stone-800">{entry.fueling_score ? Math.round(entry.fueling_score) : '--'}</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-stone-200">
                        <div className="text-stone-500 font-medium">Context</div>
                        <div className="text-lg font-bold text-stone-800">{entry.context_score ? Math.round(entry.context_score) : '--'}</div>
                      </div>
                    </div>
                    {entry.notes && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start space-x-2">
                          <span className="text-blue-600 font-bold">📝</span>
                          <div>
                            <div className="text-sm font-semibold text-blue-800 mb-1">Notes</div>
                            <p className="text-sm text-blue-700 italic">"{entry.notes}"</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-stone-50 rounded-lg border border-stone-200 p-8 text-center">
                <span className="text-4xl mb-4 block">📅</span>
                <h4 className="text-lg font-semibold text-stone-800 mb-2">No History Yet</h4>
                <p className="text-stone-600">Your readiness tracking history will appear here once you start logging data.</p>
              </div>
            )}
          </div>
        </div>
      )}

      </div>

      <Footer />
    </main>
  )
}
