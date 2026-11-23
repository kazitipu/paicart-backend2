/* Shared rules for the bulk "change status" / "receive payment" actions on
 * the 1688 orders, product request and shipment request lists. */

/* Same numbers the single-item status modals write. "Rates Provided" is a
 * product/shipment request stage; 1688 orders never use it. */
export const STATUS_SCORES = {
  pending: 1,
  "Rates Provided": 2,
  Purchased: 2,
  "Received in Warehouse": 3,
  "Ready for fly": 4,
  "Bangladesh customs": 5,
  "Bangladesh warehouse": 5,
  "Paicart warehouse": 6,
  Delivered: 7,
  Reject: 1,
};

/* The status fields to write for one item, matching the single-item modals:
 * the status itself, its score, and a `${status}Date/Time` stamp set only the
 * first time the item reaches that status. */
export const buildStatusPatch = (item, status, statusField = "orderStatus") => {
  const now = new Date();
  return {
    [statusField]: status,
    shipmentStatusScore: STATUS_SCORES[status] || 1,
    [`${status}Date`]: item[`${status}Date`] || now.toLocaleDateString("en-GB"),
    [`${status}Time`]: item[`${status}Time`] || now.toLocaleTimeString("en-GB"),
  };
};

/* Split `amount` across items in proportion to each item's due.
 *
 * ৳3,000 against five orders owing ৳6,000 in total pays 50% of every order's
 * own due. Whole taka only (every payment in the app is whole taka): each
 * share is floored, then the leftover taka go one each to the orders with the
 * largest fractional remainders, so the shares always add up to exactly
 * `amount` and none exceeds its order's due.
 *
 * dues: number[] (whole taka, >= 0). Returns number[] in the same order. */
export const allocateProportionally = (dues, amount) => {
  const clean = dues.map((d) => Math.max(Math.trunc(Number(d) || 0), 0));
  const totalDue = clean.reduce((a, b) => a + b, 0);
  const pay = Math.min(Math.max(Math.trunc(Number(amount) || 0), 0), totalDue);
  if (totalDue === 0 || pay === 0) return clean.map(() => 0);
  if (pay === totalDue) return clean.slice();

  const exact = clean.map((d) => (d * pay) / totalDue);
  const shares = exact.map(Math.floor);
  let leftover = pay - shares.reduce((a, b) => a + b, 0);
  const order = exact
    .map((x, i) => ({ i, frac: x - Math.floor(x) }))
    .filter(({ i }) => shares[i] < clean[i])
    .sort((a, b) => b.frac - a.frac || clean[b.i] - clean[a.i]);
  for (let k = 0; leftover > 0 && k < order.length; k += 1, leftover -= 1) {
    shares[order[k].i] += 1;
  }
  return shares;
};

/* For money already received (approved payment requests): the proportional
 * split, plus anything paid beyond the combined due added to the last item so
 * no received taka goes unrecorded. */
export const splitReceivedPayment = (dues, amount) => {
  const total = Math.max(Math.trunc(Number(amount) || 0), 0);
  const shares = allocateProportionally(dues, total);
  const excess = total - shares.reduce((a, b) => a + b, 0);
  if (excess > 0 && shares.length > 0) shares[shares.length - 1] += excess;
  return shares;
};

export const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Bkash", label: "Bkash" },
  { value: "Nagad", label: "Nagad" },
  { value: "Rocket", label: "Rocket" },
  { value: "City", label: "City Bank" },
];
