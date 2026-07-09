-- 0014_last_active.sql
-- Presence indicator for the Team directory (P32) — updated by a lightweight
-- client-side heartbeat once per app-shell mount (see
-- components/shared/presence-heartbeat.tsx), not per request.

alter table profiles add column last_active_at timestamptz;
