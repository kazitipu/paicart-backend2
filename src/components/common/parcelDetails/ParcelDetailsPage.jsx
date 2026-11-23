import React, { Component } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import {
  getParcelRecord,
  getSingleUser,
  updateParcelRecordFields,
} from "../../../firebase/firebase.utils";
import {
  trackingNumbersOf,
  fetchAlgCartons,
  mergeCartons,
  legacyFieldsFromCartons,
  cartonTotals,
} from "../../../constants/cartons";
import {
  getDisplayPaymentState,
  getOrderPayable,
  getShipmentPayable,
  getOrderPaid,
} from "../../../constants/paymentMath";
import { getOfferDiscount } from "../../../constants/offerMath";
import { getShipmentMode, readyStepLabel } from "../../../constants/shipment";
import { statusDisplay } from "../../../constants/statusDisplay";
import CartonBreakdown from "../cartons/CartonBreakdown.jsx";
import OrderPrintSlip from "../orderPrintSlip.jsx";
import "./ParcelDetailsPage.css";

/* Details page for a Ship For Me booking (kind "ship"), a 1688 order
 * ("order") or a product request ("request").
 *
 * Routes: /shipment-request/details/:bookingId,
 *         /1688-taobao-orders/details/:orderId,
 *         /product-request/details/:bookingId
 *
 * On load the cartons of every tracking number are looked up on ALG (one
 * request per number — see constants/cartons.js) and, when that changes
 * what is stored, written back to the record so the customer app sees the
 * same cartons. */

const P = process.env.PUBLIC_URL || "";

const KINDS = {
  ship: {
    label: "Ship For Me",
    idParam: "bookingId",
    listBase: "/shipment-request",
    defaultList: "/shipment-request/new",
    payableOf: getShipmentPayable,
    statusOf: (r) => r.status,
    invoice: (id) => `/pages/dashboard/ship-for/invoice/${id}`,
  },
  order: {
    label: "Website Order",
    idParam: "orderId",
    listBase: "/1688-taobao-orders",
    defaultList: "/1688-taobao-orders/new",
    payableOf: getOrderPayable,
    statusOf: (r) => r.orderStatus,
    invoice: (id) => `/pages/dashboard/buy-and-ship-for/invoice/${id}`,
    slipKind: "order",
  },
  request: {
    label: "Product Request",
    idParam: "bookingId",
    listBase: "/product-request",
    defaultList: "/product-request/new",
    payableOf: getOrderPayable,
    statusOf: (r) => r.orderStatus || r.status,
    invoice: (id) =>
      `/pages/dashboard/buy-and-ship-for/invoice/${id}?productRequest=true`,
    slipKind: "productRequest",
  },
};

/* ---- small helpers ---------------------------------------------------- */

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const has = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const tk = (v) => `৳${Math.round(num(v)).toLocaleString()}`;

/* 1688's cbu01 host blocks hotlinking */
const cdn = (url) =>
  url ? String(url).replace("cbu01.alicdn.com", "global-img-cdn.1688.com") : "";

/* Arrays, JSON-encoded arrays or comma strings; drops "undefined Tk" junk */
const isJunk = (v) => !v || /\b(undefined|null|NaN)\b/.test(v);
const listOf = (value) => {
  if (Array.isArray(value))
    return value.map((v) => String(v == null ? "" : v).trim()).filter((v) => !isJunk(v));
  const text = String(value == null ? "" : value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return listOf(parsed);
    } catch (e) {
      /* fall through */
    }
  }
  return text.split(",").map((v) => v.trim()).filter((v) => !isJunk(v));
};
const uniq = (arr) => Array.from(new Set(arr.filter(Boolean)));
const sumList = (value) => listOf(value).reduce((a, v) => a + num(v), 0);

/* JSON with sorted keys, so a carton read back from Firestore (whose map
   keys come back in any order) compares equal to a freshly built one. */
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .filter((k) => value[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value === undefined ? null : value);
};

const STATUS_TONE = {
  pending: "gray",
  "rates provided": "blue",
  purchased: "blue",
  "received in warehouse": "teal",
  "ready for fly": "violet",
  "bangladesh customs": "orange",
  "bangladesh warehouse": "green",
  "paicart warehouse": "green",
  delivered: "green",
  reject: "red",
};
const PAY_TONE = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "orange",
};
const isRejected = (status) => /^reject/i.test(String(status || ""));

/* Stages of the record's journey, with the field that holds each date */
const stagesOf = (kind, r) => {
  const head =
    kind === "ship"
      ? [
          { key: "Pending", label: "Booked", date: "date" },
          { key: "Rates Provided", label: "Rates provided", date: "Rates ProvidedDate" },
        ]
      : kind === "order"
      ? [
          { key: "pending", label: "Ordered", date: "orderedDate", time: "orderedTime" },
          { key: "Purchased", label: "Purchased", date: "PurchasedDate" },
        ]
      : [
          { key: "Pending", label: "Requested", date: "date" },
          { key: "Rates Provided", label: "Rates provided", date: "Rates ProvidedDate" },
          { key: "Purchased", label: "Purchased", date: "PurchasedDate" },
        ];
  return [
    ...head,
    { key: "Received in Warehouse", label: "Abroad warehouse", date: "Received in WarehouseDate" },
    { key: "Ready for fly", label: readyStepLabel(r), date: "Ready for flyDate" },
    { key: "Bangladesh customs", label: "Bangladesh customs", date: "Bangladesh customsDate" },
    { key: "Bangladesh warehouse", label: "Custom released", date: "Bangladesh warehouseDate" },
    { key: "Paicart warehouse", label: "Paicart warehouse", date: "Paicart warehouseDate" },
    { key: "Delivered", label: "Delivered", date: "DeliveredDate" },
  ].map((s) => ({
    ...s,
    dateValue: r[s.date] || "",
    timeValue: r[s.time || `${s.key}Time`] || "",
  }));
};

/* ---- presentational bits --------------------------------------------- */

const Pill = ({ tone = "gray", children }) => (
  <span className={`pd-pill pd-tone-${tone}`}>{children}</span>
);

const Card = ({ title, icon, extra, children, className = "" }) => (
  <section className={`pd-card ${className}`}>
    {(title || extra) && (
      <div className="pd-card-head">
        <h3 className="pd-card-title">
          {icon && (
            <span className="pd-card-icon">
              <i className={`fa ${icon}`} />
            </span>
          )}
          {title}
        </h3>
        {extra}
      </div>
    )}
    {children}
  </section>
);

const Field = ({ label, value, wide, mono, icon, children }) => {
  const content = children !== undefined ? children : value;
  const empty =
    content === undefined ||
    content === null ||
    content === false ||
    (typeof content === "string" && content.trim() === "");
  return (
    <div className={`pd-field${wide ? " pd-field-wide" : ""}${icon ? " pd-field-icon" : ""}`}>
      {icon && (
        <span className="pd-fi">
          <i className={`fa ${icon}`} />
        </span>
      )}
      <span className="pd-field-body">
        <span className="pd-label">{label}</span>
        <span className={`pd-value${mono ? " pd-mono" : ""}${empty ? " pd-empty" : ""}`}>
          {empty ? "Not set" : content}
        </span>
      </span>
    </div>
  );
};

const ExtLink = ({ href, children }) =>
  has(href) ? (
    <a className="pd-link" href={href} target="_blank" rel="noopener noreferrer">
      {children || href}
    </a>
  ) : null;

const Thumb = ({ src, label, big }) =>
  has(src) ? (
    <a href={src} target="_blank" rel="noopener noreferrer" className="pd-doc">
      <img src={cdn(src)} alt={label || ""} className={big ? "pd-doc-big" : ""} />
      {label && (
        <span className="pd-doc-text">
          <b>{label}</b>
          <small>Open ↗</small>
        </span>
      )}
    </a>
  ) : (
    <div className="pd-doc pd-doc-none">
      <span className="pd-doc-ph">
        <i className="fa fa-picture-o" />
      </span>
      {label && (
        <span className="pd-doc-text">
          <b>{label}</b>
          <small>Not uploaded</small>
        </span>
      )}
    </div>
  );

const isImage = (url) => /\.(png|jpe?g|gif|webp|bmp)($|\?)/i.test(String(url || "")) ||
  /firebasestorage.*%2F[^?]*\.(png|jpe?g|gif|webp)/i.test(String(url || ""));

/* ---- page -------------------------------------------------------------- */

export class ParcelDetailsPage extends Component {
  state = {
    loading: true,
    record: null,
    user: null,
    syncing: false,
    algByTracking: null,
    syncNote: "",
    syncError: "",
  };

  componentDidMount() {
    this.mounted = true;
    this.load();
  }

  componentDidUpdate(prevProps) {
    if (this.recordId(prevProps) !== this.recordId(this.props)) this.load();
  }

  componentWillUnmount() {
    this.mounted = false;
  }

  cfg = () => KINDS[this.props.kind] || KINDS.ship;

  recordId = (props) => {
    const params = (props.match && props.match.params) || {};
    return params[(KINDS[props.kind] || KINDS.ship).idParam] || params.id;
  };

  safeSet = (patch) => {
    if (this.mounted) this.setState(patch);
  };

  load = async () => {
    const id = this.recordId(this.props);
    this.safeSet({ loading: true, record: null, user: null, syncing: false, algByTracking: null, syncNote: "", syncError: "" });
    const record = await getParcelRecord(this.props.kind, id);
    this.safeSet({ loading: false, record });
    if (!record) return;
    const uid = record.userId || record.customerUid;
    if (uid) {
      getSingleUser(uid)
        .then((user) => this.safeSet({ user: user || null }))
        .catch(() => {});
    }
    this.syncAlg(record, { silent: true });
  };

  /* Looks every tracking number up on ALG; persists the merged cartons when
     they differ from what is stored. */
  syncAlg = async (base, { silent } = {}) => {
    const record = base || this.state.record;
    if (!record) return;
    const id = this.recordId(this.props);
    const nos = trackingNumbersOf(record);
    if (!nos.length) {
      if (!silent) toast.info("This record has no tracking number yet.");
      return;
    }
    this.safeSet({ syncing: true, syncError: "" });
    try {
      const algByTracking = await fetchAlgCartons(nos);
      const cartons = mergeCartons(record.cartons, algByTracking, nos);
      const storedNos = Array.isArray(record.trackingNumbers) ? record.trackingNumbers : [];
      const changed =
        canonical(cartons) !== canonical(record.cartons || []) ||
        canonical(nos) !== canonical(storedNos);
      const foundCount = nos.filter((t) => algByTracking[t] && algByTracking[t].found).length;
      let next = record;
      let note = `${foundCount} of ${nos.length} tracking no${nos.length === 1 ? "" : "s"} found on ALG`;

      if (cartons.length && changed) {
        const patch = {
          cartons,
          trackingNumbers: nos,
          ...legacyFieldsFromCartons(cartons),
        };
        /* the old Details sync stamped this too */
        if (foundCount > 0 && !has(record.cargoCompany)) patch.cargoCompany = "ALG Limited";
        const saved = await updateParcelRecordFields(this.props.kind, id, patch);
        next = saved || { ...record, ...patch };
        note += " · cartons saved to the record";
        if (!silent) toast.success("Cartons updated from ALG");
      } else if (!silent) {
        toast.info(cartons.length ? "Cartons are already up to date" : "No cartons found on ALG");
      }
      /* ignore a stale answer if the page moved to another record */
      if (id !== this.recordId(this.props)) return;
      this.safeSet({ record: next, algByTracking, syncNote: note, syncing: false });
    } catch (error) {
      console.log("ALG sync", error);
      this.safeSet({ syncing: false, syncError: error.message || "ALG sync failed" });
      if (!silent) toast.error(`ALG sync failed: ${error.message || error}`);
    }
  };

  backTo = () => {
    const st = this.props.location && this.props.location.state;
    return (st && st.from) || `${P}${this.cfg().defaultList}`;
  };

  /* ---- sections -------------------------------------------------------- */

  productOf = (r) => {
    const { kind } = this.props;
    if (kind === "order") {
      const item = (r.items || [])[0] || {};
      const sku = (item.skus || [])[0] || {};
      return {
        image: sku.image || item.picture || r.imageUrl,
        name: item.name || "1688 order",
        more: (r.items || []).length > 1 ? `+${r.items.length - 1} more item(s)` : r.shopName,
      };
    }
    if (kind === "request") {
      return {
        image: r.imageUrl,
        name: r.productType || r.productName || "Product request",
        more: [r.store, r.productVariant].filter(has).join(" · "),
      };
    }
    return {
      image: r.imageUrl,
      name: r.othersProductName || r.productType || "Ship For Me booking",
      more: [r.productType, r.shipFrom && `from ${r.shipFrom}`].filter(has).join(" · "),
    };
  };

  renderHeader(r, id) {
    const cfg = this.cfg();
    const status = cfg.statusOf(r);
    const pay = getDisplayPaymentState(r, cfg.payableOf);
    const product = this.productOf(r);
    const nos = trackingNumbersOf(r);
    const { user, syncing } = this.state;
    return (
      <header className="pd-head">
        <div className="pd-head-top">
          <Link to={this.backTo()} className="pd-back">
            <i className="fa fa-arrow-left" /> Back to {cfg.label} list
          </Link>
          <div className="pd-head-actions">
            {cfg.slipKind && (
              <span className="pd-slip">
                <OrderPrintSlip record={r} kind={cfg.slipKind} />
              </span>
            )}
            <Link to={`${P}${cfg.invoice(id)}`} className="pd-btn pd-btn-ghost">
              <i className="fa fa-file-text-o" /> Invoice
            </Link>
            <button
              type="button"
              className="pd-btn pd-btn-accent"
              disabled={syncing || !nos.length}
              onClick={() => this.syncAlg(null)}
              title={nos.length ? "Look every tracking number up on ALG again" : "No tracking number yet"}
            >
              <i className={`fa fa-refresh${syncing ? " fa-spin" : ""}`} />{" "}
              {syncing ? "Syncing…" : "Refresh from ALG"}
            </button>
          </div>
        </div>
        <div className="pd-head-main">
          {has(product.image) ? (
            <a href={product.image} target="_blank" rel="noopener noreferrer">
              <img className="pd-thumb" src={cdn(product.image)} alt="" />
            </a>
          ) : (
            <div className="pd-thumb pd-thumb-empty">
              <i className="fa fa-cube" />
            </div>
          )}
          <div className="pd-head-text">
            <div className="pd-kicker">
              {cfg.label} · #{id}
            </div>
            <h1 className="pd-title" title={product.name}>
              {product.name}
            </h1>
            {has(product.more) && <div className="pd-sub">{product.more}</div>}
            <div className="pd-chips">
              <Pill tone={isRejected(status) ? "red" : STATUS_TONE[String(status || "pending").toLowerCase()] || "violet"}>
                {statusDisplay(status) || "Pending"}
              </Pill>
              <Pill tone={PAY_TONE[pay] || "gray"}>{pay === "purchaseLater" ? "Purchase later" : pay}</Pill>
              <Pill tone="glass">
                <i className={`fa ${getShipmentMode(r) === "Sea" ? "fa-ship" : "fa-plane"}`} /> {getShipmentMode(r)}
              </Pill>
              {this.props.kind === "ship" && (
                <Pill tone={r.shipping ? "green" : "glass"}>
                  {r.shipping ? "Shipping permitted" : "Shipping not permitted"}
                </Pill>
              )}
              {this.props.kind === "order" && has(r.orderNumber) && (
                <Pill tone="glass">1688 #{r.orderNumber}</Pill>
              )}
              <Pill tone="glass">
                {nos.length} tracking no{nos.length === 1 ? "" : "s"}
              </Pill>
            </div>
          </div>
          <div className="pd-customer">
            <div className="pd-kicker">Customer</div>
            <div className="pd-customer-name">
              {r.displayName || (user && user.displayName) || r.customer || "—"}
            </div>
            <div className="pd-customer-meta">
              {user && has(user.userId) && <span>ID {user.userId}</span>}
              {user && has(user.mobileNo) && <span>{user.mobileNo}</span>}
              {user && has(user.email) && <span>{user.email}</span>}
            </div>
            {has(r.userId) && (
              <Link className="pd-customer-link" to={`${P}/users/list-user/${r.userId}`}>
                View profile <i className="fa fa-angle-right" />
              </Link>
            )}
          </div>
        </div>
      </header>
    );
  }

  renderTimeline(r) {
    const { kind } = this.props;
    const status = this.cfg().statusOf(r);
    const stages = stagesOf(kind, r);
    const lower = String(status || "").toLowerCase();
    let current = stages.findIndex((s) => s.key.toLowerCase() === lower);
    stages.forEach((s, i) => {
      if (has(s.dateValue) && i > current) current = i;
    });
    if (current < 0) current = 0;
    const rejected = isRejected(status);
    return (
      <Card title="Status timeline" icon="fa-map-signs" className="pd-span-full">
        {rejected && (
          <div className="pd-banner pd-banner-red">
            <i className="fa fa-ban" /> This {this.cfg().label.toLowerCase()} was rejected
            {has(r.cancelledReason) ? ` (${r.cancelledReason})` : ""}.
          </div>
        )}
        <ol className={`pd-timeline${rejected ? " pd-timeline-rejected" : ""}`}>
          {stages.map((s, i) => {
            const state = i < current ? "done" : i === current ? "current" : "todo";
            return (
              <li key={s.key} className={`pd-step pd-step-${state}`}>
                <span className="pd-step-dot">
                  {state === "done" ? <i className="fa fa-check" /> : i + 1}
                </span>
                <span className="pd-step-label">{s.label}</span>
                <span className="pd-step-date">
                  {has(s.dateValue) ? s.dateValue : state === "todo" ? "" : "—"}
                  {has(s.timeValue) && <em>{String(s.timeValue).slice(0, 5)}</em>}
                </span>
              </li>
            );
          })}
        </ol>
      </Card>
    );
  }

  renderProductCard(r) {
    const { kind } = this.props;
    if (kind === "order") {
      const currency = num(r.currency);
      return (
        <Card title="Order items" icon="fa-shopping-cart" className="pd-span-full">
          <div className="pd-grid pd-grid-4" style={{ marginBottom: 14 }}>
            <Field label="1688 order no" value={r.orderNumber} mono />
            <Field label="Shop" value={r.shopName} />
            <Field label="Website" value={r.websiteName} />
            <Field label="Ordered" value={[r.orderedDate, r.orderedTime].filter(has).join(" ")} />
            <Field label="Payment link">
              {has(r.paymentLink1688) ? <ExtLink href={r.paymentLink1688}>Open link</ExtLink> : null}
            </Field>
            <Field label="Payment id" value={r.paymentLinkId} mono />
            <Field label="Picked" value={[r.pickedDate, r.pickedTime].filter(has).join(" at ")} />
            <Field label="Agent carton" value={r.agentCarton} />
          </div>
          {(r.items || []).map((item, idx) => (
            <div className="pd-item" key={item.id || idx}>
              <div className="pd-item-head">
                <span className="pd-item-name">{item.name || "Item"}</span>
                <span className="pd-item-links">
                  <ExtLink href={item.detail_url}>Product link</ExtLink>
                  {has(item.id) && (
                    <ExtLink href={`https://paicart.com/product/${item.id}`}>Paicart link</ExtLink>
                  )}
                  {has(item.shippingRate) && <span className="pd-muted">Shipping ৳{item.shippingRate}/kg</span>}
                </span>
              </div>
              <div className="pd-skus">
                {(item.skus || []).map((sku, j) => (
                  <div className="pd-sku" key={j}>
                    <img src={cdn(sku.image || item.picture)} alt="" />
                    <div className="pd-sku-text">
                      <div className="pd-sku-var">
                        {[sku.color, sku.size].filter(has).join(" / ") || "Default"}
                      </div>
                      <div className="pd-muted">
                        {num(sku.totalQuantity)} pcs × {tk(sku.price)}
                        {currency > 0 && ` (¥${(num(sku.price) / currency).toFixed(2)})`}
                      </div>
                    </div>
                    <b className="pd-sku-total">{tk(num(sku.price) * num(sku.totalQuantity))}</b>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {has(r.additionalNotes) && (
            <div className="pd-note">
              <b>Notes:</b> {r.additionalNotes}
            </div>
          )}
          {(has(r.chineseIssue) || has(r.returnInfo)) && (
            <div className="pd-banner pd-banner-red" style={{ marginTop: 10 }}>
              {r.chineseIssue} {r.returnInfo}
            </div>
          )}
          {this.renderPurchase(r)}
          <div className="pd-docs">
            <Thumb src={r.imageUrl} label="CN warehouse image" />
            <Thumb src={r.imageUrlBd} label="BD warehouse image" />
          </div>
        </Card>
      );
    }
    if (kind === "request") {
      return (
        <Card title="Product information" icon="fa-shopping-bag">
          <div className="pd-grid">
            <Field label="Product" value={r.productType || r.productName} />
            <Field label="Variant" value={r.productVariant} />
            <Field label="Store" value={r.store} />
            <Field label="Quantity" value={has(r.productQuantity) ? `${r.productQuantity} pcs` : ""} />
            <Field label="Unit price" value={has(r.unitPrice) ? tk(r.unitPrice) : ""} />
            <Field label="Shipping rate" value={has(r.shippingRate) ? `৳${r.shippingRate}/kg` : ""} />
            <Field label="Product link" wide>
              {has(r.productUrl) ? <ExtLink href={r.productUrl} /> : null}
            </Field>
            {has(r.warehouse) && <Field label="Warehouse" value={r.warehouse} wide />}
            {has(r.note) && <Field label="Note" value={r.note} wide />}
          </div>
          {this.renderPurchase(r)}
        </Card>
      );
    }
    return (
      <Card title="Booking information" icon="fa-cube">
        <div className="pd-grid">
          <Field label="Product" value={r.othersProductName} />
          <Field label="Category" value={r.productType} />
          <Field label="Quantity" value={has(r.productQuantity) ? `${r.productQuantity} pcs` : ""} />
          <Field label="Products value" value={has(r.productsTotalCost) ? tk(r.productsTotalCost) : ""} />
          <Field label="Brand / non-brand" value={r.productBrand} />
          <Field label="Contains" value={r.productContains} />
          <Field label="Origin" value={r.shipFrom ? String(r.shipFrom).replace(/^\w/, (c) => c.toUpperCase()) : ""} />
          <Field label="Rate valid to" value={r.validTo} />
          <Field label="Details" value={r.productVariant} wide />
          <Field label="Product link" wide>
            {has(r.productUrl) ? <ExtLink href={r.productUrl} /> : null}
          </Field>
          {has(r.warehouse) && <Field label="Warehouse address" value={r.warehouse} wide />}
          {has(r.note) && <Field label="Note" value={r.note} wide />}
        </div>
      </Card>
    );
  }

  renderPurchase(r) {
    const fields = [r.purchaseLink, r.purchasingSupplier, r.purchasingRmb, r.exchangeRate, r.couponUsed];
    if (!fields.some((f) => has(f) && f !== null)) return null;
    return (
      <div className="pd-subsection">
        <div className="pd-subtitle">Purchase</div>
        <div className="pd-grid pd-grid-3">
          <Field label="Purchase link">{has(r.purchaseLink) ? <ExtLink href={r.purchaseLink}>Open</ExtLink> : null}</Field>
          <Field label="Supplier" value={r.purchasingSupplier} />
          <Field label="Supplier payment" value={r.purchasingSupplierPayment} />
          <Field label="Purchasing RMB" value={has(r.purchasingRmb) ? `¥${r.purchasingRmb}` : ""} />
          <Field label="Exchange rate" value={r.exchangeRate} />
          <Field
            label="Total buying cost"
            value={has(r.purchasingRmb) && has(r.exchangeRate) ? tk(num(r.purchasingRmb) * num(r.exchangeRate)) : ""}
          />
        </div>
      </div>
    );
  }

  renderShipping(r) {
    const { kind } = this.props;
    const cartons = r.cartons || [];
    const totals = cartonTotals(cartons);
    const lots = uniq([...cartons.map((c) => c.lotNo), ...listOf(r.lotNo)]);
    const marks = uniq([...cartons.map((c) => c.shippingMark), ...listOf(r.shippingMark)]);
    const est = num(r.weight);
    const actual = num(r.receivedWeight);
    const diff = est > 0 && actual > 0 ? actual - est : null;
    const addr = r.deliveryAddress;
    return (
      <Card title="Shipping information" icon="fa-truck">
        {/* weight at a glance */}
        <div className="pd-wstats">
          <div className="pd-wstat">
            <span className="pd-wstat-ic"><i className="fa fa-balance-scale" /></span>
            <div>
              <span className="pd-wstat-label">Est. weight</span>
              <b>{est > 0 ? `${est} kg` : "Not given"}</b>
              <small>by customer</small>
            </div>
          </div>
          <div className={`pd-wstat pd-wstat-main${actual > 0 ? "" : " is-pending"}`}>
            <span className="pd-wstat-ic"><i className="fa fa-check-circle" /></span>
            <div>
              <span className="pd-wstat-label">Actual weight</span>
              <b>{actual > 0 ? `${actual} kg` : "Pending"}</b>
              {diff !== null ? (
                <small className={`pd-diff ${Math.abs(diff) <= Math.max(0.5, est * 0.05) ? "is-ok" : "is-off"}`}>
                  {diff >= 0 ? "+" : "−"}{Math.abs(Math.round(diff * 100) / 100)} kg vs est.
                </small>
              ) : (
                <small>{actual > 0 ? "weighed at warehouse" : "not weighed yet"}</small>
              )}
            </div>
          </div>
          <div className="pd-wstat">
            <span className="pd-wstat-ic pd-ic-blue"><i className="fa fa-cubes" /></span>
            <div>
              <span className="pd-wstat-label">Cartons</span>
              <b>{totals.count || r.ctnQuantity || 0}</b>
              <small>
                {totals.count ? `${totals.bdWeight} kg · ${totals.cbm} CBM` : r.totalCbm ? `${r.totalCbm} CBM` : "no carton data"}
              </small>
            </div>
          </div>
        </div>

        <div className="pd-grid pd-grid-rows">
          <Field icon="fa-plane" label="Shipment mode" value={getShipmentMode(r)} />
          <Field icon="fa-building-o" label="Cargo company" value={r.cargoCompany} />
          <Field icon="fa-tags" label="Lot no" value={lots.join(", ")} />
          <Field icon="fa-bookmark-o" label="Shipping mark" value={uniq(marks).join(", ")} />
          <Field icon="fa-archive" label="Carton qty" value={r.ctnQuantity || (totals.count ? String(totals.count) : "")} />
          <Field icon="fa-cube" label="Total CBM" value={r.totalCbm} />
          <Field icon="fa-user-o" label="Customer rate" value={num(r.customerRate) > 0 ? `৳${r.customerRate}/kg` : ""} />
          <Field icon="fa-truck" label="Cargo rate" value={uniq(listOf(r.cargoRate)).join(", ")} />
          {has(r.abroadWarehouseAddress) && <Field icon="fa-map-marker" label="Abroad warehouse" value={r.abroadWarehouseAddress} wide />}
          {has(r.bangladeshWarehouseAddress) && <Field icon="fa-map-marker" label="Bangladesh warehouse" value={r.bangladeshWarehouseAddress} wide />}
          {has(r.deliveredBy) && <Field icon="fa-motorcycle" label="Delivered through" value={r.deliveredBy} />}
          {addr && (
            <Field
              icon="fa-home"
              label="Delivery address"
              wide
              value={[addr.name, addr.mobileNo, addr.address, addr.thana, addr.district, addr.division].filter(has).join(", ")}
            />
          )}
          {/* Chosen by the customer from To Receive (customer app/website):
              office_pickup | van_truck | pathao | sundorbon */}
          {r.deliveryRequest && r.deliveryRequest.method && (
            <Field icon="fa-paper-plane-o" label="Customer delivery request" wide>
              <span>
                <b>{r.deliveryRequest.label || r.deliveryRequest.method}</b>
                {" "}
                <Pill tone={r.deliveryRequest.status === "requested" ? "blue" : r.deliveryRequest.status === "cancelled" ? "gray" : "green"}>
                  {r.deliveryRequest.status || "requested"}
                </Pill>
                <br />
                <small style={{ color: "#64748b" }}>
                  Requested {r.deliveryRequest.requestedDate || ""}
                  {r.deliveryRequest.fullyPaid
                    ? " · invoice was fully paid"
                    : ` · due at request ৳${Math.round(num(r.deliveryRequest.dueAtRequest)).toLocaleString("en-IN")}`}
                </small>
                {has(r.deliveryRequest.note) && (
                  <>
                    <br />
                    <small style={{ color: "#334155" }}>Note: {r.deliveryRequest.note}</small>
                  </>
                )}
              </span>
            </Field>
          )}
        </div>
        {kind === "ship" && (
          <div className="pd-docs">
            <Thumb src={r.waybillImage} label="Waybill" />
            {has(r.packingListUrl) && !isImage(r.packingListUrl) ? (
              <a className="pd-doc pd-doc-file" href={r.packingListUrl} target="_blank" rel="noopener noreferrer">
                <span className="pd-doc-ph">
                  <i className="fa fa-file-o" />
                </span>
                <span className="pd-doc-text">
                  <b>Packing list</b>
                  <small>Open file ↗</small>
                </span>
              </a>
            ) : (
              <Thumb src={r.packingListUrl} label="Packing list" />
            )}
          </div>
        )}
      </Card>
    );
  }

  renderCartons(r) {
    const { syncing, algByTracking, syncNote, syncError } = this.state;
    const nos = trackingNumbersOf(r);
    const lotStatus = algByTracking
      ? uniq(
          Object.values(algByTracking)
            .map((a) => a && a.lot && a.lot.shipmentStatus)
            .filter(Boolean)
        )
      : [];
    return (
      <Card
        title="Tracking & cartons"
        icon="fa-cubes"
        className="pd-span-full"
        extra={
          <div className="pd-sync">
            {syncing ? (
              <span className="pd-sync-note pd-pulse">
                <i className="fa fa-refresh fa-spin" /> Checking ALG…
              </span>
            ) : syncError ? (
              <span className="pd-sync-note pd-red">{syncError}</span>
            ) : syncNote ? (
              <span className="pd-sync-note">{syncNote}</span>
            ) : null}
            {lotStatus.length > 0 && (
              <span className="pd-sync-note pd-lot-status">
                <i className="fa fa-plane" /> Lot: {lotStatus.join(", ")}
              </span>
            )}
            <button
              type="button"
              className="pd-btn pd-btn-soft"
              disabled={syncing || !nos.length}
              onClick={() => this.syncAlg(null)}
            >
              <i className="fa fa-refresh" /> Refresh from ALG
            </button>
          </div>
        }
      >
        <CartonBreakdown
          cartons={r.cartons || []}
          trackingNumbers={nos}
          lookups={algByTracking}
          loading={syncing}
        />
      </Card>
    );
  }

  billingLines(r) {
    const { kind } = this.props;
    const lines = [];
    const add = (label, value, opts = {}) => {
      if (opts.always || num(value) !== 0) lines.push({ label, value: num(value), ...opts });
    };
    if (kind === "ship") {
      const weightCharge =
        num(r.receivedWeight) > 0 && num(r.customerRate) > 0
          ? Math.round(num(r.receivedWeight) * num(r.customerRate))
          : 0;
      if (weightCharge)
        add(`Freight · ${r.receivedWeight} kg × ৳${r.customerRate}`, weightCharge, { hint: true });
      else if (num(r.result && r.result.result) > 0)
        add("Estimated charge (booking)", r.result.result, { hint: true });
      add("Packaging & other cost", r.otherCost, { hint: true });
      add("Discount", r.discount, { minus: true, hint: true });
      add("Shipping charge (customer)", r.shippingChargeCustomer, { always: true });
    } else {
      const goods = has(r.orderTotal)
        ? num(r.orderTotal)
        : (r.items || []).reduce(
            (t, item) =>
              t + (item.skus || []).reduce((a, sku) => a + num(sku.price) * num(sku.totalQuantity), 0),
            0
          );
      if (kind === "request" || has(r.actualTotal)) {
        add(kind === "order" ? "Product price" : "Actual order total", r.actualTotal, { hint: true });
      }
      add("Coupon", r.couponAmount, { minus: true, hint: true });
      add("Site discount", r.siteDiscountAmount, { minus: true, hint: true });
      add("Goods total", goods, { always: true });
      add("Local shipping", r.localShipping);
      add("Shipping charge (customer)", r.shippingChargeCustomer);
      add("Other cost", r.otherCost);
      add("Discount", r.discount, { minus: true });
      add("Pay-now offer", getOfferDiscount(r), { minus: true });
    }
    return lines;
  }

  renderBilling(r) {
    const cfg = this.cfg();
    const payable = cfg.payableOf(r);
    const paid = getOrderPaid(r);
    const due = Math.max(payable - paid, 0);
    const over = paid > payable ? paid - payable : 0;
    const cargo = sumList(r.shippingChargeCargo);
    const cartonCargo = (r.cartons || []).reduce((a, c) => a + num(c.total), 0);
    const cargoCost = cargo || cartonCargo;
    const lines = this.billingLines(r);
    const pct = payable > 0 ? Math.min(100, Math.round((paid / payable) * 100)) : paid > 0 ? 100 : 0;
    return (
      <Card title="Charges & billing" icon="fa-calculator">
        <div className="pd-bill">
          {lines.map((l, i) => (
            <div key={i} className={`pd-bill-row${l.hint ? " pd-bill-hint" : ""}`}>
              <span>{l.label}</span>
              <b className={l.minus ? "pd-red" : ""}>
                {l.minus ? "−" : ""}
                {tk(l.value)}
              </b>
            </div>
          ))}
          <div className="pd-bill-row pd-bill-total">
            <span>Total bill</span>
            <b>{tk(payable)}</b>
          </div>
          <div className="pd-bill-row">
            <span>Total paid</span>
            <b className="pd-green">{tk(paid)}</b>
          </div>
          <div className="pd-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
          <div className={`pd-due ${due > 0 ? "pd-due-open" : "pd-due-settled"}`}>
            <span>{due > 0 ? "Due" : over > 0 ? "Overpaid" : "Settled"}</span>
            <b>{tk(due > 0 ? due : over)}</b>
          </div>
          {(num(r.refund) > 0 || has(r.refundNote)) && (
            <div className="pd-bill-row pd-bill-hint">
              <span>Refund{has(r.refundNote) ? ` · ${r.refundNote}` : ""}</span>
              <b>{tk(r.refund)}</b>
            </div>
          )}
          {cargoCost > 0 && (
            <div className="pd-cargo">
              <div className="pd-bill-row">
                <span>Cargo charge (cargo company)</span>
                <b>{tk(cargoCost)}</b>
              </div>
              {this.props.kind === "ship" && num(r.shippingChargeCustomer) > 0 && (
                <div className="pd-bill-row pd-bill-hint">
                  <span>Shipping margin</span>
                  <b className={num(r.shippingChargeCustomer) - cargoCost >= 0 ? "pd-green" : "pd-red"}>
                    {tk(num(r.shippingChargeCustomer) - cargoCost)}
                  </b>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>
    );
  }

  renderPayments(r) {
    const payments = (r.payments || []).filter(Boolean);
    return (
      <Card
        title="Payment history"
        icon="fa-credit-card"
        extra={<span className="pd-count">{payments.length}</span>}
      >
        {payments.length === 0 ? (
          <div className="pd-none">No payments recorded yet.</div>
        ) : (
          <ul className="pd-payments">
            {payments.map((p, i) => {
              const by = p.approvedBy || p.receivedBy || p.paidBy;
              return (
                <li key={i} className="pd-payment">
                  <span className="pd-pay-icon">
                    <i className="fa fa-money" />
                  </span>
                  <div className="pd-pay-text">
                    <b>{tk(p.amount)}</b>
                    <span>
                      {[p.method, p.date, by && `by ${by}`].filter(has).join(" · ")}
                    </span>
                    {(has(p.transactionId) || has(p.note)) && (
                      <span className="pd-muted">
                        {[p.transactionId && `Txn ${p.transactionId}`, p.note].filter(has).join(" · ")}
                      </span>
                    )}
                  </div>
                  {has(p.receiptUrl || p.imageUrl) && (
                    <a href={p.receiptUrl || p.imageUrl} target="_blank" rel="noopener noreferrer" className="pd-link">
                      Receipt
                    </a>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    );
  }

  render() {
    const { loading, record } = this.state;
    const id = this.recordId(this.props);
    const cfg = this.cfg();

    if (loading) {
      return (
        <div className="pd-page">
          <div className="pd-loader" role="status" aria-live="polite">
            <div className="pd-loader-spinner" aria-hidden="true">
              <span className="pd-loader-ring" />
              <span className="pd-loader-ring pd-loader-ring-2" />
              <span className="pd-loader-icon">
                <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m12 2 8 4.5v11L12 22l-8-4.5v-11L12 2Z" />
                  <path d="m4 6.5 8 4.5 8-4.5M12 11v11" />
                </svg>
              </span>
            </div>
            <div className="pd-loader-title">
              Loading {cfg.label.toLowerCase()} <b>#{id}</b>
              <span className="pd-loader-dots"><i /><i /><i /></span>
            </div>
            <div className="pd-loader-sub">Fetching details, cartons and payments</div>
          </div>

          {/* skeleton of the page, so nothing jumps when the data lands */}
          <div className="pd-skel" aria-hidden="true">
            <div className="pd-skel-head">
              <span className="pd-skel-box pd-skel-thumb" />
              <div className="pd-skel-lines">
                <span className="pd-skel-box" style={{ width: "22%" }} />
                <span className="pd-skel-box pd-skel-lg" style={{ width: "38%" }} />
                <span className="pd-skel-box" style={{ width: "55%" }} />
              </div>
            </div>
            <div className="pd-skel-steps">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className="pd-skel-box pd-skel-dot" />)}
            </div>
            <div className="pd-skel-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="pd-skel-card">
                  <span className="pd-skel-box" style={{ width: "35%" }} />
                  <span className="pd-skel-box" style={{ width: "90%" }} />
                  <span className="pd-skel-box" style={{ width: "75%" }} />
                  <span className="pd-skel-box" style={{ width: "82%" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (!record) {
      return (
        <div className="pd-page">
          <div className="pd-card pd-notfound">
            <h3>
              {cfg.label} #{id} not found
            </h3>
            <p>It may have been deleted, or the link is wrong.</p>
            <Link to={this.backTo()} className="pd-btn pd-btn-ghost">
              <i className="fa fa-arrow-left" /> Back to the list
            </Link>
          </div>
        </div>
      );
    }

    return (
      <div className="pd-page">
        {this.renderHeader(record, id)}
        <div className="pd-layout">
          <div className="pd-main">
            {this.renderTimeline(record)}
            {this.renderProductCard(record)}
            {this.renderShipping(record)}
            {this.renderCartons(record)}
          </div>
          <aside className="pd-side">
            {this.renderBilling(record)}
            {this.renderPayments(record)}
          </aside>
        </div>
      </div>
    );
  }
}

export default ParcelDetailsPage;
