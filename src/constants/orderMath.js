/* Order totals, ported verbatim from the customer app's src/lib/orderMath.js.
 *
 * The admin invoice has to print the exact figures the customer sees on their
 * own invoice, so these formulas are deliberately a mirror of that file rather
 * than a second opinion. Keep the two in sync. */
import { getOfferDiscount } from "./offerMath";

export const getSingleShopTotal = (order) => {
  let total = 0;
  (order.items || []).forEach((item) =>
    (item.skus || []).forEach((sku) => {
      total += parseInt(
        parseFloat(sku.price || 0) * parseInt(sku.totalQuantity || 0),
      );
    }),
  );
  return total;
};

export const getTotalPaid = (order) => {
  if (!order || !order.payments || order.payments.length === 0) return 0;
  return order.payments.reduce((a, p) => a + parseInt(p.amount || 0), 0);
};

export const getTotalDue = (order) => {
  const totalPaid = getTotalPaid(order);
  const goods = order.orderTotal
    ? parseInt(order.orderTotal)
    : getSingleShopTotal(order);
  const offerAmt = getOfferDiscount(order);
  let totalBill;
  if (
    order.shippingChargeCustomer &&
    parseInt(order.shippingChargeCustomer) !== 0
  ) {
    totalBill =
      goods +
      parseInt(order.shippingChargeCustomer || 0) +
      parseInt(order.localShipping || 0) +
      parseInt(order.otherCost || 0) -
      parseInt(order.discount || 0);
  } else {
    totalBill =
      goods +
      parseInt(order.localShipping || 0) +
      parseInt(order.otherCost || 0) -
      parseInt(order.discount || 0);
  }
  return parseInt(totalBill) - offerAmt - totalPaid;
};

export const getGoodsTotal = (order) =>
  order.actualTotal
    ? parseInt(order.actualTotal)
    : order.orderTotal
      ? parseInt(order.orderTotal)
      : getSingleShopTotal(order);
