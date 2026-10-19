/* Aggregation for the dashboard.
 *
 * Pure functions over the records the dashboard fetches - no React, no
 * firebase. Everything date-related goes through constants/dateRange.js so
 * the dashboard lands on the same LOCAL calendar day the list pages filter
 * by; toISOString() reports the UTC date, which before 6am in Dhaka is
 * yesterday. Everything money-related goes through constants/paymentMath.js,
 * because every amount field on these records is a free-typed string on some
 * rows and a number on others.
 */
import {
  toDateInputValue,
  fromDateInputValue,
  getRecordTime,
} from "./dateRange";

/* ------------------------------------------------------------------ range */

export const RANGES = [
  { key: "today", label: "Today", days: 1, granularity: "hour" },
  { key: "7d", label: "7 days", days: 7, granularity: "day" },
  { key: "30d", label: "30 days", days: 30, granularity: "day" },
];

export const getRange = (key) => RANGES.find((r) => r.key === key) || RANGES[0];

/* The selected window plus the window immediately before it, so every tile
   can print a "vs previous period" delta. `days: 1` means today only, hence
   the days - 1 offsets. */
export const getRangeBounds = (key) => {
  const { days } = getRange(key);
  const today = new Date();

  const start = new Date();
  start.setDate(today.getDate() - (days - 1));

  const prevEnd = new Date();
  prevEnd.setDate(today.getDate() - days);

  const prevStart = new Date();
  prevStart.setDate(today.getDate() - (days * 2 - 1));

  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
    prevStartDate: toDateInputValue(prevStart),
    prevEndDate: toDateInputValue(prevEnd),
  };
};

/* The trailing 12 calendar months, used by the standing monthly row. */
export const getTwelveMonthBounds = () => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  return {
    startDate: toDateInputValue(start),
    endDate: toDateInputValue(today),
  };
};

/* ---------------------------------------------------------------- buckets */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/* An empty bucket for every slot in the window, so a quiet day draws as a
   gap in the series rather than vanishing and shifting everything after it
   one place to the left. */
const buildEmptyBuckets = (granularity, startValue, endValue) => {
  const buckets = [];

  if (granularity === "hour") {
    const day = fromDateInputValue(startValue);
    for (let h = 0; h < 24; h++) {
      const at = new Date(day.getFullYear(), day.getMonth(), day.getDate(), h);
      buckets.push({
        key: `h${h}`,
        from: at.getTime(),
        to: at.getTime() + 3600000 - 1,
        label: `${String(h).padStart(2, "0")}:00 - ${String(h).padStart(2, "0")}:59`,
        shortLabel: h % 3 === 0 ? `${String(h).padStart(2, "0")}` : "",
        count: 0,
        value: 0,
      });
    }
    return buckets;
  }

  if (granularity === "month") {
    const start = fromDateInputValue(startValue);
    const end = fromDateInputValue(endValue);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (
      cursor.getFullYear() < end.getFullYear() ||
      (cursor.getFullYear() === end.getFullYear() &&
        cursor.getMonth() <= end.getMonth())
    ) {
      const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
      const to = new Date(
        cursor.getFullYear(),
        cursor.getMonth() + 1,
        0,
        23, 59, 59, 999,
      );
      buckets.push({
        key: `${from.getFullYear()}-${from.getMonth()}`,
        from: from.getTime(),
        to: to.getTime(),
        label: `${MONTH_NAMES[from.getMonth()]} ${from.getFullYear()}`,
        shortLabel: MONTH_NAMES[from.getMonth()],
        count: 0,
        value: 0,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return buckets;
  }

  const start = fromDateInputValue(startValue);
  const end = fromDateInputValue(endValue);
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cursor <= end) {
    const from = new Date(
      cursor.getFullYear(), cursor.getMonth(), cursor.getDate(),
    );
    buckets.push({
      key: toDateInputValue(from),
      from: from.getTime(),
      to: from.getTime() + 86400000 - 1,
      label: `${from.getDate()} ${MONTH_NAMES[from.getMonth()]}`,
      shortLabel: `${from.getDate()}`,
      count: 0,
      value: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
};

/* Drops each record into its slot. `valueOf` is what the money line plots. */
export const bucketRecords = (
  records,
  granularity,
  startValue,
  endValue,
  valueOf = () => 0,
) => {
  const buckets = buildEmptyBuckets(granularity, startValue, endValue);
  if (buckets.length === 0) return buckets;

  const first = buckets[0].from;
  const last = buckets[buckets.length - 1].to;

  (records || []).forEach((record) => {
    const ms = getRecordTime(record);
    if (!Number.isFinite(ms) || ms < first || ms > last) return;
    /* Uniform slot width for hours and days, so the slot can be indexed
       directly; months vary in length and need the scan. */
    let bucket;
    if (granularity === "month") {
      bucket = buckets.find((b) => ms >= b.from && ms <= b.to);
    } else {
      const width = buckets[0].to - buckets[0].from + 1;
      bucket = buckets[Math.floor((ms - first) / width)];
    }
    if (!bucket) return;
    bucket.count += 1;
    bucket.value += valueOf(record) || 0;
  });

  return buckets;
};

/* ----------------------------------------------------------------- deltas */

export const delta = (current, previous) => {
  if (!previous) {
    /* 0 -> 0 is flat, not an infinite rise. */
    return { pct: current ? 100 : 0, direction: current ? "up" : "flat" };
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return {
    pct: Math.abs(pct),
    direction: pct > 0.5 ? "up" : pct < -0.5 ? "down" : "flat",
  };
};

/* ---------------------------------------------------------------- ladders */

/* The pipeline, in order, with where each rung lives in the UI.
 *
 * Bucketing is by the status STRING, never by shipmentStatusScore: the score
 * is ambiguous by construction - "Bangladesh customs" and "Bangladesh
 * warehouse" are both 5, and on product requests "Rates Provided" and
 * "Purchased" are both 2.
 *
 * Orders spell the first rung "pending" (lowercase); product and shipment
 * requests spell it "Pending". Shipment requests have no purchase step, and
 * they key off `status` where the other two key off `orderStatus`.
 */
export const LADDER = [
  {
    key: "pending",
    label: "Awaiting action",
    tone: "orange",
    color: "#FF6A00",
    orderStatus: "pending",
    requestStatus: "Pending",
    orderHref: "/1688-taobao-orders/new",
    productHref: "/product-request/new",
    shipmentHref: "/shipment-request/new",
  },
  {
    key: "rates",
    label: "Rates provided",
    tone: "violet",
    color: "#7c3aed",
    orderStatus: null,
    requestStatus: "Rates Provided",
    productHref: "/product-request/rates-given",
    shipmentHref: "/shipment-request/rates-given",
  },
  {
    key: "purchased",
    label: "Purchased",
    tone: "blue",
    color: "#2563eb",
    orderStatus: "Purchased",
    requestStatus: "Purchased",
    orderHref: "/1688-taobao-orders/purchased",
    productHref: "/product-request/purchased",
    shipmentHref: null,
  },
  {
    key: "china",
    label: "China warehouse",
    tone: "teal",
    color: "#0d9488",
    orderStatus: "Received in Warehouse",
    requestStatus: "Received in Warehouse",
    orderHref: "/1688-taobao-orders/received-in-warehouse",
    productHref: "/product-request/received-in-warehouse",
    shipmentHref: "/shipment-request/received-in-warehouse",
  },
  {
    key: "ready",
    label: "Ready to fly / sail",
    tone: "blue",
    color: "#0ea5e9",
    orderStatus: "Ready for fly",
    requestStatus: "Ready for fly",
    orderHref: "/1688-taobao-orders/ready-for-fly",
    productHref: "/product-request/ready-for-fly",
    shipmentHref: "/shipment-request/ready-for-fly",
  },
  {
    key: "customs",
    label: "Bangladesh customs",
    tone: "orange",
    color: "#f59e0b",
    orderStatus: "Bangladesh customs",
    requestStatus: "Bangladesh customs",
    orderHref: "/1688-taobao-orders/bangladesh-customs",
    productHref: "/product-request/bangladesh-customs",
    shipmentHref: "/shipment-request/bangladesh-customs",
  },
  {
    key: "released",
    label: "Customs released",
    tone: "green",
    color: "#22c55e",
    orderStatus: "Bangladesh warehouse",
    requestStatus: "Bangladesh warehouse",
    orderHref: "/1688-taobao-orders/custom-released",
    productHref: "/product-request/custom-released",
    shipmentHref: "/shipment-request/custom-released",
  },
  {
    key: "paicart",
    label: "Paicart warehouse",
    tone: "green",
    color: "#16a34a",
    orderStatus: "Paicart warehouse",
    requestStatus: "Paicart warehouse",
    orderHref: "/1688-taobao-orders/Paicart-warehouse",
    productHref: "/product-request/Paicart-warehouse",
    shipmentHref: "/shipment-request/Paicart-warehouse",
  },
];

/* ------------------------------------------------------------------ misc */

export const countBy = (records, predicate) =>
  (records || []).filter(predicate).length;

/* Whole days the oldest item in a queue has been sitting there. Drives the
   "oldest waiting N days" hint - a queue of 3 that has not moved in a week
   is a different problem from a queue of 3 opened this morning. */
export const oldestWaitingDays = (records) => {
  const times = (records || [])
    .map(getRecordTime)
    .filter((ms) => Number.isFinite(ms));
  if (times.length === 0) return null;
  const days = Math.floor((Date.now() - Math.min(...times)) / 86400000);
  return days > 0 ? days : 0;
};

export const money = (amount) =>
  `৳${Math.round(amount || 0).toLocaleString("en-US")}`;

export const compactMoney = (amount) => {
  const n = Math.round(amount || 0);
  if (Math.abs(n) >= 10000000) return `৳${(n / 10000000).toFixed(2)}Cr`;
  if (Math.abs(n) >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
  if (Math.abs(n) >= 1000) return `৳${(n / 1000).toFixed(1)}k`;
  return `৳${n.toLocaleString("en-US")}`;
};

export const rmb = (amount) =>
  `¥${Math.round(amount || 0).toLocaleString("en-US")}`;
