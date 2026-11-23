/* Search for the payment-request pages (Ship For Me, 1688 orders and product
 * requests). Customers know their Order / Booking ID, not the Payment ID, so
 * every ID a request carries is searchable:
 *   pendingOrders[]        — 1688 order payments (orderId)
 *   productRequestArray[]  — product-request and Ship For Me payments (bookingId)
 */

/* The orders / bookings a paymentRequestApi entry pays for. 1688 order
   payments list them in `pendingOrders`; product-request payments from the
   customer site list the bookings in `productRequestArray` instead, so
   reading only `pendingOrders` showed an empty invoice list and left the
   request impossible to approve. */
export const payableItemsOf = (paymentRequest) => {
  if (!paymentRequest) return [];
  const pending = paymentRequest.pendingOrders || [];
  if (pending.length > 0) return pending;
  return paymentRequest.productRequestArray || [];
};

/* Order / booking IDs the payment covers (not the payment's own id) */
export const coveredIds = (paymentRequest) => {
  const ids = [];
  ((paymentRequest && paymentRequest.pendingOrders) || []).forEach((o) =>
    ids.push(o && (o.orderId || o.bookingId))
  );
  ((paymentRequest && paymentRequest.productRequestArray) || []).forEach((b) =>
    ids.push(b && (b.bookingId || b.orderId))
  );
  return Array.from(
    new Set(ids.filter((id) => id !== undefined && id !== null && id !== "").map(String))
  );
};

/* Matches the payment, order or booking id, the customer's name, method,
   status, date or amount. A blank query matches everything. */
export const matchesPaymentSearch = (paymentRequest, query) => {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return true;
  if (!paymentRequest) return false;
  const haystack = [
    paymentRequest.paymentId,
    ...coveredIds(paymentRequest),
    paymentRequest.displayName,
    paymentRequest.method,
    paymentRequest.status,
    paymentRequest.date,
    paymentRequest.amount,
    paymentRequest.payableTotal,
  ];
  return haystack.some(
    (value) =>
      value !== undefined && value !== null && String(value).toLowerCase().includes(q)
  );
};
