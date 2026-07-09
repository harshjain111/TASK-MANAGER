export const MY_TASK_TABS = ['Due Soon', 'Overdue', 'Stuck', 'Co-act'] as const;
export const DELEGATED_TASK_TABS = ['Due Soon', 'Overdue', 'Stuck', 'Review'] as const;
export type MyTaskTab = (typeof MY_TASK_TABS)[number];
export type DelegatedTaskTab = (typeof DELEGATED_TASK_TABS)[number];
