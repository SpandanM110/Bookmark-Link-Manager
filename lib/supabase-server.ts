import 'server-only'

type SupaUserResponse =
  | {
      id: string
      email?: string | null
      // other fields omitted
    }
  | { error: string }

/**
 * Extracts the Supabase access token from the Authorization header and
 * verifies it with Supabase Auth. Returns a minimal user object on success.
 *
 * Keep verification in your Route Handlers (BFF pattern). [^5]
 */
export async function getUserFromRequest(
  req: Request
): Promise<{ id: string; email: string | null } | null> {
  try {
    const authHeader =
      req.headers.get('authorization') || req.headers.get('Authorization')
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
      return null
    }
    const token = authHeader.slice('bearer '.length)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !anonKey) {
      // Without env vars, treat as unauthenticated
      return null
    }

    // Call Supabase Auth user endpoint with the access token
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: anonKey,
      },
      cache: 'no-store',
    })

    if (!res.ok) return null
    const data = (await res.json()) as SupaUserResponse
    if (!('id' in data)) return null

    return { id: data.id, email: (data as any).email ?? null }
  } catch {
    return null
  }
}
