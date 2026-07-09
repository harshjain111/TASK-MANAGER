import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { ComingSoon } from '@/components/shared/coming-soon';
import { InviteForm } from './invite-form';
import { RevokeInviteButton } from './revoke-invite-button';

export default async function AdminPage() {
  const membership = await getCurrentOrgMembership();

  if (!membership) {
    return (
      <ComingSoon
        title="Admin"
        blurb="Sign in to an organization to manage members and invites."
      />
    );
  }

  if (!['owner', 'admin'].includes(membership.role)) {
    return (
      <ComingSoon title="Admin" blurb="Only owners and admins can access org settings." />
    );
  }

  const supabase = createClient();
  const { data: invites } = await supabase
    .from('org_invites')
    .select('id, email, org_role, expires_at, created_at')
    .eq('org_id', membership.orgId)
    .is('accepted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground">{membership.orgName}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Invite teammate</h2>
        <InviteForm />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Pending invites</h2>
        {!invites || invites.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending invites.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {invites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {invite.org_role} · expires {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <RevokeInviteButton inviteId={invite.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
