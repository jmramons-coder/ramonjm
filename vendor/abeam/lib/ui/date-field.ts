import { parseDate, type CalendarDate } from "@internationalized/date";
import { uiLocale, type UILanguage } from "./language.ts";

/** Travel dates are Gregorian date-only values, never inferred from time zones. */
export function parseDateOnly(value: string | undefined): CalendarDate | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  try {
    const date = parseDate(value);
    return date.toString() === value ? date : null;
  } catch {
    return null;
  }
}

export function dateOnlyError(value: string, { required = false, minDate, maxDate }: { required?: boolean; minDate?: string; maxDate?: string } = {}): "required" | "invalid" | "before-min" | "after-max" | null {
  if (!value) return required ? "required" : null;
  const date = parseDateOnly(value);
  if (!date) return "invalid";
  const min = parseDateOnly(minDate);
  const max = parseDateOnly(maxDate);
  if (min && date.compare(min) < 0) return "before-min";
  if (max && date.compare(max) > 0) return "after-max";
  return null;
}

/** Display recorded travel periods in the UI locale without rolling invalid dates. */
export function formatTravelPeriod(value: string | null, verbatim: string | null, language: UILanguage): string | null {
  if (value) {
    const month = /^(\d{4})-(\d{2})$/.exec(value);
    const day = parseDateOnly(value);
    const year = month ? Number(month[1]) : day?.year;
    const monthNumber = month ? Number(month[2]) : day?.month;
    if (year && monthNumber && monthNumber >= 1 && monthNumber <= 12) {
      const date = new Date(0);
      date.setUTCFullYear(year, monthNumber - 1, day?.day ?? 1);
      date.setUTCHours(0, 0, 0, 0);
      return new Intl.DateTimeFormat(uiLocale(language), {
        ...(day ? { day: "numeric" as const } : {}), month: "long", year: "numeric", timeZone: "UTC",
      }).format(date);
    }
    if (!/^\d/.test(value)) return value;
  }
  return verbatim?.trim() || null;
}
