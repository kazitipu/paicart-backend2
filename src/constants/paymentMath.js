/* Payment figures for an order / product request.
 *
 * These mirror the "Total Payable amount(including Shipping)" / "Total Paid" /
 * "Total Due" lines already shown inside the order modals, pulled out here so
 * the list pages can total them across many orders without duplicating the
 * formula a third time.
 */
import { getOfferDiscount } from "./offerMath";

/* Every money field on an order is a free-typed string on some records and a
 * number on others, and missing on brand-new ones. */
const num = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/* Whole taka, like parseInt: totals converted from RMB carry paisa
 * (orderTotal 513.52) but customers pay — and every other screen bills — in
 * whole taka. Keeping the paisa here left a permanent ৳0.52 "due", so fully
 * paid orders showed "Partially Paid" in the lists. */
const whole = (value) => Math.trunc(num(value));

/* Same figure as orderMath.getTotalDue + paid (customer site, invoices,
 * payment approvals): each amount in whole taka, then the pay-now offer. */
export const getOrderPayable = (order) => {
  if (!order) return 0;
  const goods = order.orderTotal ? whole(order.orderTotal) : itemsTotal(order);
  return (
    goods +
    whole(order.shippingChargeCustomer) +
    whole(order.localShipping) +
    whole(order.otherCost) -
    whole(order.discount) -
    /* granted at payment time — not already inside orderTotal */
    getOfferDiscount(order)
  );
};

/* Goods total from the SKUs when an order has no orderTotal yet */
const itemsTotal = (order) =>
  ((order && order.items) || []).reduce(
    (total, item) =>
      total +
      ((item && item.skus) || []).reduce(
        (sum, sku) => sum + Math.trunc(num(sku.price) * whole(sku.totalQuantity)),
        0,
      ),
    0,
  );

/* Shipment requests carry no orderTotal - the bill IS the shipping charge:
 * the actual charge once the parcel is weighed, falling back to the
 * booking-time estimate while it is still in transit. */
export const getShipmentPayable = (request) => {
  if (!request) return 0;
  const actual = whole(request.shippingChargeCustomer);
  if (actual > 0) return actual;
  return num(request.result && request.result.result);
};

export const getOrderPaid = (order) => {
  if (!order || !order.payments || order.payments.length === 0) return 0;
  return order.payments.reduce(
    (total, payment) => total + whole(payment && payment.amount),
    0,
  );
};

/* Overpayments (refund pending) must not net off another order's due, so the
 * per-order due is floored at zero. */
export const getOrderDue = (order, payableOf = getOrderPayable) =>
  Math.max(payableOf(order) - getOrderPaid(order), 0);

/* Derived from the recorded payments, NOT from the stored `paymentStatus`
 * field. An offline payment is entered as a payment row, so the amounts are
 * the only reliable signal of what has actually been settled - the status
 * field goes stale whenever someone records cash without updating it. */
export const getPaymentState = (order, payableOf = getOrderPayable) => {
  const paid = getOrderPaid(order);
  if (paid <= 0) return "Not Paid";
  return payableOf(order) - paid > 0 ? "Partially Paid" : "Paid";
};

export const PAYMENT_STATES = ["Paid", "Partially Paid", "Not Paid"];

const emptyBucket = () => ({ count: 0, payable: 0, paid: 0, due: 0 });

/* Rolls a list of orders into the figures the bottom summary bar shows. */
export const summarisePayments = (orders, payableOf = getOrderPayable) => {
  const summary = {
    count: 0,
    payable: 0,
    paid: 0,
    due: 0,
    userIds: [],
    byState: PAYMENT_STATES.reduce((acc, state) => {
      acc[state] = emptyBucket();
      return acc;
    }, {}),
  };
  if (!orders || orders.length === 0) return summary;

  const seenUsers = new Set();
  orders.forEach((order) => {
    if (!order) return;
    const payable = payableOf(order);
    const paid = getOrderPaid(order);
    const due = Math.max(payable - paid, 0);
    const bucket = summary.byState[getPaymentState(order, payableOf)];

    summary.count += 1;
    summary.payable += payable;
    summary.paid += paid;
    summary.due += due;

    bucket.count += 1;
    bucket.payable += payable;
    bucket.paid += paid;
    bucket.due += due;

    const userId = order.userId || order.uid;
    if (userId) seenUsers.add(String(userId));
  });
  summary.userIds = Array.from(seenUsers);
  return summary;
};

/* What the row badge shows.
 *
 * The derived state wins whenever money has actually been recorded, so an
 * offline payment turns the badge green/orange without anyone having to
 * remember to change the dropdown. `purchaseLater` / `pending` are workflow
 * markers rather than payment states, so they survive on orders that have no
 * payments against them yet. */
export const getDisplayPaymentState = (order, payableOf = getOrderPayable) => {
  const derived = getPaymentState(order, payableOf);
  if (derived !== "Not Paid") return derived;
  const stored = order && order.paymentStatus;
  if (stored === "purchaseLater" || stored === "pending") return stored;
  return "Not Paid";
};

export const PAYMENT_STATE_COLORS = {
  Paid: "green",
  "Partially Paid": "darkorange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "darkorange",
};
