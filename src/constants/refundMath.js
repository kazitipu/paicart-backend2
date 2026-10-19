/* Suggested after-sale refunds.
 *
 *  - Missing pieces (ordered 5, 3 arrived): the claimed pieces' product price
 *    only. Shipping was charged on the weight that actually arrived, so the
 *    shipping bill is already right and nothing of it is owed back.
 *  - Wrong / damaged item: the claimed pieces' product price PLUS their share
 *    of the CN→BD shipping charge the customer paid to bring them.
 *
 * Product is priced at what the customer actually paid — the list price
 * scaled by any site discount, coupon or pay-now offer — not the raw SKU
 * price. Shipping is shared by weight when the SKUs carry one, else by
 * quantity. Everything is rounded to whole taka. */
import { getOfferDiscount } from "./offerMath";

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const keyOf = (skuId) => String(skuId === undefined || skuId === null ? "" : skuId);

/* What the customer paid for goods ÷ the SKU list total (≤ 1). Claimed
   pieces are priced from the same SKU prices, so this is the matching base
   (actualTotal can already carry a site discount). */
const paidShareOfList = (record, listTotal) => {
  const list = listTotal || num(record.actualTotal);
  const paidForGoods = num(record.orderTotal) - getOfferDiscount(record);
  if (!(list > 0) || !(paidForGoods > 0)) return 1;
  return Math.min(1, paidForGoods / list);
};

/* 1688 order: claimed SKUs (with claimed quantity) against the order's SKUs */
const orderSuggestion = (order, claim) => {
  const skus = [];
  (order.items || []).forEach((item) => (item.skus || []).forEach((s) => skus.push(s)));
  const byId = {};
  skus.forEach((s) => {
    byId[keyOf(s.sku_id)] = s;
  });
  const listTotal = skus.reduce((t, s) => t + num(s.price) * num(s.totalQuantity), 0);
  const totalQty = skus.reduce((t, s) => t + num(s.totalQuantity), 0);
  const weighed = skus.length > 0 && skus.every((s) => num(s.weight) > 0);
  const totalWeight = weighed ? skus.reduce((t, s) => t + num(s.weight) * num(s.totalQuantity), 0) : 0;

  let listClaimed = 0;
  let qtyClaimed = 0;
  let weightClaimed = 0;
  ((claim && claim.skus) || []).forEach((c) => {
    const s = byId[keyOf(c.sku_id)] || c;
    const q = num(c.totalQuantity);
    listClaimed += num(s.price) * q;
    qtyClaimed += q;
    weightClaimed += num(s.weight) * q;
  });

  const product = listClaimed * paidShareOfList(order, listTotal);
  const share = weighed && totalWeight > 0 ? weightClaimed / totalWeight : totalQty > 0 ? qtyClaimed / totalQty : 0;
  const shipping = num(order.shippingChargeCustomer) * Math.min(1, share);
  return { pieces: qtyClaimed, product, shipping, basis: weighed ? "weight" : "quantity" };
};

/* Product request: one product, the customer states how many pieces */
const requestSuggestion = (booking, claim) => {
  const ordered = num(booking.productQuantity);
  const pieces = num(claim && claim.claimQuantity);
  const goods = num(booking.actualTotal) || num(booking.orderTotal);
  const unit = num(booking.unitPrice) || (ordered > 0 ? goods / ordered : 0);
  const share = ordered > 0 ? Math.min(1, pieces / ordered) : 0;
  return {
    pieces,
    product: unit * pieces,
    shipping: num(booking.shippingChargeCustomer) * share,
    basis: "quantity",
  };
};

export const suggestRefund = (record, claim, kind) => {
  if (!record || !claim) return null;
  const raw = kind === "productRequest" ? requestSuggestion(record, claim) : orderSuggestion(record, claim);
  const product = Math.round(raw.product);
  const shipping = Math.round(raw.shipping);
  return {
    pieces: raw.pieces,
    basis: raw.basis,
    product,
    shipping,
    productPlusShipping: product + shipping,
    /* missing → product only; wrong / damaged → product + shipping */
    recommended: claim.claimType === "missing" ? "product" : claim.claimType ? "productPlusShipping" : null,
  };
};

export const CLAIM_TYPE_LABEL = {
  missing: "Missing pieces",
  wrong: "Wrong item",
  damaged: "Damaged item",
};
