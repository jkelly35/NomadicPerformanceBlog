-- Add saved_foods table for the saved foods feature
-- Run this in your Supabase SQL editor

-- Create saved_foods table
CREATE TABLE IF NOT EXISTS saved_foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_item_id UUID REFERENCES food_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, food_item_id)
);

-- Enable RLS
ALTER TABLE saved_foods ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved foods" ON saved_foods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved foods" ON saved_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved foods" ON saved_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_saved_foods_user_id ON saved_foods(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_foods_food_item_id ON saved_foods(food_item_id);
