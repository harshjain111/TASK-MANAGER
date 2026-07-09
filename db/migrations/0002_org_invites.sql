-- 0002_org_invites.sql
-- Invite-by-link flow: an owner/admin creates a row here, shares the
-- generated link (/signup?invite=<token>), and P5's signup Server Action
-- consumes it via accept_org_invite() instead of create_organization().

create table org_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations (id) on delete cascade,
  email text not null,
  org_role org_role not null default 'employee',
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  invited_by uuid not null references auth.users (id),
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index org_invites_org_id_idx on org_invites (org_id);
create index org_invites_token_idx on org_invites (token);

alter table org_invites enable row level security;

create policy "Owners/admins can view their org's invites"
  on org_invites for select
  using (has_org_role(org_id, array['owner', 'admin']::org_role[]));

create policy "Owners/admins can create invites"
  on org_invites for insert
  with check (
    has_org_role(org_id, array['owner', 'admin']::org_role[])
    and invited_by = auth.uid()
  );

create policy "Owners/admins can revoke invites"
  on org_invites for delete
  using (has_org_role(org_id, array['owner', 'admin']::org_role[]));

-- No update policy: acceptance is stamped by accept_org_invite() below,
-- which runs as SECURITY DEFINER.

-- ---------------------------------------------------------------------------
-- Look up an invite by its (unguessable) token — callable by anon/authenticated
-- so the signup page can show "You're joining <org> as <role>" before the
-- visitor has an account. Token possession is the access control here, same
-- as any email-invite-link pattern; it never lists or enumerates invites.
-- ---------------------------------------------------------------------------

create or replace function get_org_invite(invite_token text)
returns table (org_name text, org_role org_role, email text)
language sql
security definer
set search_path = public
stable
as $$
  select o.name, i.org_role, i.email
  from org_invites i
  join organizations o on o.id = i.org_id
  where i.token = invite_token
    and i.accepted_at is null
    and i.expires_at > now();
$$;

-- Anonymous visitors need this to render "You're joining <org>" on the
-- signup page before they have an account — token possession is the gate.
grant execute on function get_org_invite(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Accept an invite — called from the signup Server Action right after the
-- invited user's first authenticated session exists. SECURITY DEFINER for
-- the same bootstrap reason as create_organization(): the caller isn't an
-- org_members row yet, so they can't satisfy org_members' own insert policy.
-- ---------------------------------------------------------------------------

create or replace function accept_org_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite org_invites%rowtype;
  caller_email text;
begin
  if auth.uid() is null then
    raise exception 'accept_org_invite requires an authenticated user';
  end if;

  select * into invite
  from org_invites
  where token = invite_token
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found then
    raise exception 'This invite link is invalid or has expired.';
  end if;

  caller_email := (select email from auth.users where id = auth.uid());
  if caller_email is null or lower(caller_email) <> lower(invite.email) then
    raise exception 'This invite was sent to a different email address.';
  end if;

  insert into org_members (org_id, user_id, org_role)
  values (invite.org_id, auth.uid(), invite.org_role)
  on conflict (org_id, user_id) do nothing;

  update org_invites set accepted_at = now() where id = invite.id;

  return invite.org_id;
end;
$$;
