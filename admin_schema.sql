-- Admin permissions and roles
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'admin',
  permissions JSONB DEFAULT '{"read": true, "write": true, "delete": true, "manage_users": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_users table
CREATE POLICY "Only admins can view admin_users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- System logs for admin actions
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on admin_logs table
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_logs
CREATE POLICY "Only admins can view admin_logs" ON admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$;

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  action_type TEXT,
  resource_type TEXT,
  resource_id TEXT DEFAULT NULL,
  action_details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record admin_users;
BEGIN
  -- Get admin record
  SELECT * INTO admin_record
  FROM admin_users
  WHERE user_id = auth.uid();

  IF admin_record IS NULL THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  -- Insert log entry
  INSERT INTO admin_logs (
    admin_id,
    action,
    resource_type,
    resource_id,
    details
  ) VALUES (
    admin_record.id,
    action_type,
    resource_type,
    resource_id,
    action_details
  );
END;
$$;

-- Insert the main admin user (joe@nomadicperformance.com)
-- This will be done via SQL after the user signs up
-- INSERT INTO admin_users (user_id, role, permissions)
-- SELECT id, 'super_admin', '{"read": true, "write": true, "delete": true, "manage_users": true}'
-- FROM auth.users
-- WHERE email = 'joe@nomadicperformance.com';
