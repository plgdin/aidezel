import { createClient } from '@supabase/supabase-js';

// 1. Read variables
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!rawSupabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// 2. SAFETY FIX: Remove trailing slash if present
// This ensures 'https://xyz.supabase.co/' becomes 'https://xyz.supabase.co'
const supabaseUrl = rawSupabaseUrl.replace(/\/$/, '');

export const supabase = createClient(supabaseUrl, supabaseKey);