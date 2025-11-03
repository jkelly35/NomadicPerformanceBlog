const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updatePolicies() {
  try {
    console.log('Updating admin_users RLS policies...')

    // Drop existing policies
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Only admins can view admin_users" ON admin_users;
        DROP POLICY IF EXISTS "Only admins can modify admin_users" ON admin_users;
      `
    })

    // Create new policies
    await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Only admins can view admin_users" ON admin_users
          FOR SELECT USING (
            auth.role() = 'service_role' OR
            auth.email() = 'joe@nomadicperformance.com' OR
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid()
            )
          );

        CREATE POLICY "Only admins can modify admin_users" ON admin_users
          FOR ALL USING (
            auth.role() = 'service_role' OR
            auth.email() = 'joe@nomadicperformance.com' OR
            EXISTS (
              SELECT 1 FROM admin_users au
              WHERE au.user_id = auth.uid()
            )
          );
      `
    })

    console.log('Policies updated successfully!')
  } catch (error) {
    console.error('Error updating policies:', error)
  }
}

updatePolicies()
