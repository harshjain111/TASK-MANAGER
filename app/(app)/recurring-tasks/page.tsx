import { getCurrentOrgMembership, getOrgMembersForPicker } from '@/lib/supabase/org';
import { ComingSoon } from '@/components/shared/coming-soon';
import { KarmaPanel } from '@/components/karmas/karma-panel';
import { CreateKarmaDialog } from '@/components/karmas/create-karma-dialog';

export default async function KarmasPage() {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return (
      <ComingSoon title="Recurring Tasks" blurb="Sign in to an organization to see your recurring tasks." />
    );
  }

  const orgMembers = await getOrgMembersForPicker(membership.orgId);
  const delegateOptions = orgMembers.filter((m) => m.userId !== membership.userId);

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">Recurring Tasks</h1>
        <CreateKarmaDialog orgMembers={delegateOptions} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <KarmaPanel title="My Recurring Tasks" scope="my" />
        <KarmaPanel title="Delegated Recurring Tasks" scope="delegated" />
      </div>
    </div>
  );
}
