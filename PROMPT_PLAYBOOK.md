# Flowdesk — Claude Code Build Playbook

Ordered, copy-paste-ready prompts to build the app from an empty repo to a working v1, using `CLAUDE.md` as the standing context document.

**How to use**
- Put `CLAUDE.md` in the project root before starting.
- Run prompts **in order** — each assumes the previous ones are done. Don't skip ahead.
- Start every session (or every prompt, if running fresh sessions) with: *"Read CLAUDE.md fully before doing anything."*
- After each prompt: `pnpm typecheck && pnpm lint`, fix all errors, manually click through the happy path in `pnpm dev`, then commit (suggested message given per prompt).
- Supabase project should be created first (free tier is fine for build/demo) and its URL/keys dropped into `.env.local` before P2.

---

## PHASE 0 — Project setup & foundations

**P1 — Scaffold**
```
Read CLAUDE.md fully. Initialize a Next.js 14 App Router project with TypeScript strict mode, Tailwind CSS, ESLint + Prettier, pnpm. Create the exact folder structure from CLAUDE.md §3. Add a pnpm typecheck script. Commit: "chore: scaffold next + tailwind + ts".
```

**P2 — Supabase wiring**
```
Read CLAUDE.md §2 and §9. Install @supabase/supabase-js and @supabase/ssr. Create lib/supabase/server.ts (RSC client), client.ts (browser, anon key), admin.ts (service-role, server-only, with a runtime guard that throws if imported client-side). Add auth session middleware. Create .env.example with all vars from CLAUDE.md §9. Commit: "feat: supabase clients + session middleware".
```

**P3 — Design tokens & shell**
```
Read CLAUDE.md §5. Install shadcn/ui and lucide-react. Configure a clean, minimal design system: neutral base, one accent color, generous whitespace — this app must feel calm, not busy (per the original brief). Build the app shell: a fixed left rail (icons: Home, Tasks, Projects, Karmas, Team, Rewards, Reports, Admin), a top bar (search, notification bell, + Create button, avatar), and a content area. No real data yet — static shell only. Commit: "feat: app shell + design tokens".
```

**P4 — Database migration 1: org & auth**
```
Read CLAUDE.md §4. Create the first Supabase migration: organizations, org_members (user_id, org_id, org_role enum: owner/admin/manager/employee), and RLS policies scoping every read/write to the caller's org_id. Add a Postgres trigger or Server Action so that signing up the first user in a new org auto-creates the organizations row and makes them 'owner'. Generate TypeScript types into /types/supabase.ts. Commit: "feat(db): organizations + org_members + RLS".
```

**P5 — Auth screens**
```
Build /(auth)/login and /(auth)/signup using Supabase Auth (email/password to start; magic-link optional toggle). Zod-validated forms via react-hook-form. On signup, if no invite token is present, create a new org (per P4 trigger); if an invite token is present, join the existing org as the role specified in the invite. Redirect to /home on success. Commit: "feat: auth screens + org bootstrap".
```

**P6 — Org invites**
```
Add an org_invites table (org_id, email, role, token, expires_at, accepted_at) with RLS limited to admins/owners of that org. Build an "Invite teammate" flow from /admin: enter email + role, generates a shareable invite link, sends an email via Resend. Wire signup (P5) to consume the token. Commit: "feat: org invites".
```

---

## PHASE 1 — MVP: Home, Projects, Board, Tasks

**P7 — DB migration 2: projects, board columns, tasks**
```
Read CLAUDE.md §4, including the Karma-vs-Task design decision note. Confirm and implement: separate `karmas` table (do not fold into `tasks`). Create migrations for: projects, project_members (project_role enum: manager/employee/guest), board_columns, tasks, task_assignees (is_primary, is_delegator flags), task_checklist_items. Add enums for status (not_started/in_progress/stuck/done/review) and priority (low/medium/high/urgent). RLS: project data visible only to project_members of that project within the caller's org. Regenerate types. Commit: "feat(db): projects, boards, tasks".
```

**P8 — Projects index (left-rail, WhatsApp-style list)**
```
Build /projects: a persistent left panel listing all projects the user belongs to, each row showing name, cover color/icon, and an unread/activity indicator placeholder (wire real unreads in Phase 2). Clicking a project opens its Board in the right panel — implement this as a responsive two-pane layout (list | detail) that collapses to full-screen drill-down on mobile, per CLAUDE.md §5. Include "+ New Project" (name, color, initial members) as a modal, admin/manager only. Commit: "feat: projects index + create project".
```

**P9 — Board columns (sub-projects) CRUD**
```
Inside a project's Board tab, let managers/admins add, rename, reorder (drag), and archive columns (sub-projects, e.g. "Menu", "Marketing"). Use @dnd-kit/core for column reordering. Show a task count badge per column ("0/12" style, done/total) matching the KarmaAxis reference layout. Commit: "feat: board columns crud".
```

**P10 — Task cards & create task**
```
Build the TaskCard component: avatar chip(s) via the avatarColor hashing util (CLAUDE.md §5), title, checklist progress, comment-count icon (stub 0 for now), status pill, Added/Updated relative timestamps — match the KarmaAxis card layout closely. Build "+ Add task" (full form: title, description, assignees, due date, priority, checklist) and "+ Quick task" (title only, fill in details later) per column, matching the two-button pattern from the reference screenshots. Commit: "feat: task cards + create task (full + quick)".
```

**P11 — Drag-and-drop board + status updates**
```
Wire @dnd-kit so task cards can be dragged between columns (updates column_id) and status can be changed via a one-tap status pill directly on the card (no full form needed) — cycles not_started → in_progress → stuck → done. Every status change writes an activity_log row (CLAUDE.md §4). Add a "Show done" toggle per column matching the reference screenshot. Commit: "feat: dnd board + inline status updates".
```

**P12 — Task detail sheet**
```
Build a slide-over/sheet that opens when a card is clicked: full description, checklist editor (add/check/reorder items), assignees + co-actors (AssigneePicker, multi-select from project members), attachments (Supabase Storage upload), due date/priority editors, and an activity/comment mini-thread scoped to this task (reuses chat_messages table, filtered by task_id — full chat drawer comes in P16). Commit: "feat: task detail sheet".
```

**P13 — Home screen: calendar strip**
```
Read CLAUDE.md §1.4. Build the Home screen top section: a Day/Week/Month toggle (default Day), showing the logged-in user's tasks and karmas in time order for the selected range, Google Calendar-style. Week view = 7-column grid; Month view = compact grid with dot indicators, click a day to jump to Day view for that date. Include the quick-glance chips (Due today: N, Overdue: N, Urgent: N) and the quick-action bar (+ Create Task, + Allocate Task, + New Project). Commit: "feat: home calendar strip".
```

**P14 — Home screen: My/Delegated Tasks grid**
```
Read CLAUDE.md §1.3. Below the calendar strip, build the 2x2 grid: My Tasks, Delegated Tasks, My Karmas (stub empty until Phase 2 karmas UI), Delegated Karmas (stub empty). Each panel uses the shared FilterTabs component: My Tasks/My Karmas get [Due Soon, Overdue, Stuck, Co-act]; Delegated Tasks/Delegated Karmas get [Due Soon, Overdue, Stuck, Review]. List rows: checkbox, title, avatar, due date (delegated view only) — match the reference screenshot's information density closely. Commit: "feat: home my/delegated grid".
```

**P15 — Notifications (basic)**
```
Add a notifications table and a bell icon dropdown in the top bar: task assigned to me, due today/overdue, task approved/reopened. Use Supabase Realtime on a per-user channel so the bell badge updates live. No email digest yet (Phase 2). Commit: "feat: basic notifications".
```

---

## PHASE 2 — Chat layer, delegation/review, Karmas, reporting

**P16 — Chat drawer per board column**
```
Read CLAUDE.md §1.4.2 and §5. Build the WhatsApp Web-style chat drawer: clicking a column header (not a card) opens a right-hand panel with a chronological feed for that column — text messages, photo/file uploads (Supabase Storage), and system messages auto-posted on task create/assign/status-change/member-add-remove (pull from activity_log). Input bar supports text + camera/photo + "attach to task" (links the message to a specific task_id, which also surfaces it in that task's detail sheet from P12). Wire Supabase Realtime so messages appear live for everyone viewing that column. Commit: "feat: column chat drawer + realtime".
```

**P17 — @mentions**
```
Add @mention autocomplete in the chat input (project members only). A mention creates a notification for that user even if they've muted the column (see P18). Commit: "feat: chat mentions".
```

**P18 — Per-project/column mute**
```
Add a mute toggle per project and per column, stored per user. Muted columns don't trigger push/badge notifications except for direct assignments and @mentions. Commit: "feat: mute settings".
```

**P19 — Delegation, Co-act, and Review/approval flow**
```
Read CLAUDE.md §1.2-§1.3. Implement the delegator/assignee/co-actor distinction properly via task_assignees: is_primary = the doer, is_delegator = who assigned it (may or may not also be a project member working on it). When a delegated task is marked Done by the assignee, it moves to "review" status and appears in the delegator's Delegated Tasks > Review tab. Delegator can Approve (closes task, status = done) or Reopen (status = in_progress, with a required comment posted to the task thread). Commit: "feat: delegation review/approval flow".
```

**P20 — DB migration 3: karmas (recurring duties)**
```
Create the karmas table: org_id, user_id (owner), title, description, recurrence_rule (daily/weekly/monthly/custom + cron-like fields), status, delegated_by (nullable, for Delegated Karmas), project_id (nullable — karmas can be personal, not tied to a project). RLS scoped to org + visible to owner and delegator. Write the recurrence-instance generation logic (a scheduled Supabase Edge Function or cron job that creates the next occurrence when the current one is completed or when its due date passes). Commit: "feat(db): karmas + recurrence engine".
```

**P21 — Karmas UI**
```
Build the Karmas section (nav item) and wire the Home screen's My Karmas / Delegated Karmas panels for real (replacing the P14 stub). Karma creation form: title, recurrence pattern picker (daily/weekly/monthly/custom), optional delegate-to-self-or-other. Same status pill and Co-act/Review tab behavior as Tasks. Commit: "feat: karmas ui + home wiring".
```

**P22 — Email digest**
```
Add a daily digest email (Resend) per user: "You have N tasks and N karmas today, N overdue." Sent via a scheduled job (Supabase Edge Function on a cron trigger), respecting a per-user opt-out setting in /admin or a personal settings page. Commit: "feat: daily digest email".
```

**P23 — Escalation alerts**
```
Add manager-only escalation: if a task is overdue by more than X hours (configurable per org in /admin, default 24h) or stuck for more than 24h, notify the project's managers (not just the assignee). Commit: "feat: escalation alerts".
```

**P24 — Reports: project health**
```
Build /reports with a project-health view: task counts by status, overdue count, on-time completion rate over the last 30 days, per project — color-coded (gray/blue/amber/green) so it's readable in seconds, no drill-down complexity required for v1. Commit: "feat: project health report".
```

**P25 — Reports: workload view**
```
Add a team workload view to /reports: for a selected project (or org-wide, admin only), show each member's open task count for the current week as horizontal bars/rows, flagging anyone with unusually high load. Commit: "feat: workload report".
```

**P26 — Manager "Team Day" view**
```
Read CLAUDE.md §1.4. On Home, add a My Day / Team Day toggle visible only to managers/admins. Team Day stacks every team member's day as horizontal swim-lanes for the selected date, so a manager can see at a glance who's free, overloaded, or hasn't started today's task. Commit: "feat: team day view".
```

---

## PHASE 3 — Recognition, roles polish, mobile, launch prep

**P27 — DB migration 4: kudos**
```
Create a kudos table (task_id, from_user_id, to_user_id, kind enum: clap/star/team, created_at) with RLS scoped to org. Commit: "feat(db): kudos".
```

**P28 — Kudos UI**
```
On task approval (P19) and on any completed task/karma, allow a one-tap kudos send (👏/⭐/🙌) to the assignee, visible as a small reaction on the card and posted as a system message in the column chat. Commit: "feat: kudos ui".
```

**P29 — Rewards leaderboard**
```
Build /rewards: monthly leaderboard per project and org-wide — most tasks completed on time, most kudos received. Admin-configurable named rewards (text only for v1 — no payment/voucher integration) displayed alongside the leaderboard. Commit: "feat: rewards leaderboard".
```

**P30 — Guest/Vendor role**
```
Read CLAUDE.md §1.4.4. Implement the guest/vendor project_role: restricted to specific board columns only (not the whole project), can view/update only tasks assigned to them, no visibility into org-wide reports or other columns. Update all RLS policies and the Members management screen to support assigning this role per-column. Commit: "feat: guest/vendor role".
```

**P31 — Admin settings**
```
Build /admin: org profile, member list with role management (promote/demote, remove), escalation threshold setting (P23), digest opt-out defaults, and a danger-zone project archive action. Commit: "feat: admin settings".
```

**P32 — Team directory**
```
Build /team: a simple org directory — avatar, name, role, project memberships, presence indicator (last active). Commit: "feat: team directory".
```

**P33 — Global search**
```
Add the top-bar search: query tasks, karmas, projects, and people by name/title, scoped to the user's org and visible projects only. Commit: "feat: global search".
```

**P34 — Mobile responsive pass**
```
Read CLAUDE.md §5 mobile conventions. Test and fix every screen at 375px width: bottom-tab nav (Home/Tasks/Projects/Rewards) replacing the left rail, Projects list → tap → full-screen Board → tap column → full-screen Chat drawer with a back button, matching WhatsApp's own mobile drill-down pattern. Commit: "fix: mobile responsive pass".
```

**P35 — PWA manifest & installability**
```
Add a web app manifest and service worker (basic offline fallback page only — no real offline data sync in v1) so the app can be "Added to Home Screen" on mobile. Commit: "feat: pwa manifest".
```

**P36 — Seed data & demo walkthrough**
```
Write /db/seed/seed.sql with a realistic demo org matching CLAUDE.md §1.1: 2-3 projects (e.g. an outlet launch, a construction site, an OOH campaign), each with 4-6 board columns, 15-30 tasks spread across statuses, a handful of karmas, some chat history with photo attachments, and 2-3 kudos. This is what the client will click through in the first demo — make it feel like their real business, not lorem ipsum. Commit: "chore: seed data".
```

**P37 — QA pass**
```
Read CLAUDE.md §8 (Definition of done). Go through every flow end-to-end as each role (owner, manager, employee, guest): create project → add members → create task → assign → chat/update → mark done → approve → kudos → check it surfaces correctly on Home, Reports, and Rewards. Fix any RLS gap, broken empty state, or console error found. Commit: "fix: qa pass".
```

**P38 — Deploy**
```
Deploy to Vercel, connect the production Supabase project, run all migrations against it, set production env vars, and verify auth redirects/Resend emails work against the real domain. Commit: "chore: production deploy config".
```
