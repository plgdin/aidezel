import { createClient } from '@supabase/supabase-js';

// 1. Your Project URL (I derived this from your previous screenshot)
const supabaseUrl = 'https://mghviexfuqztgbxhrslc.supabase.co';

// 2. Your Publishable Key (Copy this from your screen)
// It starts with: sb_publishable_...
const supabaseKey = 'sb_publishable_-_b_2pBqVWI8ePkXNRpfmA_HP1GNh8j';

export const supabase = createClient(supabaseUrl, supabaseKey);