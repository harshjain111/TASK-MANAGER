'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  ListChecks,
  KanbanSquare,
  RotateCw,
  Users,
  Trophy,
  BarChart3,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/projects', label: 'Projects', icon: KanbanSquare },
  // Label is "Recurring", not "Recurring Tasks": the longer string measures
  // 46px in the 44px pill and wraps to two lines, overflowing it by 4px.
  { href: '/recurring-tasks', label: 'Recurring', icon: RotateCw },
  { href: '/team', label: 'Team', icon: Users },
  { href: '/rewards', label: 'Rewards', icon: Trophy },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/admin', label: 'Admin', icon: Settings },
] as const;

export function NavRail() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="hidden w-16 shrink-0 flex-col items-center gap-1 border-r border-border bg-sidebar py-4 md:flex"
    >
      <div className="mb-4 flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
        F
      </div>
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            aria-current={active ? 'page' : undefined}
            className={cn(
              // h-11 keeps the 44px target height; w-14 (56px) inside the 64px
              // rail is what the longest label actually needs — at size-11 the
              // text overflowed the pill it was supposed to sit in.
              'flex h-11 w-14 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              active && 'bg-sidebar-accent text-sidebar-accent-foreground',
            )}
          >
            <Icon className="size-4" />
            <span className="sr-only md:not-sr-only">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
