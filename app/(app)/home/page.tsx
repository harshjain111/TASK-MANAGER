import { CalendarStrip } from '@/components/home/calendar-strip';
import { ComingSoon } from '@/components/shared/coming-soon';

export default function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <CalendarStrip />
      <div className="flex-1 overflow-auto">
        <ComingSoon
          title="My Day"
          blurb="The My/Delegated Tasks & Karmas grid lands here in P14."
        />
      </div>
    </div>
  );
}
