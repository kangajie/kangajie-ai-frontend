import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bljmcpntnubxdyxfjpyg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VQKO_b2YYSQqhQYyht2SWA_dLK1_Bre';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
