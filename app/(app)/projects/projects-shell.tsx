'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KanbanSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NewProjectDialog } from './new-project-dialog';

type ProjectRow = { id: string; name: string; cover_color: string };

export function ProjectsShell({
  projects,
  canCreate,
  orgMembers,
  children,
}: {
  projects: ProjectRow[];
  canCreate: boolean;
  orgMembers: { userId: string; name: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hasSelection = pathname !== '/projects';

  return (
    <div className="flex h-full min-h-0">
      <div
        className={cn(
          'flex w-full shrink-0 flex-col border-r border-border md:w-72',
          hasSelection ? 'hidden md:flex' : 'flex',
        )}
      >
        <div className="flex items-center justify-between border-b border-border p-3">
          <h1 className="text-sm font-semibold text-foreground">Projects</h1>
          {canCreate && <NewProjectDialog orgMembers={orgMembers} />}
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-1 p-6 text-center">
            <KanbanSquare className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">No projects yet</p>
            <p className="text-xs text-muted-foreground">
              {canCreate ? 'Create your first project to get started.' : 'Ask an admin to add you to a project.'}
            </p>
          </div>
        ) : (
          <ul className="flex-1 overflow-auto">
            {projects.map((project) => {
              const active = pathname?.startsWith(`/projects/${project.id}`);
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}/board`}
                    className={cn(
                      'flex items-center gap-3 border-b border-border/50 px-3 py-3 text-sm transition-colors hover:bg-muted',
                      active && 'bg-accent text-accent-foreground',
                    )}
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ backgroundColor: project.cover_color }}
                    >
                      {project.name.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                      {project.name}
                    </span>
                    {/* Unread/activity indicator — wired up in Phase 2 (P16 chat). */}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className={cn('min-w-0 flex-1', hasSelection ? 'flex' : 'hidden md:flex')}>{children}</div>
    </div>
  );
}
