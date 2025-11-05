import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role (you might want to adjust this logic)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Read the SQL file
    const fs = require('fs')
    const path = require('path')
    const sqlPath = path.join(process.cwd(), 'meal_planning_schema.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Execute the SQL (Note: This is a simplified approach.
    // In production, you'd want to use proper migration tools)
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      console.error('Error executing SQL:', error)
      return NextResponse.json({ error: 'Failed to execute schema' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Schema created successfully' })

  } catch (error) {
    console.error('Error in schema creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
