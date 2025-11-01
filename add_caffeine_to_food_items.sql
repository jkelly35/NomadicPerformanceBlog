-- Add caffeine_mg column to food_items table
ALTER TABLE food_items ADD COLUMN IF NOT EXISTS caffeine_mg DECIMAL DEFAULT 0;
