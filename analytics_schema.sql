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
