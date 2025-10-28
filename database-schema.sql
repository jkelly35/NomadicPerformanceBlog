-- Fitness Dashboard Database Schema
-- Run these commands in your Supabase SQL editor

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  calories_burned INTEGER,
  intensity TEXT CHECK (intensity IN ('Low', 'Medium', 'High')),
  notes TEXT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Health metrics table
CREATE TABLE IF NOT EXISTS health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'resting_hr', 'sleep_quality', 'body_fat', etc.
  value DECIMAL NOT NULL,
  unit TEXT, -- 'bpm', '%', 'kg', etc.
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, metric_type, recorded_date)
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'weekly_workouts', 'monthly_minutes', 'strength', etc.
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  period TEXT NOT NULL, -- 'weekly', 'monthly', 'yearly'
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User stats table (calculated/aggregated data)
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stat_type TEXT NOT NULL, -- 'fitness_score', 'recovery_score', 'streak_days'
  value DECIMAL NOT NULL,
  calculated_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, stat_type, calculated_date)
);

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date DESC);
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, recorded_date DESC);
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_user_stats_user_date ON user_stats(user_id, calculated_date DESC);

-- Insert some sample data for testing (optional)
-- You can remove this section after testing
INSERT INTO workouts (user_id, activity_type, duration_minutes, calories_burned, intensity, workout_date)
SELECT
  auth.uid(),
  unnest(ARRAY['Trail Running', 'Strength Training', 'Yoga & Mobility', 'Hiking', 'Core Workout']),
  unnest(ARRAY[45, 60, 30, 120, 20]),
  unnest(ARRAY[380, 250, 120, 520, 150]),
  unnest(ARRAY['High', 'Medium', 'Low', 'High', 'Medium']),
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 4)
WHERE auth.uid() IS NOT NULL;

INSERT INTO health_metrics (user_id, metric_type, value, unit, recorded_date)
SELECT
  auth.uid(),
  unnest(ARRAY['resting_hr', 'sleep_quality', 'body_fat']),
  unnest(ARRAY[58, 87, 12.5]),
  unnest(ARRAY['bpm', '%', '%']),
  CURRENT_DATE
WHERE auth.uid() IS NOT NULL;

INSERT INTO goals (user_id, goal_type, target_value, current_value, period)
SELECT
  auth.uid(),
  unnest(ARRAY['weekly_workouts', 'monthly_minutes', 'strength_goals']),
  unnest(ARRAY[6, 2000, 4]),
  unnest(ARRAY[5, 1420, 3]),
  unnest(ARRAY['weekly', 'monthly', 'monthly'])
WHERE auth.uid() IS NOT NULL;

INSERT INTO user_stats (user_id, stat_type, value, calculated_date)
SELECT
  auth.uid(),
  unnest(ARRAY['fitness_score', 'recovery_score', 'streak_days']),
  unnest(ARRAY[85, 92, 7]),
  CURRENT_DATE
WHERE auth.uid() IS NOT NULL;
