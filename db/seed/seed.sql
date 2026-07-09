-- db/seed/seed.sql
-- Realistic demo org for Flowdesk (CLAUDE.md §1.1): a holding company running
-- an F&B outlet launch, a government construction tender, and an OOH
-- campaign side by side — matching the client's actual mix of businesses,
-- not a generic SaaS demo. Run against a fresh Supabase project (after all
-- db/migrations/*.sql) with:
--   supabase db execute -f db/seed/seed.sql
-- (or paste into the SQL editor). Meant to run once against a fresh
-- project: entities with fixed UUIDs (org, projects, columns, tasks,
-- assignees, karmas) are safe to re-run via ON CONFLICT DO NOTHING, but
-- checklist items/chat messages/kudos use auto-generated ids with no
-- natural dedup key, so re-running appends duplicates of those three.
--
-- Login for every seeded user: password "password123".

-- ---------------------------------------------------------------------------
-- 1. Auth users (direct auth.users/auth.identities insert — the standard
--    Supabase seed-script pattern; profiles rows are created automatically
--    by the handle_new_user trigger from 0001_org_and_auth.sql).
-- ---------------------------------------------------------------------------

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111101', 'authenticated', 'authenticated',
   'priya@meridiangroup.in', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Priya Sharma"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111102', 'authenticated', 'authenticated',
   'rohan@meridiangroup.in', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Rohan Mehta"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111103', 'authenticated', 'authenticated',
   'ananya@meridiangroup.in', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ananya Iyer"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111104', 'authenticated', 'authenticated',
   'vikram@meridiangroup.in', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Vikram Singh"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111105', 'authenticated', 'authenticated',
   'sneha@meridiangroup.in', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Sneha Reddy"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111106', 'authenticated', 'authenticated',
   'arjun.vendor@brightsignage.co', crypt('password123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Arjun Nair"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (
  id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
)
select
  gen_random_uuid(), u.id::text, u.id,
  jsonb_build_object('sub', u.id::text, 'email', u.email),
  'email', now(), now(), now()
from auth.users u
where u.id in (
  '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111104',
  '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111106'
)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. Organization + members
--    Priya = owner, Rohan = admin, Ananya = manager, Vikram/Sneha = employees,
--    Arjun = employee at the org level (his guest/vendor restriction is
--    applied per-project below, on the OOH campaign only).
-- ---------------------------------------------------------------------------

insert into organizations (id, name, created_by)
values ('22222222-2222-2222-2222-222222222201', 'Meridian Group', '11111111-1111-1111-1111-111111111101')
on conflict (id) do nothing;

insert into org_members (org_id, user_id, org_role)
values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'owner'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'admin'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', 'manager'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111104', 'employee'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105', 'employee'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111106', 'employee')
on conflict (org_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 3. Projects — one per business line (CLAUDE.md §1.1)
-- ---------------------------------------------------------------------------

insert into projects (id, org_id, name, cover_color, created_by)
values
  ('33333333-3333-3333-3333-333333333301', '22222222-2222-2222-2222-222222222201',
   'All India Cafe — Koramangala', '#F97066', '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333302', '22222222-2222-2222-2222-222222222201',
   'NHAI Overpass — Sector 12', '#0EA5E9', '11111111-1111-1111-1111-111111111101'),
  ('33333333-3333-3333-3333-333333333303', '22222222-2222-2222-2222-222222222201',
   'Metro OOH Campaign — Q3', '#A855F7', '11111111-1111-1111-1111-111111111101')
on conflict (id) do nothing;

insert into project_members (project_id, user_id, project_role)
values
  -- All India Cafe: Ananya manages, Vikram + Sneha execute.
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111103', 'manager'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111104', 'employee'),
  ('33333333-3333-3333-3333-333333333301', '11111111-1111-1111-1111-111111111105', 'employee'),
  -- NHAI Overpass: Rohan manages, Vikram executes.
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111102', 'manager'),
  ('33333333-3333-3333-3333-333333333302', '11111111-1111-1111-1111-111111111104', 'employee'),
  -- Metro OOH Campaign: Ananya manages, Sneha executes, Arjun is an
  -- external vendor guest (column-restricted — P30).
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111103', 'manager'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111105', 'employee'),
  ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111106', 'guest')
on conflict (project_id, user_id) do nothing;

-- ---------------------------------------------------------------------------
-- 4. Board columns (4-6 per project)
-- ---------------------------------------------------------------------------

insert into board_columns (id, project_id, name, position)
values
  -- All India Cafe
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333301', 'Menu', 0),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333301', 'Procurement', 1),
  ('44444444-4444-4444-4444-444444444403', '33333333-3333-3333-3333-333333333301', 'Staffing', 2),
  ('44444444-4444-4444-4444-444444444404', '33333333-3333-3333-3333-333333333301', 'Marketing', 3),
  ('44444444-4444-4444-4444-444444444405', '33333333-3333-3333-3333-333333333301', 'Packaging & Crockery', 4),
  -- NHAI Overpass
  ('44444444-4444-4444-4444-444444444411', '33333333-3333-3333-3333-333333333302', 'Tender Docs', 0),
  ('44444444-4444-4444-4444-444444444412', '33333333-3333-3333-3333-333333333302', 'Site Survey', 1),
  ('44444444-4444-4444-4444-444444444413', '33333333-3333-3333-3333-333333333302', 'Material Procurement', 2),
  ('44444444-4444-4444-4444-444444444414', '33333333-3333-3333-3333-333333333302', 'Labor Deployment', 3),
  ('44444444-4444-4444-4444-444444444415', '33333333-3333-3333-3333-333333333302', 'Safety Compliance', 4),
  -- Metro OOH Campaign
  ('44444444-4444-4444-4444-444444444421', '33333333-3333-3333-3333-333333333303', 'Site Booking', 0),
  ('44444444-4444-4444-4444-444444444422', '33333333-3333-3333-3333-333333333303', 'Creative Approval', 1),
  ('44444444-4444-4444-4444-444444444423', '33333333-3333-3333-3333-333333333303', 'Installation', 2),
  ('44444444-4444-4444-4444-444444444424', '33333333-3333-3333-3333-333333333303', 'Client Billing', 3)
on conflict (id) do nothing;

-- Arjun (vendor guest) can only see Installation — the one column relevant
-- to his sign fabrication work.
insert into project_column_access (project_id, user_id, column_id)
values ('33333333-3333-3333-3333-333333333303', '11111111-1111-1111-1111-111111111106', '44444444-4444-4444-4444-444444444423')
on conflict (user_id, column_id) do nothing;

-- ---------------------------------------------------------------------------
-- 5. Tasks (spread across all five statuses and three projects)
-- ---------------------------------------------------------------------------

insert into tasks (id, project_id, column_id, title, description, status, priority, due_at, position, created_by)
values
  -- All India Cafe — Menu
  ('55555555-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401', 'Finalize South Indian breakfast menu', 'Lock pricing for dosa/idli/vada items with the head chef.', 'done', 'high', now() - interval '3 days', 0, '11111111-1111-1111-1111-111111111103'),
  ('55555555-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401', 'Photograph dishes for menu board', null, 'in_progress', 'medium', now() + interval '2 days', 1, '11111111-1111-1111-1111-111111111103'),
  ('55555555-0000-0000-0000-000000000003', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444401', 'Print laminated table menus (x40)', null, 'not_started', 'low', now() + interval '5 days', 2, '11111111-1111-1111-1111-111111111104'),
  -- All India Cafe — Procurement
  ('55555555-0000-0000-0000-000000000004', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402', 'Vendor contract — dairy supplier', 'Negotiate rate for daily milk/paneer delivery.', 'stuck', 'urgent', now() - interval '1 day', 0, '11111111-1111-1111-1111-111111111103'),
  ('55555555-0000-0000-0000-000000000005', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402', 'Order commercial dosa griddle', null, 'done', 'high', now() - interval '6 days', 1, '11111111-1111-1111-1111-111111111104'),
  ('55555555-0000-0000-0000-000000000006', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444402', 'Source filter coffee decoction supplier', null, 'in_progress', 'medium', now() + interval '3 days', 2, '11111111-1111-1111-1111-111111111104'),
  -- All India Cafe — Staffing
  ('55555555-0000-0000-0000-000000000007', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403', 'Interview 3 candidates for head cook', null, 'review', 'high', now() - interval '1 day', 0, '11111111-1111-1111-1111-111111111103'),
  ('55555555-0000-0000-0000-000000000008', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444403', 'Onboard 2 waitstaff', null, 'not_started', 'medium', now() + interval '7 days', 1, '11111111-1111-1111-1111-111111111105'),
  -- All India Cafe — Marketing
  ('55555555-0000-0000-0000-000000000009', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444404', 'Launch Instagram page', null, 'done', 'medium', now() - interval '10 days', 0, '11111111-1111-1111-1111-111111111105'),
  ('55555555-0000-0000-0000-00000000000a', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444404', 'Opening day flyer design', null, 'in_progress', 'medium', now() + interval '4 days', 1, '11111111-1111-1111-1111-111111111105'),
  -- All India Cafe — Packaging & Crockery
  ('55555555-0000-0000-0000-00000000000b', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444405', 'Order branded takeaway boxes', null, 'not_started', 'low', now() + interval '9 days', 0, '11111111-1111-1111-1111-111111111104'),
  ('55555555-0000-0000-0000-00000000000c', '33333333-3333-3333-3333-333333333301', '44444444-4444-4444-4444-444444444405', 'Finalize crockery vendor quote', null, 'stuck', 'medium', now() - interval '2 days', 1, '11111111-1111-1111-1111-111111111104'),

  -- NHAI Overpass — Tender Docs
  ('55555555-0000-0000-0000-000000000021', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444411', 'Submit EMD and tender fee', null, 'done', 'urgent', now() - interval '15 days', 0, '11111111-1111-1111-1111-111111111102'),
  ('55555555-0000-0000-0000-000000000022', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444411', 'Notarize technical bid documents', null, 'done', 'high', now() - interval '12 days', 1, '11111111-1111-1111-1111-111111111102'),
  -- NHAI Overpass — Site Survey
  ('55555555-0000-0000-0000-000000000023', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444412', 'Topographic survey — north approach', null, 'in_progress', 'high', now() + interval '2 days', 0, '11111111-1111-1111-1111-111111111104'),
  ('55555555-0000-0000-0000-000000000024', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444412', 'Soil testing report', null, 'review', 'high', now() - interval '1 day', 1, '11111111-1111-1111-1111-111111111104'),
  -- NHAI Overpass — Material Procurement
  ('55555555-0000-0000-0000-000000000025', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444413', 'Cement supplier rate contract', null, 'stuck', 'urgent', now() - interval '3 days', 0, '11111111-1111-1111-1111-111111111102'),
  ('55555555-0000-0000-0000-000000000026', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444413', 'Steel reinforcement order — phase 1', null, 'not_started', 'medium', now() + interval '10 days', 1, '11111111-1111-1111-1111-111111111102'),
  -- NHAI Overpass — Labor Deployment
  ('55555555-0000-0000-0000-000000000027', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444414', 'Mobilize masonry crew', null, 'not_started', 'medium', now() + interval '14 days', 0, '11111111-1111-1111-1111-111111111102'),
  -- NHAI Overpass — Safety Compliance
  ('55555555-0000-0000-0000-000000000028', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444415', 'Site safety induction — all crew', null, 'not_started', 'high', now() + interval '6 days', 0, '11111111-1111-1111-1111-111111111104'),
  ('55555555-0000-0000-0000-000000000029', '33333333-3333-3333-3333-333333333302', '44444444-4444-4444-4444-444444444415', 'PPE stock audit', null, 'done', 'low', now() - interval '8 days', 1, '11111111-1111-1111-1111-111111111102'),

  -- Metro OOH — Site Booking
  ('55555555-0000-0000-0000-000000000041', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444421', 'Confirm 12 hoarding sites — MG Road corridor', null, 'done', 'high', now() - interval '5 days', 0, '11111111-1111-1111-1111-111111111103'),
  ('55555555-0000-0000-0000-000000000042', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444421', 'Municipal permit renewal', null, 'in_progress', 'urgent', now() + interval '1 day', 1, '11111111-1111-1111-1111-111111111103'),
  -- Metro OOH — Creative Approval
  ('55555555-0000-0000-0000-000000000043', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444422', 'Client sign-off on hoarding artwork', null, 'review', 'high', now() - interval '1 day', 0, '11111111-1111-1111-1111-111111111105'),
  ('55555555-0000-0000-0000-000000000044', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444422', 'Print-ready file export', null, 'not_started', 'medium', now() + interval '3 days', 1, '11111111-1111-1111-1111-111111111105'),
  -- Metro OOH — Installation
  ('55555555-0000-0000-0000-000000000045', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444423', 'Fabricate flex banners (x12)', 'Bright Signage to deliver by Friday.', 'in_progress', 'high', now() + interval '4 days', 0, '11111111-1111-1111-1111-111111111106'),
  ('55555555-0000-0000-0000-000000000046', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444423', 'Install banners — batch 1 (sites 1-6)', null, 'not_started', 'medium', now() + interval '6 days', 1, '11111111-1111-1111-1111-111111111106'),
  -- Metro OOH — Client Billing
  ('55555555-0000-0000-0000-000000000047', '33333333-3333-3333-3333-333333333303', '44444444-4444-4444-4444-444444444424', 'Raise Q3 milestone invoice', null, 'not_started', 'medium', now() + interval '12 days', 0, '11111111-1111-1111-1111-111111111103')
on conflict (id) do nothing;

-- Assignees (primary doer per task; a couple delegated to show the Review flow)
insert into task_assignees (task_id, user_id, is_primary, is_delegator)
values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111103', true, false),
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111105', true, false),
  -- Delegated: Ananya assigned this to Vikram, awaiting her approval (review).
  ('55555555-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111103', false, true),
  ('55555555-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-00000000000a', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-00000000000b', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-00000000000c', '11111111-1111-1111-1111-111111111104', true, false),

  ('55555555-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111102', true, false),
  ('55555555-0000-0000-0000-000000000022', '11111111-1111-1111-1111-111111111102', true, false),
  ('55555555-0000-0000-0000-000000000023', '11111111-1111-1111-1111-111111111104', true, false),
  -- Delegated: Rohan assigned soil testing to Vikram, awaiting review.
  ('55555555-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000024', '11111111-1111-1111-1111-111111111102', false, true),
  ('55555555-0000-0000-0000-000000000025', '11111111-1111-1111-1111-111111111102', true, false),
  ('55555555-0000-0000-0000-000000000026', '11111111-1111-1111-1111-111111111102', true, false),
  ('55555555-0000-0000-0000-000000000027', '11111111-1111-1111-1111-111111111102', true, false),
  ('55555555-0000-0000-0000-000000000028', '11111111-1111-1111-1111-111111111104', true, false),
  ('55555555-0000-0000-0000-000000000029', '11111111-1111-1111-1111-111111111102', true, false),

  ('55555555-0000-0000-0000-000000000041', '11111111-1111-1111-1111-111111111103', true, false),
  ('55555555-0000-0000-0000-000000000042', '11111111-1111-1111-1111-111111111103', true, false),
  ('55555555-0000-0000-0000-000000000043', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-000000000044', '11111111-1111-1111-1111-111111111105', true, false),
  ('55555555-0000-0000-0000-000000000045', '11111111-1111-1111-1111-111111111106', true, false),
  ('55555555-0000-0000-0000-000000000046', '11111111-1111-1111-1111-111111111106', true, false),
  ('55555555-0000-0000-0000-000000000047', '11111111-1111-1111-1111-111111111103', true, false)
on conflict (task_id, user_id) do nothing;

-- A few checklists so P12's checklist editor has something to show.
insert into task_checklist_items (task_id, label, is_done, position)
values
  ('55555555-0000-0000-0000-000000000001', 'Confirm dosa batter recipe', true, 0),
  ('55555555-0000-0000-0000-000000000001', 'Set pricing per item', true, 1),
  ('55555555-0000-0000-0000-000000000001', 'Get chef sign-off', true, 2),
  ('55555555-0000-0000-0000-000000000004', 'Get 3 vendor quotes', true, 0),
  ('55555555-0000-0000-0000-000000000004', 'Negotiate delivery schedule', false, 1),
  ('55555555-0000-0000-0000-000000000045', 'Confirm banner dimensions', true, 0),
  ('55555555-0000-0000-0000-000000000045', 'Print proof approval', false, 1),
  ('55555555-0000-0000-0000-000000000045', 'Deliver to install team', false, 2)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 6. Karmas — a handful of recurring duties, personal and delegated.
-- ---------------------------------------------------------------------------

insert into karmas (id, org_id, user_id, delegated_by, project_id, title, description, recurrence_type, recurrence_interval, status, due_at)
values
  ('66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111104', null, '33333333-3333-3333-3333-333333333301', 'Daily cash reconciliation', 'Tally till against POS report before closing.', 'daily', 1, 'not_started', now() + interval '6 hours'),
  ('66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105', '11111111-1111-1111-1111-111111111103', '33333333-3333-3333-3333-333333333301', 'Weekly vendor call — dairy & produce', null, 'weekly', 1, 'not_started', now() + interval '2 days'),
  ('66666666-6666-6666-6666-666666666603', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', null, '33333333-3333-3333-3333-333333333302', 'Weekly site safety walkthrough', null, 'weekly', 1, 'in_progress', now() + interval '1 day'),
  ('66666666-6666-6666-6666-666666666604', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111103', null, null, 'Monthly org expense review', 'Personal duty, not tied to a single project.', 'monthly', 1, 'not_started', now() + interval '10 days'),
  ('66666666-6666-6666-6666-666666666605', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111105', null, '33333333-3333-3333-3333-333333333303', 'Weekly hoarding site photo audit', null, 'weekly', 1, 'stuck', now() - interval '1 day')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 7. Chat history — general column chatter + a couple of photo attachments
--    (URLs are illustrative placeholders; no file actually lives at these
--    paths without a real Storage upload).
-- ---------------------------------------------------------------------------

insert into chat_messages (column_id, task_id, author_id, body, attachment_url, message_type, created_at)
values
  ('44444444-4444-4444-4444-444444444401', null, '11111111-1111-1111-1111-111111111103', 'Sharing the plated dosa shot from today''s trial — thoughts on the chutney presentation?', '44444444-4444-4444-4444-444444444401/dosa-trial.jpg', 'photo', now() - interval '2 days'),
  ('44444444-4444-4444-4444-444444444401', '55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111104', 'Looks great, chef approved the batter consistency too.', null, 'text', now() - interval '2 days' + interval '20 minutes'),
  ('44444444-4444-4444-4444-444444444402', null, '11111111-1111-1111-1111-111111111104', 'Dairy vendor wants a 90-day contract minimum, pushing back on 30-day terms.', null, 'text', now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444412', null, '11111111-1111-1111-1111-111111111104', 'North approach survey photos attached — some drainage concerns near marker 4.', '44444444-4444-4444-4444-444444444412/survey-north.jpg', 'photo', now() - interval '6 hours'),
  ('44444444-4444-4444-4444-444444444423', '55555555-0000-0000-0000-000000000045', '11111111-1111-1111-1111-111111111106', 'First banner proof ready for review.', '44444444-4444-4444-4444-444444444423/banner-proof-1.jpg', 'photo', now() - interval '3 hours')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 8. Kudos
-- ---------------------------------------------------------------------------

insert into kudos (org_id, task_id, from_user_id, to_user_id, kind, created_at)
values
  ('22222222-2222-2222-2222-222222222201', '55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111103', '11111111-1111-1111-1111-111111111104', 'clap', now() - interval '2 days'),
  ('22222222-2222-2222-2222-222222222201', '55555555-0000-0000-0000-000000000021', '11111111-1111-1111-1111-111111111101', '11111111-1111-1111-1111-111111111102', 'star', now() - interval '10 days'),
  ('22222222-2222-2222-2222-222222222201', '55555555-0000-0000-0000-000000000041', '11111111-1111-1111-1111-111111111102', '11111111-1111-1111-1111-111111111103', 'team', now() - interval '4 days')
on conflict do nothing;
