'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { archiveProjectAction, type ArchivableProject } from './org-members-actions';

export function DangerZone({ initialProjects }: { initialProjects: ArchivableProject[] }) {
  const [projects, setProjects] = useState(initialProjects.filter((p) => !p.archivedAt));
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const archive = (project: ArchivableProject) => {
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    setConfirmingId(null);
    startTransition(async () => {
      await archiveProjectAction(project.id);
    });
  };

  if (projects.length === 0) {
    return <p className="text-sm text-muted-foreground">No active projects.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-border">
      {projects.map((project) => (
        <li key={project.id} className="flex items-center justify-between py-2">
          <span className="text-sm text-foreground">{project.name}</span>
          {confirmingId === project.id ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Archive this project?</span>
              <Button size="sm" variant="destructive" disabled={isPending} onClick={() => archive(project)}>
                Confirm
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmingId(null)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setConfirmingId(project.id)}>
              Archive
            </Button>
          )}
        </li>
      ))}
    </ul>
  );
}
