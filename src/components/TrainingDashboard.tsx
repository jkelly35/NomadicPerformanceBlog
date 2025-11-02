'use client';

import { useState, useEffect } from 'react';
import { StatsCardSkeleton, WorkoutCardSkeleton, HeroSkeleton } from './SkeletonLoaders';
import WeatherWidget from './WeatherWidget';
import TrainingInsightsDisplay from './TrainingInsightsDisplay';
import TrainingOptimizationDisplay from './TrainingOptimizationDisplay';
import TrainingCalendar from './TrainingCalendar';
import TrainingPlanBuilder from './TrainingPlanBuilder';
import WorkoutTracker from './WorkoutTracker';
import StrengthInsights from './StrengthInsights';
import ExerciseLibrary from './ExerciseLibrary';
import { getUserTrainingPlans, getStrengthWorkouts, TrainingPlan } from '@/lib/fitness-data';

interface Workout {
  id: string;
  workout_name: string;
  workout_date: string;
  duration_minutes: number;
  workout_type: string;
  notes: string;
}

interface Goal {
  id: string;
  goal_name: string;
  description: string;
  current_value: number;
  target_value: number;
  target_unit: string;
}

interface TrainingDashboardProps {
  initialWorkouts: Workout[];
  initialGoals: Goal[];
  initialWeeklyStats: {
    count: number;
    totalMinutes: number;
  };
  isLoading?: boolean;
}

export default function TrainingDashboard({
  initialWorkouts,
  initialGoals,
  initialWeeklyStats,
  isLoading = false
}: TrainingDashboardProps) {
  const [workouts] = useState<Workout[]>(initialWorkouts);
  const [goals] = useState<Goal[]>(initialGoals);
  const [weeklyStats] = useState(initialWeeklyStats);
  const [activeTab, setActiveTab] = useState<'overview' | 'calendar' | 'plans' | 'workouts' | 'insights' | 'exercises'>('overview');
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [strengthWorkouts, setStrengthWorkouts] = useState<any[]>([]);
  const [showPlanBuilder, setShowPlanBuilder] = useState(false);
  const [showWorkoutTracker, setShowWorkoutTracker] = useState(false);
  const [selectedPlanDay, setSelectedPlanDay] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'calendar' || activeTab === 'plans') {
      loadUserPlans();
    }
    if (activeTab === 'workouts' || activeTab === 'insights') {
      loadStrengthWorkouts();
    }
  }, [activeTab]);

  const loadUserPlans = async () => {
    try {
      const plans = await getUserTrainingPlans();
      setUserPlans(plans);
    } catch (error) {
      console.error('Error loading user plans:', error);
    }
  };

  const loadStrengthWorkouts = async () => {
    try {
      const workouts = await getStrengthWorkouts();
      setStrengthWorkouts(workouts);
    } catch (error) {
      console.error('Error loading strength workouts:', error);
    }
  };

  const handleCalendarDayClick = (date: string, dayData: any) => {
    if (dayData?.day) {
      setSelectedPlanDay(dayData.day);
      setShowWorkoutTracker(true);
    }
  };

  const handlePlanSave = (plan: TrainingPlan) => {
    setShowPlanBuilder(false);
    loadUserPlans();
  };

  const handleWorkoutSave = () => {
    setShowWorkoutTracker(false);
    loadStrengthWorkouts();
  };

  const tabs: Array<{ id: 'overview' | 'calendar' | 'plans' | 'workouts' | 'insights' | 'exercises'; label: string; icon: string }> = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'calendar', label: 'Training Calendar', icon: '📅' },
    { id: 'plans', label: 'Training Plans', icon: '📋' },
    { id: 'workouts', label: 'Workout Tracker', icon: '💪' },
    { id: 'insights', label: 'Strength Insights', icon: '📈' },
    { id: 'exercises', label: 'Exercise Library', icon: '🏋️' }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-0">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Hero Section Skeleton */}
          <div className="mb-8">
            <HeroSkeleton />
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </div>

          {/* Recent Workouts Skeleton */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <WorkoutCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-20 md:pb-0">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">💪 Training Dashboard</h1>
                <p className="text-orange-100 text-lg">Plan strength training, track exercises, and build power</p>
                <div className="flex items-center mt-4 space-x-4">
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">🏋️ Total Workouts: {workouts?.length || 0}</span>
                  </div>
                  <div className="flex items-center bg-white/10 rounded-full px-3 py-1">
                    <span className="text-sm">📅 This Week: {weeklyStats.count} workouts</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="text-6xl">💪</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <>
              {/* Weather Widget */}
              <div className="mb-8">
                <WeatherWidget showRecommendations={true} />
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Total Workouts</p>
                      <p className="text-3xl font-bold text-orange-600">{workouts?.length || 0}</p>
                      <p className="text-sm text-gray-500">All training sessions</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-full">
                      <span className="text-2xl">🏋️</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Active Goals</p>
                      <p className="text-3xl font-bold text-green-600">{goals?.length || 0}</p>
                      <p className="text-sm text-gray-500">Training objectives</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-full">
                      <span className="text-2xl">🎯</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Weekly Minutes</p>
                      <p className="text-3xl font-bold text-purple-600">{weeklyStats.totalMinutes}</p>
                      <p className="text-sm text-gray-500">Training time</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-full">
                      <span className="text-2xl">⏱️</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Training Insights */}
              <div className="mb-8">
                <TrainingInsightsDisplay showHeader={true} compact={false} />
              </div>

              {/* Training Optimization */}
              <div className="mb-8">
                <TrainingOptimizationDisplay showHeader={true} compact={false} />
              </div>

              {/* Recent Workouts */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Workouts</h2>
                {workouts && workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.slice(0, 5).map((workout) => (
                      <div key={workout.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{workout.workout_name || 'Workout'}</h3>
                            <p className="text-blue-600 text-sm font-medium">{new Date(workout.workout_date).toLocaleDateString()}</p>
                            {workout.duration_minutes && (
                              <p className="text-green-600 text-sm font-medium">{workout.duration_minutes} minutes</p>
                            )}
                            {workout.workout_type && (
                              <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full">
                                {workout.workout_type}
                              </span>
                            )}
                          </div>
                        </div>
                        {workout.notes && (
                          <p className="text-gray-600 text-sm mt-3">{workout.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏋️</div>
                    <p className="text-gray-500 text-lg">No workouts logged yet. Start building your strength!</p>
                    <p className="text-gray-400 text-sm mt-2">Track your training sessions and monitor your progress</p>
                  </div>
                )}
              </div>

              {/* Active Goals */}
              {goals && goals.length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Active Training Goals</h2>
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">{goal.goal_name}</h3>
                        <p className="text-gray-600 text-sm mb-3">{goal.description}</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Progress: {goal.current_value || 0} / {goal.target_value} {goal.target_unit}</span>
                            <span>{Math.round(((goal.current_value || 0) / goal.target_value) * 100)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${Math.min(((goal.current_value || 0) / goal.target_value) * 100, 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'plans' && (
            <TrainingPlanBuilder />
          )}

          {activeTab === 'calendar' && (
            <TrainingCalendar />
          )}

          {activeTab === 'workouts' && (
            <WorkoutTracker />
          )}

          {activeTab === 'insights' && (
            <StrengthInsights />
          )}

          {activeTab === 'exercises' && (
            <ExerciseLibrary />
          )}
        </div>
      </main>
    </div>
  );
}
