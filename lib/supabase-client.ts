'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  interface Window {
    __supabase?: SupabaseClient
  }
}

/**
 * Returns a singleton Supabase client for the browser.
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient must be called in the browser')
  }
  if (!window.__supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) {
      throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    }
    window.__supabase = createClient(url, anon)
  }
  return window.__supabase!
}
