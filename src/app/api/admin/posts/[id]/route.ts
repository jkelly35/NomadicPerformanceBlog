import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

// PUT /api/admin/posts/[id] - Update blog post
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id
    const body = await request.json()
    const {
      title,
      excerpt,
      content,
      featured_image_url,
      status,
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

    // Generate new slug if title changed
    let slug = body.slug
    if (!slug) {
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_slug', { title })

      if (slugError) {
        console.error('Error generating slug:', slugError)
        return NextResponse.json({ error: 'Failed to generate slug' }, { status: 500 })
      }
      slug = slugData
    }

    // Calculate reading time and word count
    const wordCount = content.split(' ').length
    const readingTime = Math.max(1, Math.ceil(wordCount / 200))

    const updateData = {
      title,
      slug,
      excerpt,
      content,
      featured_image_url,
      status,
      published_at: status === 'published' ? (published_at || new Date().toISOString()) : null,
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
      .update(updateData)
      .eq('id', postId)
      .select(`
        *,
        author:user_preferences(first_name, last_name)
      `)
      .single()

    if (postError) {
      console.error('Error updating post:', postError)
      return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('Error in PUT /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/admin/posts/[id] - Delete blog post
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id

    const { error: deleteError } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)

    if (deleteError) {
      console.error('Error deleting post:', deleteError)
      return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Post deleted successfully' })

  } catch (error) {
    console.error('Error in DELETE /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/admin/posts/[id] - Get single blog post
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const postId = params.id

    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:user_preferences(first_name, last_name)
      `)
      .eq('id', postId)
      .single()

    if (postError) {
      console.error('Error fetching post:', postError)
      return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
    }

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({ post })

  } catch (error) {
    console.error('Error in GET /api/admin/posts/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
