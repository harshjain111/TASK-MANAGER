'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/validations/auth';
import { toAuthMessage } from '@/lib/utils/action-error';

type ActionResult = { error: string | null; needsEmailConfirmation?: boolean };

export async function signInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      return { error: toAuthMessage(error) };
    }

    // Covers the "email confirmation required" detour: a user who signed up
    // to create a new org, had no session yet (see signUpAction), confirmed
    // via email, and is now logging in for the first time — the org-bootstrap
    // RPC that signUpAction couldn't finish without a session happens here.
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const pendingOrgName = user?.user_metadata?.org_name as string | undefined;
    if (user && pendingOrgName) {
      const { count } = await supabase
        .from('org_members')
        .select('org_id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (!count) {
        const { error: rpcError } = await supabase.rpc('create_organization', {
          org_name: pendingOrgName,
        });
        if (rpcError) {
          return { error: toAuthMessage(rpcError) };
        }
      }
    }
  } catch {
    return { error: 'Unable to reach the server. Please try again later.' };
  }

  redirect('/home');
}

export async function signUpAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email, password, fullName, orgName } = parsed.data;

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // org_name rides along in user_metadata so signInAction can finish the
      // org-bootstrap RPC on first login if "Confirm email" delays the
      // session past this request (see the comment below and in signInAction).
      options: { data: { full_name: fullName, org_name: orgName } },
    });

    if (error) {
      return { error: toAuthMessage(error) };
    }

    // "Confirm email" is on in Supabase Auth settings by default — no session
    // exists yet, so we can't call the org-scoped RPC. Send the user to check
    // their inbox; org bootstrap happens on first login once the email is
    // confirmed and a session exists (see signInAction).
    if (!data.session) {
      return { error: null, needsEmailConfirmation: true };
    }

    const { error: rpcError } = await supabase.rpc('create_organization', {
      org_name: orgName,
    });
    if (rpcError) {
      return { error: toAuthMessage(rpcError) };
    }
  } catch {
    return { error: 'Unable to reach the server. Please try again later.' };
  }

  redirect('/home');
}

export async function signOutAction(): Promise<void> {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch {
    // Nothing to tear down without a live session — fall through to redirect.
  }
  redirect('/login');
}
