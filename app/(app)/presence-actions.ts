'use server';

import { createClient } from '@/lib/supabase/server';

export async function touchPresenceAction(): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
  } catch {
    // Best-effort — presence is a nice-to-have, never worth failing a page over.
  }
}
