/**
 * Script to delete a user from Supabase Auth
 * Usage: tsx scripts/delete-user.ts <user-email>
 * Example: tsx scripts/delete-user.ts kishoratada@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in environment variables');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function deleteUser(email: string) {
  try {
    console.log(`🔍 Looking up user with email: ${email}`);
    
    // First, find the user by email
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError);
      return;
    }
    
    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`❌ User with email ${email} not found`);
      console.log('Available users:');
      users.users.forEach(u => console.log(`  - ${u.email} (${u.id})`));
      return;
    }
    
    console.log(`✅ Found user: ${user.email} (${user.id})`);
    console.log(`   Display name: ${user.user_metadata?.name || 'N/A'}`);
    console.log(`   Created at: ${user.created_at}`);
    
    // Delete the user
    console.log(`\n🗑️  Deleting user...`);
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError);
      return;
    }
    
    console.log(`✅ User ${email} deleted successfully!`);
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Please provide an email address');
  console.log('Usage: tsx scripts/delete-user.ts <user-email>');
  console.log('Example: tsx scripts/delete-user.ts kishoratada@gmail.com');
  process.exit(1);
}

deleteUser(email).then(() => {
  process.exit(0);
});
