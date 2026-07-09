// Realtime channel naming (CLAUDE.md §2): one channel per board column for
// the chat feed (wired up in P16), one per user for notifications (here).

export function userChannelName(userId: string): string {
  return `user:${userId}`;
}

export function columnChannelName(columnId: string): string {
  return `column:${columnId}`;
}
