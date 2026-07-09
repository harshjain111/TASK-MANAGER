'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { userChannelName } from '@/lib/realtime/channels';
import {
  getMyNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
  type NotificationRow,
} from '@/app/(app)/notifications-actions';

function describe(notification: NotificationRow): string {
  const title = notification.payload.taskTitle ?? 'a task';
  switch (notification.type) {
    case 'task_assigned':
      return `You were assigned to "${title}"`;
    case 'task_due_today':
      return `"${title}" is due today`;
    case 'task_overdue':
      return `"${title}" is overdue`;
    case 'task_approved':
      return `"${title}" was approved`;
    case 'task_reopened':
      return `"${title}" was reopened`;
    case 'task_review':
      return `"${title}" is ready for your review`;
    case 'task_escalated':
      return `Escalated: "${title}" needs attention`;
    case 'mention':
      return `You were mentioned: "${notification.payload.body ?? ''}"`;
    default:
      return 'New notification';
  }
}

export function NotificationsBell({ userId }: { userId: string | null }) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);

  useEffect(() => {
    getMyNotificationsAction().then(setNotifications);
  }, []);

  useEffect(() => {
    if (!userId) return;
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel(userChannelName(userId))
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          setNotifications((prev) => [payload.new as unknown as NotificationRow, ...prev].slice(0, 20));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const openNotification = (notification: NotificationRow) => {
    void markNotificationReadAction(notification.id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    if (notification.payload.projectId) {
      router.push(`/projects/${notification.payload.projectId}/board`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" aria-label="Notifications" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-sm font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={() => {
                void markAllNotificationsReadAction();
                setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
              }}
              className="text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>
        {notifications.length === 0 ? (
          <p className="px-2 py-4 text-center text-xs text-muted-foreground">You&apos;re all caught up.</p>
        ) : (
          <div className="flex max-h-80 flex-col overflow-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                onSelect={() => openNotification(notification)}
                className="flex-col items-start gap-0.5"
              >
                <span className={notification.readAt ? 'text-muted-foreground' : 'font-medium text-foreground'}>
                  {describe(notification)}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
