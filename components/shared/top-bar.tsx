import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { NotificationsBell } from '@/components/shared/notifications-bell';

export function TopBar({ userId, userName }: { userId: string | null; userName: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search tasks, karmas, people…"
          disabled
          className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" />
          Create
        </Button>
        <NotificationsBell userId={userId} />
        <Avatar name={userName} seed={userId ?? userName} size="sm" />
      </div>
    </header>
  );
}
