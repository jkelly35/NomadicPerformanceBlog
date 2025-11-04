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
