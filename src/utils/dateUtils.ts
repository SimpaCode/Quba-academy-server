// src/utils/dateUtils.ts
// Copied from Next.js lib/utils/dateUtils.ts — zero changes needed.

export function toLocalDateString(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function todayString(): string {
  return toLocalDateString(new Date());
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toLocalDateString(d);
}

export function computeLiveStreak(
  currentStreak: number,
  lastActiveDate: string | null,
): number {
  if (!lastActiveDate) return 0;
  const today = todayString();
  const yesterday = yesterdayString();
  if (lastActiveDate === today || lastActiveDate === yesterday) {
    return currentStreak;
  }
  return 0;
}
