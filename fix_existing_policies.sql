-- Only drop and recreate policies for tables that exist
-- Check which tables exist and only fix policies for those

-- Fix admin_users policies (should exist)
DROP POLICY IF EXISTS "Only admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can modify admin_users" ON admin_users;

CREATE POLICY "Only admins can view admin_users" ON admin_users
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.email() = 'joe@nomadicperformance.com' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can modify admin_users" ON admin_users
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.email() = 'joe@nomadicperformance.com' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Fix admin_logs policies (should exist)
DROP POLICY IF EXISTS "Only admins can view admin_logs" ON admin_logs;

CREATE POLICY "Only admins can view admin_logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Fix admin_settings policies (should exist)
DROP POLICY IF EXISTS "Only admins can view admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admins can modify admin_settings" ON admin_settings;

CREATE POLICY "Only admins can view admin_settings" ON admin_settings
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can modify admin_settings" ON admin_settings
  FOR ALL USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );
