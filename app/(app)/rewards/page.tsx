import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { getRewardsAction } from './actions';
import { LeaderboardPanel } from '@/components/rewards/leaderboard-panel';
import { RewardsPanel } from '@/components/rewards/rewards-panel';
import { ComingSoon } from '@/components/shared/coming-soon';

export default async function RewardsPage() {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return <ComingSoon title="Rewards" blurb="Sign in to an organization to see the leaderboard." />;
  }

  const supabase = createClient();
  const [{ data: projectRows }, rewards] = await Promise.all([
    supabase.from('projects').select('id, name').is('archived_at', null),
    getRewardsAction(),
  ]);
  const projects = projectRows ?? [];
  const isAdmin = ['owner', 'admin'].includes(membership.role);

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Rewards</h1>
        <p className="text-sm text-muted-foreground">This month&apos;s leaderboard.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <LeaderboardPanel title="Most on-time completions" metric="on_time" projects={projects} />
        <LeaderboardPanel title="Most kudos received" metric="kudos" projects={projects} />
        <RewardsPanel initialRewards={rewards} isAdmin={isAdmin} />
      </div>
    </div>
  );
}
