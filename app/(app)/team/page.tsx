import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { ComingSoon } from '@/components/shared/coming-soon';
import { TeamDirectory, type TeamMember } from './team-directory';

type ProfileRef = { full_name: string; email: string; last_active_at: string | null } | null;

export default async function TeamPage() {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return <ComingSoon title="Team" blurb="Sign in to an organization to see your team." />;
  }

  let members: TeamMember[] = [];
  try {
    const supabase = createClient();
    const [{ data: memberRows }, { data: projectMemberRows }] = await Promise.all([
      supabase
        .from('org_members')
        .select('user_id, org_role, profiles(full_name, email, last_active_at)')
        .eq('org_id', membership.orgId),
      supabase
        .from('project_members')
        .select('user_id, projects!inner(name, org_id)')
        .eq('projects.org_id', membership.orgId),
    ]);

    const projectsByUser = new Map<string, string[]>();
    for (const row of projectMemberRows ?? []) {
      const project = row.projects as unknown as { name: string };
      const list = projectsByUser.get(row.user_id) ?? [];
      list.push(project.name);
      projectsByUser.set(row.user_id, list);
    }

    members = (memberRows ?? []).map((row) => {
      const profile = row.profiles as unknown as ProfileRef;
      return {
        userId: row.user_id,
        name: profile?.full_name || profile?.email || 'Unknown',
        email: profile?.email ?? '',
        role: row.org_role,
        lastActiveAt: profile?.last_active_at ?? null,
        projects: projectsByUser.get(row.user_id) ?? [],
      };
    });
  } catch {
    members = [];
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Team</h1>
        <p className="text-sm text-muted-foreground">{membership.orgName}</p>
      </div>
      <TeamDirectory members={members} />
    </div>
  );
}
