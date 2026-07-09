import type { TaskStatus } from '@/types/domain';

// One-tap cycle order per CLAUDE.md P11 spec. `review` is excluded — that
// state is only entered/exited via the delegation approve/reopen flow (P19),
// never by tapping the pill.
const CYCLE: TaskStatus[] = ['not_started', 'in_progress', 'stuck', 'done'];

/** Next status when the pill is tapped, or null if this status isn't cycle-tappable. */
export function nextTaskStatus(current: TaskStatus): TaskStatus | null {
  const index = CYCLE.indexOf(current);
  if (index === -1) return null;
  return CYCLE[(index + 1) % CYCLE.length]!;
}
