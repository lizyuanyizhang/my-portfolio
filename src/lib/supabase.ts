import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || undefined;

/** 诊断：是否已配置（不暴露具体值） */
export const supabaseConfigStatus = {
  hasUrl: !!supabaseUrl && supabaseUrl.startsWith('https://') && !supabaseUrl.includes('your-project'),
  hasKey: !!supabaseAnonKey && supabaseAnonKey.length > 20 && !supabaseAnonKey.includes('your-anon'),
};

/** Supabase 客户端，用于语音录制上传与读取 */
let supabase: SupabaseClient | null = null;
if (supabaseConfigStatus.hasUrl && supabaseConfigStatus.hasKey) {
  try {
    supabase = createClient(supabaseUrl!, supabaseAnonKey!);
  } catch {
    supabase = null;
  }
}

export { supabase };

export const VOICES_BUCKET = 'voices';
