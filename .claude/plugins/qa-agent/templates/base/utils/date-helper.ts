/**
 * Date helpers for test data. Kept dependency-free (native Intl/Date) so tests
 * don't pull in dayjs/moment. All functions are pure.
 */

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO date only, e.g. "2026-06-09". */
export function isoDate(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Full ISO timestamp, safe for filenames when `forFilename` strips colons. */
export function isoTimestamp(forFilename = false): string {
  const iso = new Date().toISOString();
  return forFilename ? iso.replace(/[:.]/g, "-") : iso;
}

/** Shift a date by N days (negative = past). */
export function addDays(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + days);
  return d;
}

export function today(): string {
  return isoDate();
}

export function daysAgo(n: number): string {
  return isoDate(addDays(-n));
}

export function daysFromNow(n: number): string {
  return isoDate(addDays(n));
}

/** Human label like "09 Jun 2026" for assertions against UI date strings. */
export function displayDate(d: Date = new Date(), locale = "en-GB"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}
