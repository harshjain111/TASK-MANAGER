import { CalendarStrip } from '@/components/home/calendar-strip';
import { HomeContent } from '@/components/home/home-content';
import { isManagerAction } from './team-day-actions';

export default async function HomePage() {
  const isManager = await isManagerAction();

  return (
    <div className="flex h-full flex-col overflow-auto">
      <CalendarStrip />
      <HomeContent isManager={isManager} />
    </div>
  );
}
