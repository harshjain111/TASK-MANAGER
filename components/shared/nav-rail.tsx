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
  { href: '/karmas', label: 'Karmas', icon: RotateCw },
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
            className={cn(
              'flex size-11 flex-col items-center justify-center gap-0.5 rounded-lg text-[10px] font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
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
