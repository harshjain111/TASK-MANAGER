import { TaskPanel } from './task-panel';
import { KarmaPanel } from '@/components/karmas/karma-panel';

export function TaskDelegationGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <TaskPanel title="My Tasks" scope="my" />
      <TaskPanel title="Delegated Tasks" scope="delegated" />
      <KarmaPanel title="My Karmas" scope="my" />
      <KarmaPanel title="Delegated Karmas" scope="delegated" />
    </div>
  );
}
