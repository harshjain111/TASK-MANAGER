'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentOrgMembership } from '@/lib/supabase/org';
import { inviteSchema, type InviteInput } from '@/lib/validations/invite';
import { sendEmail } from '@/lib/resend';

type ActionResult = { error: string | null; inviteLink?: string };

export async function createInviteAction(input: InviteInput): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
  }

  const membership = await getCurrentOrgMembership();
  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { error: 'Only owners/admins can invite teammates.' };
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('org_invites')
      .insert({
        org_id: membership.orgId,
        email: parsed.data.email,
        org_role: parsed.data.role,
        invited_by: membership.userId,
      })
      .select('token')
      .single();

    if (error) {
      return { error: error.message };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
    const inviteLink = `${siteUrl}/signup?invite=${data.token}`;

    await sendEmail({
      to: parsed.data.email,
      subject: `You're invited to join ${membership.orgName} on Flowdesk`,
      html: `<p>You've been invited to join <strong>${membership.orgName}</strong> on Flowdesk as ${parsed.data.role}.</p><p><a href="${inviteLink}">Accept invite</a></p>`,
    });

    revalidatePath('/admin');
    return { error: null, inviteLink };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from('org_invites').delete().eq('id', inviteId);
    if (error) return { error: error.message };

    revalidatePath('/admin');
    return { error: null };
  } catch {
    return { error: 'Something went wrong. Please try again.' };
  }
}
