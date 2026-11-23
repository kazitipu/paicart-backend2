import React, { Component, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { AdminDeliveryModal } from "../deliveryRequestCell.jsx";
import { DELIVERY_STATUSES, deliveryMethod } from "../../../constants/deliveryRequest";
import { cartonTotals, trackingNumbersOf } from "../../../constants/cartons";
import { getShipmentMode } from "../../../constants/shipment";
import { has1688OrderNo, refresh1688Trace, traceNeedsRefresh } from "./store1688";

const TRACE_TRIED = new Set();

/* Website order / product request details page:
 *   - FreightSummary: order-time shipping choice vs. the customer and the
 *     internal (cargo) rate, and what the cargo company bills us.
 *   - DeliveryRequestBar: the customer's (or admin-entered) delivery
 *     request, changeable here — same modal as the warehouse lists.
 *   - TrackingTimeline: China-side tracking (live 1688 logistics trace for
 *     the 1688 order number) and the Paicart CN → BD journey. */

const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};
const has = (v) => v !== undefined && v !== null && String(v).trim() !== "";
const tk = (v) => `৳${Math.round(num(v)).toLocaleString("en-IN")}`;
const uniq = (arr) => Array.from(new Set(arr.filter(has).map((v) => String(v).trim())));
const listOf = (v) =>
  Array.isArray(v) ? v : has(v) ? String(v).split(",").map((x) => x.trim()).filter(Boolean) : [];

const copy = (text) =>
  navigator.clipboard
    ? navigator.clipboard.writeText(text).then(() => toast.success("Copied"), () => toast.error("Could not copy"))
    : null;

const Head = ({ icon, title, sub, badge }) => (
  <div className="os-head">
    {icon && <span className="ps-ic"><i className={`fa ${icon}`} /></span>}
    <div className="ps-head-text">
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
    {badge && <span className="os-badge">{badge}</span>}
  </div>
);

/* ---------------------------------------------------------------------- */

const orderTimeWeight = (kind, r) => {
  if (kind === "order") {
    const w = (r.items || []).reduce((a, it) => a + num(it.weight), 0);
    return w > 0 ? Math.round(w * 100) / 100 : num(r.weight);
  }
  return num(r.weight);
};
const orderTimeRate = (kind, r) => {
  if (kind === "order") {
    const rates = uniq((r.items || []).map((it) => it.shippingRate));
    return rates.length ? rates.map((x) => `৳${x} / kg`).join(", ") : "";
  }
  return has(r.shippingRate) ? `৳${r.shippingRate} / kg` : "";
};

export const FreightSummary = ({ kind, record: r }) => {
  const mode = kind === "request" && r.shipmentMethod ? (r.shipmentMethod === "Sea" ? "Sea" : "Air") : getShipmentMode(r);
  const cartons = r.cartons || [];
  const totals = cartonTotals(cartons);
  const marks = uniq([...cartons.map((c) => c.shippingMark), ...listOf(r.shippingMark)]);
  const cargoRates = uniq([...cartons.map((c) => c.ratePerKg), ...listOf(r.cargoRate).map((x) => String(x).replace(/[^\d.]/g, ""))]);
  const actualKg = num(r.receivedWeight) || num(totals.bdWeight);
  const cargoRate = num(cargoRates[0]);
  const customerBill =
    num(r.shippingChargeCustomer) > 0
      ? num(r.shippingChargeCustomer)
      : actualKg > 0 && num(r.customerRate) > 0
        ? Math.round(actualKg * num(r.customerRate))
        : 0;
  const cargoBill = totals.cargoCharge > 0 ? totals.cargoCharge : actualKg > 0 && cargoRate > 0 ? actualKg * cargoRate : 0;
  const Cell = ({ label, value, soft }) => (
    <div className={`os-cell${soft ? " os-cell-soft" : ""}`}>
      <span>{label}</span>
      <b className={has(value) ? "" : "os-muted"}>{has(value) ? value : "Not set"}</b>
    </div>
  );
  return (
    <section className="pd-card os-card os-freight">
      <Head title="Shipment & freight summary" sub="Customer rate visibility and internal cargo settlement" badge="BDT · Per kg" />
      <div className="os-body">
        <div className="os-grid">
          <Cell label="Shipping method" value={`${mode} Shipment`} />
          <Cell label="Cargo name" value={r.cargoCompany} />
          <Cell label={marks.length > 1 ? `Shipping mark (${marks.length})` : "Shipping mark"} value={marks.join(", ")} />
          <Cell label="Order-time approximate weight" value={orderTimeWeight(kind, r) > 0 ? `${orderTimeWeight(kind, r)} kg` : ""} />
          <Cell label={`Order-time selected ${mode} rate`} value={orderTimeRate(kind, r)} />
          <Cell label="Cargo rate · internal" value={cargoRates.length ? cargoRates.map((x) => `৳${x} / kg`).join(", ") : ""} soft />
        </div>
        <div className="os-rate">
          <span>Shipment rate · customer</span>
          <div>
            <b>{num(r.customerRate) > 0 ? <>৳{r.customerRate}<em> / kg</em></> : <i className="os-muted">Not set</i>}</b>
            <span className="os-pill">Customer billing rate</span>
          </div>
        </div>
        <div className="os-bills">
        <div className="os-bill os-bill-customer">
          <span>Shipment bill · customer</span>
          <b>{customerBill > 0 ? tk(customerBill) : "—"}</b>
          <small>
            {customerBill > 0
              ? num(r.shippingChargeCustomer) > 0
                ? `Shipping charge billed to the customer${actualKg > 0 && num(r.customerRate) > 0 ? ` · ${actualKg} kg × ৳${r.customerRate}/kg` : ""}`
                : `${actualKg} kg × ৳${r.customerRate}/kg`
              : "After the parcel is weighed and the customer rate is set"}
          </small>
        </div>
        <div className="os-bill">
          <span>Shipment bill · cargo</span>
          <b>{cargoBill > 0 ? tk(cargoBill) : "—"}</b>
          <small>
            {cargoBill > 0
              ? totals.cargoCharge > 0
                ? `Internal freight cost · ${totals.count} carton${totals.count === 1 ? "" : "s"} · ${totals.bdWeight} kg`
                : `Internal freight cost · ${actualKg} kg × ৳${cargoRate}/kg`
              : "After the parcel is weighed and the cargo rate is set"}
          </small>
        </div>
        </div>
        {customerBill > 0 && cargoBill > 0 && (
          <div className={`os-margin ${customerBill - cargoBill >= 0 ? "is-pos" : "is-neg"}`}>
            <span>Shipping margin</span>
            <b>{customerBill - cargoBill >= 0 ? "" : "−"}{tk(Math.abs(customerBill - cargoBill))}</b>
          </div>
        )}
      </div>
    </section>
  );
};

/* ---------------------------------------------------------------------- */

export const DeliveryRequestBar = ({ kind, record, onChanged }) => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const [open, setOpen] = useState(false);
  const req = record.deliveryRequest && record.deliveryRequest.method ? record.deliveryRequest : null;
  const status = kind === "ship" ? record.status : record.orderStatus;
  const st = req ? DELIVERY_STATUSES[req.status] || DELIVERY_STATUSES.requested : null;
  const m = req ? deliveryMethod(req.method) : null;
  return (
    <section className="pd-card os-dr">
      <div className="os-dr-text">
        <span className="os-dr-label">Delivery request status</span>
        <div className="os-dr-line">
          <b>{req ? req.label || (m && m.label) || req.method : "None"}</b>
          {req ? (
            <>
              <span className={`os-dr-st os-dr-${req.status || "requested"}`}>{st.label}</span>
              <small>
                {req.source === "admin" ? `Entered by ${req.enteredBy || "admin"}` : "Requested by customer"}
                {req.requestedDate ? ` · ${req.requestedDate}` : ""}
                {req.address && req.method !== "office_pickup"
                  ? ` · ${[req.address.name, req.address.address, req.address.area, req.address.thana, req.address.district].filter(has).join(", ")}`
                  : ""}
              </small>
            </>
          ) : (
            <small>
              Not requested ·{" "}
              {status === "Paicart warehouse"
                ? `The customer can request delivery now (${kind === "ship" ? "booking" : kind === "request" ? "request" : "order"} is in Paicart warehouse).`
                : `The customer can request delivery once the ${kind === "ship" ? "booking" : kind === "request" ? "request" : "order"} reaches Paicart warehouse.`}
            </small>
          )}
        </div>
      </div>
      <button type="button" className="os-dr-btn" onClick={() => setOpen(true)}>
        <i className="fa fa-pencil" /> {req ? "Change request" : "Set request"}
      </button>
      {open && (
        <AdminDeliveryModal
          kind={kind}
          record={record}
          admin={admin}
          onClose={() => setOpen(false)}
          onSaved={() => onChanged && onChanged()}
        />
      )}
    </section>
  );
};

/* ---------------------------------------------------------------------- */

/* ---- tracking helpers ------------------------------------------------ */

const fmtWhen = (date, time) => [date, time].filter(has).join(" · ");

/* "dd/mm/yyyy" (+ "HH:MM:SS" / "10:25:12 AM") or "yyyy-mm-dd HH:MM:SS" → Date */
const toDate = (date, time) => {
  const d = String(date || "").trim();
  if (!d) return null;
  let y, m, day;
  const iso = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const gb = d.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (iso) [y, m, day] = [+iso[1], +iso[2], +iso[3]];
  else if (gb) [day, m, y] = [+gb[1], +gb[2], +gb[3]];
  else return null;
  let h = 0, min = 0, sec = 0;
  const t = String(time || (iso ? d.slice(10) : "")).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (t) {
    h = +t[1]; min = +t[2]; sec = +(t[3] || 0);
    if (t[4]) {
      const pm = t[4].toUpperCase() === "PM";
      if (pm && h < 12) h += 12;
      if (!pm && h === 12) h = 0;
    }
  }
  const out = new Date(y, m - 1, day, h, min, sec);
  return Number.isNaN(out.getTime()) ? null : out;
};
const ago = (when) => {
  if (!when) return "";
  const mins = Math.round((Date.now() - when.getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};
const span = (a, b) => {
  if (!a || !b) return "";
  const hrs = Math.max(0, (b.getTime() - a.getTime()) / 3600000);
  if (hrs < 1) return "< 1 h";
  if (hrs < 48) return `${Math.round(hrs)} h`;
  return `${Math.round(hrs / 24)} days`;
};
const shortDate = (d) =>
  d ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "";

const reached = (stages, key) => {
  const i = stages.findIndex((s) => s.key === key);
  return i >= 0 && (stages[i].done || has(stages[i].dateValue));
};

/* Steps marked done / current / upcoming, with the time each step took */
const withProgress = (steps) => {
  const lastDone = steps.reduce((acc, s, i) => (s.done ? i : acc), -1);
  let prev = null;
  return steps.map((s, i) => {
    const took = s.done && s.at && prev ? span(prev, s.at) : "";
    if (s.done && s.at) prev = s.at;
    return { ...s, state: i <= lastDone ? "done" : i === lastDone + 1 ? "current" : "next", took };
  });
};

const Leg = ({ tone, icon, title, sub, refs, refHint, steps, actions, children }) => {
  const done = steps.filter((s) => s.state === "done").length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const current = steps.find((s) => s.state === "current");
  return (
    <div className={`tl-leg tl-${tone}`}>
      <div className="tl-leg-head">
        <span className="tl-leg-ic"><i className={`fa ${icon}`} /></span>
        <div className="tl-leg-title">
          <b>{title}</b>
          <small>{sub}</small>
        </div>
        <div className="tl-ring" style={{ "--p": pct }}>
          <span>{done}/{steps.length}</span>
        </div>
      </div>

      <div className="tl-refs">
        <span className="tl-cap">{refHint}</span>
        <div className="tl-ref-row">
          {refs.length ? (
            refs.map((t) => (
              <span className="tl-ref" key={t}>
                <i className="fa fa-barcode" />
                {t}
                <button type="button" onClick={() => copy(t)} title="Copy"><i className="fa fa-clone" /></button>
              </span>
            ))
          ) : (
            <span className="tl-ref tl-ref-empty">Not available yet</span>
          )}
          {actions}
        </div>
      </div>

      <div className="tl-now">
        <span className="tl-cap">{current ? "Next milestone" : "Status"}</span>
        <b>{current ? current.label : done === steps.length ? "All milestones completed" : "Not started"}</b>
      </div>

      <ol className="tl-steps">
        {steps.map((s, i) => (
          <li key={i} className={`is-${s.state}`}>
            <span className="tl-node"><i className={`fa ${s.state === "done" ? "fa-check" : s.icon}`} /></span>
            <div className="tl-step">
              <div className="tl-step-top">
                <b>{s.label}</b>
                {s.state === "done" && <span className="tl-tag tl-tag-done">Done</span>}
                {s.state === "current" && <span className="tl-tag tl-tag-now">In progress</span>}
                {s.took && <span className="tl-took"><i className="fa fa-clock-o" /> {s.took}</span>}
              </div>
              <small>
                {s.state === "done" ? (s.at ? shortDate(s.at) : s.when || "Date not recorded") : s.hint || (s.state === "current" ? "Waiting for this step" : "Upcoming")}
              </small>
            </div>
          </li>
        ))}
      </ol>
      {children}
    </div>
  );
};

export class TrackingTimeline extends Component {
  /* trace = freshly fetched copy; otherwise the one stored on the record */
  state = { fetched: null, loading: false, error: "", showAll: false };

  componentDidMount() {
    this.maybeRefresh();
  }

  componentDidUpdate(prev) {
    if (prev.record.orderNumber !== this.props.record.orderNumber) this.maybeRefresh();
  }

  /* only when nothing is stored, it's stale and still changing — at most
     one automatic try per order per session */
  maybeRefresh = () => {
    const r = this.props.record;
    if (!traceNeedsRefresh(r) || TRACE_TRIED.has(r.orderNumber)) return;
    TRACE_TRIED.add(r.orderNumber);
    this.load();
  };

  load = async () => {
    const { kind, record } = this.props;
    if (!has1688OrderNo(record)) return;
    this.setState({ loading: true, error: "" });
    try {
      const fetched = await refresh1688Trace(kind, record);
      this.setState({ fetched, loading: false });
    } catch (e) {
      this.setState({ loading: false, error: (e && e.message) || "Could not load 1688 tracking" });
    }
  };

  render() {
    const { kind, record: r, stages } = this.props;
    const { fetched, loading, error, showAll } = this.state;
    const stored = fetched || (Array.isArray(r.trace1688) ? { trace1688: r.trace1688, trace1688CheckedAt: r.trace1688CheckedAt } : null);
    const trace = stored ? stored.trace1688 : null;
    const checkedAt = stored && stored.trace1688CheckedAt ? new Date(Number(stored.trace1688CheckedAt)) : null;

    /* 1688 logistics events, newest first */
    const events = [];
    (trace || []).forEach((t) =>
      (t.steps || []).forEach((s) => events.push({ at: toDate(s.at), raw: s.at || "", remark: s.remark || "", bill: t.bill }))
    );
    events.sort((a, b) => (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0));
    const firstEvent = events.length ? events[events.length - 1] : null;
    const billNos = uniq([...(trace || []).map((t) => t.bill), ...trackingNumbersOf(r)]);
    const courier = trace && trace[0] && trace[0].company;

    const stageAt = (key) => {
      const s = stages.find((x) => x.key === key);
      return s ? toDate(s.dateValue, s.timeValue) : null;
    };
    const stageWhen = (key) => {
      const s = stages.find((x) => x.key === key);
      return s ? fmtWhen(s.dateValue, s.timeValue) : "";
    };
    const cur = stages.findIndex((s) => s.key === (r.orderStatus || r.status));
    const isReached = (key) => {
      const i = stages.findIndex((s) => s.key === key);
      return (cur >= 0 && i >= 0 && i <= cur) || reached(stages, key);
    };
    const purchased = isReached("Purchased") || num(r.actual1688OrderTotal) > 0;
    const orderedAt = toDate(r.orderedDate || r.date, r.orderedTime || r.time);

    const china = withProgress([
      { label: "Order paid at supplier", icon: "fa-credit-card", done: purchased, at: stageAt("Purchased"), when: stageWhen("Purchased") },
      {
        label: "Supplier dispatched",
        icon: "fa-truck",
        done: events.length > 0 || trackingNumbersOf(r).length > 0,
        at: firstEvent && firstEvent.at,
        hint: "Seller hasn't handed the parcel to a courier yet",
      },
      { label: "Arrived China warehouse", icon: "fa-building-o", done: isReached("Received in Warehouse"), at: stageAt("Received in Warehouse"), when: stageWhen("Received in Warehouse") },
      { label: "China export handover", icon: "fa-share-square-o", done: isReached("Ready for fly"), at: stageAt("Ready for fly"), when: stageWhen("Ready for fly") },
    ]);

    const crossDef = [
      ["Received in Warehouse", "Received at Paicart CN hub", "fa-archive"],
      ["Ready for fly", null, "fa-plane"],
      ["Bangladesh customs", "Bangladesh customs", "fa-shield"],
      ["Bangladesh warehouse", "Customs released", "fa-check-square-o"],
      ["Paicart warehouse", "Paicart BD warehouse", "fa-home"],
      ["Delivered", "Delivered to customer", "fa-flag-checkered"],
    ];
    const cross = withProgress([
      { label: kind === "order" ? "Order registered" : "Request registered", icon: "fa-file-text-o", done: true, at: orderedAt, when: fmtWhen(r.orderedDate || r.date, r.orderedTime || r.time) },
      { label: "Sourcing & purchase", icon: "fa-shopping-cart", done: purchased, at: stageAt("Purchased"), when: stageWhen("Purchased") },
      ...crossDef.map(([key, label, icon]) => {
        const s = stages.find((x) => x.key === key);
        return { label: label || (s && s.label) || key, icon, done: isReached(key), at: stageAt(key), when: stageWhen(key) };
      }),
    ]);

    /* overall journey hero */
    const all = [...cross];
    const doneAll = all.filter((s) => s.state === "done").length;
    const pct = Math.round((doneAll / all.length) * 100);
    /* while the China leg is unfinished, its next step is what's pending */
    const chinaNow = china.find((s) => s.state === "current");
    const crossNow = all.find((s) => s.state === "current");
    const nowStep = chinaNow && crossNow && /CN hub/.test(crossNow.label) ? chinaNow : crossNow;
    const lastDone = [...all].reverse().find((s) => s.state === "done");
    const daysIn = orderedAt ? Math.max(0, Math.floor((Date.now() - orderedAt.getTime()) / 86400000)) : null;
    const latest = [events[0] && events[0].at, ...all.map((s) => s.at)].filter(Boolean).sort((a, b) => b - a)[0];
    const lots = uniq([...(r.cartons || []).map((c) => c.lotNo), ...listOf(r.lotNo)]);
    const totals = cartonTotals(r.cartons || []);
    const firstBill = billNos[0];

    return (
      <section className="pd-card tl-card">
        <div className="tl-hero">
          <div className="tl-hero-main">
            <span className="tl-cap tl-cap-light">Shipment tracking · up next</span>
            <h3>{nowStep ? nowStep.label : "Delivered to customer"}</h3>
            <p>
              {lastDone ? <>Last milestone: <b>{lastDone.label}</b>{lastDone.at ? ` · ${ago(lastDone.at)}` : ""}</> : "Waiting for the first milestone"}
            </p>
          </div>
          <div className="tl-kpis">
            <div><span>Journey</span><b>{pct}%</b></div>
            <div><span>Days in transit</span><b>{daysIn === null ? "—" : daysIn}</b></div>
            <div><span>Last update</span><b>{latest ? ago(latest) : "—"}</b></div>
            <div><span>Cartons</span><b>{totals.count || 0}</b></div>
          </div>
          <div className="tl-hero-bar">
            {all.map((s, i) => (
              <span key={i} className={`is-${s.state}`} title={`${s.label}${s.at ? ` · ${shortDate(s.at)}` : ""}`} />
            ))}
          </div>
        </div>

        <div className="tl-legs">
          <Leg
            tone="blue"
            icon="fa-cube"
            title="China logistics"
            sub={courier ? `${courier} · from 1688` : "China local courier · live from 1688"}
            refHint="China courier tracking"
            refs={billNos}
            steps={china}
            actions={
              <>
                {firstBill && (
                  <a className="tl-act" href={`https://www.kuaidi100.com/chaxun?nu=${encodeURIComponent(firstBill)}`} target="_blank" rel="noopener noreferrer">
                    <i className="fa fa-external-link" /> Track courier
                  </a>
                )}
                {has(r.orderNumber) && (
                  <button type="button" className="tl-act" onClick={this.load} disabled={loading}>
                    <i className={`fa fa-refresh${loading ? " fa-spin" : ""}`} /> {loading ? "Fetching…" : "Refetch"}
                  </button>
                )}
              </>
            }
          >
            <div className="tl-feed">
              <div className="tl-feed-head">
                <span className="tl-cap">Live 1688 logistics</span>
                <small title={error || ""}>
                  {checkedAt
                    ? `Last fetched: ${checkedAt.toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} (${ago(checkedAt)})`
                    : "Not fetched yet"}
                  {error ? " · last try failed" : ""}
                </small>
              </div>
              {error && !trace && <div className="tl-feed-empty tl-feed-err"><i className="fa fa-exclamation-circle" /> {error}</div>}
              {!has(r.orderNumber) && <div className="tl-feed-empty">No 1688 order number yet — live updates appear once the order is placed on 1688.</div>}
              {loading && !trace && <div className="tl-feed-empty"><i className="fa fa-spinner fa-spin" /> Loading from 1688…</div>}
              {trace && !events.length && !error && <div className="tl-feed-empty"><i className="fa fa-hourglass-half" /> 1688 has no courier updates yet — the seller hasn't shipped.</div>}
              {events.length > 0 && (
                <ul>
                  {(showAll ? events : events.slice(0, 4)).map((e, i) => (
                    <li key={i} className={i === 0 ? "is-latest" : ""}>
                      <span className="tl-feed-dot" />
                      <div>
                        <span className="tl-feed-text">{e.remark}</span>
                        <small>{e.at ? `${shortDate(e.at)} · ${ago(e.at)}` : e.raw}{billNos.length > 1 && e.bill ? ` · ${e.bill}` : ""}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {events.length > 4 && (
                <button type="button" className="tl-more" onClick={() => this.setState({ showAll: !showAll })}>
                  {showAll ? "Show less" : `Show all ${events.length} updates`} <i className={`fa fa-angle-${showAll ? "up" : "down"}`} />
                </button>
              )}
            </div>
          </Leg>

          <Leg
            tone="orange"
            icon="fa-plane"
            title="Paicart CN → BD"
            sub={`Cross-border · ${getShipmentMode(r)} shipment${r.cargoCompany ? ` · ${r.cargoCompany}` : ""}`}
            refHint={lots.length ? "Lot number" : `${kind === "order" ? "Order" : "Booking"} reference`}
            refs={lots.length ? lots : [kind === "order" ? r.orderId : r.bookingId].filter(has)}
            steps={cross}
          >
            {totals.count > 0 && (
              <div className="tl-chips">
                <span><i className="fa fa-cubes" /> {totals.count} carton{totals.count === 1 ? "" : "s"}</span>
                {num(totals.bdWeight) > 0 && <span><i className="fa fa-balance-scale" /> {totals.bdWeight} kg</span>}
                {num(totals.cbm) > 0 && <span><i className="fa fa-cube" /> {totals.cbm} CBM</span>}
              </div>
            )}
          </Leg>
        </div>
      </section>
    );
  }
}

/* ---------------------------------------------------------------------- */
/* Product requests (no 1688 API): the whole Paicart journey as one
   horizontal tracker — summary banner + icon stepper with dates and the
   time each stage took. */

const JOURNEY_ICONS = {
  Pending: "fa-file-text-o",
  "Rates Provided": "fa-tags",
  Purchased: "fa-shopping-cart",
  "Received in Warehouse": "fa-archive",
  "Ready for fly": "fa-plane",
  "Bangladesh customs": "fa-shield",
  "Bangladesh warehouse": "fa-check-square-o",
  "Paicart warehouse": "fa-home",
  Delivered: "fa-flag-checkered",
};

export const JourneyTracking = ({ kind, record: r, stages }) => {
  const status = kind === "ship" ? r.status : r.orderStatus;
  const cur = stages.findIndex((s) => s.key === (status || "Pending"));
  const rejected = /^reject/i.test(String(status || ""));
  const steps = withProgress(
    stages.map((s, i) => ({
      label: s.label,
      icon: JOURNEY_ICONS[s.key] || "fa-circle-o",
      done: (cur >= 0 && i <= cur) || has(s.dateValue),
      at: toDate(s.dateValue, s.timeValue),
      when: fmtWhen(s.dateValue, s.timeValue),
    }))
  );
  const done = steps.filter((s) => s.state === "done").length;
  const pct = Math.round((done / steps.length) * 100);
  const now = steps.find((s) => s.state === "current");
  const last = [...steps].reverse().find((s) => s.state === "done");
  const startAt = steps[0] && steps[0].at;
  const days = startAt ? Math.max(0, Math.floor((Date.now() - startAt.getTime()) / 86400000)) : null;
  const latest = steps.map((s) => s.at).filter(Boolean).sort((a, b) => b - a)[0];
  const nos = trackingNumbersOf(r);
  const lots = uniq([...(r.cartons || []).map((c) => c.lotNo), ...listOf(r.lotNo)]);
  const totals = cartonTotals(r.cartons || []);

  return (
    <section className="pd-card tl-card jt-card">
      <div className="tl-hero">
        <div className="tl-hero-main">
          <span className="tl-cap tl-cap-light">Shipment tracking · {rejected ? "rejected" : now ? "up next" : "completed"}</span>
          <h3>{rejected ? "Request rejected" : now ? now.label : "Delivered to customer"}</h3>
          <p>
            {last ? <>Last milestone: <b>{last.label}</b>{last.at ? ` · ${ago(last.at)}` : ""}</> : "Waiting for the first milestone"}
          </p>
        </div>
        <div className="tl-kpis">
          <div><span>Journey</span><b>{pct}%</b></div>
          <div><span>Days since request</span><b>{days === null ? "—" : days}</b></div>
          <div><span>Last update</span><b>{latest ? ago(latest) : "—"}</b></div>
          <div><span>Cartons</span><b>{totals.count || 0}</b></div>
        </div>
        <div className="tl-hero-bar">
          {steps.map((s, i) => (
            <span key={i} className={`is-${s.state}`} title={`${s.label}${s.at ? ` · ${shortDate(s.at)}` : ""}`} />
          ))}
        </div>
      </div>

      <div className="jt-body">
        <div className="jt-refs">
          <div>
            <span className="tl-cap">China tracking</span>
            <div className="tl-ref-row">
              {nos.length ? nos.map((t) => (
                <span className="tl-ref" key={t}><i className="fa fa-barcode" />{t}
                  <button type="button" onClick={() => copy(t)} title="Copy"><i className="fa fa-clone" /></button>
                </span>
              )) : <span className="tl-ref tl-ref-empty">Not available yet</span>}
            </div>
          </div>
          <div>
            <span className="tl-cap">Lot</span>
            <div className="tl-ref-row">
              {lots.length ? lots.map((t) => <span className="tl-ref" key={t}><i className="fa fa-tags" />{t}</span>) : <span className="tl-ref tl-ref-empty">Not assigned</span>}
            </div>
          </div>
          <div>
            <span className="tl-cap">Route</span>
            <div className="tl-ref-row">
              <span className="tl-ref jt-plain"><i className="fa fa-plane" />{getShipmentMode(r)}{r.cargoCompany ? ` · ${r.cargoCompany}` : ""}</span>
            </div>
          </div>
        </div>

        <ol className="jt-steps">
          {steps.map((s, i) => (
            <li key={i} className={`is-${s.state}`}>
              <span className="jt-line" />
              <span className="tl-node"><i className={`fa ${s.state === "done" ? "fa-check" : s.icon}`} /></span>
              <b>{s.label}</b>
              <small>{s.state === "done" ? (s.at ? shortDate(s.at) : "Done") : s.state === "current" ? "In progress" : "Upcoming"}</small>
              {s.took && <em><i className="fa fa-clock-o" /> {s.took}</em>}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
