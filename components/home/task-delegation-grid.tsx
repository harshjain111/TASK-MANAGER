import { TaskPanel } from './task-panel';
import { KarmaPanelStub } from './karma-panel-stub';

export function TaskDelegationGrid() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2">
      <TaskPanel title="My Tasks" scope="my" />
      <TaskPanel title="Delegated Tasks" scope="delegated" />
      <KarmaPanelStub title="My Karmas" scope="my" />
      <KarmaPanelStub title="Delegated Karmas" scope="delegated" />
    </div>
  );
}
