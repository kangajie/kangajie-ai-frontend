import { createClient } from '@supabase/supabase-js';

// ─── Custom Safe Storage ──────────────────────────────────────────────────────
// Instagram, TikTok, WhatsApp in-app browser memblokir localStorage.
// Custom storage ini mencegah Supabase crash dengan fallback ke in-memory.
const _mem = {};
const safeSupabaseStorage = {
  getItem:    (k) => { try { return localStorage.getItem(k);    } catch { return _mem[k] ?? null; } },
  setItem:    (k, v) => { try { localStorage.setItem(k, v);    } catch { _mem[k] = v; } },
  removeItem: (k) => { try { localStorage.removeItem(k);       } catch { delete _mem[k]; } },
};

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://bljmcpntnubxdyxfjpyg.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_VQKO_b2YYSQqhQYyht2SWA_dLK1_Bre';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeSupabaseStorage,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
