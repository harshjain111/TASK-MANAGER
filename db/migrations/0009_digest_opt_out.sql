-- 0009_digest_opt_out.sql
-- Per-user opt-out for the daily digest email (P22). Lives on profiles
-- since it's a personal preference, not an org-level setting.

alter table profiles add column digest_opt_out boolean not null default false;
