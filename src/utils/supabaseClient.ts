import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL environment variable is missing.');
}
if (!supabaseAnonKey) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is missing.');
}

// Client for browser and general frontend usage
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as unknown as SupabaseClient);

// Server-only client with administrative privileges
export function getSupabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL. Administrative client cannot be initialized.');
  }
  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });
}
