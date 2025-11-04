import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// GET /api/admin/posts - List all blog posts (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('blog_posts')
      .select(`
        *,
        author:user_preferences(first_name, last_name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: posts, error: postsError } = await query

    if (postsError) {
      console.error('Error fetching posts:', postsError)
      return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })
      .eq(status !== 'all' ? 'status' : '', status !== 'all' ? status : '')

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in GET /api/admin/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/posts - Create new blog post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (adminError || !adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      featured_image_url,
      status = 'draft',
      published_at,
      tags = [],
      categories = [],
      seo_title,
      seo_description,
      seo_keywords = []
    } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Generate slug from title
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_slug', { title })

    if (slugError) {
      console.error('Error generating slug:', slugError)
      return NextResponse.json({ error: 'Failed to generate slug' }, { status: 500 })
    }

    // Calculate reading time and word count
    const wordCount = content.split(' ').length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const postData = {
      title,
      slug: slugData,
      excerpt,
      content,
      featured_image_url,
      status,
      published_at: status === 'published' ? (published_at || new Date().toISOString()) : null,
      author_id: user.id,
      tags,
      categories,
      seo_title,
      seo_description,
      seo_keywords,
      reading_time_minutes: readingTime,
      word_count: wordCount
    }

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select(`
        *,
        author:user_preferences(first_name, last_name)
      `)
      .single()

    if (postError) {
      console.error('Error creating post:', postError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/posts:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/admin/posts/[id] - Update blog post (handled by dynamic route)
// DELETE /api/admin/posts/[id] - Delete blog post (handled by dynamic route)

// For individual post operations, we'll use dynamic routes
// This allows for cleaner URLs like /api/admin/posts/123
