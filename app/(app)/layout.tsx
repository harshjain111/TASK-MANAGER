import { NavRail } from '@/components/shared/nav-rail';
import { TopBar } from '@/components/shared/top-bar';
import { PresenceHeartbeat } from '@/components/shared/presence-heartbeat';
import { createClient } from '@/lib/supabase/server';

async function getCurrentUserDisplay() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { userId: null, userName: 'Guest' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .maybeSingle();

    return { userId: user.id, userName: profile?.full_name || profile?.email || 'You' };
  } catch {
    return { userId: null, userName: 'Guest' };
  }
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId, userName } = await getCurrentUserDisplay();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      <PresenceHeartbeat />
      <NavRail />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar userId={userId} userName={userName} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
