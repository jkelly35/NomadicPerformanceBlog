import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is the main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can setup admin schema' }, { status: 403 })
    }

    // Read the admin_schema.sql file
    const schemaPath = path.join(process.cwd(), 'admin_schema.sql')
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8')

    // Split the SQL into individual statements (basic splitting by semicolon)
    const statements = schemaSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: statement })
          if (error) {
            console.error(`Error executing statement ${i + 1}:`, error)
            // Continue with other statements even if one fails
          } else {
            console.log(`Executed statement ${i + 1}/${statements.length}`)
          }
        } catch (err) {
          console.error(`Exception executing statement ${i + 1}:`, err)
        }
      }
    }

    return NextResponse.json({
      message: 'Admin schema execution attempted',
      statementsExecuted: statements.length
    })

  } catch (error) {
    console.error('Error executing admin schema:', error)
    return NextResponse.json({ error: 'Failed to execute admin schema' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is the main admin
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (user.email !== 'joe@nomadicperformance.com') {
      return NextResponse.json({ error: 'Not authorized - only main admin can setup admin schema' }, { status: 403 })
    }

    // Check if admin tables already exist by trying to query them
    let tablesExist = false
    let adminUserExists = false
    let adminSettingsExist = false

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id')
        .limit(1)

      tablesExist = !error

      if (tablesExist) {
        // Check if main admin user exists
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .single()

        adminUserExists = !adminError && adminData !== null

        // Check if admin_settings table exists
        try {
          const { data: settingsData, error: settingsError } = await supabase
            .from('admin_settings')
            .select('id')
            .limit(1)

          adminSettingsExist = !settingsError && settingsData !== null
        } catch (settingsCheckError) {
          // Table doesn't exist or other error
          adminSettingsExist = false
        }
      }
    } catch (e) {
      tablesExist = false
      adminUserExists = false
      adminSettingsExist = false
    }

    if (tablesExist && adminUserExists && adminSettingsExist) {
      return NextResponse.json({
        message: 'Admin system is fully configured',
        schemaExists: true,
        adminUserExists: true,
        adminSettingsExist: true
      })
    }

    if (!tablesExist) {
      // Try to create the admin_settings table directly
      try {
        // First, try to create the admin_settings table
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS admin_settings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            setting_key TEXT NOT NULL UNIQUE,
            setting_value JSONB NOT NULL,
            description TEXT,
            created_by UUID REFERENCES admin_users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
          );
        `

        // Try to execute the table creation (this might not work with standard Supabase client)
        // For now, provide instructions
        return NextResponse.json({
          message: 'Admin setup required - admin_settings table missing',
          schemaExists: false,
          adminUserExists: false,
          adminSettingsTableMissing: true,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to the SQL Editor',
            '3. Run this SQL to create the admin_settings table:',
            createTableSQL,
            '4. Then run the rest of admin_schema.sql if not already done',
            '5. Return here and refresh to complete setup'
          ],
          createTableSQL: createTableSQL
        })
      } catch (createError) {
        return NextResponse.json({
          message: 'Admin setup required',
          schemaExists: false,
          adminUserExists: false,
          instructions: [
            '1. Go to your Supabase dashboard',
            '2. Navigate to the SQL Editor',
            '3. Run the contents of admin_schema.sql file',
            '4. This will create admin_users, admin_logs, and admin_settings tables with proper permissions',
            '5. Return here and refresh to insert the main admin user'
          ],
          sqlFile: 'admin_schema.sql'
        })
      }
    }

    // Tables exist but admin user doesn't - insert the main admin user
    if (tablesExist && !adminUserExists) {
      try {
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert({
            user_id: user.id,
            role: 'super_admin',
            permissions: {
              read: true,
              write: true,
              delete: true,
              manage_users: true
            }
          })

        if (insertError) {
          console.error('Error inserting admin user:', insertError)
          return NextResponse.json({
            error: 'Failed to insert main admin user',
            details: insertError.message
          }, { status: 500 })
        }

        return NextResponse.json({
          message: 'Main admin user inserted successfully',
          schemaExists: true,
          adminUserExists: true,
          adminSettingsExist: adminSettingsExist
        })
      } catch (insertError) {
        console.error('Error inserting admin user:', insertError)
        return NextResponse.json({
          error: 'Failed to insert main admin user',
          details: insertError
        }, { status: 500 })
      }
    }

    // Tables and admin user exist but admin_settings don't - create them
    if (tablesExist && adminUserExists && !adminSettingsExist) {
      try {
        // Insert default dashboard settings
        const { error: settingsError } = await supabase
          .from('admin_settings')
          .insert({
            setting_key: 'dashboard_access',
            setting_value: {
              nutrition: { enabled: true, locked: false },
              training: { enabled: true, locked: false },
              activities: { enabled: true, locked: false },
              equipment: { enabled: true, locked: false }
            },
            description: 'Controls which dashboards are enabled and locked for users'
          })

        if (settingsError) {
          console.error('Error creating admin settings:', settingsError)
          return NextResponse.json({
            error: 'Failed to create admin settings',
            details: settingsError.message
          }, { status: 500 })
        }

        return NextResponse.json({
          message: 'Admin settings created successfully',
          schemaExists: true,
          adminUserExists: true,
          adminSettingsExist: true
        })
      } catch (settingsError) {
        console.error('Error creating admin settings:', settingsError)
        return NextResponse.json({
          error: 'Failed to create admin settings',
          details: settingsError
        }, { status: 500 })
      }
    }

  } catch (error) {
    console.error('Error checking admin setup:', error)
    return NextResponse.json({ error: 'Failed to check admin setup' }, { status: 500 })
  }
}
