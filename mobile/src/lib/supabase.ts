import { createClient } from '@supabase/supabase-js';
import { safeStorage } from './storage';

export const SUPABASE_URL = 'https://nxuwssqexezkbynulmlk.supabase.co';
export const SUPABASE_ANON_KEY = 'sb_publishable_Kd4w_TvVH-w3R5r0J6bXHw_QzPfigOu';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper to check connection status
export async function testSupabaseConnection(): Promise<{ ok: boolean; message: string }> {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('not find the table')) {
        return {
          ok: false,
          message: 'Connected to Supabase, but tables need to be created. Run supabase/schema.sql in SQL Editor.',
        };
      }
      return { ok: false, message: error.message };
    }
    return { ok: true, message: 'Connected and synchronized with Supabase!' };
  } catch (err: any) {
    return { ok: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
}
