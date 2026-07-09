import { createClient } from '@/lib/supabase/server';

/**
 * The org + role for the current user. Flowdesk doesn't have an org-switcher
 * (CLAUDE.md has no multi-org UI in scope) — every user belongs to exactly
 * one org in practice, so we take the first membership row.
 */
export async function getCurrentOrgMembership() {
  // Supabase unreachable/unconfigured (e.g. local dev with no project wired
  // up yet) should degrade to "no membership", not 500 the page — same
  // fallback as lib/supabase/middleware.ts.
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('org_members')
      .select('org_id, org_role, organizations(name)')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!data) return null;

    return {
      orgId: data.org_id,
      role: data.org_role,
      orgName: (data.organizations as unknown as { name: string } | null)?.name ?? '',
      userId: user.id,
    };
  } catch {
    return null;
  }
}

/** Org teammates for member pickers (New Project modal, AssigneePicker). */
export async function getOrgMembersForPicker(orgId: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from('org_members')
      .select('user_id, profiles(full_name, email)')
      .eq('org_id', orgId);

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as { full_name: string; email: string } | null;
      return {
        userId: row.user_id,
        name: profile?.full_name || profile?.email || 'Unknown',
      };
    });
  } catch {
    return [];
  }
}
