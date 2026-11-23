/* Cartons per tracking number, for Ship For Me bookings, 1688 orders and
 * product requests.
 *
 * A booking can have several tracking numbers (`trackingNumbers`), and each
 * tracking number several cartons. Cartons are stored on the record as
 * `cartons: [Carton]` so the customer website and app can show them without
 * calling ALG themselves.
 *
 * Carton = {
 *   id, trackingNo, cartonNo, cnWeight, bdWeight, cbm,      // what we show
 *   length, width, height, lotNo, shippingMark, productName,
 *   imageUrl, receivedDate, status, ratePerKg, total,       // ALG extras
 *   source: 'alg' | 'manual',
 * }
 *
 * ALG cartons come from https://alglimited.com/api/v1/orderTracking-alg/<no>,
 * which only accepts ONE tracking number — the old code sent the whole
 * comma-joined field, so any booking with two numbers got nothing back.
 * Tracking numbers ALG doesn't know get cartons entered by hand (source
 * 'manual'). The admin can also add manual cartons under any tracking number;
 * an ALG refresh keeps them unless ALG returns the same carton number.
 */
import Axios from "axios";

const ALG_URL = "https://alglimited.com/api/v1/orderTracking-alg/";

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

/* Every tracking number on a record: the array if present, else the
   comma/space-separated `trackingNo` string. */
export const trackingNumbersOf = (record) => {
  if (!record) return [];
  const list =
    Array.isArray(record.trackingNumbers) && record.trackingNumbers.length
      ? record.trackingNumbers
      : String(record.trackingNo || "").split(/[,\n]/);
  return Array.from(
    new Set(list.map((t) => String(t || "").trim()).filter(Boolean))
  );
};

/* One ALG parcel → our carton */
export const cartonFromAlgParcel = (p, trackingNo) => ({
  id: String(p.parcelId || `${p.lotNo || ""}-${p.cartonNo || ""}`),
  trackingNo: String(p.trackingNo || trackingNo || "").trim(),
  cartonNo: String(p.parcelId || p.cartonNo || ""),
  cnWeight: num(p.chinaWeight),
  bdWeight: num(p.grossWeight),
  cbm: num(p.totalCbm),
  length: num(p.cbm_length),
  width: num(p.cbm_width),
  height: num(p.cbm_height),
  lotNo: p.lotNo || "",
  shippingMark: p.shippingMark || "",
  productName: p.productName || p.customerDeclaredProductName || "",
  imageUrl: p.productImageUrl || p.customerDeclaredProductImageUrl || "",
  quantity: num(p.quantity),
  receivedDate: p.dateofWarehouseReceive || "",
  status: p.parcelStatus || "",
  ratePerKg: num(p.ratePerKg),
  total: num(p.finalTotal != null ? p.finalTotal : p.total),
  source: "alg",
});

/* Tracking numbers typed as a stand-in ("123456", "0", "000000", "test")
   match parcels of many different customers on ALG — looking them up would
   pull other people's cartons onto this record. */
const PLACEHOLDER_WORDS = ["test", "na", "n/a", "none", "null", "undefined", "nil", "tbd", "pending"];
export const isPlaceholderTracking = (value) => {
  const t = String(value == null ? "" : value).trim().toLowerCase();
  if (t.length < 5) return true;
  if (PLACEHOLDER_WORDS.includes(t)) return true;
  if (/^(.)\1+$/.test(t)) return true; /* 00000, 11111, xxxxx */
  /* runs of consecutive digits, up or down: 12345, 123456789, 987654 */
  if (/^\d+$/.test(t)) {
    const d = t.split("").map(Number);
    const up = d.every((v, i) => i === 0 || v === (d[i - 1] + 1) % 10);
    const down = d.every((v, i) => i === 0 || v === (d[i - 1] + 9) % 10);
    if (up || down) return true;
  }
  return false;
};

/* One customer's tracking number covers a handful of cartons under one or two
   shipping marks. An answer spanning many marks or lots is a shared /
   placeholder number, not this parcel. */
const MAX_MARKS = 3;
const MAX_LOTS = 5;
export const isAmbiguousAlgResult = (parcels) => {
  const marks = new Set((parcels || []).map((p) => String(p.shippingMark || "").trim().toLowerCase()).filter(Boolean));
  const lots = new Set((parcels || []).map((p) => String(p.lotNo || "").trim().toLowerCase()).filter(Boolean));
  return marks.size > MAX_MARKS || lots.size > MAX_LOTS;
};

/* Looks every tracking number up on ALG, one request each. Resolves to
   { [trackingNo]: { found, cartons, lot, error, rejected } } — never
   rejects, so one unknown or failing number doesn't hide the others.
   `rejected` ("placeholder" | "ambiguous") means the number was not used:
   its ALG answer would have been other customers' cartons. */
export const fetchAlgCartons = async (trackingNos) => {
  const entries = await Promise.all(
    trackingNos.map(async (t) => {
      if (isPlaceholderTracking(t)) {
        return [t, { found: false, cartons: [], rejected: "placeholder", error: `"${t}" looks like a placeholder tracking number` }];
      }
      try {
        const res = await Axios.get(ALG_URL + encodeURIComponent(t), { timeout: 20000 });
        const data = res && res.data;
        const parcels = (data && data.parcelsArray) || [];
        if (isAmbiguousAlgResult(parcels)) {
          const marks = new Set(parcels.map((p) => p.shippingMark).filter(Boolean)).size;
          return [
            t,
            {
              found: false,
              cartons: [],
              rejected: "ambiguous",
              matched: parcels.length,
              error: `"${t}" matches ${parcels.length} cartons of ${marks} different shipping marks on ALG — not this parcel`,
            },
          ];
        }
        return [
          t,
          {
            found: parcels.length > 0,
            cartons: parcels.map((p) => cartonFromAlgParcel(p, t)),
            lot: (data && data.lotObj) || null,
          },
        ];
      } catch (error) {
        return [t, { found: false, cartons: [], error: error.message || "lookup failed" }];
      }
    })
  );
  return Object.fromEntries(entries);
};

/* New carton list for a record: for every tracking number ALG found, its ALG
   cartons replace whatever was stored for that number; for the rest, keep
   the stored (manual) cartons. Cartons of tracking numbers that were removed
   from the record are dropped. */
export const mergeCartons = (storedCartons, algByTracking, trackingNos) => {
  const keep = new Set(trackingNos);
  const out = [];
  trackingNos.forEach((t) => {
    const alg = algByTracking && algByTracking[t];
    const stored = (storedCartons || []).filter((c) => c.trackingNo === t);
    if (alg && alg.found) {
      out.push(...alg.cartons);
      /* cartons the admin added by hand stay, unless ALG now has the same
         carton number */
      const algNos = new Set(alg.cartons.map((c) => String(c.cartonNo || "").trim().toLowerCase()));
      stored
        .filter((c) => c.source === "manual" && !algNos.has(String(c.cartonNo || "").trim().toLowerCase()))
        .forEach((c) => out.push(c));
    } else if (alg && alg.rejected) {
      /* a placeholder / shared number: drop anything ALG put here before
         (other customers' cartons) and keep only hand-added ones */
      out.push(...stored.filter((c) => c.source === "manual"));
    } else out.push(...stored);
  });
  /* manual cartons whose tracking number is blank are kept too */
  (storedCartons || [])
    .filter((c) => !c.trackingNo && !keep.has(c.trackingNo))
    .forEach((c) => out.push(c));
  return out;
};

export const newManualCarton = (trackingNo) => ({
  id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  trackingNo,
  cartonNo: "",
  cnWeight: null,
  bdWeight: null,
  cbm: null,
  ratePerKg: null,
  total: null,
  source: "manual",
});

/* What the cargo company charges for one carton: ALG's own total when it
   has one, else BD weight × rate for cartons entered by hand. */
export const cargoChargeOf = (c) => {
  const total = num(c && c.total);
  if (total !== null) return total;
  const w = num(c && c.bdWeight);
  const r = num(c && c.ratePerKg);
  return w !== null && r !== null ? Math.round(w * r) : null;
};

const sum = (list, key) =>
  list.reduce((a, c) => a + (Number.isFinite(c[key]) ? c[key] : num(c[key]) || 0), 0);
const round = (n, d) => Math.round(n * 10 ** d) / 10 ** d;

export const cartonTotals = (cartons) => {
  const list = cartons || [];
  return {
    count: list.length,
    cnWeight: round(sum(list, "cnWeight"), 2),
    bdWeight: round(sum(list, "bdWeight"), 2),
    cbm: round(sum(list, "cbm"), 4),
    cargoCharge: Math.round(list.reduce((a, c) => a + (cargoChargeOf(c) || 0), 0)),
  };
};

/* The booking-level cargo fields, derived per carton in the same list format
   the old ALG sync wrote ("700 tk/kg", "10990 Tk") — the cargo-collection
   report and the details page parse them that way. Empty object when no
   carton has a rate or charge, so stored values aren't wiped. */
export const cargoFieldsFromCartons = (cartons) => {
  const list = cartons || [];
  if (!list.some((c) => num(c.ratePerKg) !== null || cargoChargeOf(c) !== null)) return {};
  return {
    cargoRate: list.map((c) => (num(c.ratePerKg) !== null ? `${num(c.ratePerKg)} tk/kg` : "")),
    shippingChargeCargo: list.map((c) => (cargoChargeOf(c) !== null ? `${cargoChargeOf(c)} Tk` : "")),
  };
};

/* [{ trackingNo, cartons, totals, source }] in tracking-number order */
export const groupCartonsByTracking = (cartons, trackingNos) => {
  const order = trackingNos && trackingNos.length ? [...trackingNos] : [];
  (cartons || []).forEach((c) => {
    if (!order.includes(c.trackingNo)) order.push(c.trackingNo);
  });
  return order.map((t) => {
    const list = (cartons || []).filter((c) => c.trackingNo === t);
    return {
      trackingNo: t,
      cartons: list,
      totals: cartonTotals(list),
      source: list.length ? (list.every((c) => c.source === "alg") ? "alg" : "manual") : null,
    };
  });
};

/* Fields older screens still read (shippingMark list, ctnNo list, lotNo…),
   derived from the carton list so they stay in step. */
export const legacyFieldsFromCartons = (cartons) => {
  const list = cartons || [];
  const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
  return {
    ctnNo: uniq(list.map((c) => c.cartonNo)),
    lotNo: uniq(list.map((c) => c.lotNo)),
  };
};

/* ── Cleaning a record polluted by a placeholder / shared tracking no ──
   An older sync copied every parcel's shipping mark and cargo rate from a
   shared ALG answer onto the record itself — one booking ended up "owning"
   dozens of other customers' marks and rates. One customer's parcel carries
   one or two marks, so more than MAX_MARKS distinct marks means polluted. */
const listValues = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v == null ? "" : v).trim()).filter(Boolean);
  const text = String(value == null ? "" : value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return listValues(parsed);
    } catch (e) {
      /* not JSON */
    }
  }
  return text.split(",").map((v) => v.trim()).filter(Boolean);
};
const distinctCount = (value) => new Set(listValues(value).map((v) => v.toLowerCase())).size;

/* The customer's own mark — same rule as the customer app's getShippingMark */
export const customerShippingMark = (user) => {
  if (!user || !user.userId) return "";
  const name = String(user.displayName || "")
    .toLowerCase()
    .replace(/(^|\s)\S/g, (c) => c.toUpperCase())
    .trim();
  return name ? `${user.userId}-${name}` : `${user.userId}`;
};

/* Fields to rewrite on a polluted record, given its cleaned carton list.
   Empty object when nothing looks polluted. */
export const cleanupPollutedFields = (record, cartons, user) => {
  const patch = {};
  if (!record) return patch;
  if (distinctCount(record.shippingMark) > MAX_MARKS) {
    patch.shippingMark = customerShippingMark(user);
  }
  const rates = listValues(record.cargoRate);
  if (distinctCount(record.cargoRate) > MAX_MARKS || rates.length > Math.max((cartons || []).length, 1) * 2) {
    const fresh = cargoFieldsFromCartons(cartons);
    patch.cargoRate = fresh.cargoRate || [];
    patch.shippingChargeCargo = fresh.shippingChargeCargo || [];
  }
  return patch;
};
