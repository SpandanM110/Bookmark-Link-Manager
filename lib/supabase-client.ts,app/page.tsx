// lib/supabase-client.ts
'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | null = null;

// Safe for SSR: returns null on the server, singleton client in the browser.
export function getSupabaseBrowserClient(): SupabaseClient | null {
  if (typeof window === 'undefined') {
    // Server render (including prerender) — do not instantiate
    return null;
  }
  if (!browserClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) {
      console.warn('Supabase env vars missing: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
      return null;
    }
    browserClient = createClient(url, anon);
  }
  return browserClient;
}

// app/page.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from '@/lib/supabase-client';

export default function HomePage() {
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<{ id: string; email?: string | null } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Create the Supabase client only on the client after mount
  useEffect(() => {
    const c = getSupabaseBrowserClient();
    if (c) setSupabase(c);
  }, []);

  // Subscribe to auth state only once we have a client
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setToken(data.session?.access_token ?? null);
      setUser(
        data.session?.user
          ? { id: data.session.user.id, email: data.session.user.email }
          : null
      );
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setToken(session?.access_token ?? null);
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => {
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {}
    };
  }, [supabase]);

  async function authFetch(input: RequestInfo, init?: RequestInit) {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(input, { ...init, headers, cache: 'no-store' });
  }

  async function loginWithGoogle() {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  return (
    <div>
      <h1>Welcome to the App</h1>
      {user ? (
        <div>
          <p>Logged in as {user.email}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={loginWithGoogle}>Login with Google</button>
      )}
    </div>
  );
}
