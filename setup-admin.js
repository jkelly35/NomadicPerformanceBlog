const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

async function setupAdminTables() {
  const supabase = createClient(
    envVars.NEXT_PUBLIC_SUPABASE_URL,
    envVars.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('Setting up admin tables with service role...');

  try {
    // Try to create admin_settings table first (simpler)
    console.log('Creating admin_settings table...');
    const { error: settingsError } = await supabase
      .from('admin_settings')
      .insert({
        key: 'test',
        value: true,
        description: 'Test setting'
      });

    if (settingsError && settingsError.code === 'PGRST204') {
      console.log('admin_settings table does not exist, need to create it manually');
    } else if (settingsError && settingsError.code !== '23505') { // Ignore unique constraint errors
      console.log('admin_settings table might exist:', settingsError);
    }

    // Check admin_settings table
    console.log('Checking admin_settings table...');
    const { data: settingsData, error: settingsTableError } = await supabase
      .from('admin_settings')
      .select('*');

    if (settingsTableError) {
      console.log('Error accessing admin_settings:', settingsTableError);
    } else {
      console.log('admin_settings table contents:', settingsData);
      
      // If table is empty, insert default settings
      if (settingsData.length === 0) {
        console.log('Inserting default settings...');
        const defaultSettings = [
          {
            setting_key: 'dashboard_access',
            setting_value: {
              nutrition: { enabled: true, locked: false },
              training: { enabled: true, locked: false },
              activities: { enabled: true, locked: false },
              equipment: { enabled: true, locked: false },
              goals: { enabled: true, locked: false },
              analytics: { enabled: true, locked: false },
              readiness: { enabled: true, locked: false },
              workouts: { enabled: true, locked: false }
            },
            description: 'Controls which dashboards are enabled for users'
          }
        ];

        for (const setting of defaultSettings) {
          const { error: insertError } = await supabase
            .from('admin_settings')
            .insert(setting);

          if (insertError) {
            console.log('Error inserting setting:', setting.setting_key, insertError);
          } else {
            console.log('Successfully inserted:', setting.setting_key);
          }
        }
      }
    }

  } catch (error) {
    console.error('Setup failed:', error);
  }
}

setupAdminTables();
