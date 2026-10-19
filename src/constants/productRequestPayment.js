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
