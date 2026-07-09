'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { loginSchema, signupSchema, type LoginInput, type SignupInput } from '@/lib/validations/auth';

type ActionResult = { error: string | null; needsEmailConfirmation?: boolean };

export async function signInAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: error.message };
  }

  redirect('/home');
}

export async function signUpAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }
  const { email, password, fullName, orgName, inviteToken } = parsed.data;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    return { error: error.message };
  }

  // "Confirm email" is on in Supabase Auth settings by default — no session
  // exists yet, so we can't call org-scoped RPCs. Send the user to check
  // their inbox; org bootstrap / invite acceptance happens on first login
  // once the email is confirmed and a session exists (see signInAction).
  if (!data.session) {
    return { error: null, needsEmailConfirmation: true };
  }

  if (inviteToken) {
    // Wired up in P6 once org_invites exists (accept_org_invite RPC).
    return { error: "Invite links aren't supported yet — ask your admin to add you manually." };
  }

  const { error: rpcError } = await supabase.rpc('create_organization', {
    org_name: orgName!,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  redirect('/home');
}

export async function signOutAction(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
