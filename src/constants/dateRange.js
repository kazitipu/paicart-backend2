/* Date-range helpers for the list filters — always on the BANGLADESH calendar.
 *
 * Paicart runs on Dhaka time, but these used to follow the admin computer's
 * own time zone: on a machine set to another zone (a UTC laptop, an agent in
 * China) "today" started and ended at the wrong hour, so orders placed near
 * midnight landed in the neighbouring day and only showed after widening the
 * range by a day. Bangladesh has no daylight saving, so a Dhaka day is exactly
 * [00:00, 24:00) at UTC+6 whatever the computer is set to. */

const pad = (value) => String(value).padStart(2, "0");
const DHAKA_OFFSET_MS = 6 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/* Date -> "YYYY-MM-DD" (the Dhaka calendar day it falls on), for an
   <input type="date">. */
export const toDateInputValue = (date) => {
  const shifted = new Date(date.getTime() + DHAKA_OFFSET_MS);
  return `${shifted.getUTCFullYear()}-${pad(shifted.getUTCMonth() + 1)}-${pad(
    shifted.getUTCDate()
  )}`;
};

const parseInputValue = (value) => {
  const [year, month, day] = String(value || "")
    .split("-")
    .map(Number);
  return year && month && day ? { year, month, day } : null;
};

/* "YYYY-MM-DD" -> the instant that Dhaka day starts (00:00 Dhaka). */
export const dhakaDayStart = (value) => {
  const p = parseInputValue(value);
  if (!p) return new Date(value);
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - DHAKA_OFFSET_MS);
};

/* "YYYY-MM-DD" -> the last millisecond of that Dhaka day (23:59:59.999). */
export const dhakaDayEnd = (value) => {
  const p = parseInputValue(value);
  if (!p) return new Date(value);
  return new Date(Date.UTC(p.year, p.month - 1, p.day) - DHAKA_OFFSET_MS + DAY_MS - 1);
};

/* Kept for existing callers: the start of that Dhaka day. */
export const fromDateInputValue = dhakaDayStart;

/* The default filter window: the last `days` days up to and including today
   in Dhaka. */
export const getDefaultDateRange = (days = 30) => {
  const now = Date.now();
  return {
    startDate: toDateInputValue(new Date(now - days * DAY_MS)),
    endDate: toDateInputValue(new Date(now)),
  };
};

/* Records store the booked day as dd/mm/yyyy alongside a `time` millisecond
   stamp. `time` is authoritative; this is the fallback for older rows that
   only carry the printed date (taken as the start of that Dhaka day). */
export const parseDayMonthYear = (value) => {
  const [d, m, y] = String(value || "")
    .split("/")
    .map(Number);
  if (!d || !m || !y) return NaN;
  return Date.UTC(y, m - 1, d) - DHAKA_OFFSET_MS;
};

/* Milliseconds for a record, or NaN when it carries no usable date. */
export const getRecordTime = (record) => {
  const stamp = parseInt(record && record.time, 10);
  if (Number.isFinite(stamp)) return stamp;
  return parseDayMonthYear(record && record.date);
};

/* Inclusive [start, end] Dhaka-day test against "YYYY-MM-DD" input values.
   An empty bound is open-ended. */
export const isWithinDateRange = (record, startValue, endValue) => {
  if (!startValue && !endValue) return true;
  const ms = getRecordTime(record);
  if (!Number.isFinite(ms)) return false;
  if (startValue && ms < dhakaDayStart(startValue).getTime()) return false;
  if (endValue && ms > dhakaDayEnd(endValue).getTime()) return false;
  return true;
};
