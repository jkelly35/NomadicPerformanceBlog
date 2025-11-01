'use client'

import { useState, useEffect } from 'react'
import { StrengthPerformanceMetric, calculateStrengthGains, getStrengthWorkouts, getStrengthPerformanceMetrics } from '@/lib/fitness-data'

interface StrengthInsightsProps {
  exerciseId?: string
  compact?: boolean
}

export default function StrengthInsights({ exerciseId, compact = false }: StrengthInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [recentWorkouts, setRecentWorkouts] = useState<any[]>([])
  const [performanceMetrics, setPerformanceMetrics] = useState<StrengthPerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInsights()
  }, [exerciseId])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const [workouts, metrics] = await Promise.all([
        getStrengthWorkouts(10),
        getStrengthPerformanceMetrics(exerciseId, 20)
      ])

      setRecentWorkouts(workouts)
      setPerformanceMetrics(metrics)

      if (exerciseId) {
        const gains = await calculateStrengthGains(exerciseId)
        setInsights(gains)
      } else {
        // General insights
        setInsights(generateGeneralInsights(workouts, metrics))
      }
    } catch (error) {
      console.error('Error loading strength insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateGeneralInsights = (workouts: any[], metrics: StrengthPerformanceMetric[]) => {
    if (!workouts.length) return null

    const totalWorkouts = workouts.length
    const completedWorkouts = workouts.filter(w => w.completed).length
    const totalVolume = workouts.reduce((sum, w) => sum + (w.total_volume || 0), 0)
    const avgRpe = workouts
      .filter(w => w.average_rpe)
      .reduce((sum, w, _, arr) => sum + w.average_rpe! / arr.length, 0)

    // Calculate volume trend
    const recentWorkouts = workouts.slice(0, 5)
    const olderWorkouts = workouts.slice(5, 10)
    const recentAvgVolume = recentWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / recentWorkouts.length
    const olderAvgVolume = olderWorkouts.length > 0
      ? olderWorkouts.reduce((sum, w) => sum + (w.total_volume || 0), 0) / olderWorkouts.length
      : recentAvgVolume

    const volumeTrend = olderAvgVolume > 0 ? ((recentAvgVolume - olderAvgVolume) / olderAvgVolume) * 100 : 0

    return {
      totalWorkouts,
      completedWorkouts,
      totalVolume,
      avgRpe,
      volumeTrend,
      completionRate: (completedWorkouts / totalWorkouts) * 100
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 5) return '📈'
    if (value < -5) return '📉'
    return '➡️'
  }

  const getTrendColor = (value: number) => {
    if (value > 5) return 'text-green-600'
    if (value < -5) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
        <div className="text-center py-8">
          <div className="text-4xl mb-2">💪</div>
          <p className="text-gray-600">No strength data available yet</p>
          <p className="text-sm text-gray-500 mt-1">Complete some workouts to see insights!</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${compact ? 'p-4' : 'p-6'} bg-white rounded-xl shadow-lg border border-gray-200`}>
      <div className="flex items-center gap-2 mb-6">
        <div className="text-2xl">📊</div>
        <h3 className="text-xl font-bold text-gray-800">
          {exerciseId ? `${insights.exercise?.name} Insights` : 'Strength Training Insights'}
        </h3>
      </div>

      <div className="space-y-6">
        {exerciseId ? (
          // Specific exercise insights
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Max Weight</h4>
                <div className="text-2xl font-bold text-blue-600">{insights.max_weight} kg</div>
                <p className="text-blue-700 text-sm">Personal record</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Strength Gains</h4>
                <div className={`text-2xl font-bold ${insights.strength_gains_percentage > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {insights.strength_gains_percentage > 0 ? '+' : ''}{insights.strength_gains_percentage}%
                </div>
                <p className="text-green-700 text-sm">Since first workout</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Total Volume</h4>
                <div className="text-2xl font-bold text-purple-600">{insights.total_volume} kg</div>
                <p className="text-purple-700 text-sm">Lifetime volume</p>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Performance Trend</h4>
              <div className="h-32 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <p>Performance chart would go here</p>
                  <p className="text-sm">Showing weight progression over time</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          // General strength insights
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Total Workouts</h4>
                <div className="text-2xl font-bold text-blue-600">{insights.totalWorkouts}</div>
                <p className="text-blue-700 text-sm">{insights.completedWorkouts} completed</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 mb-2">Completion Rate</h4>
                <div className="text-2xl font-bold text-green-600">{insights.completionRate.toFixed(1)}%</div>
                <p className="text-green-700 text-sm">Workout consistency</p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h4 className="font-semibold text-purple-800 mb-2">Total Volume</h4>
                <div className="text-2xl font-bold text-purple-600">{insights.totalVolume.toLocaleString()} kg</div>
                <p className="text-purple-700 text-sm">All workouts combined</p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h4 className="font-semibold text-orange-800 mb-2">Volume Trend</h4>
                <div className={`text-2xl font-bold ${getTrendColor(insights.volumeTrend)}`}>
                  {getTrendIcon(insights.volumeTrend)} {Math.abs(insights.volumeTrend).toFixed(1)}%
                </div>
                <p className="text-orange-700 text-sm">vs previous period</p>
              </div>
            </div>

            {/* Recent Performance */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-4">Recent Workouts</h4>
              {recentWorkouts.length > 0 ? (
                <div className="space-y-2">
                  {recentWorkouts.slice(0, 5).map((workout: any, index: number) => (
                    <div key={workout.id} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                      <div>
                        <div className="font-medium text-gray-800">{workout.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(workout.workout_date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">
                          {workout.total_volume?.toLocaleString() || 0} kg
                        </div>
                        <div className="text-sm text-gray-600">
                          {workout.completed ? '✅ Completed' : '⏳ In Progress'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No recent workouts</p>
              )}
            </div>

            {/* Recommendations */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-3">💡 Recommendations</h4>
              <div className="space-y-2 text-sm text-yellow-700">
                {insights.completionRate < 70 && (
                  <div>• Focus on workout consistency - aim for 80%+ completion rate</div>
                )}
                {insights.volumeTrend < 0 && (
                  <div>• Volume has decreased recently - consider adjusting training intensity</div>
                )}
                {insights.volumeTrend > 10 && (
                  <div>• Great progress! Consider increasing training frequency or volume</div>
                )}
                {insights.totalWorkouts < 5 && (
                  <div>• Keep building your training database - more data means better insights</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
