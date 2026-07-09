import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Service-role Supabase client — bypasses RLS entirely. Server-only (the
 * `server-only` import throws a build error if this file is ever pulled into
 * a client bundle). Use only in trusted server code: seed scripts, cron/Edge
 * Functions, and Server Actions that explicitly need to cross org/RLS
 * boundaries (e.g. accepting an org invite before the user is a member yet).
 * Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
 */
export function createAdminClient() {
  if (typeof window !== 'undefined') {
    throw new Error('lib/supabase/admin.ts must never be imported in client code.');
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
