-- Update admin_users policies to allow main admin
DROP POLICY IF EXISTS "Only admins can view admin_users" ON admin_users;
DROP POLICY IF EXISTS "Only admins can modify admin_users" ON admin_users;

-- Recreate policies with main admin bypass
CREATE POLICY "Only admins can view admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    ) OR auth.email() = 'joe@nomadicperformance.com'
  );

CREATE POLICY "Only admins can modify admin_users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    ) OR auth.email() = 'joe@nomadicperformance.com'
  );
