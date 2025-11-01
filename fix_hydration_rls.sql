-- Fix hydration logging RLS policy and meal_type constraint
-- Run this in your Supabase SQL editor if you're getting RLS policy errors or hydration not appearing in meal history

-- First, update the meals table to allow 'hydration' as a meal_type
ALTER TABLE meals DROP CONSTRAINT IF EXISTS meals_meal_type_check;
ALTER TABLE meals ADD CONSTRAINT meals_meal_type_check CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack', 'hydration'));

-- Enable RLS on hydration_logs table
ALTER TABLE hydration_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage own hydration logs" ON hydration_logs;

-- Create the correct RLS policy
CREATE POLICY "Users can manage own hydration logs" ON hydration_logs
  FOR ALL USING (auth.uid() = user_id);

-- Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'hydration_logs';
