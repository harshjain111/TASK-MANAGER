import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership, getOrgMembersForPicker } from '@/lib/supabase/org';
import { MembersManager } from './members-manager';
import type { ProjectRole } from '@/types/domain';

type ProfileRef = { full_name: string; email: string } | null;
type MemberRow = { id: string; userId: string; name: string; role: ProjectRole; columnIds: string[] };

export default async function ProjectMembersPage({ params }: { params: { projectId: string } }) {
  let project: { id: string; name: string; org_id: string } | null = null;
  let members: MemberRow[] = [];
  let columns: { id: string; name: string }[] = [];
  let addableMembers: { userId: string; name: string }[] = [];
  let canManage = false;

  try {
    const supabase = createClient();

    const { data: projectRow } = await supabase
      .from('projects')
      .select('id, name, org_id')
      .eq('id', params.projectId)
      .maybeSingle();
    project = projectRow;

    if (project) {
      const [
        { data: memberRows },
        { data: columnRows },
        { data: accessRows },
        membership,
        { data: viewerRole },
      ] = await Promise.all([
        supabase
          .from('project_members')
          .select('id, user_id, project_role, profiles(full_name, email)')
          .eq('project_id', project.id),
        supabase
          .from('board_columns')
          .select('id, name')
          .eq('project_id', project.id)
          .is('archived_at', null)
          .order('position', { ascending: true }),
        supabase.from('project_column_access').select('user_id, column_id').eq('project_id', project.id),
        getCurrentOrgMembership(),
        supabase
          .from('project_members')
          .select('project_role')
          .eq('project_id', project.id)
          .maybeSingle(),
      ]);

      canManage =
        viewerRole?.project_role === 'manager' ||
        (!!membership && ['owner', 'admin'].includes(membership.role));

      const accessByUser = new Map<string, string[]>();
      for (const row of accessRows ?? []) {
        accessByUser.set(row.user_id, [...(accessByUser.get(row.user_id) ?? []), row.column_id]);
      }

      members = (memberRows ?? []).map((row) => {
        const profile = row.profiles as unknown as ProfileRef;
        return {
          id: row.id,
          userId: row.user_id,
          name: profile?.full_name || profile?.email || 'Unknown',
          role: row.project_role as ProjectRole,
          columnIds: accessByUser.get(row.user_id) ?? [],
        };
      });

      columns = columnRows ?? [];

      const orgMembers = membership ? await getOrgMembersForPicker(membership.orgId) : [];
      const memberUserIds = new Set(members.map((m) => m.userId));
      addableMembers = orgMembers.filter((m) => !memberUserIds.has(m.userId));
    }
  } catch {
    project = null;
  }

  if (!project) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{project.name} — Members</h1>
        <p className="text-sm text-muted-foreground">
          Guests only see the board columns you grant them access to.
        </p>
      </div>

      <MembersManager
        projectId={project.id}
        members={members}
        columns={columns}
        addableMembers={addableMembers}
        canManage={canManage}
      />
    </div>
  );
}
