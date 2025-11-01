'use client'

import { useState, useEffect } from 'react'
import { predictGoalAchievement } from '@/lib/fitness-data'

interface GoalPredictionDisplayProps {
  goalId: string
  showHeader?: boolean
  compact?: boolean
}

export default function GoalPredictionDisplay({ goalId, showHeader = true, compact = false }: GoalPredictionDisplayProps) {
  const [prediction, setPrediction] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true)
        const data = await predictGoalAchievement(goalId)
        setPrediction(data)
      } catch (err) {
        setError('Failed to load goal prediction')
        console.error('Error fetching goal prediction:', err)
      } finally {
        setLoading(false)
      }
    }

    if (goalId) {
      fetchPrediction()
    }
  }, [goalId])

  const getTrajectoryColor = (trajectory: string) => {
    switch (trajectory) {
      case 'ahead': return 'text-green-600 bg-green-100'
      case 'behind': return 'text-red-600 bg-red-100'
      case 'on_track': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
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
            <div className="text-2xl">🎯</div>
            <h3 className="text-lg font-bold text-gray-800">Goal Prediction</h3>
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
            <div className="text-2xl">🎯</div>
            <h3 className="text-lg font-bold text-gray-800">Goal Prediction</h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📈</div>
          <p className="text-gray-600 mb-2">Goal prediction unavailable</p>
          <p className="text-sm text-gray-500">Log more progress to enable AI goal predictions!</p>
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
            <h3 className="text-xl font-bold text-gray-800">Goal Prediction</h3>
          </div>
          <div className={`text-sm font-semibold px-3 py-1 rounded-full ${getTrajectoryColor(prediction.current_trajectory)}`}>
            {prediction.current_trajectory.replace('_', ' ').toUpperCase()}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Estimated Completion */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">📅 Estimated Completion</h4>
          <div className="text-2xl font-bold text-blue-600">{prediction.estimated_completion_date}</div>
          <p className="text-blue-700 text-sm mt-1">
            {prediction.confidence_percentage}% confidence
          </p>
        </div>

        {/* Required Progress */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2">📈 Required Weekly Progress</h4>
          <div className="text-2xl font-bold text-green-600">
            {prediction.required_weekly_progress}%
          </div>
          <p className="text-green-700 text-sm mt-1">To stay on track</p>
        </div>

        {/* Recommendations */}
        {prediction.recommendations.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Recommendations</h4>
            <div className="space-y-1">
              {prediction.recommendations.map((rec: string, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm text-yellow-700">
                  <span className="text-yellow-500">•</span>
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
