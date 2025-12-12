/**
 * Supabase Configuration
 * Initialize Supabase client for Storage operations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
// Try Service Key first (full access), then Anon Key (public/RLS access), then generic KEY
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('⚠️ Supabase URL or Key missing. File upload might fail.');
  // Create a mock object or handle this case in controller
}

module.exports = supabase;
