/* Moves website orders, product requests and Ship For Me bookings forward
 * from ALG's lot tracking when an admin list loads (rule: algStatusPatch in
 * constants/algOrderStatus.js). Each record is looked up at most once per
 * 30 minutes per browser tab; only the status fields are written. A
 * scheduled Cloud Function does the same when nobody has the admin open. */
import Axios from "axios";
import { toast } from "react-toastify";
import { algStatusPatch, orderTrackingNumbers, ALG_KINDS, isAlgEligible } from "../../constants/algOrderStatus";

const THROTTLE_MS = 30 * 60 * 1000;
const LABEL = { "Bangladesh warehouse": "Custom released" };
const running = {};

const lookupAlg = (t) =>
  Axios.get(`https://alglimited.com/api/v1/orderTracking-alg/${encodeURIComponent(t)}`, { timeout: 20000 })
    .then((r) => [t, (r && r.data) || null])
    .catch(() => [t, null]);

/* records: the list on screen; kind: 'order' | 'request' | 'ship';
   save(id, patch): writes the partial update (via the list's Redux action) */
export const syncStatusesFromAlg = async (records, kind, save) => {
  const cfg = ALG_KINDS[kind];
  if (!cfg || running[kind]) return;
  const idOf = (r) => String(kind === "order" ? r.orderId : r.bookingId);
  const key = `algStatusSync:${kind}`;
  let seen = {};
  try {
    seen = JSON.parse(sessionStorage.getItem(key) || "{}");
  } catch (e) {
    seen = {};
  }
  const now = Date.now();
  const due = (records || []).filter((r) => {
    if (!r) return false;
    const status = r[cfg.field] || (kind === "ship" ? "Pending" : "");
    return (
      cfg.from.includes(status) &&
      isAlgEligible(r, kind) &&
      orderTrackingNumbers(r).length > 0 &&
      !(seen[idOf(r)] && now - seen[idOf(r)] < THROTTLE_MS)
    );
  });
  if (!due.length) return;

  running[kind] = true;
  const moved = [];
  try {
    for (const record of due) {
      const answers = await Promise.all(orderTrackingNumbers(record).map(lookupAlg));
      seen[idOf(record)] = Date.now();
      const patch = algStatusPatch(record, Object.fromEntries(answers), kind);
      if (patch) {
        await save(idOf(record), patch);
        const to = patch[cfg.field];
        moved.push(`${idOf(record)} → ${LABEL[to] || to}`);
      }
    }
  } finally {
    sessionStorage.setItem(key, JSON.stringify(seen));
    running[kind] = false;
  }
  if (moved.length) {
    const what = kind === "order" ? "order" : kind === "request" ? "product request" : "booking";
    toast.success(
      `${moved.length} ${what}${moved.length === 1 ? "" : "s"} moved forward from ALG tracking: ${moved
        .slice(0, 3)
        .join(", ")}${moved.length > 3 ? "…" : ""}`
    );
  }
};
