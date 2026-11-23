import React, { Component } from "react";
import { toast } from "react-toastify";
import {
  cartonTotals,
  cargoChargeOf,
  groupCartonsByTracking,
} from "../../../constants/cartons";
import "./CartonBreakdown.css";

/* Read-only cartons of a record, grouped by tracking number (admin details
 * page).
 *
 * Props:
 *   cartons          Carton[] (see constants/cartons.js)
 *   trackingNumbers  string[] — order of the groups; numbers without cartons
 *                    still get a card
 *   lookups          optional { [trackingNo]: { found, cartons, error } } from
 *                    fetchAlgCartons — shown as each group's ALG status
 *   loading          optional — ALG is being asked right now */

const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : null;
};
const fmt = (v, d = 2) => (n(v) === null ? "—" : String(Math.round(n(v) * 10 ** d) / 10 ** d));
const tk = (v) => (n(v) === null ? "—" : `৳${Math.round(n(v)).toLocaleString("en-IN")}`);

const dims = (c) => {
  const p = [c.length, c.width, c.height].map(n);
  return p.some((x) => x && x > 0) ? p.map((x) => (x === null ? "?" : x)).join(" × ") : null;
};

const statusTone = (s) => {
  const v = String(s || "").toLowerCase();
  if (!v) return "";
  if (v.includes("deliver")) return "cb-st-green";
  if (v.includes("warehouse") || v.includes("received")) return "cb-st-blue";
  if (v.includes("transit") || v.includes("fly") || v.includes("ship")) return "cb-st-orange";
  return "cb-st-gray";
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`Copied ${text}`);
  } catch (e) {
    toast.error("Could not copy");
  }
};

const Tile = ({ icon, label, value, sub, tone }) => (
  <div className={`cb-tile ${tone ? `cb-tile-${tone}` : ""}`}>
    <span className="cb-tile-ic">
      <i className={`fa ${icon}`} />
    </span>
    <div className="cb-tile-body">
      <span className="cb-tile-label">{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  </div>
);

class CartonBreakdown extends Component {
  state = { collapsed: {} };

  toggle = (key) =>
    this.setState((s) => ({ collapsed: { ...s.collapsed, [key]: !s.collapsed[key] } }));

  groupStatus(g) {
    const { lookups, loading } = this.props;
    const a = lookups && lookups[g.trackingNo];
    if (loading && !a) return <span className="cb-pill cb-pill-wait"><i className="fa fa-circle-o-notch fa-spin" /> Checking ALG</span>;
    if (a && a.found)
      return (
        <span className="cb-pill cb-pill-alg">
          <i className="fa fa-check-circle" /> Verified · {a.cartons.length} on ALG
        </span>
      );
    if (g.source === "alg")
      return <span className="cb-pill cb-pill-alg"><i className="fa fa-check-circle" /> From ALG</span>;
    if (g.cartons.length)
      return <span className="cb-pill cb-pill-manual"><i className="fa fa-pencil" /> Entered manually</span>;
    if (a && a.error)
      return <span className="cb-pill cb-pill-miss"><i className="fa fa-exclamation-circle" /> ALG lookup failed</span>;
    return <span className="cb-pill cb-pill-miss"><i className="fa fa-question-circle" /> Not on ALG</span>;
  }

  renderTable(g) {
    const showProduct = g.cartons.some((c) => c.productName || c.imageUrl);
    const showCargo = g.cartons.some((c) => n(c.ratePerKg) !== null || cargoChargeOf(c) !== null);
    return (
      <div className="cb-table-wrap">
        <table className="cb-table">
          <thead>
            <tr>
              <th className="cb-idx">#</th>
              <th>Carton</th>
              {showProduct && <th>Product</th>}
              <th className="cb-num">CN weight</th>
              <th className="cb-num">BD weight</th>
              <th className="cb-num">CBM</th>
              <th>Size (cm)</th>
              {showCargo && <th className="cb-num">Rate</th>}
              {showCargo && <th className="cb-num">Cargo charge</th>}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {g.cartons.map((c, i) => {
              const cn = n(c.cnWeight);
              const bd = n(c.bdWeight);
              const delta = cn !== null && bd !== null ? Math.round((bd - cn) * 100) / 100 : null;
              return (
                <tr key={c.id || i}>
                  <td className="cb-idx">{i + 1}</td>
                  <td>
                    <span className="cb-ctn">{c.cartonNo || "—"}</span>
                    {c.source === "manual" && g.source !== "manual" && <span className="cb-mini">manual</span>}
                    {c.lotNo && <div className="cb-sub">Lot {c.lotNo}</div>}
                  </td>
                  {showProduct && (
                    <td>
                      <div className="cb-product">
                        {c.imageUrl ? (
                          <a href={c.imageUrl} target="_blank" rel="noopener noreferrer">
                            <img src={c.imageUrl} alt="" />
                          </a>
                        ) : (
                          <span className="cb-noimg"><i className="fa fa-cube" /></span>
                        )}
                        <span className="cb-product-name">
                          {c.productName || "—"}
                          {n(c.quantity) !== null && <em>{c.quantity} pcs</em>}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="cb-num">{cn === null ? "—" : <>{fmt(cn)}<span className="cb-unit">kg</span></>}</td>
                  <td className="cb-num">
                    {bd === null ? "—" : <b>{fmt(bd)}<span className="cb-unit">kg</span></b>}
                    {delta !== null && delta !== 0 && (
                      <div className={`cb-delta ${delta > 0 ? "is-up" : "is-down"}`}>
                        {delta > 0 ? "+" : "−"}{Math.abs(delta)} kg
                      </div>
                    )}
                  </td>
                  <td className="cb-num">{fmt(c.cbm, 4)}</td>
                  <td className="cb-dim">{dims(c) || "—"}</td>
                  {showCargo && <td className="cb-num">{n(c.ratePerKg) === null ? "—" : `৳${fmt(c.ratePerKg, 0)}/kg`}</td>}
                  {showCargo && <td className="cb-num cb-strong">{tk(cargoChargeOf(c))}</td>}
                  <td>
                    {c.status ? <span className={`cb-status ${statusTone(c.status)}`}>{c.status}</span> : <span className="cb-muted">—</span>}
                    {c.receivedDate && <div className="cb-sub">Rcvd {c.receivedDate}</div>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  render() {
    const { cartons, trackingNumbers, loading } = this.props;
    const groups = groupCartonsByTracking(cartons || [], trackingNumbers || []);
    const totals = cartonTotals(cartons || []);

    if (!groups.length) {
      return (
        <div className="cb-empty-all">
          <span className="cb-empty-ic"><i className="fa fa-barcode" /></span>
          <b>{loading ? "Looking up cartons…" : "No tracking number yet"}</b>
          <small>Add tracking numbers and cartons from the Update window.</small>
        </div>
      );
    }

    return (
      <div className="cb-wrap">
        {/* overview */}
        <div className="cb-tiles">
          <Tile icon="fa-barcode" label="Tracking nos" value={groups.length} />
          <Tile icon="fa-cubes" label="Cartons" value={totals.count} tone="blue" />
          <Tile icon="fa-globe" label="CN weight" value={`${fmt(totals.cnWeight)} kg`} sub="at China warehouse" />
          <Tile icon="fa-balance-scale" label="BD weight" value={`${fmt(totals.bdWeight)} kg`} sub="at Bangladesh" tone="orange" />
          <Tile icon="fa-cube" label="Total CBM" value={fmt(totals.cbm, 4)} />
          {totals.cargoCharge > 0 && <Tile icon="fa-truck" label="Cargo charge" value={tk(totals.cargoCharge)} tone="green" />}
        </div>

        {groups.map((g) => {
          const key = g.trackingNo || "__none";
          const open = !this.state.collapsed[key];
          return (
            <div className={`cb-card ${open ? "is-open" : ""}`} key={key}>
              <div className="cb-card-head">
                <button type="button" className="cb-head-main" onClick={() => this.toggle(key)} aria-expanded={open}>
                  <span className="cb-track-ic"><i className="fa fa-barcode" /></span>
                  <span className="cb-track-text">
                    <span className="cb-kicker">Tracking no</span>
                    <span className="cb-track-no">{g.trackingNo || "Without tracking no"}</span>
                  </span>
                  {this.groupStatus(g)}
                </button>
                <div className="cb-head-side">
                  <span className="cb-chip"><b>{g.totals.count}</b> ctn</span>
                  <span className="cb-chip"><b>{fmt(g.totals.bdWeight)}</b> kg</span>
                  <span className="cb-chip"><b>{fmt(g.totals.cbm, 3)}</b> cbm</span>
                  {g.trackingNo && (
                    <button type="button" className="cb-icon-btn" title="Copy tracking no" onClick={() => copy(g.trackingNo)}>
                      <i className="fa fa-clone" />
                    </button>
                  )}
                  <button type="button" className="cb-icon-btn" title={open ? "Collapse" : "Expand"} onClick={() => this.toggle(key)}>
                    <i className={`fa fa-chevron-${open ? "up" : "down"}`} />
                  </button>
                </div>
              </div>

              {open &&
                (g.cartons.length === 0 ? (
                  <div className="cb-none">
                    {loading ? (
                      <span className="cb-shimmer">Checking ALG for cartons…</span>
                    ) : (
                      <>
                        <span className="cb-none-ic"><i className="fa fa-inbox" /></span>
                        <span>
                          <b>No cartons yet</b>
                          <small>ALG doesn&apos;t know this number. Add its cartons from Update → Tracking &amp; Cartons.</small>
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  this.renderTable(g)
                ))}
            </div>
          );
        })}
      </div>
    );
  }
}

export default CartonBreakdown;
