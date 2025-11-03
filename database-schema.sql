-- User preferences table for storing dietary preferences and other user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_preferences TEXT[] DEFAULT '{}', -- Array of dietary preferences
  activities TEXT[] DEFAULT '{}', -- Array of preferred activities
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  preferences JSONB, -- Dashboard preferences and other settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to get or create user preferences
CREATE OR REPLACE FUNCTION get_or_create_user_preferences()
RETURNS user_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_prefs user_preferences;
BEGIN
  -- Try to get existing preferences
  SELECT * INTO user_prefs
  FROM user_preferences
  WHERE user_id = auth.uid();

  -- If no preferences exist, create default ones
  IF user_prefs IS NULL THEN
    INSERT INTO user_preferences (user_id, dietary_preferences, activities)
    VALUES (auth.uid(), '{}', '{}')
    RETURNING * INTO user_prefs;
  END IF;

  RETURN user_prefs;
END;
$$;

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
  goal_type TEXT NOT NULL, -- 'weekly_workouts', 'monthly_minutes', 'strength', 'weight_loss', etc.
  target_value DECIMAL NOT NULL,
  current_value DECIMAL DEFAULT 0,
  period TEXT, -- 'weekly', 'monthly', 'yearly' (optional for non-time-based goals)
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add new columns to goals table for enhanced goal management
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_date DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS priority TEXT CHECK (priority IN ('low', 'medium', 'high'));

-- Make period column optional for non-time-based goals
ALTER TABLE goals ALTER COLUMN period DROP NOT NULL;

-- Events table for tracking upcoming races, competitions, etc.
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_type TEXT, -- 'marathon', 'race', 'competition', 'triathlon', etc.
  location TEXT,
  description TEXT,
  distance TEXT, -- '5k', '10k', 'half-marathon', 'marathon', etc.
  target_time TEXT, -- target finish time
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

-- Nutrition tracking tables

-- Food items table (for storing nutritional information of foods)
CREATE TABLE IF NOT EXISTS food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL NOT NULL,
  serving_unit TEXT NOT NULL, -- 'g', 'ml', 'cup', 'piece', etc.
  calories_per_serving DECIMAL NOT NULL,
  protein_grams DECIMAL DEFAULT 0,
  carbs_grams DECIMAL DEFAULT 0,
  fat_grams DECIMAL DEFAULT 0,
  fiber_grams DECIMAL DEFAULT 0,
  sugar_grams DECIMAL DEFAULT 0,
  sodium_mg DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(name, brand)
);

-- Meals table (user's logged meals)
CREATE TABLE IF NOT EXISTS meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  meal_time TIME,
  total_calories DECIMAL DEFAULT 0,
  total_protein DECIMAL DEFAULT 0,
  total_carbs DECIMAL DEFAULT 0,
  total_fat DECIMAL DEFAULT 0,
  total_fiber DECIMAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meal items table (foods consumed in each meal)
CREATE TABLE IF NOT EXISTS meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL, -- multiplier for serving size
  custom_calories DECIMAL,
  custom_protein DECIMAL,
  custom_carbs DECIMAL,
  custom_fat DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meal templates table (reusable meal presets)
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  description TEXT,
  total_calories DECIMAL DEFAULT 0,
  total_protein DECIMAL DEFAULT 0,
  total_carbs DECIMAL DEFAULT 0,
  total_fat DECIMAL DEFAULT 0,
  total_fiber DECIMAL DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meal template items table (foods in each meal template)
CREATE TABLE IF NOT EXISTS meal_template_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_template_id UUID REFERENCES meal_templates(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL, -- multiplier for serving size
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Nutrition goals table
CREATE TABLE IF NOT EXISTS nutrition_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL, -- 'daily_calories', 'protein_target', 'carb_target', 'fat_target'
  target_value DECIMAL NOT NULL,
  period TEXT NOT NULL DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT true,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Micronutrients table (vitamins, minerals, electrolytes)
CREATE TABLE IF NOT EXISTS micronutrients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nutrient_code TEXT NOT NULL UNIQUE, -- 'VIT_A', 'IRON', 'SODIUM', etc.
  nutrient_name TEXT NOT NULL,
  nutrient_category TEXT NOT NULL, -- 'vitamin', 'mineral', 'electrolyte', 'other'
  unit TEXT NOT NULL, -- 'mg', 'mcg', 'IU', 'mmol/L', etc.
  rda_male DECIMAL, -- Recommended Daily Allowance for males
  rda_female DECIMAL, -- Recommended Daily Allowance for females
  upper_limit DECIMAL, -- Upper safe limit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Food micronutrients table (micronutrient content per food item)
CREATE TABLE IF NOT EXISTS food_micronutrients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  micronutrient_id UUID REFERENCES micronutrients(id) ON DELETE CASCADE,
  amount_per_serving DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(food_item_id, micronutrient_id)
);

-- Saved foods table (user's favorite/quick access foods)
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, food_item_id)
);

-- Hydration tracking table
CREATE TABLE IF NOT EXISTS hydration_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_ml INTEGER NOT NULL,
  beverage_type TEXT NOT NULL, -- 'water', 'coffee', 'tea', 'juice', 'soda', etc.
  logged_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Caffeine tracking table
CREATE TABLE IF NOT EXISTS caffeine_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_mg INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'coffee', 'tea', 'energy_drink', 'supplement', etc.
  logged_time TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Habit patterns table (for pattern recognition)
CREATE TABLE IF NOT EXISTS habit_patterns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_type TEXT NOT NULL, -- 'skipped_meal', 'late_snack', 'low_hydration', etc.
  pattern_description TEXT NOT NULL,
  frequency_score DECIMAL DEFAULT 0, -- 0-1 score of how frequent this pattern is
  last_detected DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User insights table (learning insights and recommendations)
CREATE TABLE IF NOT EXISTS user_insights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'weekly_summary', 'recommendation', 'correlation', 'habit_nudge'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB, -- Additional structured data for the insight
  priority INTEGER DEFAULT 1, -- 1=low, 2=medium, 3=high
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE -- When this insight becomes stale
);

-- Correlation analysis table (relationships between metrics)
CREATE TABLE IF NOT EXISTS metric_correlations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_metric TEXT NOT NULL, -- 'sleep_hours', 'calorie_intake', etc.
  secondary_metric TEXT NOT NULL, -- 'workout_performance', 'next_day_calories', etc.
  correlation_coefficient DECIMAL NOT NULL, -- -1 to 1 (Pearson's correlation)
  confidence_level DECIMAL NOT NULL, -- 0-1 confidence in the correlation
  sample_size INTEGER NOT NULL, -- Number of data points used
  time_window_days INTEGER NOT NULL, -- Analysis window in days
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  is_significant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, primary_metric, secondary_metric, time_window_days)
);

-- Readiness metrics table (for athlete readiness scoring)
CREATE TABLE IF NOT EXISTS readiness_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Recovery metrics (45% weight)
  hrv DECIMAL, -- Heart rate variability (ms)
  resting_hr DECIMAL, -- Resting heart rate (bpm)
  sleep_hours DECIMAL, -- Hours of sleep
  sleep_quality INTEGER CHECK (sleep_quality >= 0 AND sleep_quality <= 100), -- Sleep quality score 0-100

  -- Subjective wellness (20% weight)
  fatigue INTEGER CHECK (fatigue >= 1 AND fatigue <= 5), -- 1-5 scale (1=very tired, 5=very energetic)
  soreness INTEGER CHECK (soreness >= 1 AND soreness <= 5), -- 1-5 scale (1=no soreness, 5=severe soreness)
  mood INTEGER CHECK (mood >= 1 AND mood <= 5), -- 1-5 scale (1=very bad, 5=excellent)
  stress INTEGER CHECK (stress >= 1 AND stress <= 5), -- 1-5 scale (1=no stress, 5=extreme stress)

  -- Fueling and hydration (10% weight)
  energy_intake DECIMAL, -- Calories consumed (kcal)
  energy_burn DECIMAL, -- Calories burned (kcal)
  hydration_ml DECIMAL, -- Hydration amount (ml)

  -- Training load (20% weight)
  training_load DECIMAL, -- RPE × duration (arbitrary units)
  acute_load DECIMAL, -- 7-day training load
  chronic_load DECIMAL, -- 28-day training load

  -- Environmental/context factors (5% weight)
  temperature DECIMAL, -- Ambient temperature (°C)
  altitude DECIMAL, -- Altitude (meters)
  illness BOOLEAN DEFAULT false, -- Illness flag
  travel BOOLEAN DEFAULT false, -- Travel/recovery disruption flag

  -- Calculated scores
  recovery_score DECIMAL, -- 0-100 score for recovery category
  wellness_score DECIMAL, -- 0-100 score for subjective wellness
  fueling_score DECIMAL, -- 0-100 score for fueling/hydration
  load_score DECIMAL, -- 0-100 score for training load
  context_score DECIMAL, -- 0-100 score for environmental factors
  overall_readiness DECIMAL, -- 0-100 final readiness score

  notes TEXT, -- Optional notes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, recorded_date)
);

-- Enhanced food_items table with additional micronutrient fields
-- Note: We'll add micronutrient columns to existing food_items via ALTER TABLE in migration

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own health metrics" ON health_metrics;
CREATE POLICY "Users can view own health metrics" ON health_metrics
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own health metrics" ON health_metrics;
CREATE POLICY "Users can insert own health metrics" ON health_metrics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own health metrics" ON health_metrics;
CREATE POLICY "Users can update own health metrics" ON health_metrics
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
CREATE POLICY "Users can manage own goals" ON goals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own events" ON events;
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own events" ON events;
CREATE POLICY "Users can manage own events" ON events
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own stats" ON user_stats;
CREATE POLICY "Users can view own stats" ON user_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own stats" ON user_stats;
CREATE POLICY "Users can manage own stats" ON user_stats
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for nutrition tables
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nutrition tables
DROP POLICY IF EXISTS "Food items are viewable by all authenticated users" ON food_items;
CREATE POLICY "Food items are viewable by all authenticated users" ON food_items
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can manage food items" ON food_items;
CREATE POLICY "Authenticated users can manage food items" ON food_items
  FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can view own meals" ON meals;
CREATE POLICY "Users can view own meals" ON meals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meals" ON meals;
CREATE POLICY "Users can manage own meals" ON meals
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own meal items" ON meal_items;
CREATE POLICY "Users can view own meal items" ON meal_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_items.meal_id
      AND meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own meal items" ON meal_items;
CREATE POLICY "Users can manage own meal items" ON meal_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meals
      WHERE meals.id = meal_items.meal_id
      AND meals.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own nutrition goals" ON nutrition_goals;
CREATE POLICY "Users can view own nutrition goals" ON nutrition_goals
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own nutrition goals" ON nutrition_goals;
CREATE POLICY "Users can manage own nutrition goals" ON nutrition_goals
  FOR ALL USING (auth.uid() = user_id);

-- Enable RLS for meal templates tables
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_template_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meal templates
DROP POLICY IF EXISTS "Users can view own meal templates" ON meal_templates;
CREATE POLICY "Users can view own meal templates" ON meal_templates
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own meal templates" ON meal_templates;
CREATE POLICY "Users can manage own meal templates" ON meal_templates
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own meal template items" ON meal_template_items;
CREATE POLICY "Users can view own meal template items" ON meal_template_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = meal_template_items.meal_template_id
      AND meal_templates.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage own meal template items" ON meal_template_items;
CREATE POLICY "Users can manage own meal template items" ON meal_template_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM meal_templates
      WHERE meal_templates.id = meal_template_items.meal_template_id
      AND meal_templates.user_id = auth.uid()
    )
  );

-- Enable RLS for new advanced nutrition tables
ALTER TABLE micronutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_micronutrients ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE caffeine_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE metric_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE readiness_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for micronutrients (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view micronutrients" ON micronutrients;
CREATE POLICY "Anyone can view micronutrients" ON micronutrients
  FOR SELECT USING (true);

-- RLS Policies for food micronutrients (public read)
DROP POLICY IF EXISTS "Anyone can view food micronutrients" ON food_micronutrients;
CREATE POLICY "Anyone can view food micronutrients" ON food_micronutrients
  FOR SELECT USING (true);

-- RLS Policies for saved foods
DROP POLICY IF EXISTS "Users can manage own saved foods" ON saved_foods;
CREATE POLICY "Users can manage own saved foods" ON saved_foods
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for hydration logs
DROP POLICY IF EXISTS "Users can manage own hydration logs" ON hydration_logs;
CREATE POLICY "Users can manage own hydration logs" ON hydration_logs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for caffeine logs
DROP POLICY IF EXISTS "Users can manage own caffeine logs" ON caffeine_logs;
CREATE POLICY "Users can manage own caffeine logs" ON caffeine_logs
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for habit patterns
DROP POLICY IF EXISTS "Users can manage own habit patterns" ON habit_patterns;
CREATE POLICY "Users can manage own habit patterns" ON habit_patterns
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for user insights
DROP POLICY IF EXISTS "Users can manage own insights" ON user_insights;
CREATE POLICY "Users can manage own insights" ON user_insights
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for metric correlations
DROP POLICY IF EXISTS "Users can manage own correlations" ON metric_correlations;
CREATE POLICY "Users can manage own correlations" ON metric_correlations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for readiness metrics
DROP POLICY IF EXISTS "Users can manage own readiness metrics" ON readiness_metrics;
CREATE POLICY "Users can manage own readiness metrics" ON readiness_metrics
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
DROP INDEX IF EXISTS idx_workouts_user_date;
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date DESC);

DROP INDEX IF EXISTS idx_health_metrics_user_date;
CREATE INDEX idx_health_metrics_user_date ON health_metrics(user_id, recorded_date DESC);

DROP INDEX IF EXISTS idx_goals_user_active;
CREATE INDEX idx_goals_user_active ON goals(user_id, is_active) WHERE is_active = true;

DROP INDEX IF EXISTS idx_user_stats_user_date;
CREATE INDEX idx_user_stats_user_date ON user_stats(user_id, calculated_date DESC);

-- Nutrition table indexes
DROP INDEX IF EXISTS idx_meals_user_date;
CREATE INDEX idx_meals_user_date ON meals(user_id, meal_date DESC);

DROP INDEX IF EXISTS idx_meal_items_meal;
CREATE INDEX idx_meal_items_meal ON meal_items(meal_id);

DROP INDEX IF EXISTS idx_nutrition_goals_user_active;
CREATE INDEX idx_nutrition_goals_user_active ON nutrition_goals(user_id, is_active) WHERE is_active = true;

DROP INDEX IF EXISTS idx_food_items_name;
CREATE INDEX idx_food_items_name ON food_items(name);

DROP INDEX IF EXISTS idx_readiness_metrics_user_date;
CREATE INDEX idx_readiness_metrics_user_date ON readiness_metrics(user_id, recorded_date DESC);

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

-- Insert sample micronutrients data
INSERT INTO micronutrients (nutrient_code, nutrient_name, nutrient_category, unit, rda_male, rda_female, upper_limit) VALUES
  ('VIT_A', 'Vitamin A', 'vitamin', 'mcg', 900, 700, 10000),
  ('VIT_C', 'Vitamin C', 'vitamin', 'mg', 90, 75, 2000),
  ('VIT_D', 'Vitamin D', 'vitamin', 'IU', 600, 600, 4000),
  ('VIT_E', 'Vitamin E', 'vitamin', 'mg', 15, 15, 1000),
  ('VIT_K', 'Vitamin K', 'vitamin', 'mcg', 120, 90, null),
  ('THIAMIN', 'Thiamin (B1)', 'vitamin', 'mg', 1.2, 1.1, null),
  ('RIBOFLAVIN', 'Riboflavin (B2)', 'vitamin', 'mg', 1.3, 1.1, null),
  ('NIACIN', 'Niacin (B3)', 'vitamin', 'mg', 16, 14, 35),
  ('VIT_B6', 'Vitamin B6', 'vitamin', 'mg', 1.7, 1.5, 100),
  ('FOLATE', 'Folate', 'vitamin', 'mcg', 400, 400, 1000),
  ('VIT_B12', 'Vitamin B12', 'vitamin', 'mcg', 2.4, 2.4, null),
  ('CALCIUM', 'Calcium', 'mineral', 'mg', 1000, 1000, 2500),
  ('IRON', 'Iron', 'mineral', 'mg', 8, 18, 45),
  ('MAGNESIUM', 'Magnesium', 'mineral', 'mg', 400, 310, 350),
  ('PHOSPHORUS', 'Phosphorus', 'mineral', 'mg', 700, 700, 4000),
  ('POTASSIUM', 'Potassium', 'mineral', 'mg', 4700, 4700, null),
  ('SODIUM', 'Sodium', 'mineral', 'mg', 2300, 2300, null),
  ('ZINC', 'Zinc', 'mineral', 'mg', 11, 8, 40),
  ('COPPER', 'Copper', 'mineral', 'mcg', 900, 900, 10000),
  ('SELENIUM', 'Selenium', 'mineral', 'mcg', 55, 55, 400),
  ('CHLORIDE', 'Chloride', 'electrolyte', 'mg', 2300, 2300, 3600),
  ('CAFFEINE', 'Caffeine', 'other', 'mg', null, null, 400)
ON CONFLICT (nutrient_code) DO NOTHING;

INSERT INTO health_metrics (user_id, metric_type, value, unit, recorded_date)
SELECT
  auth.uid(),
  unnest(ARRAY['resting_hr', 'sleep_quality', 'body_fat']),
  unnest(ARRAY[58, 87, 12.5]),
  unnest(ARRAY['bpm', '%', '%']),
  CURRENT_DATE
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, metric_type, recorded_date) DO NOTHING;

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
WHERE auth.uid() IS NOT NULL
ON CONFLICT (user_id, stat_type, calculated_date) DO NOTHING;

-- Fix data types for nutrition fields (change INTEGER to DECIMAL)
ALTER TABLE meals ALTER COLUMN total_calories TYPE DECIMAL;
ALTER TABLE meal_templates ALTER COLUMN total_calories TYPE DECIMAL;
ALTER TABLE food_items ALTER COLUMN calories_per_serving TYPE DECIMAL;
ALTER TABLE meal_items ALTER COLUMN custom_calories TYPE DECIMAL;
INSERT INTO food_items (name, brand, serving_size, serving_unit, calories_per_serving, protein_grams, carbs_grams, fat_grams, fiber_grams)
VALUES
  ('Greek Yogurt', 'Chobani', 170, 'g', 120, 12, 8, 5, 0),
  ('Chicken Breast', 'Organic', 100, 'g', 165, 31, 0, 3.6, 0),
  ('Brown Rice', 'Organic', 45, 'g', 160, 3.5, 33, 1.5, 1.8),
  ('Spinach', 'Fresh', 30, 'g', 7, 0.9, 1.1, 0.1, 0.7),
  ('Banana', 'Fresh', 118, 'g', 105, 1.3, 27, 0.4, 3.1),
  ('Almonds', 'Raw', 28, 'g', 161, 6, 6, 14, 3.5),
  ('Salmon', 'Wild', 100, 'g', 206, 22, 0, 13, 0),
  ('Sweet Potato', 'Organic', 130, 'g', 112, 2, 26, 0.1, 3.8),
  ('Eggs', 'Organic', 50, 'g', 78, 6.3, 0.6, 5.3, 0),
  ('Oatmeal', 'Steel Cut', 40, 'g', 150, 5, 27, 2.5, 4)
ON CONFLICT (name) DO NOTHING;

-- Insert sample meals
INSERT INTO meals (user_id, meal_type, meal_date, total_calories, total_protein, total_carbs, total_fat, notes)
SELECT
  auth.uid(),
  unnest(ARRAY['breakfast', 'lunch', 'dinner', 'snack']),
  CURRENT_DATE,
  unnest(ARRAY[350, 520, 680, 200]),
  unnest(ARRAY[25, 35, 45, 8]),
  unnest(ARRAY[45, 55, 65, 25]),
  unnest(ARRAY[12, 18, 22, 10]),
  unnest(ARRAY['Greek yogurt with banana', 'Chicken salad with rice', 'Salmon with sweet potato', 'Handful of almonds'])
WHERE auth.uid() IS NOT NULL;

-- Insert sample nutrition goals
INSERT INTO nutrition_goals (user_id, goal_type, target_value, period)
SELECT
  auth.uid(),
  unnest(ARRAY['daily_calories', 'protein_target', 'carb_target', 'fat_target']),
  unnest(ARRAY[2200, 150, 250, 70]),
  'daily'
WHERE auth.uid() IS NOT NULL;

-- Equipment tracking tables

-- Equipment categories table
CREATE TABLE IF NOT EXISTS equipment_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  sport TEXT NOT NULL, -- 'climbing', 'mtb', 'skiing', 'running', 'general'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  category_id UUID REFERENCES equipment_categories(id),
  brand TEXT,
  model TEXT,
  purchase_date DATE,
  purchase_price DECIMAL,
  current_value DECIMAL,
  mileage_distance DECIMAL DEFAULT 0, -- for tracking usage (km/miles)
  mileage_time DECIMAL DEFAULT 0, -- for tracking usage (hours)
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Sends/Activities table for sport-specific logging
CREATE TABLE IF NOT EXISTS sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sport TEXT NOT NULL, -- 'climbing', 'mtb', 'skiing', 'snowboarding', 'running', 'other'
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,

  -- Climbing specific fields
  climb_type TEXT, -- 'bouldering', 'sport', 'trad', 'alpine'
  climb_name TEXT,
  climb_grade TEXT, -- V-grade, YDS, French, etc.
  climb_location TEXT,

  -- MTB specific fields
  trail_name TEXT,
  trail_level TEXT, -- 'beginner', 'intermediate', 'advanced', 'expert'
  trail_time TEXT, -- completion time
  trail_distance DECIMAL, -- in km

  -- Skiing/Snowboarding specific fields
  mountain_name TEXT,
  vertical_feet INTEGER,
  runs_completed INTEGER,

  -- Running specific fields
  run_distance DECIMAL, -- in km
  run_time TEXT, -- completion time
  run_pace TEXT, -- min/km or min/mile
  run_elevation_gain INTEGER, -- in feet/meters

  -- Equipment used (JSON array of equipment IDs)
  equipment_used JSONB DEFAULT '[]',

  -- General fields
  notes TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5), -- 1-5 star rating
  weather_conditions TEXT,
  partners TEXT, -- climbing partners, riding buddies, etc.

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert default equipment categories
INSERT INTO equipment_categories (category_name, sport) VALUES
  ('Climbing Shoes', 'climbing'),
  ('Harness', 'climbing'),
  ('Rope', 'climbing'),
  ('Quickdraws', 'climbing'),
  ('Helmet', 'climbing'),
  ('Chalk Bag', 'climbing'),
  ('Mountain Bike', 'mtb'),
  ('Bike Helmet', 'mtb'),
  ('Bike Shoes', 'mtb'),
  ('Bike Pedals', 'mtb'),
  ('Bike Tires', 'mtb'),
  ('Ski Boots', 'skiing'),
  ('Skis', 'skiing'),
  ('Ski Poles', 'skiing'),
  ('Ski Helmet', 'skiing'),
  ('Snowboard Boots', 'snowboarding'),
  ('Snowboard', 'snowboarding'),
  ('Snowboard Helmet', 'snowboarding'),
  ('Running Shoes', 'running'),
  ('Running Shorts', 'running'),
  ('Running Jacket', 'running'),
  ('GPS Watch', 'general'),
  ('Heart Rate Monitor', 'general')
ON CONFLICT (category_name) DO NOTHING;

-- Row Level Security (RLS) policies

-- Equipment policies
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own equipment" ON equipment
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own equipment" ON equipment
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own equipment" ON equipment
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own equipment" ON equipment
  FOR DELETE USING (auth.uid() = user_id);

-- Sends policies
ALTER TABLE sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own sends" ON sends
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sends" ON sends
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sends" ON sends
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sends" ON sends
  FOR DELETE USING (auth.uid() = user_id);

-- Equipment categories are readable by all authenticated users
ALTER TABLE equipment_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view equipment categories" ON equipment_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ===========================================
-- STRENGTH TRAINING SCHEMA
-- ===========================================

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('upper_body', 'lower_body', 'full_body', 'core', 'cardio', 'olympic', 'powerlifting', 'bodybuilding', 'functional')) NOT NULL,
  muscle_groups TEXT[] NOT NULL,
  equipment TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT,
  video_url TEXT,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Training plans table
CREATE TABLE IF NOT EXISTS training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('strength', 'powerlifting', 'bodybuilding', 'olympic', 'functional', 'general')) NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')) NOT NULL,
  duration_weeks INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Training phases table
CREATE TABLE IF NOT EXISTS training_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
  phase_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  goal TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(plan_id, phase_number)
);

-- Training weeks table
CREATE TABLE IF NOT EXISTS training_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES training_phases(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(phase_id, week_number)
);

-- Training days table
CREATE TABLE IF NOT EXISTS training_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_id UUID REFERENCES training_weeks(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  focus TEXT[] DEFAULT '{}',
  estimated_duration INTEGER NOT NULL, -- minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(week_id, day_number)
);

-- Training day exercises table
CREATE TABLE IF NOT EXISTS training_day_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_id UUID REFERENCES training_days(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_position INTEGER NOT NULL,
  target_sets INTEGER NOT NULL,
  target_reps TEXT NOT NULL, -- e.g., "3x8-12" or "8,8,6,6"
  target_weight TEXT, -- e.g., "70% 1RM" or "50kg"
  target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10),
  rest_time_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User training plans table
CREATE TABLE IF NOT EXISTS user_training_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id UUID REFERENCES training_plans(id) ON DELETE CASCADE NOT NULL,
  start_date DATE NOT NULL,
  current_phase INTEGER DEFAULT 1,
  current_week INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  progress_percentage DECIMAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, plan_id, start_date)
);

-- Strength workouts table
CREATE TABLE IF NOT EXISTS strength_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_day_id UUID REFERENCES training_days(id) ON DELETE SET NULL,
  workout_date DATE NOT NULL,
  name TEXT NOT NULL,
  duration_minutes INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  total_volume DECIMAL, -- Total weight lifted in kg
  average_rpe DECIMAL CHECK (average_rpe >= 1 AND average_rpe <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Workout exercises table
CREATE TABLE IF NOT EXISTS workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES strength_workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  order_position INTEGER NOT NULL,
  notes TEXT,
  target_sets INTEGER,
  target_reps TEXT,
  target_weight TEXT,
  target_rpe INTEGER CHECK (target_rpe >= 1 AND target_rpe <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Exercise sets table
CREATE TABLE IF NOT EXISTS exercise_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_exercise_id UUID REFERENCES workout_exercises(id) ON DELETE CASCADE NOT NULL,
  set_number INTEGER NOT NULL,
  reps INTEGER,
  weight_kg DECIMAL,
  weight_lbs DECIMAL,
  distance_meters DECIMAL,
  distance_miles DECIMAL,
  duration_seconds INTEGER,
  pace_min_per_km DECIMAL,
  pace_min_per_mile DECIMAL,
  rpe INTEGER CHECK (rpe >= 1 AND rpe <= 10),
  rest_time_seconds INTEGER,
  notes TEXT,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(workout_exercise_id, set_number)
);

-- Strength performance metrics table
CREATE TABLE IF NOT EXISTS strength_performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  metric_type TEXT CHECK (metric_type IN ('max_weight', 'volume', 'strength_gains', 'endurance', 'power')) NOT NULL,
  value DECIMAL NOT NULL,
  unit TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, exercise_id, date, metric_type)
);

-- ===========================================
-- STRENGTH TRAINING POLICIES
-- ===========================================

-- Exercises policies
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are viewable by authenticated users" ON exercises
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create custom exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = created_by OR is_custom = false);
CREATE POLICY "Users can update their custom exercises" ON exercises
  FOR UPDATE USING (auth.uid() = created_by AND is_custom = true);

-- Training plans policies
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public training plans are viewable by authenticated users" ON training_plans
  FOR SELECT USING (auth.uid() IS NOT NULL AND (is_public = true OR auth.uid() = created_by));
CREATE POLICY "Users can create training plans" ON training_plans
  FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their training plans" ON training_plans
  FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their training plans" ON training_plans
  FOR DELETE USING (auth.uid() = created_by);

-- Training phases, weeks, days policies (inherit from plan ownership)
ALTER TABLE training_phases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training phases are accessible through plans" ON training_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_plans
      WHERE training_plans.id = training_phases.plan_id
      AND (training_plans.is_public = true OR training_plans.created_by = auth.uid())
    )
  );

ALTER TABLE training_weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training weeks are accessible through plans" ON training_weeks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_phases tp
      JOIN training_plans p ON p.id = tp.plan_id
      WHERE tp.id = training_weeks.phase_id
      AND (p.is_public = true OR p.created_by = auth.uid())
    )
  );

ALTER TABLE training_days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training days are accessible through plans" ON training_days
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_weeks tw
      JOIN training_phases tp ON tp.id = tw.phase_id
      JOIN training_plans p ON p.id = tp.plan_id
      WHERE tw.id = training_days.week_id
      AND (p.is_public = true OR p.created_by = auth.uid())
    )
  );

ALTER TABLE training_day_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Training day exercises are accessible through plans" ON training_day_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM training_days td
      JOIN training_weeks tw ON tw.id = td.week_id
      JOIN training_phases tp ON tp.id = tw.phase_id
      JOIN training_plans p ON p.id = tp.plan_id
      WHERE td.id = training_day_exercises.day_id
      AND (p.is_public = true OR p.created_by = auth.uid())
    )
  );

-- User training plans policies
ALTER TABLE user_training_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their training plans" ON user_training_plans
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their training plans" ON user_training_plans
  FOR ALL USING (auth.uid() = user_id);

-- Strength workouts policies
ALTER TABLE strength_workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their strength workouts" ON strength_workouts
  FOR ALL USING (auth.uid() = user_id);

-- Workout exercises and sets policies
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage workout exercises through workouts" ON workout_exercises
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM strength_workouts
      WHERE strength_workouts.id = workout_exercises.workout_id
      AND strength_workouts.user_id = auth.uid()
    )
  );

ALTER TABLE exercise_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage exercise sets through workouts" ON exercise_sets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM workout_exercises we
      JOIN strength_workouts sw ON sw.id = we.workout_id
      WHERE we.id = exercise_sets.workout_exercise_id
      AND sw.user_id = auth.uid()
    )
  );

-- Strength performance metrics policies
ALTER TABLE strength_performance_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their performance metrics" ON strength_performance_metrics
  FOR ALL USING (auth.uid() = user_id);

-- ===========================================
-- STRENGTH TRAINING INDEXES
-- ===========================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_groups ON exercises USING GIN(muscle_groups);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises USING GIN(equipment);
CREATE INDEX IF NOT EXISTS idx_training_plans_category ON training_plans(category);
CREATE INDEX IF NOT EXISTS idx_training_plans_created_by ON training_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_user_training_plans_user_id ON user_training_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_workouts_user_date ON strength_workouts(user_id, workout_date);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_workout_exercise ON exercise_sets(workout_exercise_id);
CREATE INDEX IF NOT EXISTS idx_strength_metrics_user_exercise ON strength_performance_metrics(user_id, exercise_id);

-- ===========================================
-- STRENGTH TRAINING TRIGGERS
-- ===========================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to relevant tables
DROP TRIGGER IF EXISTS update_training_plans_updated_at ON training_plans;
CREATE TRIGGER update_training_plans_updated_at
    BEFORE UPDATE ON training_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_training_plans_updated_at ON user_training_plans;
CREATE TRIGGER update_user_training_plans_updated_at
    BEFORE UPDATE ON user_training_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strength_workouts_updated_at ON strength_workouts;
CREATE TRIGGER update_strength_workouts_updated_at
    BEFORE UPDATE ON strength_workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Admin settings table for global admin controls
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on admin_settings table
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only main admin can access admin settings
CREATE POLICY "Only main admin can access admin settings" ON admin_settings
  FOR ALL USING (auth.jwt() ->> 'email' = 'joe@nomadicperformance.com');

-- Insert default dashboard settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
('dashboard_access', '{
  "nutrition": {"enabled": true, "locked": false},
  "training": {"enabled": true, "locked": false},
  "activities": {"enabled": true, "locked": false},
  "equipment": {"enabled": true, "locked": false}
}', 'Controls which dashboards are enabled and locked for users')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to check if a dashboard is accessible to a user
CREATE OR REPLACE FUNCTION is_dashboard_accessible(dashboard_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_setting JSONB;
  dashboard_config JSONB;
BEGIN
  -- Get the dashboard access settings
  SELECT setting_value INTO admin_setting
  FROM admin_settings
  WHERE setting_key = 'dashboard_access';

  IF admin_setting IS NULL THEN
    -- Default to enabled if no settings exist
    RETURN TRUE;
  END IF;

  -- Get the specific dashboard configuration
  dashboard_config := admin_setting -> dashboard_name;

  IF dashboard_config IS NULL THEN
    -- Default to enabled if dashboard not configured
    RETURN TRUE;
  END IF;

  -- Return whether the dashboard is enabled
  RETURN (dashboard_config ->> 'enabled')::boolean;
END;
$$;
