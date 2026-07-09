import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getDigestCounts } from '@/lib/digest';
import { sendEmail } from '@/lib/resend';

/**
 * Daily digest email (P22) — "You have N tasks and N karmas today, N
 * overdue." Not schedulable from this codebase alone: this route is the
 * target a Supabase Edge Function (or Vercel Cron) hits on a schedule once
 * deployed (P38), guarded by CRON_SECRET so it can't be triggered publicly.
 */
export async function POST(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { data: memberships } = await supabase
    .from('org_members')
    .select('org_id, user_id, profiles!inner(email, full_name, digest_opt_out)');

  let sent = 0;
  let skipped = 0;

  for (const membership of memberships ?? []) {
    const profile = membership.profiles as unknown as {
      email: string;
      full_name: string;
      digest_opt_out: boolean;
    };
    if (profile.digest_opt_out) {
      skipped += 1;
      continue;
    }

    const counts = await getDigestCounts(supabase, membership.org_id, membership.user_id);
    if (counts.tasksToday === 0 && counts.karmasToday === 0 && counts.overdue === 0) {
      skipped += 1;
      continue;
    }

    await sendEmail({
      to: profile.email,
      subject: `You have ${counts.tasksToday + counts.karmasToday} things due today`,
      html: `<p>Hi ${profile.full_name || 'there'},</p>
        <p>You have <strong>${counts.tasksToday}</strong> tasks and <strong>${counts.karmasToday}</strong> karmas due today, and <strong>${counts.overdue}</strong> overdue.</p>
        <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/home">Open Flowdesk</a></p>`,
    });
    sent += 1;
  }

  return NextResponse.json({ sent, skipped });
}
