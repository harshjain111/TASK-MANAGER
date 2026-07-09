-- 0010_escalation_threshold.sql
-- Per-org configurable overdue-escalation threshold (P23). The "stuck for
-- more than 24h" half of the rule is fixed per CLAUDE.md's wording — only
-- the overdue threshold is configurable.

alter table organizations add column escalation_threshold_hours integer not null default 24;

alter table organizations add constraint organizations_escalation_threshold_positive
  check (escalation_threshold_hours > 0);
