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

-- Admin settings for global configuration
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on admin_settings table
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view admin_settings
CREATE POLICY "Only admins can view admin_settings" ON admin_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Only admins can insert/update admin_settings
CREATE POLICY "Only admins can modify admin_settings" ON admin_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Notification & Communication Hub Schema

-- Notification templates for reusable messages
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app', 'sms')),
  category TEXT DEFAULT 'general', -- 'welcome', 'marketing', 'system', 'reminder', etc.
  variables JSONB DEFAULT '{}', -- Available template variables
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Notification campaigns for bulk messaging
CREATE TABLE IF NOT EXISTS notification_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  template_id UUID REFERENCES notification_templates(id),
  target_audience JSONB DEFAULT '{}', -- Filters for user segments
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Individual notifications sent to users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES notification_campaigns(id),
  template_id UUID REFERENCES notification_templates(id),
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app', 'sms')),
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  clicked_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}', -- Additional tracking data
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- User communication history for tracking all interactions
CREATE TABLE IF NOT EXISTS user_communication_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_id UUID REFERENCES notifications(id),
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'in_app', 'sms', 'system')),
  direction TEXT NOT NULL CHECK (direction IN ('outbound', 'inbound')),
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'replied', 'failed')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on notification tables
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_communication_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for notification_templates (only admins can manage)
CREATE POLICY "Only admins can manage notification templates" ON notification_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- RLS policies for notification_campaigns (only admins can manage)
CREATE POLICY "Only admins can manage notification campaigns" ON notification_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- RLS policies for notifications (admins can manage, users can view their own)
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- RLS policies for user_communication_history (admins can manage, users can view their own)
CREATE POLICY "Admins can manage all communication history" ON user_communication_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own communication history" ON user_communication_history
  FOR SELECT USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_campaign_id ON notifications(campaign_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_campaigns_status ON notification_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_user_communication_history_user_id ON user_communication_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_communication_history_type ON user_communication_history(type);

-- Function to log notification sends
CREATE OR REPLACE FUNCTION log_notification_send(
  p_user_id UUID,
  p_campaign_id UUID DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_type TEXT,
  p_subject TEXT DEFAULT NULL,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  notification_id UUID;
  admin_record admin_users;
BEGIN
  -- Get admin record for logging
  SELECT * INTO admin_record
  FROM admin_users
  WHERE user_id = auth.uid();

  -- Insert notification record
  INSERT INTO notifications (
    user_id,
    campaign_id,
    template_id,
    type,
    subject,
    message,
    status,
    metadata,
    created_by
  ) VALUES (
    p_user_id,
    p_campaign_id,
    p_template_id,
    p_type,
    p_subject,
    p_message,
    'sent',
    p_metadata,
    admin_record.id
  ) RETURNING id INTO notification_id;

  -- Insert communication history
  INSERT INTO user_communication_history (
    user_id,
    notification_id,
    type,
    direction,
    subject,
    message,
    status,
    metadata
  ) VALUES (
    p_user_id,
    notification_id,
    p_type,
    'outbound',
    p_subject,
    p_message,
    'sent',
    p_metadata
  );

  -- Log admin action
  PERFORM log_admin_action(
    'send_notification',
    'notification',
    notification_id::TEXT,
    jsonb_build_object(
      'user_id', p_user_id,
      'type', p_type,
      'campaign_id', p_campaign_id,
      'template_id', p_template_id
    )
  );

  RETURN notification_id;
END;
$$;

-- Insert the main admin user (joe@nomadicperformance.com)
-- This will be done via SQL after the user signs up
-- INSERT INTO admin_users (user_id, role, permissions)
-- SELECT id, 'super_admin', '{"read": true, "write": true, "delete": true, "manage_users": true}'
-- FROM auth.users
-- WHERE email = 'joe@nomadicperformance.com';
