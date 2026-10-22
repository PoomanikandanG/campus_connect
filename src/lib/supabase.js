import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
// Only publishable keys belong in the browser. Configuration failures fail closed.
export const supabase = (() => {
  if (!url || !key || !key.startsWith('sb_publishable_')) return null
  try {
    if (new URL(url).protocol !== 'https:') return null
    return createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } })
  } catch { return null }
})()
