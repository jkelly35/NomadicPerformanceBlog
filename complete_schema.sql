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

-- Only admins can view admin_users table (or service role)
CREATE POLICY "Only admins can view admin_users" ON admin_users
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    auth.email() = 'joe@nomadicperformance.com' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Only admins can modify admin_users table (or service role)
CREATE POLICY "Only admins can modify admin_users" ON admin_users
  FOR ALL USING (
    auth.role() = 'service_role' OR
    auth.email() = 'joe@nomadicperformance.com' OR
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

-- Only admins can view admin_settings (or service role)
CREATE POLICY "Only admins can view admin_settings" ON admin_settings
  FOR SELECT USING (
    auth.role() = 'service_role' OR
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.user_id = auth.uid()
    )
  );

-- Only admins can modify admin_settings (or service role)
CREATE POLICY "Only admins can modify admin_settings" ON admin_settings
  FOR ALL USING (
    auth.role() = 'service_role' OR
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
  p_type TEXT,
  p_message TEXT,
  p_campaign_id UUID DEFAULT NULL,
  p_template_id UUID DEFAULT NULL,
  p_subject TEXT DEFAULT NULL,
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

-- User preferences table for storing dietary preferences and other user settings
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dietary_preferences TEXT[] DEFAULT '{}', -- Array of dietary preferences
  activities TEXT[] DEFAULT '{}', -- Array of preferred activities
  first_name TEXT,
  last_name TEXT,
  bio TEXT,
  preferences JSONB, -- Dashboard preferences and other settings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS on user_preferences table
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to get or create user preferences
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
    INSERT INTO user_preferences (user_id, dietary_preferences, activities)
    VALUES (auth.uid(), '{}', '{}')
    RETURNING * INTO user_prefs;
  END IF;

  RETURN user_prefs;
END;
$$;

-- Enhance existing user_preferences table with additional profile fields
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
-- Blog Posts Schema for Nomadic Performance Blog
-- Run this in your Supabase SQL Editor

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT,
  featured_image_url TEXT,
  status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tags TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  reading_time_minutes INTEGER,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_post_views table for analytics
CREATE TABLE IF NOT EXISTS blog_post_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address INET
);

-- Create blog_categories table for better category management
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blog_tags table for better tag management
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_posts
CREATE POLICY "Public can view published posts" ON blog_posts
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admins can manage all posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for blog_post_views
CREATE POLICY "Anyone can insert views" ON blog_post_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all views" ON blog_post_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- RLS Policies for categories and tags (public read, admin write)
CREATE POLICY "Public can view categories" ON blog_categories
  FOR SELECT USING (true);

CREATE POLICY "Public can view tags" ON blog_tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage categories" ON blog_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage tags" ON blog_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_post_id ON blog_post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_views_viewed_at ON blog_post_views(viewed_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_blog_post_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_blog_post_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_post_updated_at();

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '[^a-zA-Z0-9\-]', ''), '--', '-'));
END;
$$ LANGUAGE plpgsql;

-- Function to calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(content TEXT)
RETURNS INTEGER AS $$
DECLARE
  word_count INTEGER;
  reading_time INTEGER;
BEGIN
  -- Count words (approximate)
  word_count := array_length(string_to_array(content, ' '), 1);
  
  -- Average reading speed: 200 words per minute
  reading_time := GREATEST(1, CEIL(word_count::FLOAT / 200));
  
  RETURN reading_time;
END;
$$ LANGUAGE plpgsql;

-- Function to get popular posts
CREATE OR REPLACE FUNCTION get_popular_posts(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  title TEXT,
  slug TEXT,
  excerpt TEXT,
  featured_image_url TEXT,
  published_at TIMESTAMPTZ,
  author_name TEXT,
  view_count BIGINT,
  reading_time_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bp.id,
    bp.title,
    bp.slug,
    bp.excerpt,
    bp.featured_image_url,
    bp.published_at,
    COALESCE(up.first_name || ' ' || up.last_name, 'Anonymous') as author_name,
    COUNT(bpv.id) as view_count,
    bp.reading_time_minutes
  FROM blog_posts bp
  LEFT JOIN blog_post_views bpv ON bp.id = bpv.post_id
  LEFT JOIN user_preferences up ON bp.author_id = up.user_id
  WHERE bp.status = 'published'
  GROUP BY bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image_url, bp.published_at, up.first_name, up.last_name, bp.reading_time_minutes
  ORDER BY view_count DESC, bp.published_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
  ('Training', 'training', 'Workout routines, training tips, and performance optimization', '#3B82F6'),
  ('Nutrition', 'nutrition', 'Diet, supplements, and fueling strategies for athletes', '#10B981'),
  ('Travel', 'travel', 'Nomadic lifestyle, travel tips, and location-based training', '#F59E0B'),
  ('Gear', 'gear', 'Equipment reviews, gear recommendations, and tech for athletes', '#8B5CF6'),
  ('Recovery', 'recovery', 'Rest, recovery techniques, and injury prevention', '#EF4444'),
  ('Mindset', 'mindset', 'Mental performance, motivation, and athlete psychology', '#EC4899')
ON CONFLICT (slug) DO NOTHING;

-- Insert some default tags
INSERT INTO blog_tags (name, slug, color) VALUES
  ('Beginner', 'beginner', '#6B7280'),
  ('Advanced', 'advanced', '#DC2626'),
  ('HIIT', 'hiit', '#EF4444'),
  ('Strength', 'strength', '#3B82F6'),
  ('Endurance', 'endurance', '#10B981'),
  ('Flexibility', 'flexibility', '#F59E0B'),
  ('Injury Prevention', 'injury-prevention', '#8B5CF6'),
  ('Supplements', 'supplements', '#EC4899'),
  ('Travel Tips', 'travel-tips', '#06B6D4'),
  ('Gear Review', 'gear-review', '#84CC16')
ON CONFLICT (slug) DO NOTHING;
-- Function to record blog post view
CREATE OR REPLACE FUNCTION record_blog_post_view(
  p_post_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO blog_post_views (
    post_id,
    user_id,
    session_id,
    referrer,
    user_agent,
    ip_address
  ) VALUES (
    p_post_id,
    p_user_id,
    COALESCE(p_session_id, gen_random_uuid()::text),
    p_referrer,
    p_user_agent,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Analytics Schema for Nomadic Performance Blog
-- Run this in your Supabase SQL Editor

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- 'page_view', 'user_registration', 'profile_update', 'post_view', etc.
  event_data JSONB DEFAULT '{}',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referrer TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_sessions table for session tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  page_views INTEGER DEFAULT 0,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  country TEXT,
  city TEXT
);

-- Create performance_metrics table for system performance
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'page_load_time', 'api_response_time', 'error_rate'
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT, -- 'ms', 'seconds', 'percentage'
  url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies - only admins can view analytics data
CREATE POLICY "Admins can view analytics events" ON analytics_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert analytics events" ON analytics_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view user sessions" ON user_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert user sessions" ON user_sessions
  FOR ALL USING (true);

CREATE POLICY "Admins can view performance metrics" ON performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert performance metrics" ON performance_metrics
  FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_started_at ON user_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);

-- Function to record page view
CREATE OR REPLACE FUNCTION record_page_view(
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_url TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_events (
    event_type, 
    event_data, 
    user_id, 
    session_id, 
    url, 
    referrer, 
    user_agent, 
    ip_address
  ) VALUES (
    'page_view',
    jsonb_build_object('timestamp', NOW()),
    p_user_id,
    COALESCE(p_session_id, gen_random_uuid()::text),
    p_url,
    p_referrer,
    p_user_agent,
    p_ip_address
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record user registration
CREATE OR REPLACE FUNCTION record_user_registration(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_events (event_type, event_data, user_id)
  VALUES ('user_registration', jsonb_build_object('timestamp', NOW()), p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record profile update
CREATE OR REPLACE FUNCTION record_profile_update(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO analytics_events (event_type, event_data, user_id)
  VALUES ('profile_update', jsonb_build_object('timestamp', NOW()), p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get analytics summary
CREATE OR REPLACE FUNCTION get_analytics_summary(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_users BIGINT,
  new_users BIGINT,
  total_page_views BIGINT,
  unique_visitors BIGINT,
  avg_session_duration NUMERIC,
  top_pages JSONB,
  user_growth JSONB,
  popular_content JSONB
) AS $$
DECLARE
  start_date TIMESTAMPTZ := NOW() - INTERVAL '1 day' * days_back;
BEGIN
  RETURN QUERY
  SELECT
    -- Total registered users
    (SELECT COUNT(*) FROM auth.users) as total_users,
    
    -- New users in period
    (SELECT COUNT(*) FROM auth.users WHERE created_at >= start_date) as new_users,
    
    -- Total page views in period
    (SELECT COUNT(*) FROM analytics_events 
     WHERE event_type = 'page_view' AND created_at >= start_date) as total_page_views,
    
    -- Unique visitors in period
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= start_date AND user_id IS NOT NULL) as unique_visitors,
    
    -- Average session duration (placeholder - would need session tracking)
    0::NUMERIC as avg_session_duration,
    
    -- Top pages
    (SELECT jsonb_agg(
      jsonb_build_object(
        'url', url,
        'views', view_count
      )
    ) FROM (
      SELECT url, COUNT(*) as view_count
      FROM analytics_events 
      WHERE event_type = 'page_view' AND created_at >= start_date AND url IS NOT NULL
      GROUP BY url
      ORDER BY view_count DESC
      LIMIT 10
    ) top_pages_query) as top_pages,
    
    -- User growth over time
    (SELECT jsonb_agg(
      jsonb_build_object(
        'date', date,
        'count', user_count
      )
    ) FROM (
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as user_count
      FROM auth.users
      WHERE created_at >= start_date
      GROUP BY DATE(created_at)
      ORDER BY date
    ) growth_query) as user_growth,
    
    -- Popular content (blog posts)
    (SELECT jsonb_agg(
      jsonb_build_object(
        'title', title,
        'views', view_count,
        'slug', slug
      )
    ) FROM (
      SELECT 
        bp.title,
        bp.slug,
        COUNT(bpv.id) as view_count
      FROM blog_posts bp
      LEFT JOIN blog_post_views bpv ON bp.id = bpv.post_id
      WHERE bp.status = 'published' AND (bpv.viewed_at >= start_date OR bpv.viewed_at IS NULL)
      GROUP BY bp.id, bp.title, bp.slug
      ORDER BY view_count DESC NULLS LAST
      LIMIT 10
    ) content_query) as popular_content;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user engagement metrics
CREATE OR REPLACE FUNCTION get_user_engagement_metrics(days_back INTEGER DEFAULT 7)
RETURNS TABLE (
  daily_active_users BIGINT,
  weekly_active_users BIGINT,
  monthly_active_users BIGINT,
  average_session_duration NUMERIC,
  bounce_rate NUMERIC,
  top_features JSONB
) AS $$
DECLARE
  start_date TIMESTAMPTZ := NOW() - INTERVAL '1 day' * days_back;
BEGIN
  RETURN QUERY
  SELECT
    -- Daily active users
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= NOW() - INTERVAL '1 day' AND user_id IS NOT NULL) as daily_active_users,
    
    -- Weekly active users
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= NOW() - INTERVAL '7 days' AND user_id IS NOT NULL) as weekly_active_users,
    
    -- Monthly active users
    (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
     WHERE created_at >= NOW() - INTERVAL '30 days' AND user_id IS NOT NULL) as monthly_active_users,
    
    -- Average session duration (placeholder)
    0::NUMERIC as average_session_duration,
    
    -- Bounce rate (placeholder - single page sessions)
    0::NUMERIC as bounce_rate,
    
    -- Top features/pages
    (SELECT jsonb_agg(
      jsonb_build_object(
        'feature', event_type,
        'usage', usage_count
      )
    ) FROM (
      SELECT event_type, COUNT(*) as usage_count
      FROM analytics_events 
      WHERE created_at >= start_date
      GROUP BY event_type
      ORDER BY usage_count DESC
      LIMIT 10
    ) features_query) as top_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get content performance metrics
CREATE OR REPLACE FUNCTION get_content_performance(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_posts BIGINT,
  published_posts BIGINT,
  draft_posts BIGINT,
  total_views BIGINT,
  avg_views_per_post NUMERIC,
  top_performing_posts JSONB,
  content_engagement JSONB
) AS $$
DECLARE
  start_date TIMESTAMPTZ := NOW() - INTERVAL '1 day' * days_back;
BEGIN
  RETURN QUERY
  SELECT
    -- Total posts
    (SELECT COUNT(*) FROM blog_posts) as total_posts,
    
    -- Published posts
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as published_posts,
    
    -- Draft posts
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'draft') as draft_posts,
    
    -- Total views
    (SELECT COUNT(*) FROM blog_post_views WHERE viewed_at >= start_date) as total_views,
    
    -- Average views per post
    (SELECT 
      CASE 
        WHEN COUNT(DISTINCT bp.id) > 0 
        THEN COUNT(bpv.id)::NUMERIC / COUNT(DISTINCT bp.id) 
        ELSE 0 
      END
     FROM blog_posts bp
     LEFT JOIN blog_post_views bpv ON bp.id = bpv.post_id AND bpv.viewed_at >= start_date
     WHERE bp.status = 'published') as avg_views_per_post,
    
    -- Top performing posts
    (SELECT jsonb_agg(
      jsonb_build_object(
        'title', title,
        'views', view_count,
        'published_date', published_at
      )
    ) FROM (
      SELECT 
        bp.title,
        bp.published_at,
        COUNT(bpv.id) as view_count
      FROM blog_posts bp
      LEFT JOIN blog_post_views bpv ON bp.id = bpv.post_id AND bpv.viewed_at >= start_date
      WHERE bp.status = 'published'
      GROUP BY bp.id, bp.title, bp.published_at
      ORDER BY view_count DESC
      LIMIT 10
    ) top_posts) as top_performing_posts,
    
    -- Content engagement by category
    (SELECT jsonb_agg(
      jsonb_build_object(
        'category', category_name,
        'posts', post_count,
        'total_views', views
      )
    ) FROM (
      SELECT 
        COALESCE(bc.name, 'Uncategorized') as category_name,
        COUNT(DISTINCT bp.id) as post_count,
        COUNT(bpv.id) as views
      FROM blog_posts bp
      LEFT JOIN blog_post_views bpv ON bp.id = bpv.post_id AND bpv.viewed_at >= start_date
      LEFT JOIN blog_categories bc ON bp.categories && ARRAY[bc.slug]
      WHERE bp.status = 'published'
      GROUP BY bc.name
      ORDER BY views DESC
    ) engagement_query) as content_engagement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for real-time analytics dashboard
CREATE OR REPLACE VIEW analytics_dashboard AS
SELECT
  -- User metrics
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM auth.users WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_30d,
  (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'page_view' AND created_at >= NOW() - INTERVAL '30 days') as page_views_30d,
  
  -- Content metrics
  (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as published_posts,
  (SELECT COUNT(*) FROM blog_posts WHERE status = 'draft') as draft_posts,
  (SELECT COUNT(*) FROM blog_post_views WHERE viewed_at >= NOW() - INTERVAL '30 days') as content_views_30d,
  
  -- Engagement metrics
  (SELECT COUNT(DISTINCT user_id) FROM analytics_events 
   WHERE created_at >= NOW() - INTERVAL '7 days' AND user_id IS NOT NULL) as active_users_7d,
   
  -- System health (placeholder)
  NOW() as last_updated;

-- Grant access to the view for authenticated users (will be filtered by RLS)
GRANT SELECT ON analytics_dashboard TO authenticated;
