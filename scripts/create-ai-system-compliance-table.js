const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createAISystemComplianceTable() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('Creating ai_system_compliance table...');

    // Read the migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'create_ai_system_compliance.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Error creating table:', error);
      process.exit(1);
    }

    console.log('✅ ai_system_compliance table created successfully!');
  } catch (err) {
    console.error('Failed to create table:', err);
    process.exit(1);
  }
}

createAISystemComplianceTable();