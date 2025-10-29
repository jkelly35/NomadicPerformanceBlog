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

-- Nutrition tracking tables

-- Food items table (for storing nutritional information of foods)
CREATE TABLE IF NOT EXISTS food_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  serving_size DECIMAL NOT NULL,
  serving_unit TEXT NOT NULL, -- 'g', 'ml', 'cup', 'piece', etc.
  calories_per_serving INTEGER NOT NULL,
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
  total_calories INTEGER DEFAULT 0,
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
  custom_calories INTEGER,
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
  total_calories INTEGER DEFAULT 0,
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

-- Enable Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
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

-- Insert sample food items (only if they don't exist)
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
