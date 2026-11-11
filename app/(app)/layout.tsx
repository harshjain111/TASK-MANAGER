import { NavRail } from '@/components/shared/nav-rail';
import { TopBar } from '@/components/shared/top-bar';
import { BottomTabNav } from '@/components/shared/bottom-tab-nav';
import { PresenceHeartbeat } from '@/components/shared/presence-heartbeat';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';

async function getCurrentUserDisplay() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { userId: null, userName: 'Guest' };

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .maybeSingle();

      return { userId: user.id, userName: profile?.full_name || profile?.email || 'You' };
    } catch {
      // The session is real even if the profile lookup failed — showing
      // "Guest" here made a signed-in user look signed out.
      return { userId: user.id, userName: user.email ?? 'You' };
    }
  } catch {
    return { userId: null, userName: 'Guest' };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [{ userId, userName }, membership] = await Promise.all([
    getCurrentUserDisplay(),
    getCurrentOrgMembership().catch(() => null),
  ]);

  // Mirrors the gate on the projects layout — without it the TopBar's
  // "New project" item would be dead for employees and guests.
  const canCreateProject =
    !!membership && ['owner', 'admin', 'manager'].includes(membership.role);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <PresenceHeartbeat />
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userId={userId} userName={userName} canCreateProject={canCreateProject} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
        <BottomTabNav />
      </div>
    </div>
  );
}
