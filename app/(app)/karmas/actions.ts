'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { createKarmaSchema, type CreateKarmaInput } from '@/lib/validations/karma';
import type { MyTaskTab, DelegatedTaskTab } from '@/lib/home-tabs';
import type { TaskStatus } from '@/types/domain';

type ActionResult = { error: string | null };

export type PanelKarma = {
  id: string;
  title: string;
  dueAt: string;
  status: TaskStatus;
  ownerId: string;
  ownerName: string;
};

type ProfileRef = { full_name: string; email: string } | null;

export async function createKarmaAction(input: CreateKarmaInput): Promise<ActionResult> {
  const parsed = createKarmaSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const membership = await getCurrentOrgMembership();
  if (!membership) return { error: 'You must belong to an organization.' };

  const supabase = createClient();
  const rest = parsed.data;
  const delegateToUserId = rest.delegateToUserId || undefined;

  const { error } = await supabase.from('karmas').insert({
    org_id: membership.orgId,
    user_id: delegateToUserId ?? membership.userId,
    delegated_by: delegateToUserId ? membership.userId : null,
    title: rest.title,
    description: rest.description || null,
    recurrence_type: rest.recurrenceType,
    recurrence_interval: rest.recurrenceInterval,
    recurrence_days_of_week: rest.recurrenceDaysOfWeek?.length ? rest.recurrenceDaysOfWeek : null,
    due_at: rest.dueAt,
  });

  if (error) return { error: error.message };

  revalidatePath('/karmas');
  revalidatePath('/home');
  return { error: null };
}

export async function getKarmaPanelAction(
  scope: 'my' | 'delegated',
  tab: MyTaskTab | DelegatedTaskTab,
): Promise<PanelKarma[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('karmas')
      .select('id, title, due_at, status, user_id, profiles!karmas_user_id_fkey(full_name, email)')
      .eq(scope === 'my' ? 'user_id' : 'delegated_by', user.id)
      .is('archived_at', null);

    const now = new Date().toISOString();
    const sevenDaysOut = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    if (tab === 'Due Soon') {
      query = query.gte('due_at', now).lte('due_at', sevenDaysOut).neq('status', 'done');
    } else if (tab === 'Overdue') {
      query = query.lt('due_at', now).neq('status', 'done');
    } else if (tab === 'Stuck') {
      query = query.eq('status', 'stuck');
    } else if (tab === 'Review') {
      query = query.eq('status', 'review');
    } else if (tab === 'Co-act') {
      // Karmas have exactly one owner — there's no co-actor concept in this
      // table (unlike tasks), so this tab is intentionally always empty.
      return [];
    }

    const { data } = await query.order('due_at', { ascending: true });

    return (data ?? []).map((row) => {
      const profile = row.profiles as unknown as ProfileRef;
      return {
        id: row.id,
        title: row.title,
        dueAt: row.due_at,
        status: row.status,
        ownerId: row.user_id,
        ownerName: profile?.full_name || profile?.email || 'Unknown',
      };
    });
  } catch {
    return [];
  }
}

export async function updateKarmaStatusAction(
  karmaId: string,
  fromStatus: TaskStatus,
  toStatus: TaskStatus,
): Promise<ActionResult & { appliedStatus?: TaskStatus }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  let appliedStatus = toStatus;
  let delegatorId: string | null = null;
  if (toStatus === 'done') {
    const { data: karma } = await supabase
      .from('karmas')
      .select('delegated_by, title, org_id')
      .eq('id', karmaId)
      .maybeSingle();
    if (karma?.delegated_by) {
      delegatorId = karma.delegated_by;
      appliedStatus = 'review';
    }
  }

  const { data: karma, error } = await supabase
    .from('karmas')
    .update({ status: appliedStatus })
    .eq('id', karmaId)
    .select('title, org_id')
    .single();
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    org_id: karma.org_id,
    actor_id: user.id,
    entity_type: 'karma',
    entity_id: karmaId,
    action: 'status_changed',
    metadata: { from: fromStatus, to: appliedStatus, title: karma.title },
  });

  if (delegatorId && delegatorId !== user.id) {
    await supabase.from('notifications').insert({
      org_id: karma.org_id,
      user_id: delegatorId,
      type: 'karma_review',
      payload: { karmaId, karmaTitle: karma.title },
    });
  }

  revalidatePath('/karmas');
  revalidatePath('/home');
  return { error: null, appliedStatus };
}

export async function approveKarmaAction(karmaId: string): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: karma, error } = await supabase
    .from('karmas')
    .update({ status: 'done' })
    .eq('id', karmaId)
    .select('title, org_id, user_id')
    .single();
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    org_id: karma.org_id,
    actor_id: user.id,
    entity_type: 'karma',
    entity_id: karmaId,
    action: 'approved',
    metadata: { title: karma.title },
  });

  if (karma.user_id !== user.id) {
    await supabase.from('notifications').insert({
      org_id: karma.org_id,
      user_id: karma.user_id,
      type: 'karma_approved',
      payload: { karmaId, karmaTitle: karma.title },
    });
  }

  revalidatePath('/karmas');
  revalidatePath('/home');
  return { error: null };
}

export async function reopenKarmaAction(karmaId: string, comment: string): Promise<ActionResult> {
  const trimmed = comment.trim();
  if (!trimmed) return { error: 'A comment is required when reopening a karma.' };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { data: karma, error } = await supabase
    .from('karmas')
    .update({ status: 'in_progress' })
    .eq('id', karmaId)
    .select('title, org_id, user_id')
    .single();
  if (error) return { error: error.message };

  await supabase.from('activity_log').insert({
    org_id: karma.org_id,
    actor_id: user.id,
    entity_type: 'karma',
    entity_id: karmaId,
    action: 'reopened',
    metadata: { title: karma.title, comment: trimmed },
  });

  if (karma.user_id !== user.id) {
    await supabase.from('notifications').insert({
      org_id: karma.org_id,
      user_id: karma.user_id,
      type: 'karma_reopened',
      payload: { karmaId, karmaTitle: karma.title },
    });
  }

  revalidatePath('/karmas');
  revalidatePath('/home');
  return { error: null };
}
