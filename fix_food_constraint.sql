-- Fix the unique constraint on food_items table
-- Run this in your Supabase SQL editor

-- Drop the existing unique constraint on name
ALTER TABLE food_items DROP CONSTRAINT IF EXISTS food_items_name_key;

-- Add new unique constraint on (name, brand) combination
ALTER TABLE food_items ADD CONSTRAINT food_items_name_brand_key UNIQUE (name, brand);
