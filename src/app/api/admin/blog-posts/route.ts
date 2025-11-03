import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'

    let isAuthorized = isMainAdmin

    if (!isMainAdmin) {
      // Check database admin status
      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        isAuthorized = adminUser !== null
      } catch (dbError) {
        // Table might not exist, only main admin can access
        console.log('Admin users table not found or error:', dbError)
        isAuthorized = false
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const postsDirectory = path.join(process.cwd(), 'src/content/posts')
    const filenames = fs.readdirSync(postsDirectory)

    const posts = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(postsDirectory, filename)
        const fileContents = fs.readFileSync(filePath, 'utf8')
        const { data } = matter(fileContents)

        return {
          slug: filename.replace('.mdx', ''),
          title: data.title || 'Untitled',
          date: data.date || new Date().toISOString(),
          excerpt: data.excerpt || data.description || 'No excerpt available',
          ...data
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return NextResponse.json(posts)
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 })
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

    const isMainAdmin = user.email === 'joe@nomadicperformance.com'

    let isAuthorized = isMainAdmin

    if (!isMainAdmin) {
      // Check database admin status
      try {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', user.id)
          .single()

        isAuthorized = adminUser !== null
      } catch (dbError) {
        // Table might not exist, only main admin can access
        console.log('Admin users table not found or error:', dbError)
        isAuthorized = false
      }
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, excerpt, date } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    // Create frontmatter
    const frontmatter = `---
title: "${title}"
date: "${date || new Date().toISOString()}"
excerpt: "${excerpt || ''}"
---

`

    const fullContent = frontmatter + content
    const filePath = path.join(process.cwd(), 'src/content/posts', `${slug}.mdx`)

    // Write file
    fs.writeFileSync(filePath, fullContent, 'utf8')

    return NextResponse.json({
      success: true,
      slug,
      message: 'Blog post created successfully'
    })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 })
  }
}
