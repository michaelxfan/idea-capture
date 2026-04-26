export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = typeof WEEKDAYS[number];

const JS_DAY_TO_WEEKDAY: Weekday[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

export function todayWeekday(): Weekday {
  return JS_DAY_TO_WEEKDAY[new Date().getDay()];
}

export function isScheduledToday(officeDays: string[]): boolean {
  return officeDays.includes(todayWeekday());
}

export function labelDay(day: string): string {
  return day.charAt(0).toUpperCase() + day.slice(1, 3);
}
