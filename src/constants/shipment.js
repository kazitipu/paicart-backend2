/* Freight-mode helpers, mirrored from the customer app's src/lib/shipment.js.
 *
 * The mode is stored under different keys depending on which flow created the
 * record:
 *   - orders and buy-and-ship bookings -> `shipmentMethod`: 'Air' | 'Sea'
 *   - ship-for-me requests             -> `method` / `shipBy`: 'air' | 'sea'
 * Air is the default everywhere: records written before the sea option
 * existed carry no field at all.
 */
/* Checked in order, and a field only counts if it actually holds a freight
   mode: ship-for-me records set `shipmentMethod` to "D2D" (the delivery
   term), so taking the first non-empty field would read every one of them
   as Air. */
const MODE_FIELDS = ["shipBy", "method", "shipmentMethod"];

export const isSeaShipment = (record) => {
  if (!record) return false;
  for (let i = 0; i < MODE_FIELDS.length; i++) {
    const raw = String(record[MODE_FIELDS[i]] || "")
      .trim()
      .toLowerCase();
    if (raw === "sea") return true;
    if (raw === "air") return false;
  }
  return false;
};

/* "Air" | "Sea" - the label used on badges and tabs. */
export const getShipmentMode = (record) =>
  isSeaShipment(record) ? "Sea" : "Air";

/* The milestone between the abroad warehouse and BD customs is stored as the
 * literal status 'Ready for fly'. It must NOT be renamed in the data - only
 * what is displayed changes, because a sea parcel is loaded onto a vessel
 * rather than flown. */
export const READY_STATUS = "Ready for fly";
export const READY_SEA_LABEL = "Ready for vessel";

export const readyStepLabel = (record, airLabel = READY_STATUS) =>
  isSeaShipment(record) ? READY_SEA_LABEL : airLabel;
