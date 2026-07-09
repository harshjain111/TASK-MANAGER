import Link from 'next/link';
import { Plus, UserPlus, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Task/karma creation needs a project + column (or a recurrence pattern for
// karmas, P21) that Home doesn't have context for — these are shortcuts into
// the place that does, not full creation flows on their own.
export function QuickActionBar() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/projects">
          <Plus className="size-3.5" />
          Create Task
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/projects">
          <UserPlus className="size-3.5" />
          Allocate Task
        </Link>
      </Button>
      <Button asChild size="sm" variant="outline" className="gap-1.5">
        <Link href="/projects">
          <FolderPlus className="size-3.5" />
          New Project
        </Link>
      </Button>
    </div>
  );
}
