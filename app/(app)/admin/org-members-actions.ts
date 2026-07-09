'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import type { OrgRole } from '@/types/domain';

type ActionResult = { error: string | null };
type ProfileRef = { full_name: string; email: string; digest_opt_out: boolean } | null;

export type OrgMemberRow = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: OrgRole;
  digestOptOut: boolean;
};

export async function getOrgMembersAction(): Promise<OrgMemberRow[]> {
  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return [];

    const supabase = createClient();
    const { data } = await supabase
      .from('org_members')
      .select('id, user_id, org_role, profiles(full_name, email, digest_opt_out)')
      .eq('org_id', membership.orgId);

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as ProfileRef;
      return {
        id: row.id,
        userId: row.user_id,
        name: profile?.full_name || profile?.email || 'Unknown',
        email: profile?.email ?? '',
        role: row.org_role,
        digestOptOut: profile?.digest_opt_out ?? false,
      };
    });
  } catch {
    return [];
  }
}

export async function setOrgNameAction(orgId: string, name: string): Promise<ActionResult> {
  const trimmed = name.trim();
  if (!trimmed) return { error: 'Organization name is required.' };

  const supabase = createClient();
  const { error } = await supabase.from('organizations').update({ name: trimmed }).eq('id', orgId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { error: null };
}

export async function updateMemberRoleAction(
  memberId: string,
  role: OrgRole,
): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('org_members').update({ org_role: role }).eq('id', memberId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { error: null };
}

export async function removeMemberAction(memberId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from('org_members').delete().eq('id', memberId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  return { error: null };
}

export type ArchivableProject = { id: string; name: string; archivedAt: string | null };

export async function getArchivableProjectsAction(): Promise<ArchivableProject[]> {
  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return [];

    const supabase = createClient();
    const { data } = await supabase
      .from('projects')
      .select('id, name, archived_at')
      .eq('org_id', membership.orgId)
      .order('name', { ascending: true });

    return (data ?? []).map((p) => ({ id: p.id, name: p.name, archivedAt: p.archived_at }));
  } catch {
    return [];
  }
}

export async function archiveProjectAction(projectId: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase
    .from('projects')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', projectId);
  if (error) return { error: error.message };

  revalidatePath('/admin');
  revalidatePath('/projects');
  return { error: null };
}
