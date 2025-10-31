-- Fix hydration logging RLS policy
-- Run this in your Supabase SQL editor if you're getting RLS policy errors

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
