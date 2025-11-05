// src/lib/posts.ts
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import path from 'path';

export type PostMeta = {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags?: string[];
  status?: string;
  published_at?: string;
  featured_image_url?: string;
  reading_time_minutes?: number;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[];
};

const POSTS_DIR = path.join(process.cwd(), "src/content/posts");

export async function getPostSlugs() {
  try {
    // Try server client first (for runtime requests)
    const supabase = await createClient()
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('slug')
      .eq('status', 'published')

    if (!error && posts) {
      return posts.map(post => post.slug)
    }
  } catch (error) {
    // Fall back to admin client for static generation
    console.log('Using admin client for getPostSlugs')
  }

  // Fallback for static generation
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('slug')
    .eq('status', 'published')

  if (error) {
    console.error('Error fetching post slugs:', error)
    return []
  }

  return posts?.map(post => post.slug) || []
}

export async function getPostBySlug(slug: string) {
  try {
    // Try server client first (for runtime requests)
    const supabase = await createClient()
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!error && post) {
      return processPostData(post)
    }
  } catch (error) {
    // Fall back to admin client for static generation
    console.log('Using admin client for getPostBySlug')
  }

  // Fallback for static generation
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !post) {
    throw new Error(`Post not found: ${slug}`)
  }

  return processPostData(post)
}

function processPostData(post: any) {
  // Convert database format to PostMeta format
  const meta: PostMeta = {
    title: post.title,
    slug: post.slug,
    date: post.published_at || post.created_at,
    excerpt: post.excerpt || '',
    tags: post.tags || [],
    status: post.status,
    published_at: post.published_at,
    featured_image_url: post.featured_image_url,
    reading_time_minutes: post.reading_time_minutes,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    seo_keywords: post.seo_keywords
  }

  return { meta, content: post.content || '' }
}

export async function getAllPostsMeta(): Promise<PostMeta[]> {
  try {
    // Try server client first (for runtime requests)
    const supabase = await createClient()
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (!error && posts) {
      return posts.map(processPostMeta)
    }
  } catch (error) {
    // Fall back to admin client for static generation
    console.log('Using admin client for getAllPostsMeta')
  }

  // Fallback for static generation
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: posts, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return posts?.map(processPostMeta) || []
}

function processPostMeta(post: any): PostMeta {
  return {
    title: post.title,
    slug: post.slug,
    date: post.published_at || post.created_at,
    excerpt: post.excerpt || '',
    tags: post.tags || [],
    status: post.status,
    published_at: post.published_at,
    featured_image_url: post.featured_image_url,
    reading_time_minutes: post.reading_time_minutes,
    seo_title: post.seo_title,
    seo_description: post.seo_description,
    seo_keywords: post.seo_keywords
  }
}
