# CLAUDE.md — Flowdesk (Org Task Manager)

> Working title: **Flowdesk**. Rename freely — search/replace `Flowdesk` once a final name is picked.
> This file is the single source of truth for Claude Code on this project. Read it fully before writing any code, and re-read the relevant section before starting each new prompt in `PROMPT_PLAYBOOK.md`.

---

## 1. What this product is

A single web app that replaces two things the client currently uses side by side: **KarmaAxis** (a Kanban-style task/board tool) and **informal WhatsApp groups** (for day-to-day discussion, photo updates, and progress chatter). The goal is not to reinvent task management — it's to keep everything staff already know muscle-memory-wise from KarmaAxis, and bolt on a real chat/discussion layer that KarmaAxis lacks.

The client is a multi-outlet / multi-project organization (construction contracting, OOH advertising, F&B outlets, real estate — see business context below). One owner/admin allocates work across managers and staff; managers allocate within their own project; staff execute and report back with text + photo updates in real time.

### 1.1 Business context (for realistic seed data / copy tone)
The organization runs several parallel business lines under one roof: government civil-construction tenders, an OOH (outdoor advertising) inventory/agency business, and F&B outlet openings (the reference screenshots show an "All India Cafe" project with menu categories like Breakfast, South Indian, Packaging, Crockery & Cutlery). Seed/demo data should reflect this kind of organization — multiple **Projects** (outlets/sites/tenders), each with several **Boards/sub-projects** (menu categories, procurement, staffing, marketing, vendor coordination), not a generic SaaS demo.

### 1.2 Two task vocabularies — do not conflate these
KarmaAxis (and this app) distinguish two entity types. This is a deliberate product decision carried over from the client's current tool, not an accident to "clean up":

- **Task** — a one-off, project-scoped work item. Lives inside a Board column of a Project. Has an owner, one or more assignees, a due date, status, checklist, attachments, and a comment thread.
- **Karma** — a recurring / ongoing personal duty, independent of any single project (e.g. "daily cash reconciliation", "weekly vendor call"). Repeats on a schedule (`daily` / `weekly` / `monthly` / `custom`). Tracked separately from Tasks on the Home screen and in its own `Karmas` section, but uses the same status pipeline.

Both Task and Karma share the same status pipeline: `not_started → in_progress → stuck → done`, plus a `review` state used only when the item has been delegated (i.e. assigned by someone other than the person completing it) and is awaiting the delegator's approval.

### 1.3 "My X" vs "Delegated X" — the core mental model
Every list in the app (Tasks and Karmas) is filtered into two lenses, exactly like KarmaAxis:
- **My [Tasks/Karmas]** — items assigned *to* the current user. Tabs: `Due Soon`, `Overdue`, `Stuck`, `Co-act` (items where the user is a collaborator/co-actor, not the primary assignee).
- **Delegated [Tasks/Karmas]** — items the current user assigned *to someone else*. Tabs: `Due Soon`, `Overdue`, `Stuck`, `Review` (items marked done by the assignee, awaiting the delegator's approval).

This 2×4 grid (My Tasks / Delegated Tasks / My Karmas / Delegated Karmas) is the primary content of the Home screen, sitting **below** a calendar strip (see §1.4) that KarmaAxis does not have — this is one of our intentional improvements.

### 1.4 What we are adding beyond KarmaAxis (the actual brief)
1. **Calendar-first Home screen** — a Day / Week / Month strip at the top of Home (Google Calendar-style), showing today's/this week's/this month's tasks and karmas in time order. KarmaAxis has no calendar view at all; it's list/board only.
2. **WhatsApp Web-style chat layer per Board column** — clicking a column header (e.g. "Menu", "Marketing") opens a right-hand chat drawer scoped to that column: text, photo updates, @mentions, system messages for status changes ("Priya marked *Finalize starters list* as Done"), all timestamped and threaded — a persistent discussion layer the Kanban board itself doesn't provide.
3. **Recognition layer** — lightweight kudos/points tied to task completion & approval (not present in KarmaAxis at all), used to replace the informal WhatsApp praise culture with something trackable.
4. **Consolidated org directory + role model** — Owner/Admin, Manager (per-project), Employee, Guest/Vendor (per sub-project only).

### 1.5 Explicit non-goals for v1
Do **not** build: Contacts CRM, Expenses/billing module, full attendance/payroll tracking, native mobile apps, offline mode, multi-language i18n, video calls, Gantt/dependency graphs. KarmaAxis has `Contacts`, `Expenses`, `Reports`, `Admin` as full modules — for v1 we stub `Reports` (basic project/workload dashboards only) and skip Contacts/Expenses entirely. Note them as nav placeholders ("Coming soon") only if it's trivial; do not build the underlying features.

---

## 2. Tech stack (locked — do not deviate without discussion)

- **Framework:** Next.js 14, App Router, TypeScript strict mode
- **UI:** Tailwind CSS + shadcn/ui (Radix primitives) + lucide-react icons
- **Backend/DB:** Supabase — Postgres, Auth, Realtime, Storage. Row-Level Security everywhere; no bypassing RLS from client code.
- **Forms/validation:** react-hook-form + Zod, validated again server-side in Server Actions/Route Handlers — never trust client-only validation.
- **Realtime:** Supabase Realtime channels, one channel per Board column (`column:{id}`) for the chat feed, and one per user (`user:{id}`) for notifications.
- **State/data fetching:** Server Components by default; `"use client"` only where interactivity is required (forms, drag-and-drop board, chat feed, calendar view). Use `@tanstack/react-query` client-side only where Realtime + optimistic UI is needed (chat, task status toggles).
- **Drag-and-drop (Kanban):** `@dnd-kit/core` (lighter and more accessible than react-beautiful-dnd, which is unmaintained).
- **Dates:** `date-fns` (no moment.js).
- **Hosting:** Vercel. Storage buckets in Supabase for photos/attachments.
- **Package manager:** pnpm.

---

## 3. Project structure

```
/app
  /(auth)/login, /(auth)/signup
  /(app)/home                      → Home ("My Day")
  /(app)/tasks                     → All My Tasks / Delegated Tasks (list, cross-project)
  /(app)/karmas                    → All My Karmas / Delegated Karmas
  /(app)/projects
    /page.tsx                      → Projects index (left-rail list, WhatsApp-style)
    /[projectId]
      /board/page.tsx              → Kanban board (columns = sub-projects)
      /members/page.tsx            → Member management
  /(app)/team                      → Org directory
  /(app)/rewards                   → Kudos / leaderboard
  /(app)/reports                   → Project health, workload
  /(app)/admin                     → Org settings, roles
  /api/... (route handlers only where a Server Action doesn't fit, e.g. webhooks)
/components
  /ui                              → shadcn primitives (generated, don't hand-edit)
  /home                            → CalendarStrip, MyDayList, TaskDelegationGrid
  /board                           → BoardColumn, TaskCard, ChatDrawer, ChatMessage
  /tasks                           → TaskDetailSheet, ChecklistEditor, AssigneePicker
  /shared                          → Avatar (color-hash), StatusPill, FilterTabs
/lib
  /supabase                        → server.ts, client.ts, admin.ts, middleware.ts
  /validations                     → zod schemas per entity
  /realtime                        → channel helpers
  /utils                           → avatarColor(name), date helpers, status helpers
/db
  /migrations                      → numbered SQL migrations
  /seed                            → seed.sql with realistic org/project/task demo data
/types                             → generated Supabase types + shared domain types
```

---

## 4. Database design principles

- **Multi-tenancy:** every table carries `org_id`. RLS policies scope all reads/writes to `org_id = auth org` plus role checks. No table is ever queried without an RLS policy in place — write the policy in the same migration as the table.
- **Core tables (v1):**
  - `organizations`, `org_members` (user_id, org_id, org_role: owner/admin/manager/employee)
  - `projects` (org_id, name, cover_color, created_by, archived_at)
  - `project_members` (project_id, user_id, project_role: manager/employee/guest)
  - `board_columns` (project_id, name, position, is_default) — these are the "sub-projects" (Menu, Marketing, etc.)
  - `tasks` (project_id, column_id, title, description, status, priority, due_at, created_by, is_karma boolean **or** a separate `karmas` table — decide in P-DB-1 below, see note)
  - `task_assignees` (task_id, user_id, is_primary, is_delegator) — supports co-actors + delegation in one join table
  - `task_checklist_items` (task_id, label, is_done, position)
  - `chat_messages` (column_id, task_id nullable, author_id, body, attachment_url, message_type: text/photo/file/system)
  - `kudos` (task_id, from_user_id, to_user_id, kind: 👏/⭐/🙌, created_at)
  - `notifications` (user_id, type, payload jsonb, read_at)
  - `activity_log` (org_id, actor_id, entity_type, entity_id, action, created_at) — powers system messages + Reports

  > **Design decision to make in the first DB migration prompt:** whether `Karma` (recurring duty) is its own table (`karmas`, with a `recurrence_rule` column) or a `tasks` row with `is_recurring = true` + a `recurrence_rule`. Recommendation: **separate `karmas` table** — the two entities are filtered, displayed, and reported on separately throughout the UI (per §1.2), and forcing them into one polymorphic table adds query complexity for no real benefit. Confirm this in P-DB-1, don't silently pick one.

- **Soft deletes:** `archived_at` / `deleted_at` timestamp columns, never hard-delete org data.
- **Audit trail:** every status change, assignment, and member add/remove writes an `activity_log` row — this is what powers the WhatsApp-style "system messages" in the chat feed (§1.4.2).
- **Enums:** define Postgres enums for `status`, `priority`, `org_role`, `project_role`, `message_type` — don't use free-text columns for these.

---

## 5. UI/UX conventions

- **Avatar color-hashing:** a pure function `avatarColor(userId): string` mapping to a fixed palette of ~10 accessible colors, so the same person always gets the same colored initials circle everywhere in the app (matches KarmaAxis's pattern exactly — this is a big part of how staff scan lists fast).
- **Status pill colors:** Not started = gray, In progress = blue, Stuck = amber/red, Done = green, Review = purple. Consistent everywhere (card, list row, calendar chip).
- **Filter tabs:** the `Due Soon / Overdue / Stuck / Co-act` and `Due Soon / Overdue / Stuck / Review` tab bars are a shared `<FilterTabs>` component — build once, reuse across Home, My Tasks, My Karmas.
- **Board (Kanban):** columns = sub-projects, cards show avatar, title, checklist progress ("0/12"), comment-count icon, Added/Updated timestamps — mirror the KarmaAxis card layout closely (reference screenshots provided by client — do not redesign this part, just add the chat entry point).
- **Chat drawer:** clicking a column header (not a card) opens the right-hand drawer for that column's general discussion; clicking a specific task can optionally open a task-scoped mini-thread that also appears inlined in the column's chat feed, tagged with the task title.
- **Calendar strip:** Day/Week/Month toggle, top of Home only — this does not replace the board, it's a personal planning lens on top of it.
- **Mobile:** the whole app must degrade to a single-column, bottom-tab layout (Home / Tasks / Projects / Rewards) — the WhatsApp Web split-panel becomes a full-screen drill-down (list → tap → full-screen board/chat, back button to return), same as WhatsApp's own mobile pattern.

---

## 6. Coding conventions

- Server Components by default. `"use client"` only for interactive leaves (forms, DnD board, chat feed, calendar, dropdowns).
- Server Actions for all mutations (create task, change status, add member, post message) — no client-side direct Supabase writes except for optimistic chat message echoes (reconciled on Realtime confirm).
- Every form: react-hook-form + zodResolver, and the same Zod schema re-validated inside the Server Action.
- Naming: `kebab-case` files, `PascalCase` components, `camelCase` functions/variables, DB columns `snake_case`.
- Error handling: Server Actions return `{ data, error }` — never throw raw Supabase errors to the client; map to user-facing messages.
- No `any`. Generate Supabase types (`supabase gen types typescript`) and keep `/types/supabase.ts` current after every migration.

---

## 7. Build order (matches PROMPT_PLAYBOOK.md phases)

1. **Phase 0** — scaffold, Supabase wiring, design tokens, auth, org/role model
2. **Phase 1 (MVP)** — Home (calendar strip + 2×4 grid), Projects list, Board (columns + cards, no chat yet), Task detail (create/assign/checklist), basic notifications
3. **Phase 2** — Chat drawer per column + Realtime, delegation/review/approval flow, Karmas module, workload/reporting dashboards
4. **Phase 3** — Kudos/rewards + leaderboard, Guest/vendor role, activity log polish, mobile responsive pass, PWA manifest

---

## 8. Definition of done (per prompt/task)
Typecheck + lint clean · RLS policy exists for any new table · Zod validation client + server · matches the CLAUDE.md section it was built from · happy path manually verified via `pnpm dev` · seed data still loads cleanly · commit with a clear conventional-commit message.

## 9. Environment variables
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_SITE_URL
RESEND_API_KEY            # notification emails
```

## 10. Important reminders
- Never bypass RLS, even in seed scripts run against a real project — use the service-role client only in trusted server-side seed/migration scripts, never expose it to the browser.
- Every list screen needs an empty state and a loading skeleton — this app lives or dies on "does it feel fast," per the original brief.
- Test the Board + Chat drawer combination on a narrow viewport early — it's the riskiest layout (three panels: project list, board, chat) to collapse gracefully.
- Keep card and avatar visual language identical to the KarmaAxis reference screenshots unless explicitly told to redesign — the client's staff already know that pattern; don't relearn it for them.
