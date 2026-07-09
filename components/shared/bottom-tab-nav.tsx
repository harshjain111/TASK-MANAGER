'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ListChecks, KanbanSquare, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mobile degrades to exactly these four tabs (CLAUDE.md §5) — the full
// eight-item rail (Karmas/Team/Reports/Admin included) is desktop-only.
const TABS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: ListChecks },
  { href: '/projects', label: 'Projects', icon: KanbanSquare },
  { href: '/rewards', label: 'Rewards', icon: Trophy },
] as const;

export function BottomTabNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="flex h-14 shrink-0 items-center border-t border-border bg-background md:hidden"
    >
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium text-muted-foreground',
              active && 'text-primary',
            )}
          >
            <Icon className="size-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
