-- Drop existing policies first
DROP POLICY IF EXISTS "Only admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can modify admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can view admin_logs" ON admin_logs;
DROP POLICY IF EXISTS "Only admins can view admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admins can modify admin_settings" ON admin_settings;
DROP POLICY IF EXISTS "Only admins can manage notification templates" ON notification_templates;
DROP POLICY IF EXISTS "Only admins can manage notification campaigns" ON notification_campaigns;
DROP POLICY IF EXISTS "Admins can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can manage all communication history" ON user_communication_history;
DROP POLICY IF EXISTS "Users can view their own communication history" ON user_communication_history;

-- Recreate policies with service role support
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

CREATE POLICY "Only admins can view admin_logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

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

CREATE POLICY "Only admins can manage notification templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage notification campaigns" ON notification_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all communication history" ON user_communication_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own communication history" ON user_communication_history
  FOR SELECT USING (auth.uid() = user_id);
