import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// GET /api/admin/tags - List all tags
export async function GET(request: NextRequest) {
  try {
    // Use admin client since authentication is already checked at the page level
    const supabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: tags, error: tagsError } = await supabase
      .from('blog_tags')
      .select('*')
      .order('name')

    if (tagsError) {
      console.error('Error fetching tags:', tagsError)
      return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
    }

    return NextResponse.json({ tags: tags || [] })

  } catch (error) {
    console.error('Error in GET /api/admin/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/admin/tags - Create new tag
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
    const { name, color } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate slug from name
    const { data: slugData, error: slugError } = await supabase
      .rpc('generate_slug', { title: name })

    if (slugError) {
      console.error('Error generating slug:', slugError)
      return NextResponse.json({ error: 'Failed to generate slug' }, { status: 500 })
    }

    const { data: tag, error: tagError } = await supabase
      .from('blog_tags')
      .insert({
        name,
        slug: slugData,
        color
      })
      .select()
      .single()

    if (tagError) {
      console.error('Error creating tag:', tagError)
      return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 })
    }

    return NextResponse.json({ tag }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/admin/tags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
