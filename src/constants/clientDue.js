/* Client Due — what every customer owes, and their payment history.
 *
 * Ported from the customer app (paicart-nextjs15):
 *   src/lib/buckets.js        getOrderBucket / getRequestBucket / getShipBucket
 *   src/lib/dashboardData.js  bills, computeOutstanding, buildTransactions
 *
 * The admin page has to show each customer exactly the due their own
 * dashboard Overview shows, so these are a mirror of those files rather than
 * a second opinion. Keep the two in sync.
 *
 * Records:
 *   orders     — ordersApi          Buy & Ship for me (website order)
 *   requests   — bookingRequest     Requested product
 *   shipments  — shipForMe          Ship for me (only shipment)
 *   paymentRequests — paymentRequestApi + paymentRequest (uploaded slips)
 */
import { getTotalDue, getTotalPaid } from "./orderMath";

const toInt = (v) => parseInt(v, 10) || 0;
const lower = (v) => String(v || "").trim().toLowerCase();
const paidOf = (r) =>
  ((r && r.payments) || []).reduce(
    (a, p) => a + Math.max(toInt(p && p.amount), 0),
    0,
  );

/* ── Buckets (customer app tabs) ──────────────────────────────────────── */

export const isRefundGiven = (r) => !!r && r.refundStatus === "given";

export const getOrderBucket = (order) => {
  const pay = lower(order && order.paymentStatus);
  const st = lower(order && order.orderStatus);
  const score = parseInt(order && order.shipmentStatusScore) || 1;
  const delivered = score >= 7 || st === "delivered";

  if (isRefundGiven(order) && !delivered) return "Refunded";
  if (st === "reject") return "Rejected";
  if (delivered) return "Delivered";
  if (score >= 6 || !!order.receivedWeight || parseInt(order.shippingChargeCustomer) > 0)
    return "To Receive";
  if (order.trackingNo || score >= 3) return "In Shipment";
  if (pay === "paid" || pay === "partially paid") return "To Ship";
  return "To Pay";
};

export const getRequestBucket = (req) => {
  const pay = lower(req && req.paymentStatus);
  const st = lower(req && (req.orderStatus || req.status));
  const score = parseInt(req && req.shipmentStatusScore) || 1;
  const delivered = score >= 7 || st === "delivered";

  if (isRefundGiven(req) && !delivered) return "Refunded";
  if (st === "reject") return "Rejected";
  if (delivered) return "Delivered";
  if (score >= 6 || !!req.receivedWeight || parseInt(req.shippingChargeCustomer) > 0)
    return "To Receive";
  if (req.trackingNo || score >= 3) return "In Shipment";
  if (pay === "paid" || pay === "partially paid" || st === "purchased") return "To Ship";
  if (st === "rates provided") return "Approved";
  return "Pending";
};

export const getShipBucket = (req) => {
  const status = (req && req.status) || "";
  const score = parseInt(req && req.shipmentStatusScore) || 1;

  if (status === "Reject" || status === "Cancelled") return "Rejected";
  if (score >= 7 || status === "Delivered") return "Delivered";
  if (score === 6) return "To Receive";
  if (score >= 3) return "In Shipment";
  if (status === "Rates Provided") return "Approved";
  return "Pending";
};

/* ── Bills ────────────────────────────────────────────────────────────── */

export const requestBill = (b) => {
  const base = b.actualTotal
    ? toInt(b.actualTotal)
    : b.unitPrice
      ? toInt(b.unitPrice) * (toInt(b.productQuantity) || 1)
      : 0;
  const offerAmt =
    toInt(b.offer) > 0 && toInt(b.actualTotalAfterCoupon) > 0
      ? Math.round(toInt(b.actualTotalAfterCoupon) * (toInt(b.offer) / 100))
      : 0;
  return (
    base +
    toInt(b.shippingChargeCustomer) +
    toInt(b.localShipping) +
    toInt(b.otherCost) -
    toInt(b.discount) -
    toInt(b.couponAmount) -
    offerAmt
  );
};
export const requestDue = (b) => requestBill(b) - paidOf(b);

export const orderBill = (o) => getTotalDue(o) + getTotalPaid(o);
export const orderDue = (o) => getTotalDue(o);

/* A Ship For Me invoice exists only once the parcel is weighed and the
   actual charge is set — the booking-time estimate is not a bill yet. */
export const shipmentBill = (s) => toInt(s.shippingChargeCustomer);
export const shipmentDue = (s) => shipmentBill(s) - paidOf(s);

/* ── Which records count as due ───────────────────────────────────────── */

/* Only To Ship → In Shipment → To Receive → Delivered. To Pay orders,
   Pending / Approved (quoted, unpaid) requests, Rejected and Refunded
   records are left out. Ship For Me has no To Ship stage, so it starts at In Shipment,
   and only once the parcel is weighed and billed. Pending (unapproved)
   payment slips never reduce the due — only payments on the record do. */
export const DUE_BUCKETS = ["To Ship", "In Shipment", "To Receive", "Delivered"];
export const isOrderDueCounted = (o) => DUE_BUCKETS.includes(getOrderBucket(o));
export const isRequestDueCounted = (b) => DUE_BUCKETS.includes(getRequestBucket(b));
export const isShipmentDueCounted = (s) =>
  DUE_BUCKETS.includes(getShipBucket(s)) && !isRefundGiven(s) && shipmentBill(s) > 0;

export const KIND_LABEL = {
  order: "Website Order",
  request: "Requested Product",
  ship: "Ship for me",
};

/* ── Dates ────────────────────────────────────────────────────────────── */

/* Records store `date` as "dd/mm/yyyy" (en-GB) and often `time` (ms). */
export const parseRecordDate = (dateStr, time) => {
  const t = Number(time);
  if (Number.isFinite(t) && t > 0) return t;
  const [d, m, y] = String(dateStr || "").split("/").map(Number);
  if (d && m && y) return new Date(y, m - 1, d, 12).getTime();
  const parsed = Date.parse(dateStr);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const formatDateTime = (ms) => {
  if (!ms) return "—";
  return new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ── All clients' due ─────────────────────────────────────────────────── */

const emptyClient = (userId) => ({
  userId,
  websiteOrderDue: 0,
  shipmentDue: 0,
  requestedProductDue: 0,
  total: 0,
  invoices: [],
});

/* One entry per customer who owes anything, biggest due first. Each carries
   the invoices making up the figure so the detail view can list them. */
export const buildClientDues = ({ orders = [], requests = [], shipments = [] }) => {
  const byUser = {};
  const add = (kind, field, rec, id, bucket, bill, due) => {
    if (due <= 0) return;
    const userId = rec.userId || rec.uid;
    if (!userId) return;
    const client = byUser[userId] || (byUser[userId] = emptyClient(userId));
    client[field] += due;
    client.total += due;
    client.invoices.push({
      key: `${kind}-${id}`,
      kind,
      id: String(id || ""),
      bucket,
      bill,
      paid: paidOf(rec),
      due,
      time: parseRecordDate(rec.date, rec.time),
    });
  };

  orders.filter(isOrderDueCounted).forEach((o) =>
    add("order", "websiteOrderDue", o, o.orderId, getOrderBucket(o), orderBill(o), Math.max(orderDue(o), 0)),
  );
  requests.filter(isRequestDueCounted).forEach((b) =>
    add("request", "requestedProductDue", b, b.bookingId, getRequestBucket(b), requestBill(b), Math.max(requestDue(b), 0)),
  );
  shipments.filter(isShipmentDueCounted).forEach((s) =>
    add("ship", "shipmentDue", s, s.bookingId, getShipBucket(s), shipmentBill(s), Math.max(shipmentDue(s), 0)),
  );

  return Object.values(byUser)
    .map((c) => ({ ...c, invoices: c.invoices.sort((a, b) => b.due - a.due) }))
    .sort((a, b) => b.total - a.total);
};

/* ── Transaction history ──────────────────────────────────────────────── */

const BANK_WORDS = ["bank", "city", "brac", "brack", "dbbl", "dutch", "islami", "ebl", "ucb", "prime", "eastern"];

/* direct = bKash gateway · bank = bank transfer · manual = bKash/Nagad/Rocket
   slip · cash = recorded by Paicart in person */
export const classifyMethod = (method) => {
  const m = lower(method);
  if (m.includes("cash")) return "cash";
  if (BANK_WORDS.some((w) => m.includes(w))) return "bank";
  return "manual";
};

export const TXN_TYPE_LABELS = {
  direct: "bKash Direct",
  bank: "Bank Transfer",
  manual: "Manual bKash",
  cash: "Cash received by Paicart",
};

const labelFor = (type, method) => {
  if (type === "direct") return "bKash Direct";
  if (type === "cash") return "Cash received by Paicart";
  if (type === "bank")
    return method && lower(method) !== "bank" ? `Bank Transfer · ${method}` : "Bank Transfer";
  return method ? `Manual ${method}` : "Manual payment";
};

const slipStatus = (s) => {
  const v = lower(s);
  if (v === "approved" || v === "paid") return "approved";
  if (v.startsWith("reject")) return "rejected";
  return "pending";
};

/* Builds one list from two sources:
 *  1. Payment slips the customer uploaded (pending / approved / rejected).
 *  2. Payments recorded straight on an order / request / shipment that no
 *     slip accounts for: bKash gateway payments (grouped by TrxID) and
 *     payments Paicart recorded in person (cash, or an offline transfer).
 * Approving a slip also writes a payment line onto the record, so those
 * lines are matched back to their slip and not listed twice. */
export const buildTransactions = ({ paymentRequests = [], orders = [], requests = [], shipments = [] }) => {
  const txns = [];
  const fromSlipKeys = new Set();

  paymentRequests.forEach((r) => {
    const kind = r._collection === "paymentRequest" ? "ship" : r.productRequest ? "request" : "order";
    const items = (r.pendingOrders && r.pendingOrders.length ? r.pendingOrders : r.productRequestArray) || [];
    const ids = items.map((i) => i && (i.orderId || i.bookingId)).filter(Boolean).map(String);
    const status = slipStatus(r.status);
    const type = classifyMethod(r.method);
    if (status === "approved")
      ids.forEach((id) => fromSlipKeys.add(`${kind}|${id}|${r.date}|${lower(r.method)}`));
    txns.push({
      key: `slip-${r._collection}-${r._id}`,
      id: `PAY-${r.paymentId || r._id}`,
      reference: String(r.paymentId || r._id),
      type,
      methodLabel: labelFor(type, r.method),
      amount: toInt(r.payableTotal || r.amount),
      status,
      time: parseRecordDate(r.date, r.time),
      kind,
      ids,
      invoice: `${KIND_LABEL[kind]} · ${ids.join(", ") || "—"}`,
      slipUrl: r.imageUrl || "",
      trxId: r.trxID || "",
      note:
        status === "rejected"
          ? "Payment slip was rejected — it does not reduce the due."
          : status === "pending"
            ? "Waiting for verification."
            : "Payment slip verified by Paicart.",
    });
  });

  const gateway = new Map();
  const scan = (records, kind, idOf, billOf) => {
    records.forEach((rec) => {
      const id = String(idOf(rec) || "");
      const payments = (rec.payments || [])
        .map((p, index) => ({ ...p, _index: index, _time: parseRecordDate(p && p.date) }))
        .filter((p) => toInt(p.amount) > 0)
        .sort((a, b) => a._time - b._time || a._index - b._index);
      const bill = billOf(rec);
      let runningPaid = 0;
      payments.forEach((p) => {
        const amount = toInt(p.amount);
        const dueBefore = Math.max(bill - runningPaid, 0);
        runningPaid += amount;

        const isGateway =
          p.receivedBy === "Bkash-Gateway" ||
          lower(p.approvedBy) === "bkash-gateway" ||
          (p.trxID && lower(p.method) === "bkash");
        if (isGateway) {
          const k = p.trxID || `${kind}-${id}-${p.date}`;
          const g = gateway.get(k) || {
            key: `gw-${k}`,
            id: `BKD-${p.trxID || id}`,
            reference: p.trxID || "—",
            type: "direct",
            methodLabel: "bKash Direct",
            amount: 0,
            status: "approved",
            time: p._time,
            kind,
            ids: [],
            note: "Gateway payment confirmed automatically.",
          };
          g.amount += amount;
          g.ids.push(id);
          gateway.set(k, g);
          return;
        }
        const fromSlip =
          kind === "ship"
            ? lower(p.approvedBy) === "admin" && lower(p.paidBy) !== "admin"
            : fromSlipKeys.has(`${kind}|${id}|${p.date}|${lower(p.method)}`);
        if (fromSlip) return;

        const type = classifyMethod(p.method);
        txns.push({
          key: `rec-${kind}-${id}-${p._index}`,
          id: `${type === "cash" ? "CSH" : "REC"}-${id}-${p._index + 1}`,
          reference: `${id}-${p._index + 1}`,
          type,
          methodLabel:
            type === "cash" ? "Cash received by Paicart" : `${labelFor(type, p.method)} · recorded by Paicart`,
          amount,
          status: "approved",
          time: p._time,
          kind,
          ids: [id],
          invoice: `${KIND_LABEL[kind]} · ${id}`,
          recorded: true,
          receivedBy: p.receivedBy || p.approvedBy || "Paicart",
          dueBefore,
          dueAfter: Math.max(dueBefore - amount, 0),
          note: "Recorded by Paicart and adjusted against the invoice balance.",
        });
      });
    });
  };
  scan(orders, "order", (o) => o.orderId, orderBill);
  scan(requests, "request", (b) => b.bookingId, requestBill);
  scan(shipments, "ship", (s) => s.bookingId, shipmentBill);

  gateway.forEach((g) => {
    const ids = Array.from(new Set(g.ids));
    txns.push({ ...g, ids, invoice: `${KIND_LABEL[g.kind]} · ${ids.join(", ")}` });
  });

  return txns.sort((a, b) => (b.time || 0) - (a.time || 0));
};

/* ── All clients' bills (Accounts → Client Bills) ─────────────────────── */

/* A record has been billed once it reaches To Ship (paid / approved) — or a
   weighed Ship For Me parcel — and stays billed through delivery. Quick-
   refunded records are kept too, so the refund shows against the client.
   To Pay, Pending, Approved-but-unpaid and Rejected records are not bills. */
const BILLED_BUCKETS = [...DUE_BUCKETS, "Refunded"];
const refundGiven = (r) => Math.max(toInt(r && r.refund), 0);
const refundRequested = (r) => !!r && r.refundStatus === "requested";

const emptyKind = () => ({ count: 0, billed: 0, paid: 0, refund: 0, due: 0 });
const emptyBillClient = (userId) => ({
  userId,
  billed: 0,
  paid: 0,
  refund: 0,
  netReceived: 0,
  due: 0,
  refundPending: 0,
  byKind: { order: emptyKind(), request: emptyKind(), ship: emptyKind() },
  invoices: [],
  lastTime: 0,
});

/* One entry per billed customer, biggest bill first. `due` uses exactly the
   Client Due rules (a quick-refunded record owes nothing). */
export const buildClientBills = ({ orders = [], requests = [], shipments = [] }) => {
  const byUser = {};
  const add = (kind, rec, id, bucket, bill, dueCounted, dueOf) => {
    const userId = rec.userId || rec.uid;
    if (!userId || bill <= 0) return;
    const c = byUser[userId] || (byUser[userId] = emptyBillClient(userId));
    const paid = paidOf(rec);
    const refund = refundGiven(rec);
    const due = dueCounted ? Math.max(dueOf(rec), 0) : 0;
    const time = parseRecordDate(rec.date, rec.time);
    const k = c.byKind[kind];
    k.count += 1;
    k.billed += bill;
    k.paid += paid;
    k.refund += refund;
    k.due += due;
    c.billed += bill;
    c.paid += paid;
    c.refund += refund;
    c.due += due;
    if (refundRequested(rec)) c.refundPending += 1;
    if (time > c.lastTime) c.lastTime = time;
    c.invoices.push({
      key: `${kind}-${id}`,
      kind,
      id: String(id || ""),
      bucket,
      bill,
      paid,
      refund,
      refundStatus: rec.refundStatus || "",
      refundNote: rec.refundNote || "",
      due,
      time,
    });
  };

  orders.forEach((o) => {
    const bucket = getOrderBucket(o);
    if (BILLED_BUCKETS.includes(bucket))
      add("order", o, o.orderId, bucket, orderBill(o), isOrderDueCounted(o), orderDue);
  });
  requests.forEach((b) => {
    const bucket = getRequestBucket(b);
    if (BILLED_BUCKETS.includes(bucket))
      add("request", b, b.bookingId, bucket, requestBill(b), isRequestDueCounted(b), requestDue);
  });
  shipments.forEach((s) => {
    /* Ship For Me has no Refunded bucket — a refunded parcel keeps its stage */
    const bucket = isRefundGiven(s) ? "Refunded" : getShipBucket(s);
    if (BILLED_BUCKETS.includes(bucket))
      add("ship", s, s.bookingId, bucket, shipmentBill(s), isShipmentDueCounted(s), shipmentDue);
  });

  return Object.values(byUser)
    .map((c) => ({
      ...c,
      netReceived: c.paid - c.refund,
      invoices: c.invoices.sort((a, b) => b.time - a.time),
    }))
    .sort((a, b) => b.billed - a.billed);
};
