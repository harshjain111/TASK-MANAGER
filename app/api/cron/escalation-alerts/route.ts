import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STUCK_THRESHOLD_HOURS = 24;

/**
 * Manager escalation (P23): tasks overdue past the org's configurable
 * threshold, or stuck for more than 24h, notify the project's managers
 * (not just the assignee). Same deployment story as P22's digest — this
 * route is the target a scheduled job hits, guarded by CRON_SECRET.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = Date.now();

  const { data: orgs } = await supabase.from('organizations').select('id, escalation_threshold_hours');
  const thresholdByOrg = new Map((orgs ?? []).map((o) => [o.id, o.escalation_threshold_hours]));

  const { data: candidateTasks } = await supabase
    .from('tasks')
    .select('id, title, project_id, status, due_at, updated_at, projects!inner(org_id)')
    .is('archived_at', null)
    .neq('status', 'done')
    .or(`due_at.not.is.null,status.eq.stuck`);

  let escalated = 0;

  for (const task of candidateTasks ?? []) {
    const orgId = (task.projects as unknown as { org_id: string }).org_id;
    const thresholdHours = thresholdByOrg.get(orgId) ?? 24;

    const isOverdue =
      !!task.due_at && now - new Date(task.due_at).getTime() > thresholdHours * 60 * 60 * 1000;
    const isStuck =
      task.status === 'stuck' &&
      now - new Date(task.updated_at).getTime() > STUCK_THRESHOLD_HOURS * 60 * 60 * 1000;
    if (!isOverdue && !isStuck) continue;

    // Don't re-escalate a task we already escalated in the last 24h.
    const { data: recentEscalation } = await supabase
      .from('activity_log')
      .select('id')
      .eq('entity_type', 'task')
      .eq('entity_id', task.id)
      .eq('action', 'escalated')
      .gte('created_at', new Date(now - 24 * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();
    if (recentEscalation) continue;

    const { data: managers } = await supabase
      .from('project_members')
      .select('user_id')
      .eq('project_id', task.project_id)
      .eq('project_role', 'manager');
    if (!managers || managers.length === 0) continue;

    await supabase.from('notifications').insert(
      managers.map((m) => ({
        org_id: orgId,
        user_id: m.user_id,
        type: 'task_escalated',
        payload: { taskId: task.id, taskTitle: task.title, projectId: task.project_id, reason: isStuck ? 'stuck' : 'overdue' },
      })),
    );

    // activity_log.actor_id has no nullable "system" option — attribute the
    // automated entry to the first notified manager rather than add a
    // schema-wide nullable-actor exception for this one automated case.
    await supabase.from('activity_log').insert({
      org_id: orgId,
      actor_id: managers[0]!.user_id,
      entity_type: 'task',
      entity_id: task.id,
      action: 'escalated',
      metadata: { title: task.title, reason: isStuck ? 'stuck' : 'overdue' },
    });

    escalated += 1;
  }

  return NextResponse.json({ escalated });
}
