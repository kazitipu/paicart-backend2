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

/* Looks every tracking number up on ALG, one request each. Resolves to
   { [trackingNo]: { found, cartons, lot, error } } — never rejects, so one
   unknown or failing number doesn't hide the others. */
export const fetchAlgCartons = async (trackingNos) => {
  const entries = await Promise.all(
    trackingNos.map(async (t) => {
      try {
        const res = await Axios.get(ALG_URL + encodeURIComponent(t), { timeout: 20000 });
        const data = res && res.data;
        const parcels = (data && data.parcelsArray) || [];
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
