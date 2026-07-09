import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership, getOrgMembersForPicker } from '@/lib/supabase/org';
import { ProjectsShell } from './projects-shell';

export default async function ProjectsLayout({ children }: { children: React.ReactNode }) {
  const membership = await getCurrentOrgMembership();

  let projects: { id: string; name: string; cover_color: string }[] = [];
  let orgMembers: { userId: string; name: string }[] = [];
  const canCreate = !!membership && ['owner', 'admin', 'manager'].includes(membership.role);

  if (membership) {
    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('id, name, cover_color')
      .is('archived_at', null)
      .order('created_at', { ascending: false });
    projects = data ?? [];

    if (canCreate) {
      orgMembers = await getOrgMembersForPicker(membership.orgId);
    }
  }

  return (
    <ProjectsShell projects={projects} canCreate={canCreate} orgMembers={orgMembers}>
      {children}
    </ProjectsShell>
  );
}
