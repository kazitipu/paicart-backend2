/* 1688 data cached on the record itself, so the details page doesn't call
 * 1688 on every visit.
 *
 * Stored fields (website orders: ordersApi, product requests: bookingRequest):
 *   status1688, status1688CheckedAt (ms), seller1688   — order detail API
 *   trace1688: [{ bill, company, steps: [{ at, remark }] }],
 *   trace1688CheckedAt (ms)                             — logistics trace API
 *
 * A stored copy is used as-is while it's fresh (STALE_MS) or final (the
 * order is done / cancelled on 1688, or the parcel already reached the China
 * warehouse). Otherwise one call refreshes it and writes it back. The
 * Refresh buttons force a call. */
import { get1688OrderDetails, get1688TrackingStatus } from "../../../actions/get1688Data";
import { build1688OrderUpdate } from "../../../constants/orderStatus1688";
import { updateParcelRecordFields } from "../../../firebase/firebase.utils";

export const STALE_MS = 6 * 60 * 60 * 1000;
const FINAL_STATUSES = ["success", "cancel", "cancelled", "terminated", "signinsuccess", "confirm_goods"];
const PAST_CHINA = ["Received in Warehouse", "Ready for fly", "Bangladesh customs", "Bangladesh warehouse", "Paicart warehouse", "Delivered", "Reject"];

export const has1688OrderNo = (r) => /^\d{10,}$/.test(String((r && r.orderNumber) || "").trim());
const recordId = (kind, r) => (kind === "order" ? r.orderId : r.bookingId);
const fresh = (at) => Number(at) > 0 && Date.now() - Number(at) < STALE_MS;

export const statusNeedsRefresh = (r) =>
  has1688OrderNo(r) && !FINAL_STATUSES.includes(r.status1688) && !fresh(r.status1688CheckedAt) && !PAST_CHINA.includes(r.orderStatus);

export const traceNeedsRefresh = (r) =>
  has1688OrderNo(r) && !fresh(r.trace1688CheckedAt) && !PAST_CHINA.includes(r.orderStatus) && r.status1688 !== "cancel";

/* → the stored fields after the refresh */
export const refresh1688Status = async (kind, r) => {
  const details = await get1688OrderDetails(String(r.orderNumber).trim());
  if (!details) throw new Error("1688 returned no details");
  let patch;
  if (kind === "order") {
    /* same diff the order list's 1688 popup writes (status, actual totals) */
    const { orderId, ...rest } = build1688OrderUpdate(r, details) || {};
    patch = rest;
  } else {
    const base = details.baseInfo || {};
    const seller = base.sellerContact || {};
    patch = { status1688: String(base.status || "").trim().toLowerCase(), status1688CheckedAt: Date.now() };
    if (seller.companyName || seller.shopName) patch.seller1688 = seller.companyName || seller.shopName;
  }
  if (!patch.status1688CheckedAt) patch.status1688CheckedAt = Date.now();
  await updateParcelRecordFields(kind, recordId(kind, r), patch);
  return patch;
};

export const refresh1688Trace = async (kind, r) => {
  const raw = (await get1688TrackingStatus(String(r.orderNumber).trim())) || [];
  const trace1688 = raw.map((t) => ({
    bill: t.logisticsBillNo || "",
    company: t.logisticsCompanyName || t.logisticsCompanyId || "",
    steps: (t.logisticsSteps || []).map((s) => ({ at: s.acceptTime || "", remark: s.remark || "" })),
  }));
  const patch = { trace1688, trace1688CheckedAt: Date.now() };
  await updateParcelRecordFields(kind, recordId(kind, r), patch);
  return patch;
};
