import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  addWeeks,
  addMonths,
  format,
  isSameDay,
} from 'date-fns';

export type CalendarView = 'day' | 'week' | 'month';

export function rangeForView(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  switch (view) {
    case 'day':
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case 'week':
      return { start: startOfWeek(anchor), end: endOfWeek(anchor) };
    case 'month':
      // Pad to full weeks so the month grid has no partial rows.
      return {
        start: startOfWeek(startOfMonth(anchor)),
        end: endOfWeek(endOfMonth(anchor)),
      };
  }
}

export function daysInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function shiftAnchor(view: CalendarView, anchor: Date, direction: 1 | -1): Date {
  switch (view) {
    case 'day':
      return addDays(anchor, direction);
    case 'week':
      return addWeeks(anchor, direction);
    case 'month':
      return addMonths(anchor, direction);
  }
}

export function formatRangeLabel(view: CalendarView, anchor: Date): string {
  switch (view) {
    case 'day':
      return format(anchor, 'EEEE, MMM d');
    case 'week': {
      const { start, end } = rangeForView('week', anchor);
      return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
    }
    case 'month':
      return format(anchor, 'MMMM yyyy');
  }
}

export { isSameDay };
