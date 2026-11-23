import React, { Component } from "react";
import { ClipLoader } from "react-spinners";
import { toast } from "react-toastify";
import { getOrderDue } from "../../constants/paymentMath";
import {
  createPathaoOrder,
  findByName,
  getPathaoAreas,
  getPathaoCities,
  getPathaoPricePlan,
  getPathaoStores,
  getPathaoZones,
  isValidBdPhone,
  normalizeBdPhone,
} from "../../constants/pathao";
import "./pathaoBookingModal.css";

/* Stores and cities rarely change - fetch them once per page load. */
let storesPromise = null;
let citiesPromise = null;

const CLOSE_MS = 200; // keep in sync with .is-closing animations
const ADDRESS_MAX = 220;
const DESCRIPTION_MAX = 250;
const WEIGHT_PRESETS = [0.5, 1, 2, 3, 5];

const taka = (n) =>
  `৳${(Number(n) || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

const totalQuantity = (order) =>
  ((order && order.items) || []).reduce(
    (sum, item) =>
      sum +
      ((item && item.skus) || []).reduce(
        (s, sku) => s + (parseInt(sku.totalQuantity, 10) || 0),
        0,
      ),
    0,
  );

/* Pathao accepts 0.5 - 10 kg for a regular parcel. */
const defaultWeight = (order) => {
  const kg = parseFloat(order && order.receivedWeight);
  if (!Number.isFinite(kg) || kg <= 0) return "0.5";
  return String(Math.min(Math.max(Math.round(kg * 10) / 10, 0.5), 10));
};

/* Books a Paicart-warehouse order with Pathao. Rendered only while open. */
export default class PathaoBookingModal extends Component {
  constructor(props) {
    super(props);
    const { order } = props;
    const address = (order && order.deliveryAddress) || {};
    this.state = {
      closing: false,
      stores: [],
      cities: [],
      zones: [],
      areas: [],
      loadingLists: true,
      loadingZones: false,
      loadingAreas: false,
      listError: null,
      submitting: false,
      submitError: null,
      booked: null,

      price: null,
      priceLoading: false,
      priceError: null,

      storeId: process.env.REACT_APP_PATHAO_STORE_ID || "",
      recipientName: address.name || order.displayName || "",
      recipientPhone: normalizeBdPhone(address.mobileNo),
      recipientAddress: [address.address, address.thana, address.district]
        .filter(Boolean)
        .join(", ")
        .slice(0, ADDRESS_MAX),
      cityId: "",
      zoneId: "",
      areaId: "",
      deliveryType: 48,
      itemType: 2,
      itemQuantity: String(totalQuantity(order) || 1),
      itemWeight: defaultWeight(order),
      amountToCollect: String(getOrderDue(order)),
      itemDescription: (order.items || [])
        .map((item) => item && item.name)
        .filter(Boolean)
        .join(", ")
        .slice(0, DESCRIPTION_MAX),
      specialInstruction: "",
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyDown);
    document.body.style.overflow = "hidden";
    this.loadLists();
  }

  componentDidUpdate(prevProps, prevState) {
    const keys = ["storeId", "cityId", "zoneId", "itemWeight", "deliveryType", "itemType"];
    if (keys.some((k) => prevState[k] !== this.state[k])) this.schedulePrice();
  }

  componentWillUnmount() {
    this.unmounted = true;
    clearTimeout(this.priceTimer);
    clearTimeout(this.closeTimer);
    document.removeEventListener("keydown", this.onKeyDown);
    document.body.style.overflow = "";
  }

  onKeyDown = (e) => {
    if (e.key === "Escape") this.requestClose();
  };

  /* Play the exit animation, then unmount. */
  requestClose = () => {
    if (this.state.submitting || this.state.closing) return;
    this.setState({ closing: true });
    this.closeTimer = setTimeout(() => this.props.onClose(), CLOSE_MS);
  };

  safeSetState = (patch) => {
    if (!this.unmounted) this.setState(patch);
  };

  set = (key) => (value) =>
    this.setState({ [key]: value, submitError: null });

  /* Lists ---------------------------------------------------------------- */

  loadLists = async () => {
    this.safeSetState({ loadingLists: true, listError: null });
    try {
      storesPromise = storesPromise || getPathaoStores();
      citiesPromise = citiesPromise || getPathaoCities();
      const [stores, cities] = await Promise.all([storesPromise, citiesPromise]);
      const address = this.props.order.deliveryAddress || {};
      const city = findByName(cities, address.district);
      this.safeSetState({
        stores,
        cities,
        loadingLists: false,
        storeId: this.state.storeId || (stores[0] ? String(stores[0].id) : ""),
      });
      if (city) await this.selectCity(String(city.id), address.thana);
    } catch (err) {
      storesPromise = null;
      citiesPromise = null;
      this.safeSetState({ loadingLists: false, listError: err.message });
    }
  };

  selectCity = async (cityId, guessZoneName) => {
    this.safeSetState({
      cityId,
      zoneId: "",
      areaId: "",
      zones: [],
      areas: [],
      submitError: null,
    });
    if (!cityId) return;
    this.safeSetState({ loadingZones: true });
    try {
      const zones = await getPathaoZones(cityId);
      if (this.state.cityId !== cityId) return; // changed again meanwhile
      const zone = guessZoneName ? findByName(zones, guessZoneName) : null;
      this.safeSetState({ zones, loadingZones: false });
      if (zone) await this.selectZone(String(zone.id));
    } catch (err) {
      this.safeSetState({ loadingZones: false });
      toast.error(`Could not load Pathao zones: ${err.message}`);
    }
  };

  selectZone = async (zoneId) => {
    this.safeSetState({ zoneId, areaId: "", areas: [], submitError: null });
    if (!zoneId) return;
    this.safeSetState({ loadingAreas: true });
    try {
      const areas = await getPathaoAreas(zoneId);
      if (this.state.zoneId !== zoneId) return;
      this.safeSetState({ areas, loadingAreas: false });
    } catch (err) {
      this.safeSetState({ loadingAreas: false });
      toast.error(`Could not load Pathao areas: ${err.message}`);
    }
  };

  /* Price quote ------------------------------------------------------------ */

  schedulePrice = () => {
    clearTimeout(this.priceTimer);
    const s = this.state;
    const weight = parseFloat(s.itemWeight);
    if (!s.storeId || !s.cityId || !s.zoneId || !(weight >= 0.5 && weight <= 10)) {
      if (s.price || s.priceError) this.setState({ price: null, priceError: null });
      return;
    }
    this.setState({ priceLoading: true, priceError: null });
    this.priceTimer = setTimeout(this.fetchPrice, 400);
  };

  fetchPrice = async () => {
    const s = this.state;
    const request = {
      store_id: parseInt(s.storeId, 10),
      item_type: parseInt(s.itemType, 10),
      delivery_type: parseInt(s.deliveryType, 10),
      item_weight: parseFloat(s.itemWeight),
      recipient_city: parseInt(s.cityId, 10),
      recipient_zone: parseInt(s.zoneId, 10),
    };
    const key = JSON.stringify(request);
    this.priceKey = key;
    try {
      const price = await getPathaoPricePlan(request);
      if (this.priceKey !== key) return;
      this.safeSetState({ price, priceLoading: false });
    } catch (err) {
      if (this.priceKey !== key) return;
      /* The dev-server proxy only picks up new routes on restart. */
      const message = /^Not allowed:/.test(err.message)
        ? "Restart npm start to enable price quotes."
        : err.message;
      this.safeSetState({ price: null, priceLoading: false, priceError: message });
    }
  };

  /* Charges shown in the summary: delivery fee from Pathao's price plan plus
   * its cash-on-delivery percentage on the amount collected. */
  charges = () => {
    const { price } = this.state;
    if (!price) return null;
    const cod = Math.max(parseInt(this.state.amountToCollect, 10) || 0, 0);
    const delivery = Number(price.final_price) || 0;
    const codPercent = Number(price.cod_percentage) || 0;
    const codCharge = price.cod_enabled && cod > 0 ? Math.round(cod * codPercent * 100) / 100 : 0;
    const total = delivery + codCharge + (Number(price.additional_charge) || 0);
    return {
      base: Number(price.price) || delivery,
      delivery,
      discounted: (Number(price.price) || 0) > delivery,
      codPercent,
      codCharge,
      additional: Number(price.additional_charge) || 0,
      total,
      cod,
      payout: cod - total,
    };
  };

  /* Validation ------------------------------------------------------------- */

  checks = () => {
    const s = this.state;
    const weight = parseFloat(s.itemWeight);
    return [
      { label: "Recipient name", ok: !!s.recipientName.trim() },
      { label: "Valid mobile number", ok: isValidBdPhone(normalizeBdPhone(s.recipientPhone)) },
      {
        label: "Full address (10+ characters)",
        ok: s.recipientAddress.trim().length >= 10 && s.recipientAddress.length <= ADDRESS_MAX,
      },
      { label: "City and zone", ok: !!(s.cityId && s.zoneId) },
      { label: "Weight 0.5 – 10 kg", ok: weight >= 0.5 && weight <= 10 },
      { label: "Pickup store", ok: !!s.storeId },
    ];
  };

  validate = () => {
    const failed = this.checks().find((c) => !c.ok);
    if (failed) return `Please complete: ${failed.label}.`;
    if (!(parseInt(this.state.itemQuantity, 10) >= 1)) return "Quantity must be at least 1.";
    if (!(parseInt(this.state.amountToCollect, 10) >= 0))
      return "Cash to collect cannot be negative.";
    return null;
  };

  submit = async () => {
    const problem = this.validate();
    if (problem) {
      this.setState({ submitError: problem });
      return;
    }
    const s = this.state;
    const { order } = this.props;
    const payload = {
      store_id: parseInt(s.storeId, 10),
      merchant_order_id: String(order.orderId),
      recipient_name: s.recipientName.trim(),
      recipient_phone: normalizeBdPhone(s.recipientPhone),
      recipient_address: s.recipientAddress.trim(),
      recipient_city: parseInt(s.cityId, 10),
      recipient_zone: parseInt(s.zoneId, 10),
      ...(s.areaId ? { recipient_area: parseInt(s.areaId, 10) } : {}),
      delivery_type: parseInt(s.deliveryType, 10),
      item_type: parseInt(s.itemType, 10),
      item_quantity: parseInt(s.itemQuantity, 10),
      item_weight: parseFloat(s.itemWeight),
      amount_to_collect: parseInt(s.amountToCollect, 10),
      item_description: s.itemDescription.trim() || undefined,
      special_instruction: s.specialInstruction.trim() || undefined,
    };

    this.setState({ submitting: true, submitError: null });
    try {
      const data = await createPathaoOrder(payload);
      if (!data || !data.consignment_id) {
        throw new Error("Pathao did not return a consignment id.");
      }
      const now = new Date();
      const pathaoBooking = {
        consignmentId: data.consignment_id,
        orderStatus: data.order_status || "Pending",
        deliveryFee: data.delivery_fee !== undefined ? data.delivery_fee : null,
        amountToCollect: payload.amount_to_collect,
        storeId: payload.store_id,
        recipientPhone: payload.recipient_phone,
        bookedDate: now.toLocaleDateString("en-GB"),
        bookedTime: now.toLocaleTimeString("en-GB"),
        bookedAt: now.toISOString(),
      };
      await this.props.onBooked(pathaoBooking);
      toast.success(`Booked with Pathao. Consignment ${data.consignment_id}`);
      this.safeSetState({ submitting: false, booked: pathaoBooking });
    } catch (err) {
      this.safeSetState({ submitting: false, submitError: err.message });
    }
  };

  copyConsignment = async () => {
    const id = this.state.booked && this.state.booked.consignmentId;
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Consignment ID copied");
    } catch (err) {
      toast.info(id);
    }
  };

  /* Render ----------------------------------------------------------------- */

  renderSuccess() {
    const { booked } = this.state;
    return (
      <div className="pbm-success">
        <div className="pbm-success-icon">
          <i className="fa fa-check" />
        </div>
        <h3>Parcel booked with Pathao</h3>
        <p>Pathao will pick it up from your store. The order is marked as booked.</p>
        <div className="pbm-consignment">
          {booked.consignmentId}
          <button type="button" className="pbm-btn ghost small" onClick={this.copyConsignment}>
            <i className="fa fa-copy" /> Copy
          </button>
        </div>
        <div className="pbm-success-grid">
          <div>
            <small>Status</small>
            <b>{booked.orderStatus}</b>
          </div>
          <div>
            <small>Delivery fee</small>
            <b>{booked.deliveryFee !== null ? taka(booked.deliveryFee) : "—"}</b>
          </div>
          <div>
            <small>Cash to collect</small>
            <b>{taka(booked.amountToCollect)}</b>
          </div>
        </div>
        <button type="button" className="pbm-btn primary" onClick={this.requestClose}>
          Done
        </button>
      </div>
    );
  }

  renderSummary() {
    const s = this.state;
    const c = this.charges();
    const checks = this.checks();
    const city = s.cities.find((x) => String(x.id) === s.cityId);
    const zone = s.zones.find((x) => String(x.id) === s.zoneId);
    const area = s.areas.find((x) => String(x.id) === s.areaId);

    return (
      <aside className="pbm-side">
        <div>
          <div className="pbm-side-title">Deliver to</div>
          <div className="pbm-panel pbm-recipient">
            <div className="name">{s.recipientName || "—"}</div>
            <div className="line">
              <i className="fa fa-phone" />
              <span>{s.recipientPhone || "—"}</span>
            </div>
            <div className="line">
              <i className="fa fa-map-marker" />
              <span>
                {[area && area.name, zone && zone.name, city && city.name]
                  .filter(Boolean)
                  .join(", ") || "Choose city and zone"}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="pbm-side-title">Charges</div>
          <div className="pbm-panel">
            {s.priceLoading ? (
              <>
                <div className="pbm-row"><span>Delivery fee</span><span className="pbm-skeleton" /></div>
                <div className="pbm-row"><span>COD charge</span><span className="pbm-skeleton" /></div>
                <div className="pbm-row total"><span>Total charge</span><span className="pbm-skeleton" /></div>
              </>
            ) : c ? (
              <>
                <div className="pbm-row">
                  <span>Delivery fee</span>
                  <span>
                    {c.discounted && <span className="pbm-strike">{taka(c.base)}</span>}
                    {taka(c.delivery)}
                  </span>
                </div>
                <div className="pbm-row">
                  <span>COD charge ({Math.round(c.codPercent * 1000) / 10}%)</span>
                  <span>{taka(c.codCharge)}</span>
                </div>
                {c.additional > 0 && (
                  <div className="pbm-row">
                    <span>Additional</span>
                    <span>{taka(c.additional)}</span>
                  </div>
                )}
                <div className="pbm-row total">
                  <span>Total charge</span>
                  <span>{taka(c.total)}</span>
                </div>
                <div className="pbm-row">
                  <span>Cash collected</span>
                  <span>{taka(c.cod)}</span>
                </div>
                <div className="pbm-row payout">
                  <span>You receive</span>
                  <span style={c.payout < 0 ? { color: "#dc2626" } : undefined}>
                    {taka(c.payout)}
                  </span>
                </div>
              </>
            ) : (
              <div className="pbm-help">
                {s.priceError
                  ? `Price unavailable: ${s.priceError}`
                  : "Choose city, zone and weight to see the delivery charge."}
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="pbm-side-title">Ready to book</div>
          <div className="pbm-panel">
            <ul className="pbm-check">
              {checks.map((check) => (
                <li key={check.label} className={check.ok ? "ok" : "no"}>
                  <i className={`fa ${check.ok ? "fa-check-circle" : "fa-circle-o"}`} />
                  {check.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>
    );
  }

  renderForm() {
    const s = this.state;
    const { order } = this.props;
    const due = getOrderDue(order);
    const phoneOk = isValidBdPhone(normalizeBdPhone(s.recipientPhone));
    const disabled = s.submitting;
    const input = (key, extra = {}) => ({
      className: `pbm-input ${extra.invalid ? "invalid" : ""}`,
      value: s[key],
      disabled,
      onChange: (e) => this.set(key)(e.target.value),
    });
    const qty = parseInt(s.itemQuantity, 10) || 0;

    return (
      <div className="pbm-form">
        {s.listError && (
          <div className="pbm-alert error">
            <i className="fa fa-exclamation-circle" />
            <span>{s.listError}</span>
            <button type="button" className="pbm-btn ghost small" onClick={this.loadLists}>
              Retry
            </button>
          </div>
        )}

        <section className="pbm-card">
          <div className="pbm-card-title">
            <i className="fa fa-user" /> Recipient
          </div>
          <div className="pbm-grid c2">
            <div className="pbm-field">
              <label className="pbm-label">Name</label>
              <div className="pbm-input-wrap">
                <i className="fa fa-user-o" />
                <input {...input("recipientName")} placeholder="Customer name" />
              </div>
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Mobile</label>
              <div className="pbm-input-wrap">
                <i className="fa fa-phone" />
                <input
                  {...input("recipientPhone", { invalid: s.recipientPhone && !phoneOk })}
                  inputMode="tel"
                  placeholder="01XXXXXXXXX"
                />
                {s.recipientPhone && (
                  <i
                    className={`pbm-ok fa ${phoneOk ? "fa-check-circle" : "fa-exclamation-circle"}`}
                    style={{ color: phoneOk ? "#16a34a" : "#dc2626" }}
                  />
                )}
              </div>
            </div>
          </div>
          <div className="pbm-field" style={{ marginTop: 12 }}>
            <label className="pbm-label">
              Address
              <span className={`pbm-count ${s.recipientAddress.length > ADDRESS_MAX ? "over" : ""}`}>
                {s.recipientAddress.length}/{ADDRESS_MAX}
              </span>
            </label>
            <textarea
              {...input("recipientAddress")}
              rows={2}
              maxLength={ADDRESS_MAX}
              placeholder="House, road, area"
            />
          </div>
        </section>

        <section className="pbm-card">
          <div className="pbm-card-title">
            <i className="fa fa-map-marker" /> Delivery location
            {order.deliveryAddress && order.deliveryAddress.district && (
              <span className="pbm-hint">
                Customer entered: {[order.deliveryAddress.thana, order.deliveryAddress.district].filter(Boolean).join(", ")}
              </span>
            )}
          </div>
          <div className="pbm-grid c3">
            <div className="pbm-field">
              <label className="pbm-label">City</label>
              <SearchSelect
                options={s.cities}
                value={s.cityId}
                loading={s.loadingLists}
                disabled={disabled}
                placeholder="Select city"
                onChange={(id) => this.selectCity(id)}
              />
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Zone</label>
              <SearchSelect
                options={s.zones}
                value={s.zoneId}
                loading={s.loadingZones}
                disabled={disabled || !s.cityId}
                placeholder={s.cityId ? "Select zone" : "Choose city first"}
                onChange={(id) => this.selectZone(id)}
              />
            </div>
            <div className="pbm-field">
              <label className="pbm-label">
                Area <span className="pbm-count">optional</span>
              </label>
              <SearchSelect
                options={s.areas}
                value={s.areaId}
                loading={s.loadingAreas}
                disabled={disabled || !s.zoneId}
                placeholder={s.zoneId ? "Select area" : "Choose zone first"}
                onChange={(id) => this.set("areaId")(id)}
                allowClear
              />
            </div>
          </div>
        </section>

        <section className="pbm-card">
          <div className="pbm-card-title">
            <i className="fa fa-cube" /> Parcel
          </div>
          <div className="pbm-grid c3">
            <div className="pbm-field">
              <label className="pbm-label">Pickup store</label>
              <SearchSelect
                options={s.stores}
                value={s.storeId}
                loading={s.loadingLists}
                disabled={disabled}
                placeholder="Select store"
                onChange={(id) => this.set("storeId")(id)}
              />
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Delivery type</label>
              <Segmented
                value={s.deliveryType}
                disabled={disabled}
                onChange={this.set("deliveryType")}
                options={[
                  { value: 48, label: "Normal" },
                  { value: 12, label: "On demand" },
                ]}
              />
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Item type</label>
              <Segmented
                value={s.itemType}
                disabled={disabled}
                onChange={this.set("itemType")}
                options={[
                  { value: 2, label: "Parcel" },
                  { value: 1, label: "Document" },
                ]}
              />
            </div>

            <div className="pbm-field">
              <label className="pbm-label">Quantity</label>
              <div className="pbm-stepper">
                <button
                  type="button"
                  disabled={disabled || qty <= 1}
                  onClick={() => this.set("itemQuantity")(String(Math.max(qty - 1, 1)))}
                >
                  −
                </button>
                <input
                  value={s.itemQuantity}
                  disabled={disabled}
                  inputMode="numeric"
                  onChange={(e) => this.set("itemQuantity")(e.target.value.replace(/\D/g, ""))}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => this.set("itemQuantity")(String(qty + 1))}
                >
                  +
                </button>
              </div>
            </div>
            <div className="pbm-field">
              <label className="pbm-label">
                Weight <span className="pbm-count">kg · 0.5 – 10</span>
              </label>
              <div className="pbm-input-wrap">
                <i className="fa fa-balance-scale" />
                <input
                  {...input("itemWeight")}
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.1"
                />
              </div>
              <div className="pbm-chips">
                {WEIGHT_PRESETS.map((w) => (
                  <button
                    type="button"
                    key={w}
                    className={`pbm-chip ${parseFloat(s.itemWeight) === w ? "active" : ""}`}
                    onClick={() => this.set("itemWeight")(String(w))}
                    disabled={disabled}
                  >
                    {w} kg
                  </button>
                ))}
              </div>
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Cash to collect</label>
              <div className="pbm-input-wrap">
                <i style={{ fontStyle: "normal", fontWeight: 700 }}>৳</i>
                <input {...input("amountToCollect")} type="number" min="0" />
              </div>
              <div className="pbm-chips">
                <button
                  type="button"
                  className={`pbm-chip ${String(due) === s.amountToCollect ? "active" : ""}`}
                  onClick={() => this.set("amountToCollect")(String(due))}
                  disabled={disabled}
                >
                  Order due {taka(due)}
                </button>
                <button
                  type="button"
                  className={`pbm-chip ${s.amountToCollect === "0" ? "active" : ""}`}
                  onClick={() => this.set("amountToCollect")("0")}
                  disabled={disabled}
                >
                  No cash
                </button>
              </div>
            </div>
          </div>

          <div className="pbm-grid c2" style={{ marginTop: 12 }}>
            <div className="pbm-field">
              <label className="pbm-label">
                Item description
                <span className="pbm-count">
                  {s.itemDescription.length}/{DESCRIPTION_MAX}
                </span>
              </label>
              <textarea
                {...input("itemDescription")}
                rows={2}
                maxLength={DESCRIPTION_MAX}
              />
            </div>
            <div className="pbm-field">
              <label className="pbm-label">Special instruction</label>
              <textarea
                {...input("specialInstruction")}
                rows={2}
                placeholder="e.g. Call before delivery"
              />
            </div>
          </div>
        </section>

        {s.submitError && (
          <div className="pbm-alert error">
            <i className="fa fa-exclamation-circle" />
            <span>{s.submitError}</span>
          </div>
        )}
      </div>
    );
  }

  render() {
    const { order } = this.props;
    const s = this.state;
    const c = this.charges();
    const ready = this.checks().every((check) => check.ok);

    return (
      <div
        className={`pbm-backdrop ${s.closing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) this.requestClose();
        }}
      >
        <div className="pbm">
          <header className="pbm-head">
            <div className="pbm-logo">
              <i className="fa fa-truck" />
            </div>
            <div>
              <h2 className="pbm-title">Book Pathao delivery</h2>
              <div className="pbm-sub">
                Order <b>{order.orderId}</b>
                {order.uid ? (
                  <>
                    {" · "}
                    {order.uid}-{order.displayName || ""}
                  </>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              className="pbm-close"
              aria-label="Close"
              onClick={this.requestClose}
              disabled={s.submitting}
            >
              ×
            </button>
          </header>

          {s.booked ? (
            this.renderSuccess()
          ) : (
            <>
              <div className="pbm-body">
                {this.renderForm()}
                {this.renderSummary()}
              </div>
              <footer className="pbm-foot">
                <span className="pbm-foot-note">
                  {s.loadingLists ? (
                    <>
                      <ClipLoader size={11} color="#94a3b8" /> Loading Pathao stores and cities…
                    </>
                  ) : ready ? (
                    "Everything looks good."
                  ) : (
                    "Complete the checklist to book."
                  )}
                </span>
                <button
                  type="button"
                  className="pbm-btn ghost"
                  onClick={this.requestClose}
                  disabled={s.submitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="pbm-btn primary"
                  onClick={this.submit}
                  disabled={s.submitting || s.loadingLists}
                >
                  {s.submitting ? (
                    <>
                      <ClipLoader size={13} color="#fff" /> Booking…
                    </>
                  ) : (
                    <>
                      <i className="fa fa-paper-plane" /> Confirm booking
                      {c ? ` · ${taka(c.total)}` : ""}
                    </>
                  )}
                </button>
              </footer>
            </>
          )}
        </div>
      </div>
    );
  }
}

/* Two or three options as a pill toggle. */
const Segmented = ({ options, value, onChange, disabled }) => (
  <div className="pbm-seg">
    {options.map((o) => (
      <button
        type="button"
        key={o.value}
        disabled={disabled}
        className={String(value) === String(o.value) ? "active" : ""}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/* Select with a type-to-filter box - Pathao zone lists run to 100+ entries.
 * Options are { id, name }; value and onChange use the id as a string. */
class SearchSelect extends Component {
  state = { open: false, query: "", hl: 0 };

  componentDidMount() {
    document.addEventListener("mousedown", this.onOutside);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.onOutside);
  }

  onOutside = (e) => {
    if (this.state.open && this.root && !this.root.contains(e.target)) {
      this.setState({ open: false });
    }
  };

  filtered = () => {
    const q = this.state.query.trim().toLowerCase();
    const list = this.props.options || [];
    return q ? list.filter((o) => String(o.name).toLowerCase().includes(q)) : list;
  };

  toggle = () => {
    if (this.props.disabled) return;
    this.setState(
      (st) => ({ open: !st.open, query: "", hl: 0 }),
      () => this.state.open && this.search && this.search.focus(),
    );
  };

  pick = (option) => {
    this.setState({ open: false, query: "" });
    this.props.onChange(option ? String(option.id) : "");
  };

  onKeyDown = (e) => {
    const list = this.filtered();
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.setState((st) => ({ hl: Math.min(st.hl + 1, list.length - 1) }));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.setState((st) => ({ hl: Math.max(st.hl - 1, 0) }));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (list[this.state.hl]) this.pick(list[this.state.hl]);
    } else if (e.key === "Escape") {
      e.stopPropagation(); // close the menu, not the whole modal
      e.nativeEvent.stopImmediatePropagation();
      this.setState({ open: false });
    }
  };

  render() {
    const { options = [], value, placeholder, disabled, loading, allowClear } = this.props;
    const { open, query, hl } = this.state;
    const selected = options.find((o) => String(o.id) === String(value));
    const list = this.filtered();

    return (
      <div className={`pbm-select ${open ? "open" : ""}`} ref={(el) => (this.root = el)}>
        <button
          type="button"
          className={`pbm-select-btn ${selected ? "" : "placeholder"}`}
          onClick={this.toggle}
          disabled={disabled || loading}
        >
          {loading ? (
            <>
              <ClipLoader size={11} color="#94a3b8" /> Loading…
            </>
          ) : selected ? (
            String(selected.name).trim()
          ) : (
            placeholder
          )}
        </button>
        {open && (
          <div className="pbm-menu">
            <input
              ref={(el) => (this.search = el)}
              value={query}
              placeholder="Type to search…"
              onChange={(e) => this.setState({ query: e.target.value, hl: 0 })}
              onKeyDown={this.onKeyDown}
            />
            <ul>
              {allowClear && selected && (
                <li onClick={() => this.pick(null)} style={{ color: "#94a3b8" }}>
                  Clear selection
                </li>
              )}
              {list.length === 0 && <div className="pbm-empty">No matches</div>}
              {list.map((o, i) => (
                <li
                  key={o.id}
                  className={`${i === hl ? "hl" : ""} ${String(o.id) === String(value) ? "sel" : ""}`}
                  onMouseEnter={() => this.setState({ hl: i })}
                  onClick={() => this.pick(o)}
                >
                  {String(o.name).trim()}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}
