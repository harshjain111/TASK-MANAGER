'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function getDigestOptOutAction(): Promise<boolean> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabase
      .from('profiles')
      .select('digest_opt_out')
      .eq('id', user.id)
      .maybeSingle();
    return data?.digest_opt_out ?? false;
  } catch {
    return false;
  }
}

export async function setDigestOptOutAction(optOut: boolean): Promise<{ error: string | null }> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in.' };

  const { error } = await supabase
    .from('profiles')
    .update({ digest_opt_out: optOut })
    .eq('id', user.id);

  if (error) return { error: error.message };
  revalidatePath('/admin');
  return { error: null };
}
