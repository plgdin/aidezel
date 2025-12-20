import { createClient } from '@supabase/supabase-js';

// 1. Read variables
const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 2. DEBUG: Check what the browser sees (Look at your Console F12)
console.log("-----------------------------------");
console.log("Supabase Debugging:");
console.log("Raw URL:", rawSupabaseUrl);
console.log("Key Length:", supabaseKey ? supabaseKey.length : "undefined");
console.log("-----------------------------------");

if (!rawSupabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase Environment Variables');
}

// 3. SAFETY FIX: Remove trailing slash if present
// This ensures 'https://xyz.supabase.co/' becomes 'https://xyz.supabase.co'
const supabaseUrl = rawSupabaseUrl.replace(/\/$/, '');

// 4. Create Client
export const supabase = createClient(supabaseUrl, supabaseKey);