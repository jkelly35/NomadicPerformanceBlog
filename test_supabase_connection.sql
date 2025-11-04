-- Test SQL to verify VS Code + Supabase connection
-- This creates a simple test table

CREATE TABLE IF NOT EXISTS test_connection (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Insert a test record
INSERT INTO test_connection (message) VALUES ('VS Code + Supabase connection test successful!');
