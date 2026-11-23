import React, { Component } from "react";
import "./CartonManager.css";
import { cargoChargeOf,
  fetchAlgCartons,
  mergeCartons,
  newManualCarton,
  cartonTotals,
  groupCartonsByTracking,
} from "../../../constants/cartons";

/* Tracking numbers + their cartons, as one controlled editor.

   Props
     trackingNumbers   string[]
     cartons           Carton[] (see constants/cartons.js)
     onChange({ trackingNumbers, cartons })
     estWeight         optional, customer's estimated weight (kg)
     onUseTotalWeight  optional, called with the BD-weight total
     fetchKey          optional, e.g. the record id; when it changes to a new
                       non-empty value the ALG lookup runs again (for modals
                       that stay mounted between records). */

const NUMERIC = ["cnWeight", "bdWeight", "cbm", "ratePerKg", "total"];

const splitNumbers = (text) =>
  String(text || "")
    .split(/[\s,;]+/)
    .map((t) => t.trim())
    .filter(Boolean);

const fmt = (n, d = 2) => {
  const v = parseFloat(n);
  if (!Number.isFinite(v)) return "—";
  return String(Math.round(v * 10 ** d) / 10 ** d);
};

const EMPTY_MANUAL = { cartonNo: "", trackingNo: "", cbm: "", cnWeight: "", bdWeight: "", ratePerKg: "", total: "" };
const toNum = (v) => {
  const n = parseFloat(v);
  return v === "" || v == null || !Number.isFinite(n) ? null : n;
};

class CartonManager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      draft: "",
      alg: {}, // { [trackingNo]: { loading, found, count, error } }
      raw: {}, // in-progress text of numeric inputs, keyed `${id}:${field}`
      manual: { ...EMPTY_MANUAL }, // "Add carton manually" form
      manualError: "",
    };
    this.autoFetched = false;
  }

  componentDidMount() {
    this._mounted = true;
    this.maybeAutoFetch();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.fetchKey !== this.props.fetchKey) {
      this.autoFetched = false;
      this.setState({ alg: {}, raw: {}, draft: "", manual: { ...EMPTY_MANUAL }, manualError: "" });
    }
    this.maybeAutoFetch();
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  maybeAutoFetch() {
    if (this.autoFetched) return;
    if ("fetchKey" in this.props && !this.props.fetchKey) return;
    const list = this.props.trackingNumbers || [];
    if (!list.length) return;
    this.autoFetched = true;
    this.fetchAlg(list);
  }

  emit = (trackingNumbers, cartons) => {
    this.props.onChange &&
      this.props.onChange({ trackingNumbers, cartons });
  };

  /* ── ALG lookup ─────────────────────────────────────────────── */
  fetchAlg = async (list) => {
    const nos = (list || this.props.trackingNumbers || []).filter(Boolean);
    if (!nos.length) return;
    this.autoFetched = true;
    const key = this.props.fetchKey;
    this.setState((s) => {
      const alg = { ...s.alg };
      nos.forEach((t) => (alg[t] = { ...(alg[t] || {}), loading: true }));
      return { alg };
    });
    const result = await fetchAlgCartons(nos);
    /* gone, or the modal moved on to another record meanwhile */
    if (!this._mounted || this.props.fetchKey !== key) return;

    this.setState((s) => {
      const alg = { ...s.alg };
      nos.forEach((t) => {
        const r = result[t] || {};
        alg[t] = {
          loading: false,
          found: !!r.found,
          count: (r.cartons || []).length,
          error: r.error || null,
        };
      });
      return { alg };
    });

    /* Merge against the latest props — the admin may have edited meanwhile. */
    const trackingNumbers = this.props.trackingNumbers || [];
    const anyFound = nos.some((t) => result[t] && result[t].found);
    if (anyFound) {
      this.emit(
        trackingNumbers,
        mergeCartons(this.props.cartons || [], result, trackingNumbers)
      );
    }
  };

  /* ── tracking-number chips ──────────────────────────────────── */
  addNumbers = (text) => {
    const existing = this.props.trackingNumbers || [];
    const fresh = Array.from(new Set(splitNumbers(text))).filter(
      (t) => !existing.includes(t)
    );
    this.setState({ draft: "" });
    if (!fresh.length) return;
    this.emit([...existing, ...fresh], this.props.cartons || []);
    /* look the new ones up straight away (after props catch up) */
    setTimeout(() => this._mounted && this.fetchAlg(fresh), 0);
  };

  /* "Add carton manually": any carton under any tracking number. A tracking
     number that isn't on the booking yet is added (and looked up on ALG). */
  setManual = (field, value) =>
    this.setState((st) => ({ manual: { ...st.manual, [field]: value }, manualError: "" }));

  addManualCarton = () => {
    const m = this.state.manual;
    const cartonNo = m.cartonNo.trim();
    const trackingNo = m.trackingNo.trim();
    if (!cartonNo || !trackingNo) {
      this.setState({ manualError: "Carton no and tracking no are required." });
      return;
    }
    const cartons = this.props.cartons || [];
    const dup = cartons.some(
      (c) => c.trackingNo === trackingNo && String(c.cartonNo || "").trim().toLowerCase() === cartonNo.toLowerCase()
    );
    if (dup) {
      this.setState({ manualError: `Carton ${cartonNo} is already listed under ${trackingNo}.` });
      return;
    }
    const existing = this.props.trackingNumbers || [];
    const isNewNumber = !existing.includes(trackingNo);
    const carton = {
      ...newManualCarton(trackingNo),
      cartonNo,
      cbm: toNum(m.cbm),
      cnWeight: toNum(m.cnWeight),
      bdWeight: toNum(m.bdWeight),
      ratePerKg: toNum(m.ratePerKg),
      total: toNum(m.total),
    };
    this.emit(isNewNumber ? [...existing, trackingNo] : existing, [...cartons, carton]);
    /* keep the tracking no + rate for the next carton of the same parcel */
    this.setState({
      manual: { ...EMPTY_MANUAL, trackingNo, ratePerKg: m.ratePerKg },
      manualError: "",
    });
    if (isNewNumber) setTimeout(() => this._mounted && this.fetchAlg([trackingNo]), 0);
  };

  renderManualForm() {
    const m = this.state.manual;
    const nos = this.props.trackingNumbers || [];
    const listId = `cm-tn-${this.props.fetchKey || "x"}`;
    const input = (field, label, opts = {}) => (
      <label className={`cm-mf-field ${opts.wide ? "cm-mf-wide" : ""}`}>
        <span>{label}{opts.required ? " *" : ""}</span>
        <input
          className="cm-in"
          type={opts.number ? "number" : "text"}
          step={opts.number ? "any" : undefined}
          min={opts.number ? "0" : undefined}
          list={opts.list}
          placeholder={opts.placeholder || ""}
          value={m[field]}
          onChange={(e) => this.setManual(field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.addManualCarton();
            }
          }}
        />
      </label>
    );
    const suggested =
      toNum(m.bdWeight) !== null && toNum(m.ratePerKg) !== null
        ? String(Math.round(toNum(m.bdWeight) * toNum(m.ratePerKg)))
        : "৳";
    return (
      <div className="cm-manual">
        <div className="cm-manual-head">
          <b>Add carton manually</b>
          <span>Works for any tracking number — a new number is added to the booking.</span>
        </div>
        <div className="cm-mf-grid">
          {input("cartonNo", "Carton no", { required: true, placeholder: "e.g. CB_744-566" })}
          {input("trackingNo", "Tracking no", { required: true, list: listId, placeholder: nos[0] || "Tracking number" })}
          {input("cbm", "Total CBM", { number: true, placeholder: "0.000" })}
          {input("cnWeight", "CN weight (kg)", { number: true, placeholder: "0.00" })}
          {input("bdWeight", "BD weight (kg)", { number: true, placeholder: "0.00" })}
          {input("ratePerKg", "Cargo rate / kg (optional)", { number: true, placeholder: "৳/kg" })}
          {input("total", "Cargo charge (optional)", { number: true, placeholder: suggested })}
          <div className="cm-mf-actions">
            <button type="button" className="cm-btn cm-btn-primary" onClick={this.addManualCarton}>
              + Add carton
            </button>
          </div>
        </div>
        <datalist id={listId}>
          {nos.map((t) => <option key={t} value={t} />)}
        </datalist>
        {this.state.manualError && <div className="cm-manual-err">{this.state.manualError}</div>}
      </div>
    );
  }

  removeNumber = (t) => {
    const cartons = this.props.cartons || [];
    const own = cartons.filter((c) => c.trackingNo === t);
    if (
      own.length &&
      !window.confirm(
        `Remove tracking no ${t}? Its ${own.length} carton${own.length > 1 ? "s" : ""} will be removed too.`
      )
    )
      return;
    this.emit(
      (this.props.trackingNumbers || []).filter((x) => x !== t),
      cartons.filter((c) => c.trackingNo !== t)
    );
    this.setState((s) => {
      const alg = { ...s.alg };
      delete alg[t];
      return { alg };
    });
  };

  onDraftKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (this.state.draft.trim()) this.addNumbers(this.state.draft);
    } else if (
      e.key === "Backspace" &&
      !this.state.draft &&
      (this.props.trackingNumbers || []).length
    ) {
      const list = this.props.trackingNumbers;
      this.removeNumber(list[list.length - 1]);
    }
  };

  onDraftChange = (e) => {
    const v = e.target.value;
    if (/[,\s;]/.test(v) && splitNumbers(v).length) {
      /* typed a separator — commit everything before the last separator */
      const endsWithSep = /[,\s;]$/.test(v);
      const parts = splitNumbers(v);
      if (endsWithSep) this.addNumbers(parts.join(","));
      else {
        const last = parts.pop();
        if (parts.length) this.addNumbers(parts.join(","));
        this.setState({ draft: last });
      }
      return;
    }
    this.setState({ draft: v });
  };

  onDraftPaste = (e) => {
    const text = (e.clipboardData || window.clipboardData).getData("text");
    if (splitNumbers(text).length > 1 || /[,\s;]/.test(text.trim())) {
      e.preventDefault();
      this.addNumbers(`${this.state.draft},${text}`);
    }
  };

  /* ── manual cartons ─────────────────────────────────────────── */
  addCarton = (trackingNo) => {
    this.emit(this.props.trackingNumbers || [], [
      ...(this.props.cartons || []),
      newManualCarton(trackingNo),
    ]);
  };

  deleteCarton = (id) => {
    this.emit(
      this.props.trackingNumbers || [],
      (this.props.cartons || []).filter((c) => c.id !== id)
    );
  };

  editCarton = (id, field, value) => {
    let stored = value;
    if (NUMERIC.includes(field)) {
      const key = `${id}:${field}`;
      this.setState((s) => ({ raw: { ...s.raw, [key]: value } }));
      const n = parseFloat(value);
      stored = value === "" || !Number.isFinite(n) ? null : n;
    }
    this.emit(
      this.props.trackingNumbers || [],
      (this.props.cartons || []).map((c) =>
        c.id === id ? { ...c, [field]: stored } : c
      )
    );
  };

  clearRaw = (id, field) => {
    const key = `${id}:${field}`;
    if (!(key in this.state.raw)) return;
    this.setState((s) => {
      const raw = { ...s.raw };
      delete raw[key];
      return { raw };
    });
  };

  numValue = (c, field) => {
    const key = `${c.id}:${field}`;
    if (key in this.state.raw) return this.state.raw[key];
    return c[field] === null || c[field] === undefined ? "" : String(c[field]);
  };

  /* ── render helpers ─────────────────────────────────────────── */
  renderStatus(t, group) {
    const a = this.state.alg[t];
    if (a && a.loading)
      return (
        <span className="cm-state cm-state-loading">
          <span className="cm-spin" /> Checking ALG…
        </span>
      );
    if (a && a.found)
      return (
        <span className="cm-state cm-state-ok">
          ALG · {a.count} carton{a.count === 1 ? "" : "s"}
        </span>
      );
    if (a && a.error)
      return (
        <span className="cm-state cm-state-err" title={a.error}>
          ALG lookup failed — enter cartons manually
        </span>
      );
    if (a)
      return (
        <span className="cm-state cm-state-warn">
          Not found in ALG — enter cartons manually
        </span>
      );
    if (group.source === "alg")
      return (
        <span className="cm-state cm-state-ok">
          ALG · {group.totals.count} saved
        </span>
      );
    return <span className="cm-state cm-state-idle">Not checked yet</span>;
  }

  renderCartonRow(c, idx) {
    const isAlg = c.source === "alg";
    const dims =
      c.length || c.width || c.height
        ? `${fmt(c.length, 1)}×${fmt(c.width, 1)}×${fmt(c.height, 1)}`
        : null;

    if (isAlg) {
      return (
        <tr key={c.id || idx} className="cm-row-alg">
          <td className="cm-td-idx">{idx + 1}</td>
          <td>
            <div className="cm-ctn">
              {c.cartonNo || "—"} <span className="cm-badge">ALG</span>
            </div>
            {dims && <div className="cm-sub">{dims} cm</div>}
          </td>
          <td className="cm-num">{fmt(c.cnWeight)}</td>
          <td className="cm-num">{fmt(c.bdWeight)}</td>
          <td className="cm-num">{fmt(c.cbm, 4)}</td>
          <td className="cm-num">{c.ratePerKg != null ? `৳${fmt(c.ratePerKg, 0)}` : "—"}</td>
          <td className="cm-num cm-strong">{cargoChargeOf(c) != null ? `৳${fmt(cargoChargeOf(c), 0)}` : "—"}</td>
          <td>{c.lotNo || "—"}</td>
          <td>
            {c.status ? <div className="cm-status">{c.status}</div> : "—"}
            {c.receivedDate && <div className="cm-sub">Rcvd {c.receivedDate}</div>}
          </td>
          <td />
        </tr>
      );
    }

    return (
      <tr key={c.id || idx} className="cm-row-manual">
        <td className="cm-td-idx">{idx + 1}</td>
        <td>
          <input
            className="cm-in"
            value={c.cartonNo || ""}
            placeholder="Carton no"
            onChange={(e) => this.editCarton(c.id, "cartonNo", e.target.value)}
          />
        </td>
        {NUMERIC.map((f) => (
          <td key={f}>
            <input
              className="cm-in cm-in-num"
              type="number"
              step="any"
              min="0"
              placeholder={
                f === "cbm" ? "0.000"
                : f === "ratePerKg" ? "৳/kg"
                : f === "total" ? (c.bdWeight != null && c.ratePerKg != null ? String(Math.round(c.bdWeight * c.ratePerKg)) : "৳")
                : "0.00"
              }
              title={f === "total" ? "Leave empty to use BD weight × rate" : undefined}
              value={this.numValue(c, f)}
              onChange={(e) => this.editCarton(c.id, f, e.target.value)}
              onBlur={() => this.clearRaw(c.id, f)}
            />
          </td>
        ))}
        <td>
          <input
            className="cm-in"
            value={c.lotNo || ""}
            placeholder="Lot"
            onChange={(e) => this.editCarton(c.id, "lotNo", e.target.value)}
          />
        </td>
        <td>
          <span className="cm-badge cm-badge-manual">Manual</span>
        </td>
        <td className="cm-td-act">
          <button
            type="button"
            className="cm-icon-btn"
            title="Delete carton"
            onClick={() => this.deleteCarton(c.id)}
          >
            ×
          </button>
        </td>
      </tr>
    );
  }

  renderGroup(group) {
    const t = group.trackingNo;
    const a = this.state.alg[t];
    const hasAlgRows = group.cartons.some((c) => c.source === "alg");
    const canEdit = !(a && a.found) && !hasAlgRows && !(a && a.loading);

    return (
      <div className="cm-group" key={t || "__blank"}>
        <div className="cm-group-head">
          <div className="cm-group-title">
            <span className="cm-tn">{t || "(no tracking no)"}</span>
            {this.renderStatus(t, group)}
          </div>
          {canEdit && (
            <button
              type="button"
              className="cm-btn cm-btn-soft"
              onClick={() => this.addCarton(t)}
            >
              + Add carton
            </button>
          )}
        </div>

        {group.cartons.length ? (
          <div className="cm-table-wrap">
            <table className="cm-table">
              <thead>
                <tr>
                  <th className="cm-td-idx">#</th>
                  <th>Carton no</th>
                  <th className="cm-num">CN wt (kg)</th>
                  <th className="cm-num">BD wt (kg)</th>
                  <th className="cm-num">CBM</th>
                  <th className="cm-num">Rate/kg</th>
                  <th className="cm-num">Cargo charge</th>
                  <th>Lot</th>
                  <th>Status</th>
                  <th className="cm-td-act" />
                </tr>
              </thead>
              <tbody>{group.cartons.map((c, i) => this.renderCartonRow(c, i))}</tbody>
              <tfoot>
                <tr>
                  <td />
                  <td>
                    {group.totals.count} carton{group.totals.count === 1 ? "" : "s"}
                  </td>
                  <td className="cm-num">{fmt(group.totals.cnWeight)}</td>
                  <td className="cm-num">{fmt(group.totals.bdWeight)}</td>
                  <td className="cm-num">{fmt(group.totals.cbm, 4)}</td>
                  <td />
                  <td className="cm-num cm-strong">৳{fmt(group.totals.cargoCharge, 0)}</td>
                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="cm-empty">
            {a && a.loading
              ? "Looking up cartons on ALG…"
              : canEdit
              ? "No cartons yet. Use “Add carton” to enter them by hand."
              : "No cartons."}
          </div>
        )}
      </div>
    );
  }

  render() {
    const trackingNumbers = this.props.trackingNumbers || [];
    const cartons = this.props.cartons || [];
    const { estWeight, onUseTotalWeight } = this.props;
    const groups = groupCartonsByTracking(cartons, trackingNumbers);
    const totals = cartonTotals(cartons);
    const anyLoading = Object.values(this.state.alg).some((a) => a && a.loading);

    return (
      <div className="cm-root">
        {/* chips + input */}
        <div className="cm-top">
          <div
            className="cm-chipbox"
            onClick={() => this.draftInput && this.draftInput.focus()}
          >
            {trackingNumbers.map((t) => {
              const a = this.state.alg[t];
              const tone = a
                ? a.loading
                  ? "loading"
                  : a.found
                  ? "ok"
                  : a.error
                  ? "err"
                  : "warn"
                : "idle";
              return (
                <span key={t} className={`cm-chip cm-chip-${tone}`}>
                  {a && a.loading ? <span className="cm-spin cm-spin-sm" /> : <span className="cm-chip-dot" />}
                  {t}
                  <button
                    type="button"
                    className="cm-chip-x"
                    aria-label={`Remove ${t}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      this.removeNumber(t);
                    }}
                  >
                    ×
                  </button>
                </span>
              );
            })}
            <input
              ref={(el) => (this.draftInput = el)}
              className="cm-chip-input"
              value={this.state.draft}
              placeholder={
                trackingNumbers.length
                  ? "Add another…"
                  : "Type or paste tracking numbers, press Enter"
              }
              onChange={this.onDraftChange}
              onKeyDown={this.onDraftKeyDown}
              onPaste={this.onDraftPaste}
              onBlur={() => this.state.draft.trim() && this.addNumbers(this.state.draft)}
            />
          </div>
          <button
            type="button"
            className="cm-btn cm-btn-primary"
            disabled={!trackingNumbers.length || anyLoading}
            onClick={() => this.fetchAlg(trackingNumbers)}
          >
            {anyLoading ? (
              <>
                <span className="cm-spin cm-spin-light" /> Fetching…
              </>
            ) : (
              "⟳ Fetch from ALG"
            )}
          </button>
        </div>
        <div className="cm-hint">
          Separate several numbers with commas, spaces or new lines. Cartons
          come from ALG when it knows the number; otherwise enter them by hand.
        </div>

        {/* groups */}
        {groups.length ? (
          <div className="cm-groups">{groups.map((g) => this.renderGroup(g))}</div>
        ) : (
          <div className="cm-empty cm-empty-big">No tracking numbers yet.</div>
        )}

        {this.renderManualForm()}

        {/* grand total */}
        {cartons.length > 0 && (
          <div className="cm-total">
            <div className="cm-total-items">
              <div className="cm-total-item">
                <span>Cartons</span>
                <b>{totals.count}</b>
              </div>
              <div className="cm-total-item">
                <span>CN weight</span>
                <b>{fmt(totals.cnWeight)} kg</b>
              </div>
              <div className="cm-total-item cm-total-strong">
                <span>BD weight</span>
                <b>{fmt(totals.bdWeight)} kg</b>
              </div>
              <div className="cm-total-item">
                <span>CBM</span>
                <b>{fmt(totals.cbm, 4)}</b>
              </div>
              <div className="cm-total-item">
                <span>Cargo charge</span>
                <b>৳{fmt(totals.cargoCharge, 0)}</b>
              </div>
            </div>
            {(onUseTotalWeight || estWeight) && (
              <div className="cm-total-actions">
                {estWeight ? (
                  <span className="cm-est">Customer est. {estWeight} kg</span>
                ) : null}
                {onUseTotalWeight && (
                  <button
                    type="button"
                    className="cm-btn cm-btn-soft"
                    disabled={!(totals.bdWeight > 0)}
                    onClick={() => onUseTotalWeight(totals.bdWeight)}
                  >
                    Use BD total as received weight ({fmt(totals.bdWeight)} kg)
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

export default CartonManager;
