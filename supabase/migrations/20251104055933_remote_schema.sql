


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."calculate_reading_time"("content" "text") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."calculate_reading_time"("content" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_slug"("title" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN LOWER(REPLACE(REPLACE(REPLACE(title, ' ', '-'), '[^a-zA-Z0-9\-]', ''), '--', '-'));
END;
$$;


ALTER FUNCTION "public"."generate_slug"("title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_analytics_summary"("days_back" integer DEFAULT 30) RETURNS TABLE("total_users" bigint, "new_users" bigint, "total_page_views" bigint, "unique_visitors" bigint, "avg_session_duration" numeric, "top_pages" "jsonb", "user_growth" "jsonb", "popular_content" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_analytics_summary"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_content_performance"("days_back" integer DEFAULT 30) RETURNS TABLE("total_posts" bigint, "published_posts" bigint, "draft_posts" bigint, "total_views" bigint, "avg_views_per_post" numeric, "top_performing_posts" "jsonb", "content_engagement" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_content_performance"("days_back" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "dietary_preferences" "text"[] DEFAULT '{}'::"text"[],
    "activities" "text"[] DEFAULT '{}'::"text"[],
    "first_name" "text",
    "last_name" "text",
    "bio" "text",
    "preferences" "jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "avatar_url" "text",
    "website" "text",
    "twitter_handle" "text",
    "instagram_handle" "text",
    "linkedin_url" "text",
    "github_username" "text",
    "fitness_level" "text",
    "goals" "text"[],
    "newsletter_subscription" boolean DEFAULT true,
    "public_profile" boolean DEFAULT true,
    "location" "text",
    "timezone" "text",
    CONSTRAINT "user_preferences_fitness_level_check" CHECK (("fitness_level" = ANY (ARRAY['beginner'::"text", 'intermediate'::"text", 'advanced'::"text", 'expert'::"text"])))
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_or_create_user_preferences"() RETURNS "public"."user_preferences"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_or_create_user_preferences"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_popular_posts"("limit_count" integer DEFAULT 10) RETURNS TABLE("id" "uuid", "title" "text", "slug" "text", "excerpt" "text", "featured_image_url" "text", "published_at" timestamp with time zone, "author_name" "text", "view_count" bigint, "reading_time_minutes" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_popular_posts"("limit_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_engagement_metrics"("days_back" integer DEFAULT 7) RETURNS TABLE("daily_active_users" bigint, "weekly_active_users" bigint, "monthly_active_users" bigint, "average_session_duration" numeric, "bounce_rate" numeric, "top_features" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."get_user_engagement_metrics"("days_back" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"("user_uuid" "uuid" DEFAULT "auth"."uid"()) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users
    WHERE user_id = user_uuid
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("action_type" "text", "resource_type" "text", "resource_id" "text" DEFAULT NULL::"text", "action_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_admin_action"("action_type" "text", "resource_type" "text", "resource_id" "text", "action_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_notification_send"("p_user_id" "uuid", "p_type" "text", "p_message" "text", "p_campaign_id" "uuid" DEFAULT NULL::"uuid", "p_template_id" "uuid" DEFAULT NULL::"uuid", "p_subject" "text" DEFAULT NULL::"text", "p_metadata" "jsonb" DEFAULT '{}'::"jsonb") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."log_notification_send"("p_user_id" "uuid", "p_type" "text", "p_message" "text", "p_campaign_id" "uuid", "p_template_id" "uuid", "p_subject" "text", "p_metadata" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_blog_post_view"("p_post_id" "uuid", "p_user_id" "uuid" DEFAULT NULL::"uuid", "p_session_id" "text" DEFAULT NULL::"text", "p_referrer" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."record_blog_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_page_view"("p_user_id" "uuid" DEFAULT NULL::"uuid", "p_session_id" "text" DEFAULT NULL::"text", "p_url" "text" DEFAULT NULL::"text", "p_referrer" "text" DEFAULT NULL::"text", "p_user_agent" "text" DEFAULT NULL::"text", "p_ip_address" "inet" DEFAULT NULL::"inet") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."record_page_view"("p_user_id" "uuid", "p_session_id" "text", "p_url" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_profile_update"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO analytics_events (event_type, event_data, user_id)
  VALUES ('profile_update', jsonb_build_object('timestamp', NOW()), p_user_id);
END;
$$;


ALTER FUNCTION "public"."record_profile_update"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."record_user_registration"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO analytics_events (event_type, event_data, user_id)
  VALUES ('user_registration', jsonb_build_object('timestamp', NOW()), p_user_id);
END;
$$;


ALTER FUNCTION "public"."record_user_registration"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_blog_post_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_blog_post_updated_at"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "resource_id" "text",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_settings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "setting_key" "text" NOT NULL,
    "setting_value" "jsonb" NOT NULL,
    "description" "text",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admin_users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "role" "text" DEFAULT 'admin'::"text",
    "permissions" "jsonb" DEFAULT '{"read": true, "write": true, "delete": true, "manage_users": false}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."admin_users" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" "text" NOT NULL,
    "event_data" "jsonb" DEFAULT '{}'::"jsonb",
    "user_id" "uuid",
    "session_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "referrer" "text",
    "url" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_post_views" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "viewed_at" timestamp with time zone DEFAULT "now"(),
    "session_id" "text",
    "referrer" "text",
    "user_agent" "text",
    "ip_address" "inet"
);


ALTER TABLE "public"."blog_post_views" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "text",
    "featured_image_url" "text",
    "status" "text" DEFAULT 'draft'::"text",
    "published_at" timestamp with time zone,
    "author_id" "uuid",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "categories" "text"[] DEFAULT '{}'::"text"[],
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text"[],
    "reading_time_minutes" integer,
    "word_count" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "blog_posts_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."blog_posts" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."analytics_dashboard" AS
 SELECT ( SELECT "count"(*) AS "count"
           FROM "auth"."users") AS "total_users",
    ( SELECT "count"(*) AS "count"
           FROM "auth"."users"
          WHERE ("users"."created_at" >= ("now"() - '30 days'::interval))) AS "new_users_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."analytics_events"
          WHERE (("analytics_events"."event_type" = 'page_view'::"text") AND ("analytics_events"."created_at" >= ("now"() - '30 days'::interval)))) AS "page_views_30d",
    ( SELECT "count"(*) AS "count"
           FROM "public"."blog_posts"
          WHERE ("blog_posts"."status" = 'published'::"text")) AS "published_posts",
    ( SELECT "count"(*) AS "count"
           FROM "public"."blog_posts"
          WHERE ("blog_posts"."status" = 'draft'::"text")) AS "draft_posts",
    ( SELECT "count"(*) AS "count"
           FROM "public"."blog_post_views"
          WHERE ("blog_post_views"."viewed_at" >= ("now"() - '30 days'::interval))) AS "content_views_30d",
    ( SELECT "count"(DISTINCT "analytics_events"."user_id") AS "count"
           FROM "public"."analytics_events"
          WHERE (("analytics_events"."created_at" >= ("now"() - '7 days'::interval)) AND ("analytics_events"."user_id" IS NOT NULL))) AS "active_users_7d",
    "now"() AS "last_updated";


ALTER VIEW "public"."analytics_dashboard" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blog_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "color" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blog_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_campaigns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "template_id" "uuid",
    "target_audience" "jsonb" DEFAULT '{}'::"jsonb",
    "scheduled_at" timestamp with time zone,
    "sent_at" timestamp with time zone,
    "status" "text" DEFAULT 'draft'::"text",
    "total_recipients" integer DEFAULT 0,
    "sent_count" integer DEFAULT 0,
    "opened_count" integer DEFAULT 0,
    "clicked_count" integer DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notification_campaigns_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'scheduled'::"text", 'sending'::"text", 'sent'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."notification_campaigns" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "type" "text" NOT NULL,
    "category" "text" DEFAULT 'general'::"text",
    "variables" "jsonb" DEFAULT '{}'::"jsonb",
    "is_active" boolean DEFAULT true,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notification_templates_type_check" CHECK (("type" = ANY (ARRAY['email'::"text", 'push'::"text", 'in_app'::"text", 'sms'::"text"])))
);


ALTER TABLE "public"."notification_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "campaign_id" "uuid",
    "template_id" "uuid",
    "type" "text" NOT NULL,
    "subject" "text",
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "sent_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "opened_at" timestamp with time zone,
    "clicked_at" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "notifications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'sent'::"text", 'delivered'::"text", 'opened'::"text", 'clicked'::"text", 'failed'::"text"]))),
    CONSTRAINT "notifications_type_check" CHECK (("type" = ANY (ARRAY['email'::"text", 'push'::"text", 'in_app'::"text", 'sms'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."performance_metrics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "metric_type" "text" NOT NULL,
    "metric_value" numeric NOT NULL,
    "metric_unit" "text",
    "url" "text",
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."performance_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_communication_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "notification_id" "uuid",
    "type" "text" NOT NULL,
    "direction" "text" NOT NULL,
    "subject" "text",
    "message" "text",
    "status" "text" DEFAULT 'sent'::"text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "user_communication_history_direction_check" CHECK (("direction" = ANY (ARRAY['outbound'::"text", 'inbound'::"text"]))),
    CONSTRAINT "user_communication_history_status_check" CHECK (("status" = ANY (ARRAY['sent'::"text", 'delivered'::"text", 'read'::"text", 'replied'::"text", 'failed'::"text"]))),
    CONSTRAINT "user_communication_history_type_check" CHECK (("type" = ANY (ARRAY['email'::"text", 'push'::"text", 'in_app'::"text", 'sms'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."user_communication_history" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "session_id" "text" NOT NULL,
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "duration_minutes" integer,
    "page_views" integer DEFAULT 0,
    "device_type" "text",
    "browser" "text",
    "country" "text",
    "city" "text"
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_setting_key_key" UNIQUE ("setting_key");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_categories"
    ADD CONSTRAINT "blog_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_post_views"
    ADD CONSTRAINT "blog_post_views_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blog_tags"
    ADD CONSTRAINT "blog_tags_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_communication_history"
    ADD CONSTRAINT "user_communication_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_session_id_key" UNIQUE ("session_id");



CREATE INDEX "idx_analytics_events_created_at" ON "public"."analytics_events" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_analytics_events_session_id" ON "public"."analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events" USING "btree" ("event_type");



CREATE INDEX "idx_analytics_events_user_id" ON "public"."analytics_events" USING "btree" ("user_id");



CREATE INDEX "idx_blog_post_views_post_id" ON "public"."blog_post_views" USING "btree" ("post_id");



CREATE INDEX "idx_blog_post_views_viewed_at" ON "public"."blog_post_views" USING "btree" ("viewed_at" DESC);



CREATE INDEX "idx_blog_posts_author" ON "public"."blog_posts" USING "btree" ("author_id");



CREATE INDEX "idx_blog_posts_published_at" ON "public"."blog_posts" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_blog_posts_slug" ON "public"."blog_posts" USING "btree" ("slug");



CREATE INDEX "idx_blog_posts_status" ON "public"."blog_posts" USING "btree" ("status");



CREATE INDEX "idx_notification_campaigns_status" ON "public"."notification_campaigns" USING "btree" ("status");



CREATE INDEX "idx_notifications_campaign_id" ON "public"."notifications" USING "btree" ("campaign_id");



CREATE INDEX "idx_notifications_status" ON "public"."notifications" USING "btree" ("status");



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_user_id" ON "public"."notifications" USING "btree" ("user_id");



CREATE INDEX "idx_performance_metrics_created_at" ON "public"."performance_metrics" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_performance_metrics_type" ON "public"."performance_metrics" USING "btree" ("metric_type");



CREATE INDEX "idx_user_communication_history_type" ON "public"."user_communication_history" USING "btree" ("type");



CREATE INDEX "idx_user_communication_history_user_id" ON "public"."user_communication_history" USING "btree" ("user_id");



CREATE INDEX "idx_user_preferences_public" ON "public"."user_preferences" USING "btree" ("public_profile") WHERE ("public_profile" = true);



CREATE INDEX "idx_user_sessions_started_at" ON "public"."user_sessions" USING "btree" ("started_at" DESC);



CREATE INDEX "idx_user_sessions_user_id" ON "public"."user_sessions" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_blog_post_updated_at" BEFORE UPDATE ON "public"."blog_posts" FOR EACH ROW EXECUTE FUNCTION "public"."update_blog_post_updated_at"();



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admin_users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."admin_settings"
    ADD CONSTRAINT "admin_settings_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."admin_users"
    ADD CONSTRAINT "admin_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_post_views"
    ADD CONSTRAINT "blog_post_views_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."blog_post_views"
    ADD CONSTRAINT "blog_post_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."blog_posts"
    ADD CONSTRAINT "blog_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."notification_campaigns"
    ADD CONSTRAINT "notification_campaigns_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id");



ALTER TABLE ONLY "public"."notification_templates"
    ADD CONSTRAINT "notification_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "public"."notification_campaigns"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."notification_templates"("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."performance_metrics"
    ADD CONSTRAINT "performance_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_communication_history"
    ADD CONSTRAINT "user_communication_history_notification_id_fkey" FOREIGN KEY ("notification_id") REFERENCES "public"."notifications"("id");



ALTER TABLE ONLY "public"."user_communication_history"
    ADD CONSTRAINT "user_communication_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all communication history" ON "public"."user_communication_history" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage all notifications" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage all posts" ON "public"."blog_posts" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage categories" ON "public"."blog_categories" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage tags" ON "public"."blog_tags" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all views" ON "public"."blog_post_views" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view analytics events" ON "public"."analytics_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view performance metrics" ON "public"."performance_metrics" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view user sessions" ON "public"."user_sessions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users"
  WHERE ("admin_users"."user_id" = "auth"."uid"()))));



CREATE POLICY "Anyone can insert analytics events" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can insert views" ON "public"."blog_post_views" FOR INSERT WITH CHECK (true);



CREATE POLICY "Only admins can manage notification campaigns" ON "public"."notification_campaigns" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Only admins can manage notification templates" ON "public"."notification_templates" USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Only admins can modify admin_settings" ON "public"."admin_settings" USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only admins can modify admin_users" ON "public"."admin_users" USING ((("auth"."role"() = 'service_role'::"text") OR ("auth"."email"() = 'joe@nomadicperformance.com'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only admins can view admin_logs" ON "public"."admin_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"()))));



CREATE POLICY "Only admins can view admin_settings" ON "public"."admin_settings" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Only admins can view admin_users" ON "public"."admin_users" FOR SELECT USING ((("auth"."role"() = 'service_role'::"text") OR ("auth"."email"() = 'joe@nomadicperformance.com'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."admin_users" "au"
  WHERE ("au"."user_id" = "auth"."uid"())))));



CREATE POLICY "Public can view categories" ON "public"."blog_categories" FOR SELECT USING (true);



CREATE POLICY "Public can view published posts" ON "public"."blog_posts" FOR SELECT USING (("status" = 'published'::"text"));



CREATE POLICY "Public can view tags" ON "public"."blog_tags" FOR SELECT USING (true);



CREATE POLICY "System can insert performance metrics" ON "public"."performance_metrics" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can insert user sessions" ON "public"."user_sessions" USING (true);



CREATE POLICY "Users can insert their own preferences" ON "public"."user_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own preferences" ON "public"."user_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own communication history" ON "public"."user_communication_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own preferences" ON "public"."user_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admin_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."admin_users" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_post_views" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_posts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."blog_tags" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_campaigns" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notification_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."performance_metrics" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_communication_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."calculate_reading_time"("content" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_reading_time"("content" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_reading_time"("content" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_slug"("title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_analytics_summary"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_analytics_summary"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_analytics_summary"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_content_performance"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_content_performance"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_content_performance"("days_back" integer) TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_or_create_user_preferences"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_popular_posts"("limit_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_popular_posts"("limit_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_popular_posts"("limit_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_engagement_metrics"("days_back" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_engagement_metrics"("days_back" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_engagement_metrics"("days_back" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("action_type" "text", "resource_type" "text", "resource_id" "text", "action_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("action_type" "text", "resource_type" "text", "resource_id" "text", "action_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("action_type" "text", "resource_type" "text", "resource_id" "text", "action_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_notification_send"("p_user_id" "uuid", "p_type" "text", "p_message" "text", "p_campaign_id" "uuid", "p_template_id" "uuid", "p_subject" "text", "p_metadata" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_notification_send"("p_user_id" "uuid", "p_type" "text", "p_message" "text", "p_campaign_id" "uuid", "p_template_id" "uuid", "p_subject" "text", "p_metadata" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_notification_send"("p_user_id" "uuid", "p_type" "text", "p_message" "text", "p_campaign_id" "uuid", "p_template_id" "uuid", "p_subject" "text", "p_metadata" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_blog_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."record_blog_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_blog_post_view"("p_post_id" "uuid", "p_user_id" "uuid", "p_session_id" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_page_view"("p_user_id" "uuid", "p_session_id" "text", "p_url" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "anon";
GRANT ALL ON FUNCTION "public"."record_page_view"("p_user_id" "uuid", "p_session_id" "text", "p_url" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_page_view"("p_user_id" "uuid", "p_session_id" "text", "p_url" "text", "p_referrer" "text", "p_user_agent" "text", "p_ip_address" "inet") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_profile_update"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_profile_update"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_profile_update"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."record_user_registration"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."record_user_registration"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."record_user_registration"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_blog_post_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_blog_post_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_blog_post_updated_at"() TO "service_role";


















GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admin_settings" TO "anon";
GRANT ALL ON TABLE "public"."admin_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_settings" TO "service_role";



GRANT ALL ON TABLE "public"."admin_users" TO "anon";
GRANT ALL ON TABLE "public"."admin_users" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_users" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."blog_post_views" TO "anon";
GRANT ALL ON TABLE "public"."blog_post_views" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_post_views" TO "service_role";



GRANT ALL ON TABLE "public"."blog_posts" TO "anon";
GRANT ALL ON TABLE "public"."blog_posts" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_posts" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_dashboard" TO "anon";
GRANT ALL ON TABLE "public"."analytics_dashboard" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_dashboard" TO "service_role";



GRANT ALL ON TABLE "public"."blog_categories" TO "anon";
GRANT ALL ON TABLE "public"."blog_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_categories" TO "service_role";



GRANT ALL ON TABLE "public"."blog_tags" TO "anon";
GRANT ALL ON TABLE "public"."blog_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."blog_tags" TO "service_role";



GRANT ALL ON TABLE "public"."notification_campaigns" TO "anon";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_campaigns" TO "service_role";



GRANT ALL ON TABLE "public"."notification_templates" TO "anon";
GRANT ALL ON TABLE "public"."notification_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_templates" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."performance_metrics" TO "anon";
GRANT ALL ON TABLE "public"."performance_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."performance_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."user_communication_history" TO "anon";
GRANT ALL ON TABLE "public"."user_communication_history" TO "authenticated";
GRANT ALL ON TABLE "public"."user_communication_history" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";


