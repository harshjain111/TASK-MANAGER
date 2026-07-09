import { KanbanSquare } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
      <KanbanSquare className="size-8 text-muted-foreground" />
      <h1 className="text-lg font-semibold text-foreground">Pick a project</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Select a project from the list to open its board.
      </p>
    </div>
  );
}
