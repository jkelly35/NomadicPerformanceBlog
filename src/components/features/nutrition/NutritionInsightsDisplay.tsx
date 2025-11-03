'use client'

import { useState, useEffect } from 'react'
import { Insight, getAllInsights } from '@/lib/fitness-data'

interface NutritionInsightsDisplayProps {
  showHeader?: boolean
  compact?: boolean
}

export default function NutritionInsightsDisplay({ showHeader = true, compact = false }: NutritionInsightsDisplayProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const refreshInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllInsights()
      setInsights(data)
      setLastFetchTime(Date.now())
    } catch (err) {
      setError('Failed to refresh insights')
      console.error('Error refreshing insights:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchInsights = async () => {
      const now = Date.now()

      // Check if we have cached data that's still fresh
      if (insights.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await getAllInsights()
        setInsights(data)
        setLastFetchTime(now)
      } catch (err) {
        setError('Failed to load insights')
        console.error('Error fetching insights:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  // Filter to only nutrition-related insights
  const nutritionInsights = insights.filter(insight =>
    insight.type === 'nutrition' || insight.type === 'hydration'
  )

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-green-200 bg-green-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return '🚨'
      case 'medium': return '⚠️'
      case 'low': return '💡'
      default: return '💡'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'nutrition': return '🥗'
      case 'hydration': return '💧'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🥗</div>
            <h3 className="text-lg font-bold text-gray-800">Nutrition Insights</h3>
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

  if (error) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center gap-2 mb-4">
            <div className="text-2xl">🥗</div>
            <h3 className="text-lg font-bold text-gray-800">Nutrition Insights</h3>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">😵</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (nutritionInsights.length === 0) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        {showHeader && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="text-2xl">🥗</div>
              <h3 className="text-xl font-bold text-gray-800">Nutrition Insights</h3>
            </div>
            <button
              onClick={refreshInsights}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        )}
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🥗</div>
          <p className="text-gray-600 mb-2">No nutrition insights available yet</p>
          <p className="text-sm text-gray-500">Start logging meals and hydration to get personalized nutrition insights!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="text-2xl">🥗</div>
            <h3 className="text-xl font-bold text-gray-800">Nutrition Insights</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-500">
              {nutritionInsights.length} insight{nutritionInsights.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={refreshInsights}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {nutritionInsights.map((insight) => (
          <div
            key={insight.id}
            className={`p-4 rounded-lg border-l-4 shadow-sm ${getPriorityColor(insight.priority)}`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="text-lg">{getPriorityIcon(insight.priority)}</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="text-sm">{getTypeIcon(insight.type)}</div>
                  <h4 className="font-semibold text-gray-800 text-sm">{insight.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                    insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-gray-700 text-sm mb-2">{insight.message}</p>
                {insight.recommendation && (
                  <div className="bg-white bg-opacity-50 rounded p-3 border border-gray-200">
                    <p className="text-gray-800 text-sm font-medium">💡 Recommendation:</p>
                    <p className="text-gray-700 text-sm mt-1">{insight.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
