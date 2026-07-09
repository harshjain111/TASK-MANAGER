import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { ComingSoon } from '@/components/shared/coming-soon';
import { InviteForm } from './invite-form';
import { RevokeInviteButton } from './revoke-invite-button';
import { DigestToggle } from './digest-toggle';
import { EscalationThresholdForm } from './escalation-threshold-form';
import { OrgProfileForm } from './org-profile-form';
import { MembersTable } from './members-table';
import { DangerZone } from './danger-zone';
import { getOrgMembersAction, getArchivableProjectsAction } from './org-members-actions';

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

  const isOwnerOrAdmin = ['owner', 'admin'].includes(membership.role);

  let invites: { id: string; email: string; org_role: string; expires_at: string }[] = [];
  let escalationThresholdHours = 24;
  let orgMembers: Awaited<ReturnType<typeof getOrgMembersAction>> = [];
  let archivableProjects: Awaited<ReturnType<typeof getArchivableProjectsAction>> = [];

  if (isOwnerOrAdmin) {
    const supabase = createClient();
    const [{ data: invitesData }, { data: org }, members, projects] = await Promise.all([
      supabase
        .from('org_invites')
        .select('id, email, org_role, expires_at, created_at')
        .eq('org_id', membership.orgId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false }),
      supabase
        .from('organizations')
        .select('escalation_threshold_hours')
        .eq('id', membership.orgId)
        .maybeSingle(),
      getOrgMembersAction(),
      getArchivableProjectsAction(),
    ]);
    invites = invitesData ?? [];
    escalationThresholdHours = org?.escalation_threshold_hours ?? 24;
    orgMembers = members;
    archivableProjects = projects;
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Admin</h1>
        <p className="text-sm text-muted-foreground">{membership.orgName}</p>
      </div>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-foreground">My notifications</h2>
        <DigestToggle />
      </section>

      {isOwnerOrAdmin && (
        <>
          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Organization profile</h2>
            <OrgProfileForm orgId={membership.orgId} initialName={membership.orgName} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Members</h2>
            <MembersTable initialMembers={orgMembers} currentUserId={membership.userId} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Escalation alerts</h2>
            <EscalationThresholdForm orgId={membership.orgId} initialHours={escalationThresholdHours} />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Invite teammate</h2>
            <InviteForm />
          </section>

          <section className="rounded-xl border border-border bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Pending invites</h2>
            {invites.length === 0 ? (
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

          <section className="rounded-xl border border-destructive/40 bg-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-destructive">Danger zone</h2>
            <DangerZone initialProjects={archivableProjects} />
          </section>
        </>
      )}
    </div>
  );
}
