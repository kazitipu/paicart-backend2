/* Delivery requests — admin side.
 *
 * Mirrors paicart-nextjs15/src/lib/deliveryRequest.js (the customer website
 * and app share that file). A record's `deliveryRequest`:
 *   { method, label, status, requestedAt, requestedDate, fullyPaid,
 *     dueAtRequest, note, requestedBy, source: 'customer' | 'admin',
 *     enteredBy, address, groupId, groupSize, handledBy, handledAt }
 * Customers can't choose Van / Truck or Sundorbon unless every record is
 * fully paid; staff may (the dialog warns them). */
import {
  getOrderBucket,
  getRequestBucket,
  getShipBucket,
  orderDue,
  requestDue,
  shipmentBill,
  shipmentDue,
} from "./clientDue";

export const DELIVERY_METHODS = [
  { key: "office_pickup", label: "Office Pickup", hint: "Collect from the Paicart warehouse", needsFullPayment: false, tone: "gray" },
  { key: "van_truck", label: "Van / Truck", hint: "Inside Dhaka · bulk or heavy cargo", needsFullPayment: true, tone: "violet" },
  { key: "pathao", label: "Home Delivery (Pathao)", hint: "Courier to the customer's address", needsFullPayment: false, tone: "orange" },
  { key: "sundorbon", label: "Sundorbon Express", hint: "Outside Dhaka · nationwide", needsFullPayment: true, tone: "teal" },
];
export const deliveryMethod = (key) => DELIVERY_METHODS.find((m) => m.key === key) || null;

export const DELIVERY_STATUSES = {
  requested: { label: "Requested", tone: "blue" },
  arranged: { label: "Arranged", tone: "orange" },
  delivered: { label: "Delivered", tone: "green" },
  /* stored "cancelled"; the customer can request again only after this */
  cancelled: { label: "Rejected", tone: "red" },
};

export const KIND_OF_COLLECTION = { ordersApi: "order", bookingRequest: "request", shipForMe: "ship" };
export const recordIdOf = (kind, r) => String((r && (kind === "order" ? r.orderId : r.bookingId)) || "");
export const stageOf = (kind, r) =>
  (kind === "order" ? getOrderBucket : kind === "request" ? getRequestBucket : getShipBucket)(r);

export const deliveryDue = (kind, r) =>
  Math.max(kind === "order" ? orderDue(r) : kind === "request" ? requestDue(r) : shipmentDue(r), 0);
export const isBilled = (kind, r) => kind !== "ship" || shipmentBill(r) > 0;
export const isFullyPaid = (kind, r) => isBilled(kind, r) && deliveryDue(kind, r) <= 0;

/* The customer's default shipping address (users.addressBook) */
export const defaultShippingAddress = (user) => {
  const book = (user && Array.isArray(user.addressBook) && user.addressBook) || [];
  const a = book.find((x) => x && x.defaultShipping) || book[0] || null;
  return a
    ? {
        name: a.name || "",
        mobileNo: a.mobileNo || "",
        address: a.address || "",
        area: a.area || "",
        thana: a.thana || "",
        district: a.district || "",
        division: a.division || "",
        pathao: a.pathao || null,
      }
    : null;
};

/* Where to deliver: what the customer sent with the request, else the
   record's own address, else their current default shipping address. */
export const deliveryAddressOf = (record, user) =>
  (record && record.deliveryRequest && record.deliveryRequest.address) ||
  (record && record.deliveryAddress) ||
  defaultShippingAddress(user);

/* Where deliveryAddressOf's answer came from — shown next to the address,
   because only the first is fixed; "default" changes whenever the customer
   edits their profile. */
export const deliveryAddressSource = (record) => {
  if (record && record.deliveryRequest && record.deliveryRequest.address) return "request";
  if (record && record.deliveryAddress) return "order";
  return "default";
};
export const ADDRESS_SOURCE_LABEL = {
  request: "Saved with the request",
  order: "Order's delivery address",
  default: "Customer's current default address — not saved with this request",
};

export const formatAddress = (a) =>
  a ? [a.name, a.mobileNo, a.address, a.area, a.thana, a.district, a.division].filter(Boolean).join(", ") : "";

/* Request entered (or changed) by Paicart staff for one record */
export const buildAdminDeliveryRequest = (kind, record, { method, status = "requested", note = "", enteredBy, address }) => {
  const m = deliveryMethod(method);
  if (!m) throw new Error("Choose a delivery method.");
  const now = new Date();
  const prev = (record && record.deliveryRequest) || {};
  return {
    ...prev,
    method: m.key,
    label: m.label,
    status,
    requestedAt: prev.requestedAt || now.getTime(),
    requestedDate: prev.requestedDate || now.toLocaleDateString("en-GB"),
    fullyPaid: isFullyPaid(kind, record),
    dueAtRequest: deliveryDue(kind, record),
    note: String(note || "").trim().slice(0, 500),
    source: "admin",
    enteredBy: enteredBy || "Paicart",
    address: address || prev.address || null,
    groupId: prev.groupId || "",
    groupSize: prev.groupSize || 1,
    handledBy: enteredBy || "Paicart",
    handledAt: now.getTime(),
    handledDate: now.toLocaleDateString("en-GB"),
    ...(prev.source === "customer" ? { customerChoice: { method: prev.method, label: prev.label, requestedAt: prev.requestedAt } } : {}),
  };
};
