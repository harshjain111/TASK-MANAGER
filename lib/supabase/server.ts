import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

/**
 * Supabase client for use in Server Components, Server Actions, and Route Handlers.
 * Reads/writes the auth session via Next.js cookies. Subject to RLS as the calling user.
 */
export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no request context (e.g. during
            // static rendering) — the middleware refreshes the session instead.
          }
        },
      },
    },
  );
}
