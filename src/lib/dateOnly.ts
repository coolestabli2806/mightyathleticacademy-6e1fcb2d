/**
 * Date-only helpers (YYYY-MM-DD) that avoid timezone shifts.
 *
 * Postgres `date` values come back as strings like "2025-01-02".
 * `new Date("2025-01-02")` is interpreted as UTC and can display as the
 * previous day in negative timezones. These helpers treat the date as local.
 */

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateOnly(value: string | null | undefined): Date | undefined {
  if (!value) return undefined;

  const datePart = value.split("T")[0];
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return new Date(year, month - 1, day);
}
