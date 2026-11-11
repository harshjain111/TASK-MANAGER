'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { createUserSchema, type CreateUserInput } from '@/lib/validations/create-user';
import { toUserMessage } from '@/lib/utils/action-error';

type ActionResult = { error: string | null };

/**
 * Admin-direct account creation (replaces email-based invites): an
 * owner/admin sets a name, email, and temp password for a new teammate and
 * shares the credentials with them directly — no invite email round-trip.
 * Uses the service-role client to create the auth user (bypassing the
 * "confirm email" requirement, since the admin is vouching for the email),
 * then inserts the org_members row through the normal RLS-checked client
 * so the "Owners/admins can add members" policy is the one source of truth
 * for who's allowed to do this.
 */
export async function createUserAction(input: CreateUserInput): Promise<ActionResult> {
  const parsed = createUserSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const membership = await getCurrentOrgMembership();
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only owners/admins can create teammate accounts.' };
  }

  try {
    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });

    if (createError) {
      return { error: toUserMessage(createError) };
    }
    if (!created.user) {
      return { error: 'Account creation failed. Please try again.' };
    }

    const supabase = createClient();
    const { error: memberError } = await supabase.from('org_members').insert({
      org_id: membership.orgId,
      user_id: created.user.id,
      org_role: parsed.data.role,
    });

    if (memberError) {
      // Account exists but couldn't be attached to the org — clean up so a
      // retry with the same email doesn't hit "already registered".
      await admin.auth.admin.deleteUser(created.user.id);
      return { error: toUserMessage(memberError) };
    }

    revalidatePath('/admin');
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}
