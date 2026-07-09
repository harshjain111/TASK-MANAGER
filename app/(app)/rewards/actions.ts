'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

export type LeaderboardRow = { userId: string; name: string; count: number };
type ProfileRef = { full_name: string; email: string } | null;

function startOfMonthISO() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function getOnTimeLeaderboardAction(
  scope: { type: 'project'; projectId: string } | { type: 'org' },
): Promise<LeaderboardRow[]> {
  try {
    const supabase = createClient();
    const monthStart = startOfMonthISO();

    let query = supabase
      .from('tasks')
      .select(
        'due_at, updated_at, project_id, projects!inner(org_id), task_assignees!inner(user_id, is_primary, profiles(full_name, email))',
      )
      .eq('status', 'done')
      .eq('task_assignees.is_primary', true)
      .gte('updated_at', monthStart)
      .is('archived_at', null);

    if (scope.type === 'project') {
      query = query.eq('project_id', scope.projectId);
    } else {
      const membership = await getCurrentOrgMembership();
      if (!membership) return [];
      query = query.eq('projects.org_id', membership.orgId);
    }

    const { data } = await query;

    const countByUser = new Map<string, { name: string; count: number }>();
    for (const row of data ?? []) {
      const onTime = !row.due_at || row.updated_at <= row.due_at;
      if (!onTime) continue;
      const assignees = row.task_assignees as unknown as {
        user_id: string;
        profiles: ProfileRef;
      }[];
      for (const a of assignees) {
        const existing = countByUser.get(a.user_id);
        const name = a.profiles?.full_name || a.profiles?.email || 'Unknown';
        countByUser.set(a.user_id, { name, count: (existing?.count ?? 0) + 1 });
      }
    }

    return Array.from(countByUser.entries())
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export async function getKudosLeaderboardAction(
  scope: { type: 'project'; projectId: string } | { type: 'org' },
): Promise<LeaderboardRow[]> {
  try {
    const supabase = createClient();
    const monthStart = startOfMonthISO();

    let query = supabase
      .from('kudos')
      .select('to_user_id, profiles!kudos_to_user_id_fkey(full_name, email), org_id')
      .gte('created_at', monthStart);

    if (scope.type === 'project') {
      const { data: orgId } = await supabase.rpc('get_project_org_id', {
        check_project_id: scope.projectId,
      });
      if (!orgId) return [];
      query = query.eq('org_id', orgId);
    } else {
      const membership = await getCurrentOrgMembership();
      if (!membership) return [];
      query = query.eq('org_id', membership.orgId);
    }

    const { data } = await query;

    const countByUser = new Map<string, { name: string; count: number }>();
    for (const row of data ?? []) {
      const profile = row.profiles as unknown as ProfileRef;
      const existing = countByUser.get(row.to_user_id);
      const name = profile?.full_name || profile?.email || 'Unknown';
      countByUser.set(row.to_user_id, { name, count: (existing?.count ?? 0) + 1 });
    }

    return Array.from(countByUser.entries())
      .map(([userId, v]) => ({ userId, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  } catch {
    return [];
  }
}

export type RewardRow = { id: string; title: string; description: string | null };

export async function getRewardsAction(): Promise<RewardRow[]> {
  try {
    const membership = await getCurrentOrgMembership();
    if (!membership) return [];
    const supabase = createClient();
    const { data } = await supabase
      .from('rewards')
      .select('id, title, description')
      .eq('org_id', membership.orgId)
      .order('created_at', { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function createRewardAction(
  title: string,
  description: string,
): Promise<{ error: string | null }> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return { error: 'Title is required.' };

  const membership = await getCurrentOrgMembership();
  if (!membership) return { error: 'You must belong to an organization.' };

  const supabase = createClient();
  const { error } = await supabase.from('rewards').insert({
    org_id: membership.orgId,
    title: trimmedTitle,
    description: description.trim() || null,
    created_by: membership.userId,
  });

  if (error) return { error: error.message };
  revalidatePath('/rewards');
  return { error: null };
}

export async function deleteRewardAction(rewardId: string): Promise<{ error: string | null }> {
  const supabase = createClient();
  const { error } = await supabase.from('rewards').delete().eq('id', rewardId);
  if (error) return { error: error.message };
  revalidatePath('/rewards');
  return { error: null };
}
