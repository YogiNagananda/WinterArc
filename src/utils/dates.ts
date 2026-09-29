// ─── Date utilities – all "day" logic respects the rollover hour ─────────────
import {
  format,
  parse,
  addDays,
  subDays,
  differenceInDays,
  startOfWeek,
  getISOWeek,
  getYear,
  isAfter,
  isBefore,
  isSameDay,
  getDay,
  parseISO,
} from 'date-fns';

/**
 * Get the effective "today" date string, respecting the rollover hour.
 * If the current time is before the rollover hour, we consider it still "yesterday".
 */
export function getEffectiveToday(rolloverHour: number = 4): string {
  const now = new Date();
  if (now.getHours() < rolloverHour) {
    return format(subDays(now, 1), 'yyyy-MM-dd');
  }
  return format(now, 'yyyy-MM-dd');
}

/**
 * Get the current date (without rollover adjustment) as YYYY-MM-DD.
 */
export function getCalendarToday(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

/**
 * Parse a YYYY-MM-DD string to a Date at midnight local time.
 */
export function parseLocalDate(dateStr: string): Date {
  return parse(dateStr, 'yyyy-MM-dd', new Date());
}

/**
 * Format a Date to YYYY-MM-DD.
 */
export function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get the day number (1-based) within the arc.
 * Returns 0 if before start, or arcLength+1 if after.
 */
export function getArcDay(
  startDate: string,
  arcLength: number,
  today: string,
): number {
  const start = parseLocalDate(startDate);
  const current = parseLocalDate(today);
  const diff = differenceInDays(current, start) + 1;
  if (diff < 1) return 0;
  if (diff > arcLength) return arcLength + 1;
  return diff;
}

/**
 * Days until the arc starts (0 if already started).
 */
export function daysUntilStart(startDate: string, today: string): number {
  const start = parseLocalDate(startDate);
  const current = parseLocalDate(today);
  const diff = differenceInDays(start, current);
  return Math.max(0, diff);
}

/**
 * Check if a task is scheduled for a given date.
 */
export function isTaskScheduledForDate(
  task: { startDate: string; repeat: { type: string; days: number[] }; archived: boolean },
  dateStr: string,
): boolean {
  if (task.archived) return false;

  const date = parseLocalDate(dateStr);
  const startDate = parseLocalDate(task.startDate);

  // Can't be scheduled before it was created
  if (isBefore(date, startDate)) return false;

  switch (task.repeat.type) {
    case 'none':
      return isSameDay(date, startDate);
    case 'daily':
      return true;
    case 'weekdays': {
      const dow = getDay(date);
      return dow >= 1 && dow <= 5;
    }
    case 'weekly':
      return task.repeat.days.includes(getDay(date));
    default:
      return false;
  }
}

/**
 * Check if two time ranges overlap.
 */
export function doTimesOverlap(
  startA: string,
  durationA: number,
  startB: string,
  durationB: number,
): boolean {
  if (!startA || !startB) return false;

  const [hA, mA] = startA.split(':').map(Number);
  const [hB, mB] = startB.split(':').map(Number);

  const startMinA = hA * 60 + mA;
  const endMinA = startMinA + durationA;
  const startMinB = hB * 60 + mB;
  const endMinB = startMinB + durationB;

  return startMinA < endMinB && startMinB < endMinA;
}

/**
 * Get ISO week string YYYY-Www.
 */
export function getISOWeekString(dateStr: string): string {
  const date = parseLocalDate(dateStr);
  const week = getISOWeek(date);
  const year = getYear(startOfWeek(date, { weekStartsOn: 1 }));
  return `${year}-W${String(week).padStart(2, '0')}`;
}

/**
 * Get days remaining in the arc.
 */
export function daysRemaining(
  startDate: string,
  arcLength: number,
  today: string,
): number {
  const day = getArcDay(startDate, arcLength, today);
  if (day === 0) return arcLength;
  if (day > arcLength) return 0;
  return arcLength - day;
}

/**
 * Format minutes to a readable string like "2h 30m".
 */
export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Get all dates between two dates (inclusive).
 */
export function getDateRange(from: string, to: string): string[] {
  const dates: string[] = [];
  let current = parseLocalDate(from);
  const end = parseLocalDate(to);

  while (!isAfter(current, end)) {
    dates.push(formatDate(current));
    current = addDays(current, 1);
  }
  return dates;
}

/**
 * Time string to minutes since midnight.
 */
export function timeToMinutes(time: string): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Format a time string from HH:mm to a readable form like "2:30 PM".
 */
export function formatTime(time: string): string {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export { addDays, subDays, differenceInDays, format, parseISO, isBefore, isAfter, isSameDay, getDay, startOfWeek };
