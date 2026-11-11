'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Plus,
  KanbanSquare,
  RotateCw,
  LogOut,
  MoreHorizontal,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/shared/avatar';
import { NotificationsBell } from '@/components/shared/notifications-bell';
import { SearchBox } from '@/components/shared/search-box';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { signOutAction } from '@/app/(auth)/actions';
import { requestCreate } from '@/lib/utils/create-intent';

// The four rail destinations the bottom tab bar has no room for (CLAUDE.md §5
// fixes the mobile tabs at Home/Tasks/Projects/Rewards). Without this menu they
// are unreachable below `md` — the rail itself is `hidden md:flex`.
const OVERFLOW_LINKS = [
  { href: '/recurring-tasks', label: 'Recurring tasks', icon: RotateCw },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: Settings },
] as const;

export function TopBar({
  userId,
  userName,
  canCreateProject,
}: {
  userId: string | null;
  userName: string;
  canCreateProject: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const create = (intent: 'project' | 'recurring', href: string) => {
    const alreadyOnPage = pathname === href || pathname?.startsWith(`${href}/`) === true;
    requestCreate(intent, alreadyOnPage);
    if (!alreadyOnPage) router.push(href);
  };

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      <SearchBox />

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="size-4" />
              Create
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {canCreateProject && (
              <DropdownMenuItem onSelect={() => create('project', '/projects')}>
                <KanbanSquare className="size-3.5" />
                New project
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={() => create('recurring', '/recurring-tasks')}>
              <RotateCw className="size-3.5" />
              New recurring task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More sections"
              className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
            >
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {OVERFLOW_LINKS.map(({ href, label, icon: Icon }) => (
              <DropdownMenuItem key={href} asChild>
                <Link href={href} aria-current={pathname === href ? 'page' : undefined}>
                  <Icon className="size-3.5" />
                  {label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationsBell userId={userId} />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Account menu for ${userName}`}
              className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <Avatar name={userName} seed={userId ?? userName} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <p className="truncate px-2 py-1.5 text-xs text-muted-foreground">
              Signed in as <span className="font-medium text-foreground">{userName}</span>
            </p>
            <DropdownMenuItem destructive onSelect={() => void signOutAction()}>
              <LogOut className="size-3.5" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
