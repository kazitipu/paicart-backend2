import * as api1688 from "./get1688Data";
import { getOrderApiDoc, apply1688Reorder } from "../firebase/firebase.utils";

// Live 1688 status of one order: "waitbuyerpay", "cancel", ..., "not found"
// (1688 returned nothing), or null if 1688 could not be reached.
export const fetch1688Status = async (orderNumber) => {
  if (!orderNumber) return "not ordered";
  try {
    const details = await api1688.get1688OrderDetails(orderNumber);
    return (details && details.baseInfo && details.baseInfo.status) ||
      "not found";
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const fetch1688Statuses = async (orderNumbers) => {
  const statuses = await Promise.all(orderNumbers.map(fetch1688Status));
  const byNumber = {};
  orderNumbers.forEach((number, i) => {
    byNumber[String(number)] = statuses[i];
  });
  return byNumber;
};

// Re-orders (re-picks) one order on 1688 with the same items and China
// address it was picked with, and saves the new 1688 order number.
// Resolves to { ok, order, payment, oldOrderNumber, newOrderNumber, error }.
export const reorder1688 = async (orderId) => {
  const order = await getOrderApiDoc(orderId);
  if (!order) return { ok: false, error: `Order ${orderId} not found` };

  const addressId = order.chinaAddress && order.chinaAddress.id;
  if (!addressId) {
    return {
      ok: false,
      error: `Order ${orderId} has no saved China shipping address. Pick it manually instead.`,
    };
  }

  // Never re-order something already paid or still payable on 1688.
  const oldStatus = await fetch1688Status(order.orderNumber);
  if (oldStatus === null) {
    return {
      ok: false,
      error: `Couldn't check 1688 status of ${order.orderNumber}. Try again.`,
    };
  }
  if (!api1688.is1688Repickable(oldStatus)) {
    return {
      ok: false,
      error: `1688 order ${order.orderNumber} is "${oldStatus}", so it doesn't need re-ordering.`,
    };
  }

  let result = null;
  try {
    result = await api1688.create1688Order(order, addressId);
  } catch (error) {
    console.log(error);
  }
  if (!result || !result.orderId) {
    // Read through the namespace: lastCreateOrderError is a live binding.
    const err = api1688.lastCreateOrderError;
    const errorMsg =
      (err && (err.message || err.errorMessage || err.code)) ||
      "1688 did not return a new order";
    return { ok: false, error: `1688 refused the new order: ${errorMsg}` };
  }

  const newOrderNumber = String(result.orderId);
  const creationTime1688 = {
    postFee: result.postFee
      ? parseFloat(result.postFee / 100).toFixed(2)
      : "",
    totalSuccessAmount: result.totalSuccessAmount
      ? parseFloat(result.totalSuccessAmount / 100).toFixed(2)
      : "",
  };

  try {
    const applied = await apply1688Reorder(orderId, {
      oldOrderNumber: order.orderNumber,
      oldStatus,
      newOrderNumber,
      creationTime1688,
    });
    const fresh = await getOrderApiDoc(orderId).catch(() => null);
    return {
      ok: true,
      ...applied,
      order: fresh || applied.order,
      oldOrderNumber: order.orderNumber,
      oldStatus,
      newOrderNumber,
    };
  } catch (error) {
    console.log(error);
    return {
      ok: false,
      newOrderNumber,
      error: `New 1688 order ${newOrderNumber} was created, but saving it failed: ${error.message}. Note this number before retrying.`,
    };
  }
};

// One at a time, so 1688 isn't flooded and each result can be reported.
export const reorder1688Bulk = async (orderIds, onProgress) => {
  const results = [];
  for (const orderId of orderIds) {
    const result = await reorder1688(orderId);
    results.push({ orderId, ...result });
    if (onProgress) onProgress(results.slice());
  }
  return results;
};
