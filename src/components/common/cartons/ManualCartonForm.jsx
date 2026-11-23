import React, { Component } from "react";
import { toast } from "react-toastify";
import { cargoFieldsFromCartons, legacyFieldsFromCartons, newManualCarton, trackingNumbersOf } from "../../../constants/cartons";
import { updateParcelRecordFields } from "../../../firebase/firebase.utils";
import "./CartonManager.css";

/* "Add carton manually" on a details page — the same form as the update
 * dialog's CartonManager, saved straight to the record (website order,
 * product request or Ship For Me): cartons, tracking numbers, the comma
 * trackingNo and the derived lot / carton / cargo fields, exactly as the
 * update dialog writes them. onSaved() reloads the page. */

const EMPTY = { cartonNo: "", trackingNo: "", cbm: "", cnWeight: "", bdWeight: "", ratePerKg: "", total: "" };
const toNum = (v) => {
  const n = parseFloat(v);
  return v === "" || v == null || !Number.isFinite(n) ? null : n;
};

class ManualCartonForm extends Component {
  state = { m: { ...EMPTY }, error: "", saving: false };

  set = (field, value) => this.setState((st) => ({ m: { ...st.m, [field]: value }, error: "" }));

  add = async () => {
    const { record, kind, onSaved } = this.props;
    const { m } = this.state;
    const cartonNo = m.cartonNo.trim();
    const trackingNo = m.trackingNo.trim();
    if (!cartonNo || !trackingNo) return this.setState({ error: "Carton no and tracking no are required." });
    const cartons = record.cartons || [];
    if (cartons.some((c) => c.trackingNo === trackingNo && String(c.cartonNo || "").trim().toLowerCase() === cartonNo.toLowerCase())) {
      return this.setState({ error: `Carton ${cartonNo} is already listed under ${trackingNo}.` });
    }
    const existing = trackingNumbersOf(record);
    const trackingNumbers = existing.includes(trackingNo) ? existing : [...existing, trackingNo];
    const next = [
      ...cartons,
      {
        ...newManualCarton(trackingNo),
        cartonNo,
        cbm: toNum(m.cbm),
        cnWeight: toNum(m.cnWeight),
        bdWeight: toNum(m.bdWeight),
        ratePerKg: toNum(m.ratePerKg),
        total: toNum(m.total),
      },
    ];
    this.setState({ saving: true });
    try {
      const id = kind === "order" ? record.orderId : record.bookingId;
      await updateParcelRecordFields(kind, id, {
        cartons: next,
        trackingNumbers,
        trackingNo: trackingNumbers.join(","),
        ...legacyFieldsFromCartons(next),
        ...cargoFieldsFromCartons(next),
      });
      toast.success(`Carton ${cartonNo} added`);
      /* keep the tracking no + rate for the next carton of the same parcel */
      this.setState({ m: { ...EMPTY, trackingNo, ratePerKg: m.ratePerKg }, saving: false });
      onSaved && onSaved();
    } catch (e) {
      this.setState({ saving: false, error: (e && e.message) || "Could not save the carton." });
    }
  };

  render() {
    const { record } = this.props;
    const { m, error, saving } = this.state;
    const nos = trackingNumbersOf(record);
    const listId = `mcf-tn-${record.orderId || record.bookingId || "x"}`;
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
          disabled={saving}
          onChange={(e) => this.set(field, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              this.add();
            }
          }}
        />
      </label>
    );
    const suggested = toNum(m.bdWeight) !== null && toNum(m.ratePerKg) !== null ? String(Math.round(toNum(m.bdWeight) * toNum(m.ratePerKg))) : "৳";
    return (
      <div className="cm-manual" style={{ marginTop: 14 }}>
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
            <button type="button" className="cm-btn cm-btn-primary" onClick={this.add} disabled={saving}>
              {saving ? "Saving…" : "+ Add carton"}
            </button>
          </div>
        </div>
        <datalist id={listId}>
          {nos.map((t) => <option key={t} value={t} />)}
        </datalist>
        {error && <div className="cm-manual-err">{error}</div>}
      </div>
    );
  }
}

export default ManualCartonForm;
