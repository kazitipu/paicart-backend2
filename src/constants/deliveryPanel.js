/* Delivery section — rules and formulas.
 *
 * Ported from the "Warehouse Parcel & Delivery Management" design
 * (Paicart_warehouse_Delivery.php). The page shows:
 *   - Paicart Warehouse Parcels: every website order / product request /
 *     Ship For Me whose delivery request Paicart approved ("arranged") or
 *     staff entered themselves; each row's action follows its method.
 *   - Pathao Deliveries: the Pathao bookings made from here (collection
 *     `pathaoDeliveries`, one doc per Pathao consignment).
 *   - Waiting Pathao Payment Approval: delivered Pathao parcels whose cash
 *     Pathao has collected, until staff approve what Pathao paid.
 */
import { getOrderBucket, getRequestBucket, getShipBucket } from "./clientDue";
import { deliveryDue, recordIdOf } from "./deliveryRequest";
import { trackingNumbersOf } from "./cartons";

/* ── Labels ───────────────────────────────────────────────────────────── */

export const KIND_TYPE = { order: "Website Order", request: "Product Request", ship: "Ship For Me" };
export const ORDER_TYPES = ["Ship For Me", "Website Order", "Product Request"];

export const DELIVERY_TYPE_OF_METHOD = {
  pathao: "Home Delivery - Pathao",
  office_pickup: "Office Pickup",
  van_truck: "Van / Truck Delivery",
  sundorbon: "Sundorbon Express",
};

/* warehouse status of a parcel (stored as deliveryRequest.warehouseStatus) */
export const WAREHOUSE = {
  IN: "Paicart Warehouse",
  DELIVERED: "Delivered",
  PATHAO: "Pathao Booked",
};

/* Pathao parcel statuses, in journey order (exact labels of the design) */
export const PATHAO_STATUSES = [
  "Pathao pickup requested",
  "Rider Assigned",
  "Picked parcel From Paicart",
  "In Transit",
  "Ready For Delivery",
  "Delivered",
  "Returned",
  "Cancelled",
];
export const CLOSED_STATUSES = ["Delivered", "Returned", "Cancelled"];

/* Pathao's own order_status strings → the labels above */
export const pathaoStatusLabel = (raw) => {
  const s = String(raw || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!s || s === "pending" || s.includes("pickup_request")) return "Pathao pickup requested";
  if (s.includes("cancel")) return "Cancelled";
  if (s.includes("return")) return "Returned";
  if (s.includes("deliver") && !s.includes("assigned") && !s.includes("for_delivery")) return "Delivered";
  if (s.includes("for_delivery") || s.includes("last_mile") || s.includes("out_for")) return "Ready For Delivery";
  if (s.includes("transit") || s.includes("hub") || s.includes("sorting")) return "In Transit";
  if (s.includes("picked")) return "Picked parcel From Paicart";
  if (s.includes("assign")) return "Rider Assigned";
  return "Pathao pickup requested";
};

export const isPickupOrRiderAssigned = (status) =>
  ["pathao pickup requested", "rider assigned"].includes(String(status || "").trim().toLowerCase());

/* Payment shows Paid once Pathao has delivered (the design's rule) */
export const paymentStatusOf = (parcelStatus) => (parcelStatus === "Delivered" ? "Paid" : "Unpaid");

/* ── Money / date formatting ─────────────────────────────────────────── */

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
export const money = (n) => `${Math.round(num(n)).toLocaleString("en-IN")} ৳`;
export const approvalMoney = (n) => `৳${Math.round(num(n)).toLocaleString("en-IN")}`;
export const isoDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const displayDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? String(iso)
    : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/* ── Pathao charges (Pathao merchant plan) ───────────────────────────── */

/* Delivery charge by weight; COD is 1% of what Pathao collects (due +
   delivery), only when there is something to collect. Used until Pathao's
   own price plan answers, and always editable. */
export const calculatePathaoRates = (weight, due) => {
  const w = num(weight);
  let delivery;
  if (w <= 0.2) delivery = 60;
  else if (w <= 0.5) delivery = 70;
  else if (w <= 1) delivery = 80;
  else if (w <= 1.5) delivery = 90;
  else if (w <= 2) delivery = 100;
  else delivery = 100 + Math.ceil(w - 2) * 15;
  const cod = num(due) > 0 ? Math.round((num(due) + delivery) * 0.01) : 0;
  return { delivery, cod };
};

/* Over 15 kg in total — or any single carton over 15 kg — goes Hub Delivery */
export const HEAVY_KG = 15;

/* ── Warehouse rows ──────────────────────────────────────────────────── */

const BUCKET_OF = { order: getOrderBucket, request: getRequestBucket, ship: getShipBucket };

/* A record belongs in the Delivery section once its delivery request was
   approved (arranged / delivered) or entered by staff (source admin). */
export const isInDeliverySection = (record) => {
  const dr = record && record.deliveryRequest;
  if (!dr || !dr.method || dr.status === "cancelled") return false;
  return dr.status === "arranged" || dr.status === "delivered" || dr.source === "admin";
};

/* The parcel's cartons as { name, weight, trackingNo } — from the stored
   carton list, else one per tracking number, else the parcel as one carton */
export const cartonsOf = (record, customerNumber) => {
  const stored = (record && record.cartons) || [];
  if (stored.length) {
    return stored.map((c, i) => ({
      name: c.cartonNo || `CB_${customerNumber || ""}-${String(i + 1).padStart(2, "0")}`,
      weight: num(c.bdWeight) || num(c.cnWeight),
      trackingNo: c.trackingNo || "",
    }));
  }
  const nos = trackingNumbersOf(record);
  const total = num(record && record.receivedWeight);
  if (nos.length > 1) {
    return nos.map((t, i) => ({
      name: `CB_${customerNumber || ""}-${String(i + 1).padStart(2, "0")}`,
      weight: Math.round((total / nos.length) * 10) / 10,
      trackingNo: t,
    }));
  }
  return [{ name: `CB_${customerNumber || ""}-01`, weight: total, trackingNo: nos[0] || "" }];
};

const productOf = (kind, r) =>
  kind === "order"
    ? (r.items || []).map((i) => i && i.name).filter(Boolean).join(", ") || r.shopName || "Website order"
    : kind === "request"
      ? r.productType || r.productName || "Requested product"
      : r.othersProductName || r.productType || "Shipment";

const markOf = (r, user) => {
  const marks = Array.isArray(r.shippingMark) ? r.shippingMark : String(r.shippingMark || "").split(",");
  const first = marks.map((m) => String(m || "").trim()).filter(Boolean)[0];
  if (first) return first;
  return user && user.userId ? `${user.userId}/${String(user.displayName || "").split(" ")[0] || ""}` : "";
};

/* Delivery address: the one sent with the request, the order's own, else
   the customer's default shipping address */
const addressOf = (r, user) => {
  const dr = r.deliveryRequest || {};
  const book = (user && user.addressBook) || [];
  return dr.address || r.deliveryAddress || book.find((a) => a && a.defaultShipping) || book[0] || null;
};
export const addressLine = (a) =>
  a ? [a.address, a.thana, a.district].filter(Boolean).join(", ") : "";

export const buildWarehouseRow = (kind, record, user) => {
  const id = recordIdOf(kind, record);
  const dr = record.deliveryRequest || {};
  const customerNumber = (user && user.userId) || "";
  const cartons = cartonsOf(record, customerNumber);
  const totalWeight = cartons.reduce((a, c) => a + num(c.weight), 0) || num(record.receivedWeight);
  const address = addressOf(record, user);
  const status = dr.warehouseStatus || WAREHOUSE.IN;
  return {
    key: `${kind}-${id}`,
    kind,
    id,
    record,
    uid: record.userId,
    userId: customerNumber ? `U-${customerNumber}` : "",
    customer: (address && address.name) || (user && user.displayName) || record.displayName || "Customer",
    mobile: (address && address.mobileNo) || (user && user.mobileNo) || "",
    address,
    type: KIND_TYPE[kind],
    shippingMark: markOf(record, user),
    product: productOf(kind, record),
    cartons,
    parcelType: cartons.length > 1 ? "Master CTN" : "Single CTN",
    totalWeight,
    due: Math.max(deliveryDue(kind, record), 0),
    deliveryType: DELIVERY_TYPE_OF_METHOD[dr.method] || dr.label || "—",
    method: dr.method,
    deliveryStatus: status,
    view: status === WAREHOUSE.IN ? "active" : "history",
    stage: BUCKET_OF[kind](record),
    request: dr,
  };
};

/* ── Waiting Pathao Payment Approval ─────────────────────────────────── */

/* The design's row formula:
     adjustment = min(due, max(stored adjustment, paid < due ? due − paid : 0))
     paid       = adjustment > 0 ? due − adjustment : stored paid
     extra      = max(0, paid − due)
     collection = paid + new delivery + new COD */
export const approvalAmounts = (delivery) => {
  const a = (delivery && delivery.approval) || {};
  const due = Math.max(num(delivery && delivery.due), 0);
  const storedPaid = Math.max(num(a.paid !== undefined ? a.paid : due), 0);
  const storedAdj = Math.max(num(a.adjustment), 0);
  const oldDelivery = Math.max(num(delivery && delivery.deliveryCharge), 0);
  const oldCod = Math.max(num(delivery && delivery.codCharge), 0);
  const newDelivery = Math.max(num(a.newDelivery !== undefined ? a.newDelivery : oldDelivery), 0);
  const newCod = Math.max(num(a.newCod !== undefined ? a.newCod : oldCod), 0);
  const adjustment = Math.min(due, Math.max(storedAdj, storedPaid < due ? due - storedPaid : 0));
  const paid = adjustment > 0 ? Math.max(0, due - adjustment) : storedPaid;
  const extra = Math.max(0, paid - due);
  return { due, paid, adjustment, extra, oldDelivery, newDelivery, oldCod, newCod, collection: paid + newDelivery + newCod };
};

/* Pathao has delivered (so collected the cash) → needs approval */
export const needsApproval = (delivery) => delivery && delivery.parcelStatus === "Delivered";
export const approvalStatusOf = (delivery) =>
  (delivery && delivery.approval && delivery.approval.status) === "approved" ? "approved" : "pending";

/* ── KPI tiles ───────────────────────────────────────────────────────── */

export const kpis = (deliveries) => {
  const list = deliveries || [];
  const today = isoDate();
  const month = today.slice(0, 7);
  const cartonsOfDelivery = (d) => Math.max((d.cartons || []).length, 1);
  const returned = list.filter((d) => d.parcelStatus === "Returned");
  const approvals = list.filter(needsApproval);
  const waiting = approvals.filter((d) => approvalStatusOf(d) === "pending" && num(d.due) > 0);
  const billReceived = approvals
    .filter((d) => approvalStatusOf(d) === "approved" && String(d.approval.approvedDate || "").slice(0, 7) === month)
    .reduce((a, d) => a + num(d.approval.paid), 0);
  return {
    parcels: list.length,
    cartons: list.reduce((a, d) => a + cartonsOfDelivery(d), 0),
    today: list.filter((d) => d.date === today).length,
    returned: returned.length,
    returnedCartons: returned.reduce((a, d) => a + cartonsOfDelivery(d), 0),
    billReceived,
    waitingDue: waiting.reduce((a, d) => a + num(d.due), 0),
    waitingCount: waiting.length,
    /* COD still to come: unpaid, not returned or cancelled */
    codTotal: list
      .filter((d) => paymentStatusOf(d.parcelStatus) === "Unpaid" && d.parcelStatus !== "Returned" && d.parcelStatus !== "Cancelled")
      .reduce((a, d) => a + num(d.total), 0),
  };
};

/* time filter: rows from the last N days (inclusive), never future */
export const TIME_FILTERS = [
  { key: "all", label: "Time: All", days: null },
  { key: "2m", label: "Last 2 Months", days: 62 },
  { key: "6m", label: "Last 6 Months", days: 185 },
  { key: "1y", label: "Last 1 Year", days: 366 },
];
export const withinDays = (iso, days) => {
  if (!days) return true;
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const diff = (new Date(`${isoDate()}T00:00:00`) - d) / 86400000;
  return diff >= 0 && diff <= days;
};
