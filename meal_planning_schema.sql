-- Meal Planning Schema for Nutrition Dashboard
-- Add this to your database-schema.sql file

-- Planned meals table (for meal planning calendar)
CREATE TABLE IF NOT EXISTS planned_meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  planned_date DATE NOT NULL,
  planned_time TIME,
  meal_template_id UUID REFERENCES meal_templates(id) ON DELETE SET NULL,
  recipe_id TEXT, -- For MealDB API recipes
  recipe_name TEXT,
  recipe_image TEXT,
  custom_name TEXT, -- For custom planned meals
  notes TEXT,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, meal_type, planned_date)
);

-- Enable RLS on planned_meals table
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

-- RLS policies for planned_meals
CREATE POLICY "Users can view their own planned meals" ON planned_meals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own planned meals" ON planned_meals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own planned meals" ON planned_meals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own planned meals" ON planned_meals
  FOR DELETE USING (auth.uid() = user_id);

-- Planned meal items table (for custom planned meals with specific food items)
CREATE TABLE IF NOT EXISTS planned_meal_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  planned_meal_id UUID REFERENCES planned_meals(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  quantity DECIMAL NOT NULL, -- multiplier for serving size
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on planned_meal_items table
ALTER TABLE planned_meal_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for planned_meal_items
CREATE POLICY "Users can view their own planned meal items" ON planned_meal_items
  FOR SELECT USING (
    auth.uid() = (SELECT user_id FROM planned_meals WHERE id = planned_meal_id)
  );

CREATE POLICY "Users can insert their own planned meal items" ON planned_meal_items
  FOR INSERT WITH CHECK (
    auth.uid() = (SELECT user_id FROM planned_meals WHERE id = planned_meal_id)
  );

CREATE POLICY "Users can update their own planned meal items" ON planned_meal_items
  FOR UPDATE USING (
    auth.uid() = (SELECT user_id FROM planned_meals WHERE id = planned_meal_id)
  );

CREATE POLICY "Users can delete their own planned meal items" ON planned_meal_items
  FOR DELETE USING (
    auth.uid() = (SELECT user_id FROM planned_meals WHERE id = planned_meal_id)
  );

-- Nutrition progress tracking table (for trend charts)
CREATE TABLE IF NOT EXISTS nutrition_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_calories DECIMAL DEFAULT 0,
  total_protein DECIMAL DEFAULT 0,
  total_carbs DECIMAL DEFAULT 0,
  total_fat DECIMAL DEFAULT 0,
  total_fiber DECIMAL DEFAULT 0,
  meals_logged INTEGER DEFAULT 0,
  hydration_ml DECIMAL DEFAULT 0,
  caffeine_mg DECIMAL DEFAULT 0,
  weight_kg DECIMAL,
  body_fat_percentage DECIMAL,
  muscle_mass_kg DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, recorded_date)
);

-- Enable RLS on nutrition_progress table
ALTER TABLE nutrition_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for nutrition_progress
CREATE POLICY "Users can view their own nutrition progress" ON nutrition_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nutrition progress" ON nutrition_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nutrition progress" ON nutrition_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to calculate and store daily nutrition progress
CREATE OR REPLACE FUNCTION calculate_daily_nutrition_progress(p_user_id UUID, p_date DATE)
RETURNS nutrition_progress
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  progress_record nutrition_progress;
  meal_stats RECORD;
  hydration_total DECIMAL := 0;
  caffeine_total DECIMAL := 0;
BEGIN
  -- Calculate meal totals for the date
  SELECT
    COALESCE(SUM(total_calories), 0) as calories,
    COALESCE(SUM(total_protein), 0) as protein,
    COALESCE(SUM(total_carbs), 0) as carbs,
    COALESCE(SUM(total_fat), 0) as fat,
    COALESCE(SUM(total_fiber), 0) as fiber,
    COUNT(*) as meals_count
  INTO meal_stats
  FROM meals
  WHERE user_id = p_user_id AND meal_date = p_date;

  -- Calculate hydration total
  SELECT COALESCE(SUM(amount_ml), 0)
  INTO hydration_total
  FROM hydration_logs
  WHERE user_id = p_user_id AND DATE(logged_time) = p_date;

  -- Calculate caffeine total
  SELECT COALESCE(SUM(amount_mg), 0)
  INTO caffeine_total
  FROM caffeine_logs
  WHERE user_id = p_user_id AND DATE(logged_time) = p_date;

  -- Insert or update progress record
  INSERT INTO nutrition_progress (
    user_id,
    recorded_date,
    total_calories,
    total_protein,
    total_carbs,
    total_fat,
    total_fiber,
    meals_logged,
    hydration_ml,
    caffeine_mg
  ) VALUES (
    p_user_id,
    p_date,
    meal_stats.calories,
    meal_stats.protein,
    meal_stats.carbs,
    meal_stats.fat,
    meal_stats.fiber,
    meal_stats.meals_count,
    hydration_total,
    caffeine_total
  )
  ON CONFLICT (user_id, recorded_date)
  DO UPDATE SET
    total_calories = EXCLUDED.total_calories,
    total_protein = EXCLUDED.total_protein,
    total_carbs = EXCLUDED.total_carbs,
    total_fat = EXCLUDED.total_fat,
    total_fiber = EXCLUDED.total_fiber,
    meals_logged = EXCLUDED.meals_logged,
    hydration_ml = EXCLUDED.hydration_ml,
    caffeine_mg = EXCLUDED.caffeine_mg,
    updated_at = NOW()
  RETURNING * INTO progress_record;

  RETURN progress_record;
END;
$$;
