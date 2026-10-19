/* Display helpers for the detail popups' parcel / cargo rows. */

const PLACEHOLDER = "Not given yet";
const isJunk = (v) => v === "" || /\b(undefined|null|NaN)\b/.test(v);

/* "a, b, c" — no trailing comma. `suffix` (" kg") is added to each value.
   Repeated "Not given yet" collapses to one; real repeated values (two
   parcels of 0.3 kg) are kept. */
export const joinList = (items, suffix = "") => {
  const out = [];
  (items || []).forEach((item) => {
    if (item === undefined || item === null) return;
    const text = String(item).trim();
    if (isJunk(text)) return;
    if (text === PLACEHOLDER) {
      if (!out.includes(PLACEHOLDER)) out.push(PLACEHOLDER);
      return;
    }
    out.push(`${text}${suffix}`);
  });
  return out.join(", ");
};

/* Stored as arrays, JSON-encoded arrays ('["800 tk/kg"]'), comma strings or
   bare numbers — and usually already carrying their unit. */
const toList = (value) => {
  if (Array.isArray(value)) return value;
  const text = String(value === undefined || value === null ? "" : value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      /* fall through */
    }
  }
  return text.split(",");
};

/* "800 tk/kg" stays as is; a bare 800 becomes "800 Tk/Kg". Fixes the
   "800 tk/kgTk/Kg" that came from always appending the unit. */
export const withUnit = (value, unit) =>
  joinList(
    toList(value).map((item) => {
      const text = String(item === undefined || item === null ? "" : item).trim();
      return /^\d+(\.\d+)?$/.test(text) ? `${text} ${unit}` : text;
    })
  );
