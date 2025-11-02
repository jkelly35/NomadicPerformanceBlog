-- User Metrics Table Schema
-- This table stores detailed health metrics and fitness information for users

CREATE TABLE IF NOT EXISTS user_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gender TEXT,
    weight TEXT, -- Stored as string to allow for different units/formats
    height TEXT, -- Stored as string to allow for different units/formats
    age TEXT,
    fitness_goals TEXT[] DEFAULT '{}', -- Array of selected fitness goals
    sports_activities TEXT[] DEFAULT '{}', -- Array of selected sports/activities
    resting_heart_rate TEXT,
    max_heart_rate TEXT,
    body_fat_percentage TEXT,
    muscle_mass TEXT,
    bone_density TEXT,
    hydration_level TEXT,
    sleep_quality TEXT,
    stress_level TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure one record per user
    UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own metrics"
    ON user_metrics FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
    ON user_metrics FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
    ON user_metrics FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
    ON user_metrics FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_metrics_user_id ON user_metrics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_metrics_updated_at ON user_metrics(updated_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_metrics_updated_at
    BEFORE UPDATE ON user_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_user_metrics_updated_at();
