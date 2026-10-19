/* Mapping the 1688 order lifecycle onto our own order pipeline.
 *
 * The 1688 order detail API reports where an order really stands with the
 * seller; these helpers turn that into the orderStatus / shipmentStatusScore
 * pair the rest of the app (and the customer's progress tracker) reads. */
import { extract1688Actuals } from "../actions/get1688Data";

/* Same scores the manual status update in updateRequestModal writes, so an
 * automatic move is indistinguishable from an admin doing it by hand. */
export const ORDER_STATUS_SCORES = {
  pending: 1,
  Purchased: 2,
  "Received in Warehouse": 3,
  "Ready for fly": 4,
  "Bangladesh customs": 5,
  "Bangladesh warehouse": 5,
  "Paicart warehouse": 6,
  Delivered: 7,
  Reject: 1,
};

/* 1688 status -> our orderStatus. `waitbuyerpay` maps to "pending", which with
 * agentStatus "Picked" is exactly what keeps an order on the Picked Orders
 * tab. Anything unrecognised yields null and leaves the order alone. */
const STATUS_MAP_1688 = {
  waitbuyerpay: "pending",
  waitsellersend: "Purchased",
  waitbuyerreceive: "Purchased",
  success: "Received in Warehouse",
  cancel: "Reject",
  cancelled: "Reject",
  terminated: "Reject",
  reject: "Reject",
};

export const map1688StatusToOrderStatus = (status) => {
  if (!status) return null;
  return STATUS_MAP_1688[String(status).trim().toLowerCase()] || null;
};

const getScore = (order) => {
  const stored = parseInt(order && order.shipmentStatusScore, 10);
  if (Number.isFinite(stored)) return stored;
  return ORDER_STATUS_SCORES[order && order.orderStatus] || 1;
};

/* An order only ever moves FORWARD through the pipeline from a sync. 1688 has
 * no idea the parcel has since flown or cleared customs, so a `success` there
 * must not drag an order that an admin already advanced to "Ready for fly"
 * back to "Received in Warehouse". A cancellation always applies. */
const shouldApplyStatus = (order, mappedStatus) => {
  if (!mappedStatus || mappedStatus === order.orderStatus) return false;
  if (mappedStatus === "Reject") return true;
  return ORDER_STATUS_SCORES[mappedStatus] > getScore(order);
};

/* The exact field diff to write for one order, or null if the response told us
 * nothing. Keys are whitelisted here so a stale in-memory order can never
 * carry anything else into the document. */
export const build1688OrderUpdate = (order, details) => {
  if (!order || !details) return null;
  const actuals = extract1688Actuals(details);
  const baseInfo = details.baseInfo;
  if (!actuals && !baseInfo) return null;

  const update = { orderId: order.orderId, ...(actuals || {}) };

  const mappedStatus = map1688StatusToOrderStatus(baseInfo && baseInfo.status);
  if (shouldApplyStatus(order, mappedStatus)) {
    const date = new Date();
    update.orderStatus = mappedStatus;
    update.shipmentStatusScore = ORDER_STATUS_SCORES[mappedStatus];
    // Stamped on first arrival only - same rule as the manual update path.
    if (!order[`${mappedStatus}Date`]) {
      update[`${mappedStatus}Date`] = date.toLocaleDateString("en-GB");
    }
    if (!order[`${mappedStatus}Time`]) {
      update[`${mappedStatus}Time`] = date.toLocaleTimeString("en-GB");
    }
  }
  return update;
};
