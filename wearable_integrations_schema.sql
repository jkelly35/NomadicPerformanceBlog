-- Wearable Device Integration Tables
-- This file creates the necessary database tables for storing wearable device integrations

-- Table for storing wearable device integrations
CREATE TABLE IF NOT EXISTS wearable_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'google-fit', 'fitbit', 'oura', etc.
  connected BOOLEAN DEFAULT true,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[], -- Array of granted scopes
  provider_user_id VARCHAR(255), -- User's ID on the provider's system
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one integration per user per provider
  UNIQUE(user_id, provider)
);

-- Table for storing wearable data points
CREATE TABLE IF NOT EXISTS wearable_data_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES wearable_integrations(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  value DECIMAL NOT NULL,
  unit VARCHAR(50),
  source VARCHAR(50) NOT NULL, -- 'google-fit', 'fitbit', etc.
  data_type VARCHAR(50) NOT NULL, -- 'heart_rate', 'steps', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate data points
  UNIQUE(user_id, source, data_type, timestamp)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_user_id ON wearable_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_integrations_provider ON wearable_integrations(provider);
CREATE INDEX IF NOT EXISTS idx_wearable_data_points_user_id ON wearable_data_points(user_id);
CREATE INDEX IF NOT EXISTS idx_wearable_data_points_timestamp ON wearable_data_points(timestamp);
CREATE INDEX IF NOT EXISTS idx_wearable_data_points_data_type ON wearable_data_points(data_type);
CREATE INDEX IF NOT EXISTS idx_wearable_data_points_source ON wearable_data_points(source);

-- Row Level Security (RLS) policies
ALTER TABLE wearable_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_data_points ENABLE ROW LEVEL SECURITY;

-- Users can only see their own integrations
CREATE POLICY "Users can view own wearable integrations" ON wearable_integrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable integrations" ON wearable_integrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wearable integrations" ON wearable_integrations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wearable integrations" ON wearable_integrations
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own data points
CREATE POLICY "Users can view own wearable data points" ON wearable_data_points
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wearable data points" ON wearable_data_points
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update updated_at on wearable_integrations
CREATE TRIGGER update_wearable_integrations_updated_at
  BEFORE UPDATE ON wearable_integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
