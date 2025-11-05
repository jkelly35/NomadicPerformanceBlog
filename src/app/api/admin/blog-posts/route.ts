import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    console.log('Blog Posts API: Called')
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('Blog Posts API: Auth check:', { user: user?.email, error: userError })

    if (userError || !user) {
      console.log('Blog Posts API: Not authenticated')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: adminCheck, error: adminError } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    console.log('Blog Posts API: Admin check:', { adminCheck, adminError })

    if (adminError || !adminCheck) {
      console.log('Blog Posts API: Admin access required')
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
        *
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

    // Get total count for pagination
    let countQuery = supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true })

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error getting count:', countError)
    }

    return NextResponse.json({
      posts: posts || [],
      total: count || 0,
      limit,
      offset
    })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      slug,
      excerpt,
      content,
      featured_image_url,
      status = 'draft',
      categories = [],
      tags = [],
      seo_title,
      seo_description,
      seo_keywords = []
    } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: 'Title, slug, and content are required' }, { status: 400 })
    }

    // Calculate reading time and word count
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        status,
        author_id: user.id,
        categories,
        tags,
        seo_title,
        seo_description,
        seo_keywords,
        reading_time_minutes: readingTime,
        word_count: wordCount,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating post:', insertError)
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
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
      id,
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      status,
      categories = [],
      tags = [],
      seo_title,
      seo_description,
      seo_keywords = []
    } = body

    if (!id || !title || !slug || !content) {
      return NextResponse.json({ error: 'ID, title, slug, and content are required' }, { status: 400 })
    }

    // Calculate reading time and word count
    const wordCount = content.split(/\s+/).length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const { data: post, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt,
        content,
        featured_image_url,
        status,
        categories,
        tags,
        seo_title,
        seo_description,
        seo_keywords,
        reading_time_minutes: readingTime,
        word_count: wordCount,
        published_at: status === 'published' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating post:', updateError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 })
    }

    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
