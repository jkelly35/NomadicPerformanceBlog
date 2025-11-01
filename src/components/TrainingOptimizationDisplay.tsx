'use client'

import { useState, useEffect } from 'react'
import { TrainingOptimization, optimizeTrainingSchedule } from '@/lib/fitness-data'

interface TrainingOptimizationDisplayProps {
  showHeader?: boolean
  compact?: boolean
}

export default function TrainingOptimizationDisplay({ showHeader = true, compact = false }: TrainingOptimizationDisplayProps) {
  const [optimization, setOptimization] = useState<TrainingOptimization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOptimization = async () => {
      try {
        setLoading(true)
        const data = await optimizeTrainingSchedule()
        setOptimization(data)
      } catch (err) {
        setError('Failed to load training optimization')
        console.error('Error fetching training optimization:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchOptimization()
  }, [])

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLoadColor = (score: number) => {
    if (score >= 80) return 'text-red-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-green-600'
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🎯</div>
            <h3 className="text-lg font-bold text-gray-800">Training Optimization</h3>
          </div>
        )}
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !optimization) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🎯</div>
            <h3 className="text-lg font-bold text-gray-800">Training Optimization</h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-gray-600 mb-2">Training optimization unavailable</p>
          <p className="text-sm text-gray-500">Log more workouts to enable AI training optimization!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🎯</div>
            <h3 className="text-xl font-bold text-gray-800">Training Optimization</h3>
          </div>
          <div className={`text-sm font-semibold ${getLoadColor(optimization.training_load_score)}`}>
            Load: {optimization.training_load_score}/100
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Optimal Training Time */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">⏰ Optimal Training Time</h4>
          <div className="text-2xl font-bold text-blue-600">{optimization.optimal_training_time}</div>
          <p className="text-blue-700 text-sm mt-1">Based on your performance patterns</p>
        </div>

        {/* Recommended Intensity */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-semibold text-purple-800 mb-2">💪 Recommended Intensity</h4>
          <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getIntensityColor(optimization.recommended_intensity)}`}>
            {optimization.recommended_intensity}
          </div>
          <p className="text-purple-700 text-sm mt-2">{optimization.next_session_focus}</p>
        </div>

        {/* Recovery Information */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">🔄 Recovery Recommendation</h4>
          <div className="text-lg font-bold text-green-600">
            {optimization.recovery_days_needed} day{optimization.recovery_days_needed !== 1 ? 's' : ''} rest
          </div>
          <p className="text-green-700 text-sm mt-1">Before next intense session</p>
        </div>

        {/* Risk Factors */}
        {optimization.risk_factors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Risk Factors</h4>
            <div className="space-y-1">
              {optimization.risk_factors.map((risk, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                  <span className="text-red-500">•</span>
                  {risk}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
