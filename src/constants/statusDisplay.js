/* What a stored status reads as — mirrors statusDisplay() in the customer
 * app's src/lib/shipment.js. "Bangladesh warehouse" is the stage after BD
 * customs and is shown as "Custom Released". The stored value (and its
 * `Bangladesh warehouseDate` stamp) must not change — queries, scores and
 * the status dropdowns all key off it; only the wording does. */
export const STATUS_DISPLAY = { "Bangladesh warehouse": "Custom Released" };
export const statusDisplay = (status) => STATUS_DISPLAY[status] || status;
