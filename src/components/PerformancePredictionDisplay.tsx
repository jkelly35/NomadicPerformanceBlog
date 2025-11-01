'use client'

import { useState, useEffect } from 'react'
import { PerformancePrediction, predictWorkoutPerformance } from '@/lib/fitness-data'

interface PerformancePredictionDisplayProps {
  showHeader?: boolean
  compact?: boolean
}

export default function PerformancePredictionDisplay({ showHeader = true, compact = false }: PerformancePredictionDisplayProps) {
  const [prediction, setPrediction] = useState<PerformancePrediction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true)
        const data = await predictWorkoutPerformance()
        setPrediction(data)
      } catch (err) {
        setError('Failed to load performance prediction')
        console.error('Error fetching performance prediction:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPrediction()
  }, [])

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈'
      case 'declining': return '📉'
      case 'stable': return '➡️'
      default: return '➡️'
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-600'
      case 'declining': return 'text-red-600'
      case 'stable': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🔮</div>
            <h3 className="text-lg font-bold text-gray-800">Performance Prediction</h3>
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

  if (error || !prediction) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🔮</div>
            <h3 className="text-lg font-bold text-gray-800">Performance Prediction</h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📊</div>
          <p className="text-gray-600 mb-2">Performance prediction unavailable</p>
          <p className="text-sm text-gray-500">Log more workouts to enable AI performance predictions!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🔮</div>
            <h3 className="text-xl font-bold text-gray-800">Performance Prediction</h3>
          </div>
          <div className={`text-sm font-semibold ${getConfidenceColor(prediction.confidence_level)}`}>
            {prediction.confidence_level}% confidence
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Main Prediction */}
        <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
          <div className="text-3xl font-bold text-gray-800 mb-2">
            {prediction.predicted_performance}
          </div>
          <div className="text-sm text-gray-600 mb-3">Predicted Performance Score</div>
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getTrendColor(prediction.trend_direction)} bg-white`}>
            <span>{getTrendIcon(prediction.trend_direction)}</span>
            Trend: {prediction.trend_direction}
          </div>
        </div>

        {/* Next Workout Suggestion */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">💡 Next Workout Suggestion</h4>
          <p className="text-green-700 text-sm">{prediction.next_workout_suggestion}</p>
        </div>

        {/* Influencing Factors */}
        {prediction.factors_influencing.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Key Factors</h4>
            <div className="space-y-2">
              {prediction.factors_influencing.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-blue-500">•</span>
                  {factor}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
