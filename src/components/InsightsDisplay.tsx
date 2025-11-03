'use client'

import { useState, useEffect } from 'react'
import { Insight, getAllInsights } from '@/lib/fitness-data'
import { UserPreferences } from '@/types/global'

interface InsightsDisplayProps {
  limit?: number
  showHeader?: boolean
  compact?: boolean
  preferences?: UserPreferences
  refreshTrigger?: number
}

export default function InsightsDisplay({ limit, showHeader = true, compact = false, preferences, refreshTrigger = 0 }: InsightsDisplayProps) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  const filterInsights = (insights: Insight[]): Insight[] => {
    if (!preferences?.dashboards) return insights

    return insights.filter(insight => {
      // Filter out nutrition insights if nutrition dashboard is disabled
      if (insight.type === 'nutrition' && preferences.dashboards.nutrition === false) {
        return false
      }
      // Filter out workout insights if activities or training dashboards are disabled
      if (insight.type === 'workout' && 
          (preferences.dashboards.activities === false || preferences.dashboards.training === false)) {
        return false
      }
      return true
    })
  }

  const refreshInsights = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllInsights()
      const filteredData = filterInsights(data)
      setInsights(limit ? filteredData.slice(0, limit) : filteredData)
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
      // Always fetch fresh data when refreshTrigger changes
      if (refreshTrigger === 0) {
        const now = Date.now()
        // Check if we have cached data that's still fresh
        if (insights.length > 0 && (now - lastFetchTime) < CACHE_DURATION) {
          setLoading(false)
          return
        }
      }

      try {
        setLoading(true)
        const data = await getAllInsights()
        const filteredData = filterInsights(data)
        setInsights(limit ? filteredData.slice(0, limit) : filteredData)
        setLastFetchTime(Date.now())
      } catch (err) {
        setError('Failed to load insights')
        console.error('Error fetching insights:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [limit, preferences, refreshTrigger])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-300 bg-gradient-to-r from-red-50 to-red-25'
      case 'medium': return 'border-amber-300 bg-gradient-to-r from-amber-50 to-amber-25'
      case 'low': return 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-emerald-25'
      default: return 'border-slate-300 bg-gradient-to-r from-slate-50 to-slate-25'
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

  const getPriorityAccent = (priority: string) => {
    switch (priority) {
      case 'high': return 'from-red-500 to-red-600'
      case 'medium': return 'from-amber-500 to-amber-600'
      case 'low': return 'from-emerald-500 to-emerald-600'
      default: return 'from-slate-500 to-slate-600'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'workout': return '🏃‍♂️'
      case 'nutrition': return '🥗'
      case 'health': return '❤️'
      case 'goals': return '🎯'
      case 'hydration': return '💧'
      default: return '📊'
    }
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-6' : 'p-8'} bg-gradient-to-br from-white via-slate-50/30 to-slate-100/50 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-sm`}>
        {showHeader && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              🧠
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Insights</h3>
              <p className="text-slate-600 font-medium text-sm">Smart recommendations for your performance</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-20 bg-gradient-to-r from-slate-200 to-slate-100 rounded-2xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${compact ? 'p-6' : 'p-8'} bg-gradient-to-br from-white via-slate-50/30 to-slate-100/50 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-sm`}>
        {showHeader && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              🧠
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Insights</h3>
              <p className="text-slate-600 font-medium text-sm">Smart recommendations for your performance</p>
            </div>
          </div>
        )}
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
            😵
          </div>
          <p className="text-slate-600 font-medium mb-2">Unable to load insights</p>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    )
  }

  if (insights.length === 0) {
    return (
      <div className={`${compact ? 'p-6' : 'p-8'} bg-gradient-to-br from-white via-slate-50/30 to-slate-100/50 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-sm`}>
        {showHeader && (
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              🧠
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Insights</h3>
              <p className="text-slate-600 font-medium text-sm">Smart recommendations for your performance</p>
            </div>
          </div>
        )}
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
            🎯
          </div>
          <p className="text-slate-600 font-medium mb-2">No insights available yet</p>
          <p className="text-sm text-slate-500">Start logging your activities to get personalized insights!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-6' : 'p-8'} bg-gradient-to-br from-white via-slate-50/30 to-slate-100/50 rounded-3xl shadow-xl border border-slate-200/50 backdrop-blur-sm`}>
      {showHeader && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-2xl flex items-center justify-center text-white text-xl shadow-lg">
              🧠
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">AI Insights</h3>
              <p className="text-slate-600 font-medium text-sm">Smart recommendations for your performance</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm text-slate-500 font-medium">
              {insights.length} insight{insights.length !== 1 ? 's' : ''}
            </div>
            <button
              onClick={refreshInsights}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl text-slate-700 font-semibold hover:bg-white hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <span className={loading ? 'animate-spin' : ''}>🔄</span>
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={`group relative p-6 rounded-2xl border-l-4 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-[1.02] overflow-hidden ${getPriorityColor(insight.priority)}`}
          >
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10 flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 bg-gradient-to-br ${getPriorityAccent(insight.priority)} rounded-2xl flex items-center justify-center text-white text-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110`}>
                  {getPriorityIcon(insight.priority)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-lg">{getTypeIcon(insight.type)}</div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">{insight.title}</h4>
                  <span className={`px-3 py-1 text-xs rounded-full font-semibold capitalize shadow-sm ${
                    insight.priority === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                    insight.priority === 'medium' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                    'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}>
                    {insight.priority}
                  </span>
                </div>
                <p className="text-slate-700 text-base mb-4 leading-relaxed">{insight.message}</p>
                {insight.recommendation && (
                  <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 border border-slate-200/50 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-lg flex items-center justify-center text-white text-xs">
                        💡
                      </div>
                      <p className="text-slate-800 text-sm font-bold">Recommendation</p>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{insight.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {limit && insights.length >= limit && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-105">
            View all insights →
          </button>
        </div>
      )}
    </div>
  )
}
