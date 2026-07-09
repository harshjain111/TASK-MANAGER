'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

export type SearchResults = {
  tasks: { id: string; title: string; projectId: string }[];
  karmas: { id: string; title: string }[];
  projects: { id: string; name: string }[];
  people: { id: string; name: string }[];
};

const EMPTY: SearchResults = { tasks: [], karmas: [], projects: [], people: [] };

export async function globalSearchAction(rawQuery: string): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (query.length < 2) return EMPTY;

  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return EMPTY;

    const supabase = createClient();
    const pattern = `%${query}%`;

    // Each query is scoped by RLS to the caller's session — a guest with
    // restricted column access, for instance, only gets matches from tasks
    // they can actually see (0013_guest_vendor_role.sql).
    const [{ data: tasks }, { data: karmas }, { data: projects }, { data: people }] = await Promise.all([
      supabase.from('tasks').select('id, title, project_id').ilike('title', pattern).is('archived_at', null).limit(8),
      supabase.from('karmas').select('id, title').ilike('title', pattern).is('archived_at', null).limit(8),
      supabase.from('projects').select('id, name').ilike('name', pattern).is('archived_at', null).limit(8),
      supabase
        .from('org_members')
        .select('user_id, profiles(full_name, email)')
        .eq('org_id', membership.orgId)
        .limit(50),
    ]);

    const peopleMatches = (people ?? [])
      .map((row) => {
        const profile = row.profiles as unknown as { full_name: string; email: string } | null;
        return { id: row.user_id, name: profile?.full_name || profile?.email || 'Unknown' };
      })
      .filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8);

    return {
      tasks: (tasks ?? []).map((t) => ({ id: t.id, title: t.title, projectId: t.project_id })),
      karmas: (karmas ?? []).map((k) => ({ id: k.id, title: k.title })),
      projects: (projects ?? []).map((p) => ({ id: p.id, name: p.name })),
      people: peopleMatches,
    };
  } catch {
    return EMPTY;
  }
}
