import { supabase } from '../lib/supabase';
import { BACKEND_URL } from '../lib/constants';

/**
 * Fetch daily suggestions from Supabase / Backend API
 * Table: daily_suggestions
 * Column: topics (jsonb array of {icon, color, text})
 */
export async function fetchDailySuggestions() {
  // 1. Coba ambil dari endpoint backend /api/suggestions (bebas blokir RLS Supabase)
  try {
    const url = `${BACKEND_URL}/api/suggestions`;
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      if (json && isValidDailySuggestions(json.topics)) {
        return json.topics;
      }
    }
  } catch (err) {
    console.warn('Gagal ambil dari /api/suggestions, mencoba langsung ke Supabase...', err);
  }

  // 2. Fallback: langsung query ke Supabase
  try {
    let { data, error } = await supabase
      .from('daily_suggestions')
      .select('topics')
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      const res2 = await supabase
        .from('daily_suggestions')
        .select('topics')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      data = res2.data;
      error = res2.error;
    }

    if (error) {
      console.error('Error fetching daily suggestions:', error);
      return null;
    }

    return data?.topics || null;
  } catch (err) {
    console.error('Error Supabase suggestions:', err);
    return null;
  }
}

/**
 * Validate suggestions array
 */
export function isValidDailySuggestions(arr) {
  if (!Array.isArray(arr) || arr.length < 1) return false;
  return arr.every(s =>
    typeof s === 'object' &&
    s &&
    typeof s.text === 'string' &&
    s.text.trim() !== ''
  );
}
