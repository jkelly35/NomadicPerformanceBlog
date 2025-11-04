-- Enhance existing user_preferences table with additional profile fields
-- Run this in your Supabase SQL Editor

-- Add new columns to existing user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS instagram_handle TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS github_username TEXT,
ADD COLUMN IF NOT EXISTS fitness_level TEXT CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
ADD COLUMN IF NOT EXISTS goals TEXT[],
ADD COLUMN IF NOT EXISTS newsletter_subscription BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS public_profile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT;

-- Add index for public profiles
CREATE INDEX IF NOT EXISTS idx_user_preferences_public ON user_preferences(public_profile) WHERE public_profile = true;

-- Update the get_or_create_user_preferences function to include new defaults
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
    INSERT INTO user_preferences (
      user_id, 
      dietary_preferences, 
      activities,
      newsletter_subscription,
      public_profile
    )
    VALUES (
      auth.uid(), 
      '{}', 
      '{}',
      true,
      true
    )
    RETURNING * INTO user_prefs;
  END IF;

  RETURN user_prefs;
END;
$$;
