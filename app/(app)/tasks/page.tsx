import { TaskPanel } from '@/components/home/task-panel';

export default function TasksPage() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Tasks</h1>
        <p className="text-sm text-muted-foreground">
          Every task across all your projects — assigned to you or delegated by you.
        </p>
      </div>
      <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
        <TaskPanel title="My Tasks" scope="my" />
        <TaskPanel title="Delegated Tasks" scope="delegated" />
      </div>
    </div>
  );
}
