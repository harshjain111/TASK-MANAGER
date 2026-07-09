import 'server-only';
import { Resend } from 'resend';

let client: Resend | null = null;

function getClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}

/**
 * Sends via Resend when RESEND_API_KEY is configured; otherwise no-ops with a
 * console warning so local/dev environments without an email provider don't
 * crash the invite/notification flows that call this.
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const resend = getClient();
  if (!resend) {
    console.warn(`[resend] RESEND_API_KEY not set — skipping email to ${params.to}: ${params.subject}`);
    return { skipped: true as const };
  }

  const from = `Flowdesk <notifications@${new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost').hostname}>`;
  await resend.emails.send({ from, ...params });
  return { skipped: false as const };
}
