# Deploying Flowdesk

This app was built end-to-end (P1–P37) against SQL migrations only — no live
Supabase project has been connected in the build environment, and this repo
has no `git remote` configured. Everything below is written so a human with
the right accounts can go from this repo to a live production deployment;
none of it can be done by an agent without your credentials, so treat this
as a runbook rather than something already executed.

## 1. Create the production Supabase project

1. Create a new project at [supabase.com](https://supabase.com).
2. In the SQL Editor (or via `supabase db push` / the CLI), run every file in
   `db/migrations/` **in order**, `0001` through `0014`. Each migration is
   idempotent-unsafe (no `IF NOT EXISTS` guards on most DDL) — run once, in
   order, on a clean database.
3. Optionally load `db/seed/seed.sql` for demo data. Note its header comment:
   fixed-UUID rows (org/projects/columns/tasks/assignees/karmas) are safe to
   re-run via `ON CONFLICT DO NOTHING`, but checklist items, chat messages,
   and kudos use auto-generated ids and will duplicate on a second run.
4. In Authentication → Providers, confirm Email is enabled. "Confirm email"
   is on by default (see `app/(auth)/actions.ts`'s handling of
   `needsEmailConfirmation` — this is intentional, not a bug to disable).
5. In Storage, confirm the two buckets created by migrations 0005/0006 exist:
   `attachments` (task attachments) and `chat-attachments` (chat photos).
6. Generate real types to replace the hand-written ones:
   `supabase gen types typescript --project-id <ref> > types/supabase.ts`.

## 2. Set environment variables

Copy `.env.example` and fill in real values, both locally (`.env.local`) and
in the Vercel project settings (Production + Preview):

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project → Settings → API (server-only secret — never expose to the client, only set as a Vercel server env var) |
| `NEXT_PUBLIC_SITE_URL` | Your production domain, e.g. `https://flowdesk.yourcompany.com` |
| `RESEND_API_KEY` | [resend.com](https://resend.com) API key (digest emails no-op without it) |
| `CRON_SECRET` | Any long random string you generate — shared bearer token the scheduled jobs must present |

## 3. Deploy to Vercel

1. Push this repo to a GitHub/GitLab/Bitbucket remote (none is configured
   yet — `git remote add origin <url>` then `git push -u origin master`).
2. Import the repo in Vercel, framework preset "Next.js" (auto-detected).
3. Add the env vars from step 2 to the Vercel project.
4. Deploy. `vercel.json` in this repo already declares the two cron jobs
   (`/api/cron/daily-digest` at 03:00 UTC daily, `/api/cron/escalation-alerts`
   hourly) — Vercel Cron picks these up automatically on deploy and calls
   them via `GET` with `Authorization: Bearer $CRON_SECRET` as long as
   `CRON_SECRET` is set on the project.
5. Point your production domain at the Vercel deployment (Vercel → Domains).

## 4. Post-deploy checks

- Sign up as the first user, confirm the org-bootstrap RPC (`create_organization`)
  runs correctly and lands you on `/home`.
- Confirm password-reset / email-confirmation emails arrive (Supabase's
  built-in SMTP works for low volume; for production volume configure a
  custom SMTP provider in Supabase Auth settings).
- Trigger each cron route once manually to confirm they're wired up:
  `curl -H "Authorization: Bearer $CRON_SECRET" https://<domain>/api/cron/daily-digest`
- Verify Realtime works: open the chat drawer on a board column in two
  browser sessions and confirm messages appear live.
- Run through CLAUDE.md §8's Definition of Done checklist against the live
  site for at least one end-to-end flow (create project → task → chat →
  approve → kudos).

## Local development without a live DB

Everything in this app degrades gracefully with no Supabase project
configured (`pnpm dev` with an empty `.env.local`) — auth redirects are
bypassed, every Server Action returns `{ error: ... }` instead of throwing,
and every list renders its empty state. This was a deliberate build
constraint during development; it also means running against a real
project is purely additive — nothing in the app assumes Supabase is absent.
