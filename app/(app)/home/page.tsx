import { CalendarStrip } from '@/components/home/calendar-strip';
import { TaskDelegationGrid } from '@/components/home/task-delegation-grid';

export default function HomePage() {
  return (
    <div className="flex h-full flex-col overflow-auto">
      <CalendarStrip />
      <TaskDelegationGrid />
    </div>
  );
}
