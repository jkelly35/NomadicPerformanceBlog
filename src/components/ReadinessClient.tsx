'use client'

import { useState, useEffect } from 'react'
import { ReadinessMetric, createOrUpdateReadinessMetrics } from '@/lib/fitness-data'

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
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'input', label: 'Daily Input' },
            { id: 'history', label: 'History' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Readiness Dial */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Readiness</h3>
            <div className="flex items-center justify-center">
              <div className="relative">
                <svg className="w-48 h-48" viewBox="0 0 200 200">
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="80"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  {data.todayMetrics?.overall_readiness && (
                    <circle
                      cx="100"
                      cy="100"
                      r="80"
                      fill="none"
                      stroke={getReadinessColor(data.todayMetrics.overall_readiness)}
                      strokeWidth="12"
                      strokeDasharray={`${(data.todayMetrics.overall_readiness / 100) * 502.4} 502.4`}
                      strokeLinecap="round"
                      transform="rotate(-90 100 100)"
                    />
                  )}
                  {/* Center text */}
                  <text
                    x="100"
                    y="95"
                    textAnchor="middle"
                    fontSize="24"
                    fontWeight="bold"
                    fill="#374151"
                  >
                    {data.todayMetrics?.overall_readiness || '--'}
                  </text>
                  <text
                    x="100"
                    y="115"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#6b7280"
                  >
                    Readiness Score
                  </text>
                </svg>
              </div>
            </div>
            <div className="text-center mt-4">
              <p className="text-lg font-medium text-gray-900">
                {getReadinessLabel(data.todayMetrics?.overall_readiness)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {data.todayMetrics?.recorded_date ? `Last updated: ${new Date(data.todayMetrics.recorded_date).toLocaleDateString()}` : 'No data recorded today'}
              </p>
            </div>
          </div>

          {/* Category Scores */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Scores</h3>
            <div className="space-y-3">
              {[
                { label: 'Recovery', score: data.todayMetrics?.recovery_score, weight: '45%' },
                { label: 'Training Load', score: data.todayMetrics?.load_score, weight: '20%' },
                { label: 'Wellness', score: data.todayMetrics?.wellness_score, weight: '20%' },
                { label: 'Fueling', score: data.todayMetrics?.fueling_score, weight: '10%' },
                { label: 'Context', score: data.todayMetrics?.context_score, weight: '5%' }
              ].map((category) => (
                <div key={category.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">{category.label}</span>
                    <span className="text-xs text-gray-500">({category.weight})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-300"
                        style={{
                          width: `${category.score || 0}%`,
                          backgroundColor: getReadinessColor(category.score)
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-gray-900 w-8 text-right">
                      {category.score ? Math.round(category.score) : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Insights Card */}
          <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights & Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.todayMetrics?.recovery_score && data.todayMetrics.recovery_score < 60 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Low Recovery Score</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Consider prioritizing recovery activities like extra sleep or light mobility work.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {data.todayMetrics?.load_score && data.todayMetrics.load_score > 80 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-red-800">High Training Load</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Training load is high. Consider reducing intensity or adding recovery days.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {(!data.todayMetrics || !data.todayMetrics.overall_readiness) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-blue-800">Complete Your Daily Check-in</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Add today's metrics to get personalized readiness insights and recommendations.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Tab */}
      {activeTab === 'input' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Daily Readiness Input</h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recovery Metrics */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Recovery Metrics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">HRV (ms)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.hrv || ''}
                    onChange={(e) => handleInputChange('hrv', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 45.2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Resting HR (bpm)</label>
                  <input
                    type="number"
                    value={formData.resting_hr || ''}
                    onChange={(e) => handleInputChange('resting_hr', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 55"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sleep Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={formData.sleep_hours || ''}
                    onChange={(e) => handleInputChange('sleep_hours', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 7.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sleep Quality (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.sleep_quality || ''}
                    onChange={(e) => handleInputChange('sleep_quality', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 85"
                  />
                </div>
              </div>
            </div>

            {/* Subjective Wellness */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Subjective Wellness (1-5 scale)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fatigue (1=Very energetic, 5=Very tired)</label>
                  <select
                    value={formData.fatigue || ''}
                    onChange={(e) => handleInputChange('fatigue', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Soreness (1=No soreness, 5=Severe)</label>
                  <select
                    value={formData.soreness || ''}
                    onChange={(e) => handleInputChange('soreness', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mood (1=Very bad, 5=Excellent)</label>
                  <select
                    value={formData.mood || ''}
                    onChange={(e) => handleInputChange('mood', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="">Select...</option>
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Stress (1=No stress, 5=Extreme)</label>
                  <select
                    value={formData.stress || ''}
                    onChange={(e) => handleInputChange('stress', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Fueling & Hydration</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Energy Intake (kcal)</label>
                  <input
                    type="number"
                    value={formData.energy_intake || ''}
                    onChange={(e) => handleInputChange('energy_intake', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 2500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Energy Burned (kcal)</label>
                  <input
                    type="number"
                    value={formData.energy_burn || ''}
                    onChange={(e) => handleInputChange('energy_burn', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 2800"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hydration (ml)</label>
                  <input
                    type="number"
                    value={formData.hydration_ml || ''}
                    onChange={(e) => handleInputChange('hydration_ml', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 3200"
                  />
                </div>
              </div>
            </div>

            {/* Training Load */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Training Load</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Training Load (RPE × duration)</label>
                  <input
                    type="number"
                    value={formData.training_load || ''}
                    onChange={(e) => handleInputChange('training_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 240"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">7-day Acute Load</label>
                  <input
                    type="number"
                    value={formData.acute_load || ''}
                    onChange={(e) => handleInputChange('acute_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Auto-calculated"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">28-day Chronic Load</label>
                  <input
                    type="number"
                    value={formData.chronic_load || ''}
                    onChange={(e) => handleInputChange('chronic_load', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="Auto-calculated"
                  />
                </div>
              </div>
            </div>

            {/* Environmental Factors */}
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-3">Environmental Factors</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.temperature || ''}
                    onChange={(e) => handleInputChange('temperature', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 22.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Altitude (m)</label>
                  <input
                    type="number"
                    value={formData.altitude || ''}
                    onChange={(e) => handleInputChange('altitude', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    placeholder="e.g., 1500"
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.illness || false}
                      onChange={(e) => handleInputChange('illness', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Illness</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.travel || false}
                      onChange={(e) => handleInputChange('travel', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Travel</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Any additional notes about your day..."
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Readiness Data'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Readiness Trend (Last 30 Days)</h3>
            {data.readinessHistory.length > 0 ? (
              <div className="h-64">
                <svg width="100%" height="100%" viewBox="0 0 800 250" className="border border-gray-200 rounded">
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map(value => (
                    <g key={value}>
                      <line
                        x1="60"
                        y1={220 - (value / 100) * 180}
                        x2="780"
                        y2={220 - (value / 100) * 180}
                        stroke="#f3f4f6"
                        strokeWidth="1"
                      />
                      <text
                        x="50"
                        y={225 - (value / 100) * 180}
                        textAnchor="end"
                        fontSize="12"
                        fill="#6b7280"
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
                      const x = 60 + (index / (arr.length - 1)) * 720
                      const y = 220 - ((entry.overall_readiness || 0) / 100) * 180
                      const color = getReadinessColor(entry.overall_readiness)

                      return (
                        <g key={entry.id}>
                          {/* Line to next point */}
                          {index < arr.length - 1 && (
                            <line
                              x1={x}
                              y1={y}
                              x2={60 + ((index + 1) / (arr.length - 1)) * 720}
                              y2={220 - ((arr[index + 1].overall_readiness || 0) / 100) * 180}
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />
                          )}
                          {/* Data point */}
                          <circle
                            cx={x}
                            cy={y}
                            r="4"
                            fill={color}
                            stroke="#fff"
                            strokeWidth="2"
                          />
                          {/* Date label for every 5th point */}
                          {index % 5 === 0 && (
                            <text
                              x={x}
                              y="240"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#6b7280"
                            >
                              {new Date(entry.recorded_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </text>
                          )}
                        </g>
                      )
                    })}

                  {/* Y-axis label */}
                  <text
                    x="15"
                    y="125"
                    textAnchor="middle"
                    fontSize="12"
                    fill="#374151"
                    transform="rotate(-90 15 125)"
                  >
                    Readiness Score
                  </text>
                </svg>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No readiness data to display chart.</p>
            )}
          </div>

          {/* History List */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Detailed History</h3>
            {data.readinessHistory.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {data.readinessHistory.map((entry) => (
                  <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">
                        {new Date(entry.recorded_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getReadinessColor(entry.overall_readiness) }}
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {entry.overall_readiness ? Math.round(entry.overall_readiness) : '--'}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-gray-600 mb-2">
                      <div>Recovery: {entry.recovery_score ? Math.round(entry.recovery_score) : '--'}</div>
                      <div>Load: {entry.load_score ? Math.round(entry.load_score) : '--'}</div>
                      <div>Wellness: {entry.wellness_score ? Math.round(entry.wellness_score) : '--'}</div>
                      <div>Fueling: {entry.fueling_score ? Math.round(entry.fueling_score) : '--'}</div>
                      <div>Context: {entry.context_score ? Math.round(entry.context_score) : '--'}</div>
                    </div>
                    {entry.notes && (
                      <p className="text-sm text-gray-600 italic">"{entry.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No readiness data recorded yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
