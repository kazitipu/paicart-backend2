/* The "pay more, pay now" tier discount granted on an order.
 *
 * The amount recorded when the customer took the offer is authoritative:
 * the customer app applies the offer's `maximumDiscountAmount` cap before
 * granting it, so recomputing `actualTotalAfterCoupon × offer%` here reports
 * a larger figure than the customer was actually given whenever the cap bit.
 * `offer` is a plain number (20, never "20%"); parseFloat also reads the
 * legacy "20%" strings written before that was standardised.
 */
export const getOfferDiscount = (order) => {
  if (!order) return 0;
  const stored = parseFloat(order.offerDiscountAmount);
  if (Number.isFinite(stored) && stored > 0) return Math.round(stored);
  const pct = parseFloat(order.offer) || 0;
  const base = parseFloat(order.actualTotalAfterCoupon) || 0;
  if (pct <= 0 || base <= 0) return 0;
  return Math.round(base * (pct / 100));
};
