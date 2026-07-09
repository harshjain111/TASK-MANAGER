import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { SearchBox } from '@/components/shared/search-box';

export function TopBar({ userId, userName }: { userId: string | null; userName: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <SearchBox />

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
