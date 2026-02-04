import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Environment variables:', {
    SUPABASE_URL: supabaseUrl ? '✓' : '✗ MISSING',
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? '✓' : '✗ MISSING',
    SUPABASE_ANON_KEY: supabaseAnonKey ? '✓' : '✗ MISSING'
  });
  throw new Error('Missing Supabase environment variables. Check .env file in server directory.');
}

// Admin client (service role - bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// User client (anon key - respects RLS)
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
});
