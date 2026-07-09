import { createClient } from '@/lib/supabase/server';
import { SignupForm } from './signup-form';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { invite?: string };
}) {
  const inviteToken = searchParams.invite;
  let invite: { org_name: string; org_role: string; email: string } | null = null;

  if (inviteToken) {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .rpc('get_org_invite', { invite_token: inviteToken })
        .maybeSingle();
      invite = data ?? null;
    } catch {
      invite = null;
    }
  }

  if (inviteToken && !invite) {
    return (
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-lg font-semibold text-foreground">Invite link invalid</h1>
        <p className="text-sm text-muted-foreground">
          This invite has expired, been revoked, or already used. Ask your admin to resend it.
        </p>
      </div>
    );
  }

  return <SignupForm inviteToken={inviteToken} invite={invite ?? undefined} />;
}
