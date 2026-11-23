/* Browser side of the Pathao Courier integration.
 *
 * Every call goes to /pathao-api/... on our own dev server (src/setupProxy.js),
 * which adds the merchant token and forwards it to Pathao. Nothing here holds
 * a credential.
 */
import axios from "axios";

const API = "/pathao-api/aladdin/api/v1";

/* Pathao wraps everything as { message, type, code, data }. Surface its own
 * message - it names the offending field on validation errors. */
const unwrap = async (request) => {
  try {
    const { data } = await request;
    /* Some Pathao endpoints answer HTTP 200 with { error: true, message }
     * (e.g. success-rate on an account without access to it). */
    if (data && data.error === true) {
      const error = new Error(
        data.message === "Unauthorized!"
          ? "Pathao refused the request (Unauthorized). Check the Pathao login in .env.local."
          : data.message || "Pathao request failed",
      );
      error.code = "PATHAO_ERROR";
      throw error;
    }
    return data && data.data !== undefined ? data.data : data;
  } catch (err) {
    const body = err.response && err.response.data;
    const fieldErrors =
      body && body.errors
        ? Object.values(body.errors).flat().filter(Boolean).join(" ")
        : "";
    const error = new Error(
      fieldErrors ||
        (body && body.message) ||
        err.message ||
        "Pathao request failed",
    );
    error.code = (body && body.code) || (err.response && err.response.status);
    throw error;
  }
};

/* "+880 1712-345678", "8801712345678", "01712345678" -> "01712345678" */
export const normalizeBdPhone = (raw) => {
  let digits = String(raw || "").replace(/\D/g, "");
  if (digits.startsWith("880")) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("1")) digits = `0${digits}`;
  return digits;
};

export const isValidBdPhone = (phone) => /^01[3-9]\d{8}$/.test(phone);

/* Fraud check ------------------------------------------------------------ */

export const RISK_LEVELS = {
  new: {
    label: "New customer",
    tone: "blue",
    advice: "No Pathao delivery history yet. Confirm the order by phone.",
  },
  low: {
    label: "Low risk",
    tone: "green",
    advice: "Customer usually accepts parcels.",
  },
  medium: {
    label: "Medium risk",
    tone: "orange",
    advice: "Several returned parcels. Consider taking an advance payment.",
  },
  high: {
    label: "High risk",
    tone: "red",
    advice: "Most parcels returned. Take full advance payment before buying.",
  },
};

/* "moderate_customer" -> "Moderate customer" */
export const formatPathaoRating = (rating) => {
  const text = String(rating || "").replace(/_/g, " ").trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
};

export const riskLevelFor = ({ total, successRate }) => {
  if (!total) return "new";
  if (successRate >= 80) return "low";
  if (successRate >= 50) return "medium";
  return "high";
};

/* Pathao has returned this a few shapes over time; read whichever is present. */
const normalizeFraudResult = (data) => {
  const customer = (data && (data.customer || data)) || {};
  const total = parseInt(
    customer.total_delivery !== undefined
      ? customer.total_delivery
      : customer.total_order,
    10,
  ) || 0;
  const success = parseInt(
    customer.successful_delivery !== undefined
      ? customer.successful_delivery
      : customer.success_delivery,
    10,
  ) || 0;
  const cancel = Math.max(total - success, 0);
  const successRate = total > 0 ? Math.round((success / total) * 100) : 0;
  const result = {
    total,
    success,
    cancel,
    successRate,
    rating: (data && data.customer_rating) || null,
    fraudReason: (data && (data.fraud_reason || data.fraud_message)) || null,
    checkedAt: new Date().toISOString(),
  };
  return { ...result, risk: riskLevelFor(result) };
};

/* One lookup per phone per page load - re-opening the Pick modal for the
 * same customer must not hit Pathao again. */
const fraudCache = {};

export const checkCustomerFraud = (rawPhone, { force } = {}) => {
  const phone = normalizeBdPhone(rawPhone);
  if (!isValidBdPhone(phone)) {
    return Promise.reject(
      new Error(`"${rawPhone || ""}" is not a valid Bangladeshi mobile number.`),
    );
  }
  if (!force && fraudCache[phone]) return fraudCache[phone];
  /* Served by the merchant-panel route in setupProxy.js - the official
   * success-rate endpoint is not enabled for our merchant account. */
  const request = unwrap(axios.post("/pathao-api/fraud-check", { phone }))
    .then((data) => ({ phone, ...normalizeFraudResult(data) }))
    .catch((err) => {
      delete fraudCache[phone]; // let a retry actually retry
      throw err;
    });
  fraudCache[phone] = request;
  return request;
};

/* Booking ---------------------------------------------------------------- */

/* Pathao lists come back as { data: [...] } with prefixed keys (city_id /
 * city_name, zone_id / zone_name ...). Flatten them to { id, name }. */
const listOf = (prefix) => (data) => {
  const rows = data && Array.isArray(data.data) ? data.data : data || [];
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    ...row,
    id: row[`${prefix}_id`],
    name: row[`${prefix}_name`],
  }));
};

export const getPathaoStores = () =>
  unwrap(axios.get(`${API}/stores`)).then(listOf("store"));
export const getPathaoCities = () =>
  unwrap(axios.get(`${API}/city-list`)).then(listOf("city"));
export const getPathaoZones = (cityId) =>
  unwrap(axios.get(`${API}/cities/${cityId}/zone-list`)).then(listOf("zone"));
export const getPathaoAreas = (zoneId) =>
  unwrap(axios.get(`${API}/zones/${zoneId}/area-list`)).then(listOf("area"));

export const DELIVERY_TYPES = [
  { id: 48, label: "Normal delivery" },
  { id: 12, label: "On demand delivery" },
];

export const ITEM_TYPES = [
  { id: 2, label: "Parcel" },
  { id: 1, label: "Document" },
];

export const createPathaoOrder = (payload) =>
  unwrap(axios.post(`${API}/orders`, payload));

/* Best-effort match of our free-typed district/thana to Pathao's lists so
 * the booking form opens pre-selected most of the time. */
export const findByName = (list, name) => {
  const clean = (s) =>
    String(s || "")
      .toLowerCase()
      .replace(/[^a-z]/g, "");
  const target = clean(name);
  if (!target) return null;
  return (
    list.find((item) => clean(item.name) === target) ||
    list.find(
      (item) =>
        clean(item.name).includes(target) || target.includes(clean(item.name)),
    ) ||
    null
  );
};

/* Delivery charge quote for the booking summary.
 * -> { price, discount, promo_discount, final_price, cod_enabled,
 *      cod_percentage, additional_charge, plan_id } */
export const getPathaoPricePlan = (payload) =>
  unwrap(axios.post(`${API}/merchant/price-plan`, payload));
