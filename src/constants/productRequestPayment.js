/* Rules for Product Request purchase batches.
 *
 * The list page's checkbox eligibility and the update modal's status gate both
 * read from here, so the two can never drift apart. */

/* `purchasingRmb` is a hand-typed free-text field: it arrives as "245", "¥245",
 * "245 rmb", "" or occasionally junk. Everything downstream needs a number. */
export const parseRmb = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }
  const cleaned = String(value || "").replace(/[^0-9.]/g, "");
  const parsed = parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const isInBatch = (request) =>
  Boolean(request && request.productRequestPaymentId);

/* A request can be put in a batch once someone has entered what it costs, and
 * only if it is not already in one. */
export const isBatchable = (request) =>
  Boolean(request) && parseRmb(request.purchasingRmb) > 0 && !isInBatch(request);

export const sumRmb = (requests) =>
  (requests || []).reduce(
    (total, request) => total + parseRmb(request && request.purchasingRmb),
    0,
  );

/* Only the pre-purchase tabs offer selection - the batch IS the purchase. */
export const PAYMENT_SELECTION_TABS = ["new", "rates-given"];

/* Statuses an admin can set before the goods have been paid for. Everything
 * else in the ladder (Purchased -> ... -> Delivered) needs a batch first.
 *
 * Matched on the status STRING, not shipmentStatusScore: the score is ambiguous
 * by construction - "Rates Provided" and "Purchased" are both 2, and
 * "Bangladesh customs" and "Bangladesh warehouse" are both 5. */
export const STATUSES_ALLOWED_WITHOUT_BATCH = [
  "",
  "Pending",
  "pending",
  "Rates Provided",
  "Reject",
];

export const requiresBatch = (status) =>
  !STATUSES_ALLOWED_WITHOUT_BATCH.includes(status);

/* ── Purchased needs the purchase details, not a batch ──
 * A request can move to Purchased (and anything after it) once the admin has
 * entered what it cost in the update modal: Purchasing RMB and the exchange
 * rate. A payment batch is optional bookkeeping and no longer gates status.
 * `values` is whatever is about to be saved (the modal's fields, or the
 * stored request for a bulk change) → labels of the missing fields. */
export const PURCHASE_REQUIRED_FIELDS = [
  { key: "purchasingRmb", label: "Purchasing RMB" },
  { key: "exchangeRate", label: "Exchange rate" },
];
export const missingPurchaseInfo = (values) =>
  PURCHASE_REQUIRED_FIELDS.filter((f) => parseRmb(values && values[f.key]) <= 0).map((f) => f.label);
export const requiresPurchaseInfo = (status) => requiresBatch(status);
