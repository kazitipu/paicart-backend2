import React, { useCallback, useEffect, useState } from "react";
import { has1688OrderNo, refresh1688Status, statusNeedsRefresh } from "./store1688";
import { toast } from "react-toastify";
import { getOfferDiscount } from "../../../constants/offerMath";
import { trackingNumbersOf } from "../../../constants/cartons";

/* Two cards for website orders and product requests on the details page:
 *   - ProductsComparison: variant-wise qty, the 1688 unit price (¥) and line
 *     total next to the Paicart price (৳) and line total.
 *   - PurchaseReference: the 1688 order number, supplier, China tracking,
 *     China delivery warehouse and the China-side actual purchase cost.
 *
 * Currency: the rate the customer was charged at (`currency`) converts
 * Paicart prices back to ¥; the purchase rate (`exchangeRate`) converts the
 * real 1688 cost to ৳. A ¥ figure derived from a ৳ price is marked "≈". */

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const has = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const tk = (v, d = 0) =>
  `৳${(Math.round(num(v) * 10 ** d) / 10 ** d).toLocaleString("en-IN", { maximumFractionDigits: d })}`;
const short = (t) => (String(t).length > 34 ? `${String(t).slice(0, 32)}…` : String(t));
const cny = (v) => `¥${num(v).toFixed(2)}`;
const cdn = (url) => (url ? String(url).replace("cbu01.alicdn.com", "global-img-cdn.1688.com") : "");

const saleRate = (r) => num(r.currency) || num(r.exchangeRate) || num(r.rmbRate);
const buyRate = (r) => num(r.exchangeRate) || num(r.currency) || num(r.rmbRate);

/* What 1688 actually charged (¥): the synced figure, else the purchasing RMB */
const actual1688 = (r) => {
  const ct = r.creationTime1688 || {};
  const total = num(r.actual1688OrderTotal) || num(ct.totalSuccessAmount) || num(r.purchasingRmb);
  const courier = num(r.actual1688OrderShippingFee) || num(ct.postFee);
  return { total, courier, product: total > 0 ? Math.max(0, total - courier) : 0 };
};

/* The discounts actually granted, as a share of the goods total, so each
   variant shows the price the customer really paid (matches the bill) */
const offerShare = (kind, r) => {
  if (kind !== "order") return 0;
  const goods = (r.items || []).reduce(
    (t, item) => t + (item.skus || []).reduce((a, sku) => a + num(sku.price) * num(sku.totalQuantity), 0),
    0
  );
  /* every discount the bill applies to the goods: site discount, coupon
     and the pay-now offer */
  const off = getOfferDiscount(r) + num(r.siteDiscountAmount) + num(r.couponAmount);
  return goods > 0 && off > 0 ? Math.min(1, off / goods) : 0;
};

const rowsOf = (kind, r) => {
  const rate = saleRate(r);
  const offer = offerShare(kind, r);
  if (kind === "order") {
    const rows = [];
    (r.items || []).forEach((item) =>
      (item.skus || []).forEach((sku) => {
        const before = num(sku.price);
        rows.push({
          name: item.name || "Item",
          sub: has(item.id) ? `Offer ${item.id}` : "",
          image: cdn(sku.image || item.picture),
          variant: [sku.color, sku.size].filter(has).join(" · ") || "Default",
          qty: num(sku.totalQuantity),
          cny: rate > 0 ? before / rate : null,
          cnyEstimated: true,
          price: offer > 0 ? before * (1 - offer) : before,
          before: offer > 0 ? before : null,
          link1688: item.detail_url,
          linkPaicart: has(item.id) ? `https://paicart.com/product/${item.id}` : "",
        });
      })
    );
    return rows;
  }
  const qty = num(r.productQuantity);
  const unit = num(r.unitPrice);
  const bought = num(r.purchasingRmb);
  return [
    {
      name: r.productName || r.productType || "Requested product",
      sub: has(r.store) ? r.store : "",
      image: cdn(r.imageUrl || r.productImage),
      variant: r.productVariant || "Default",
      qty,
      /* purchased: real ¥ per piece; else back from the quoted ৳ price */
      cny: bought > 0 && qty > 0 ? bought / qty : unit > 0 && rate > 0 ? unit / rate : null,
      cnyEstimated: !(bought > 0 && qty > 0),
      price: unit,
      before: null,
      link1688: r.purchaseLink || r.productUrl,
      linkPaicart: "",
    },
  ];
};

const Head = ({ icon, title, sub, badge }) => (
  <div className="ps-head">
    <span className="ps-ic"><i className={`fa ${icon}`} /></span>
    <div className="ps-head-text">
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
    {badge && <span className="ps-badge">{badge}</span>}
  </div>
);

/* Product requests: just what the customer asked for — no 1688 columns */
export const RequestedProducts = ({ record: r }) => {
  const rows = rowsOf("request", r);
  const qty = rows.reduce((a, x) => a + x.qty, 0);
  const total = rows.reduce((a, x) => a + x.price * x.qty, 0);
  return (
    <section className="pd-card ps-card ps-top">
      <Head
        icon="fa-th"
        title="Requested product"
        sub="Variant, quantity, unit price and total for this request"
        badge={`${qty} pcs`}
      />
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Product variant</th>
              <th>Qty</th>
              <th>Unit price (BDT / pc)</th>
              <th>Total amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i}>
                <td>
                  <div className="ps-prod">
                    {x.image ? <img src={x.image} alt="" /> : <span className="ps-noimg"><i className="fa fa-cube" /></span>}
                    <div>
                      <b>{x.name}</b>
                      {x.sub && <small>{x.sub}</small>}
                    </div>
                  </div>
                </td>
                <td className="ps-var">{x.variant}</td>
                <td className="ps-strong">{x.qty} pc</td>
                <td><b className="ps-orange">{x.price > 0 ? `${tk(x.price, 2)} / pc` : "—"}</b></td>
                <td className="ps-orange ps-strong">{x.price > 0 ? tk(x.price * x.qty, 2) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {has(r.productUrl) && (
        <div className="ps-links" style={{ padding: "12px 16px 16px" }}>
          <a href={r.productUrl} target="_blank" rel="noopener noreferrer" className="ps-link">↗ Product link</a>
        </div>
      )}
      {!has(r.productUrl) && <div style={{ height: 14 }} />}
    </section>
  );
};

export const ProductsComparison = ({ kind, record: r, children }) => {
  const rows = rowsOf(kind, r);
  if (!rows.length) return null;
  const qty = rows.reduce((a, x) => a + x.qty, 0);
  const cnyTotal = rows.reduce((a, x) => a + (x.cny || 0) * x.qty, 0);
  const productsTk = rows.reduce((a, x) => a + x.price * x.qty, 0);
  /* same basis as the 1688 side, which includes the China courier */
  const courierTk = num(r.localShipping);
  const tkTotal = productsTk + courierTk;
  const a = actual1688(r);
  const rate = buyRate(r);
  const offerPct = Math.round(offerShare(kind, r) * 1000) / 10;
  const anyEstimate = rows.some((x) => x.cnyEstimated && x.cny !== null);
  /* 1688 side: the real charge once synced/purchased, else the line totals */
  const cnySide = a.total > 0 ? a.total : cnyTotal + (saleRate(r) > 0 ? num(r.localShipping) / saleRate(r) : 0);
  const links = [];
  rows.forEach((x) => {
    if (has(x.link1688) && !links.some((l) => l.href === x.link1688)) links.push({ href: x.link1688, label: `${short(x.name)} · 1688` });
    if (has(x.linkPaicart) && !links.some((l) => l.href === x.linkPaicart)) links.push({ href: x.linkPaicart, label: `${short(x.name)} · Paicart` });
  });
  return (
    <section className="pd-card ps-card ps-top">
      <Head
        icon="fa-th"
        title="Products & price comparison"
        sub="Variant-wise quantity, original 1688 unit price and line totals for 1688 and Paicart"
        badge={`${rows.length} variant${rows.length === 1 ? "" : "s"} · ${qty} pcs`}
      />
      <div className="ps-table-wrap">
        <table className="ps-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Product variant</th>
              <th>Qty</th>
              <th>1688 original price (CNY / pc)</th>
              <th>Total amount (CNY)</th>
              <th>Paicart price (BDT / pc)</th>
              <th>Paicart total amount (BDT)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x, i) => (
              <tr key={i}>
                <td>
                  <div className="ps-prod">
                    {x.image ? <img src={x.image} alt="" /> : <span className="ps-noimg"><i className="fa fa-cube" /></span>}
                    <div>
                      <b>{x.name}</b>
                      {x.sub && <small>{x.sub}</small>}
                    </div>
                  </div>
                </td>
                <td className="ps-var">{x.variant}</td>
                <td className="ps-strong">{x.qty} pc</td>
                <td className="ps-strong">{x.cny === null ? "—" : `${cny(x.cny)} / pc`}</td>
                <td className="ps-strong">{x.cny === null ? "—" : cny(x.cny * x.qty)}</td>
                <td>
                  <b className="ps-orange">{tk(x.price, 2)} / pc</b>
                  {x.before !== null && (
                    <>
                      <small className="ps-prev">Previous price: <s>{tk(x.before, 2)}</s></small>
                      <small className="ps-off">{offerPct}% OFF</small>
                    </>
                  )}
                </td>
                <td className="ps-orange ps-strong">{tk(x.price * x.qty, 2)}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 1 && (
            <tfoot>
              <tr>
                <td colSpan={2}>Total</td>
                <td>{qty} pc</td>
                <td />
                <td>{cnyTotal > 0 ? cny(cnyTotal) : "—"}</td>
                <td />
                <td className="ps-orange">{tk(productsTk, 2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <div className="ps-tiles">
        <div className="ps-tile">
          <span>1688 website · total CNY amount</span>
          <b>{cnySide > 0 ? `${a.total > 0 ? "" : "≈ "}${cny(cnySide)}` : "—"}</b>
          <small>
            {a.total > 0
              ? `Product total: ${cny(a.product)} · CN local courier charge: ${cny(a.courier)}`
              : "Not purchased on 1688 yet — from the Paicart prices"}
          </small>
        </div>
        <div className="ps-tile ps-tile-hot">
          <span>Paicart website · total amount</span>
          <b className="ps-orange">{tk(tkTotal, 2)}</b>
          <small>
            Product total: {tk(productsTk, 2)} · CN local courier charge: {tk(courierTk, 2)}
          </small>
        </div>
        <div className="ps-tile ps-tile-cool">
          <span>Total product quantity</span>
          <b>{qty} pcs</b>
          <small>Across {rows.length} variant{rows.length === 1 ? "" : "s"}</small>
        </div>
      </div>
      {links.length > 0 && (
        <div className="ps-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="ps-link">
              ↗ {l.label}
            </a>
          ))}
        </div>
      )}
      {children && <div className="ps-children">{children}</div>}
      <p className="ps-foot">
        Currency conversion uses this {kind === "order" ? "order" : "request"}'s saved exchange rate
        {saleRate(r) > 0 ? ` (৳${saleRate(r)} / ¥)` : ""}.
        {anyEstimate ? " 1688 unit prices are converted from the Paicart price until the 1688 purchase is recorded." : ""}
      </p>
    </section>
  );
};

const copy = (text, what) => {
  if (!text) return;
  (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject())
    .then(() => toast.success(`${what} copied`))
    .catch(() => toast.error("Could not copy"));
};

const chinaAddressText = (a) => {
  if (!a) return "";
  if (typeof a === "string") return a;
  return [a.fullName, a.mobilePhone, a.address, a.post].filter(has).join(", ");
};

/* 1688's own order status codes, in plain words */
const STATUS_1688 = {
  waitbuyerpay: { label: "Waiting for payment", tone: "amber" },
  waitsellersend: { label: "Paid · waiting for seller to ship", tone: "blue" },
  waitlogisticstakein: { label: "Waiting for courier pickup", tone: "blue" },
  waitbuyerreceive: { label: "Shipped · on the way to China warehouse", tone: "violet" },
  waitbuyersign: { label: "Delivered · waiting for sign-off", tone: "violet" },
  signinsuccess: { label: "Received at China warehouse", tone: "green" },
  confirm_goods: { label: "Goods confirmed", tone: "green" },
  success: { label: "Completed", tone: "green" },
  cancel: { label: "Cancelled", tone: "red" },
  terminated: { label: "Closed", tone: "red" },
};

/* 1688 status stored on the record (status1688); refreshed from 1688 only
   when missing / stale, or when the admin clicks refresh (store1688.js) */
const tried = new Set();
const useStored1688Status = (kind, r) => {
  const [state, setState] = useState({ patch: null, loading: false, error: "" });
  const run = useCallback(
    (force) => {
      if (!has1688OrderNo(r)) return;
      if (!force && (!statusNeedsRefresh(r) || tried.has(r.orderNumber))) return;
      tried.add(r.orderNumber); // at most one automatic try per order per session
      setState((st) => ({ ...st, loading: true, error: "" }));
      refresh1688Status(kind, r)
        .then((patch) => setState({ patch, loading: false, error: "" }))
        .catch((e) => setState((st) => ({ ...st, loading: false, error: (e && e.message) || "Could not reach 1688" })));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kind, r.orderNumber, r.status1688CheckedAt]
  );
  useEffect(() => run(false), [run]);
  const merged = { ...r, ...(state.patch || {}) };
  return { status: merged.status1688 || "", checkedAt: merged.status1688CheckedAt, seller: merged.seller1688 || "", loading: state.loading, error: state.error, refresh: () => run(true) };
};

export const PurchaseReference = ({ kind, record: r }) => {
  const a = actual1688(r);
  const rate = buyRate(r);
  const orderNo = r.orderNumber || r.order1688Number || "";
  /* the China courier number(s) from 1688 — courierTrackingId is the BD
     courier, not this */
  const tracking = trackingNumbersOf(r).join(", ");
  const supplier = [r.shopName || r.store, r.purchasingSupplier].filter(has).filter((v, i, arr) => arr.indexOf(v) === i).join(" · ");
  const paid1688 =
    a.total > 0 || (r.creationTime1688 && num(r.creationTime1688.totalSuccessAmount) > 0)
      ? "Paid"
      : has(r.paymentLink1688)
        ? "Payment link created"
        : "Not purchased yet";
  const live = useStored1688Status(kind, r);
  const code = live.status;
  const st = STATUS_1688[code];
  const sellerCompany = live.seller;
  const address = chinaAddressText(r.chinaAddress);
  const localCourierTk = kind === "order" ? num(r.localShipping) : 0;
  const trackingNos = trackingNumbersOf(r);
  const statusPill = live.loading && !code ? (
    <span className="pr-st pr-st-gray"><i className="fa fa-spinner fa-spin" /> Checking 1688</span>
  ) : code ? (
    <span className={`pr-st pr-st-${st ? st.tone : "gray"}`} title={`1688 status code: ${code}`}>
      <span className="pr-st-dot" />
      {st ? st.label : code}
    </span>
  ) : (
    <span className="pr-st pr-st-gray" title={live.error || ""}>{paid1688}</span>
  );
  const Item = ({ label, children, mono }) => (
    <div className="pr-item">
      <span>{label}</span>
      <div className={`pr-val${mono ? " pr-mono" : ""}`}>{has(children) || React.isValidElement(children) ? children : <i className="pr-muted">Not set</i>}</div>
    </div>
  );
  const ledger = [
    { label: "Product amount", cny: a.total > 0 ? a.product : null },
    {
      label: "China local courier",
      cny: a.courier > 0 ? a.courier : null,
      note: !(a.courier > 0) && localCourierTk > 0 ? `${tk(localCourierTk)} charged to customer` : "",
    },
  ];
  return (
    <section className="pd-card ps-card pr-card">
      <Head
        icon="fa-external-link"
        title="1688 purchase & supplier reference"
        sub="Order reference, supplier and China-side purchase cost"
        badge="1688 source"
      />

      <div className="pr-top">
        <div className="pr-order">
          <span>1688 order number</span>
          <div className="pr-order-no">
            <code>{orderNo || "—"}</code>
            {orderNo && (
              <button type="button" className="pr-icon" title="Copy order number" onClick={() => copy(orderNo, "Order number")}>
                <i className="fa fa-clone" />
              </button>
            )}
          </div>
        </div>
        <div className="pr-status">
          <span>Order status</span>
          {statusPill}
        </div>
      </div>

      {has1688OrderNo(r) && (
        <div className="pr-fetch">
          <span title={live.error || ""}>
            <i className="fa fa-clock-o" />{" "}
            {live.checkedAt
              ? `Last fetched from 1688: ${new Date(Number(live.checkedAt)).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
              : "Not fetched from 1688 yet"}
            {live.error && <em> · last try failed ({live.error})</em>}
          </span>
          <button type="button" className="pr-refetch" onClick={live.refresh} disabled={live.loading}>
            <i className={`fa fa-refresh${live.loading ? " fa-spin" : ""}`} /> {live.loading ? "Fetching…" : "Refetch"}
          </button>
        </div>
      )}

      <div className="pr-grid">
        <Item label="Supplier / shop">{supplier || sellerCompany || ""}</Item>
        <Item label="Exchange rate">{rate > 0 ? `৳${rate.toFixed(2)} / ¥` : ""}</Item>
        <Item label="China tracking" mono>
          {trackingNos.length ? (
            <span className="pr-chips">
              {trackingNos.map((t) => (
                <span key={t} className="pr-chip" onClick={() => copy(t, "Tracking number")} title="Copy">{t}</span>
              ))}
            </span>
          ) : (
            ""
          )}
        </Item>
        <Item label="Purchase link">
          {has(r.purchaseLink) ? (
            <a href={r.purchaseLink} target="_blank" rel="noopener noreferrer" className="pr-link">Open on 1688 <i className="fa fa-external-link" /></a>
          ) : (
            ""
          )}
        </Item>
        {has(r.purchasingSupplierPayment) && <Item label="Supplier payment">{r.purchasingSupplierPayment}</Item>}
      </div>

      <div className="pr-address">
        <span className="pr-address-ic"><i className="fa fa-map-marker" /></span>
        <div>
          <span>China delivery warehouse</span>
          <p className={address ? "" : "pr-muted"}>{address || "Not chosen yet"}</p>
        </div>
        {address && (
          <button type="button" className="pr-icon" title="Copy address" onClick={() => copy(address, "Address")}>
            <i className="fa fa-clone" />
          </button>
        )}
      </div>

      <div className="pr-ledger">
        <div className="pr-ledger-head">
          <span>China-side cost</span>
          <span>CNY</span>
          <span>BDT</span>
        </div>
        {ledger.map((l) => (
          <div className="pr-ledger-row" key={l.label}>
            <span>{l.label}{l.note && <small>{l.note}</small>}</span>
            <span>{l.cny !== null ? cny(l.cny) : "—"}</span>
            <span>{l.cny !== null && rate > 0 ? tk(l.cny * rate) : "—"}</span>
          </div>
        ))}
        <div className="pr-ledger-row pr-ledger-total">
          <span>Actual order total</span>
          <span>{a.total > 0 ? cny(a.total) : "—"}</span>
          <span>{a.total > 0 && rate > 0 ? tk(a.total * rate) : "—"}</span>
        </div>
        {!(a.total > 0) && <div className="pr-ledger-note">Filled in once the order is paid on 1688.</div>}
      </div>
    </section>
  );
};
