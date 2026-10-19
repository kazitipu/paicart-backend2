import React, { Component, Fragment } from "react";
import ReactToPrint from "react-to-print";
import { Printer, Download } from "react-feather";
import Breadcrumb from "../common/breadcrumb";
import PaicartLogo from "../common/paicart_logo.png";
import { getCustomReleasedParcels } from "../../firebase/firebase.utils";

/* Cargo Collection Sheet.
 *
 * Everything at "Custom released" (stored "Bangladesh warehouse") across 1688
 * orders, product requests and Ship For Me bookings, as one printable sheet an
 * employee takes to the cargo company to collect the cartons. Several orders
 * go on one sheet, grouped By Air / By Sea.
 *
 * The cargo rate and bill are shown to staff on screen only: printing and the
 * PDF re-render the sheet without them, and the sheet never carries customer
 * names, phones or prices. */

const C = {
  brand: "#FF6A00",
  ink: "#111827",
  text: "#374151",
  muted: "#6B7280",
  line: "#E5E7EB",
  soft: "#F9FAFB",
};

/* Carton numbers, marks, tracking, cargo rate/bill are stored as arrays, as
   JSON-encoded arrays ('["CB_739mix-389"]') or as comma strings. */
/* Entries an earlier save wrote as "undefined tk/kg", "NaN Tk", … */
const isJunk = (v) => !v || /\b(undefined|null|NaN)\b/.test(v);

const parseList = (value) => {
  if (Array.isArray(value)) return value.map((v) => String(v == null ? "" : v).trim()).filter((v) => !isJunk(v));
  const text = String(value == null ? "" : value).trim();
  if (!text) return [];
  if (text.startsWith("[")) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parseList(parsed);
    } catch (e) {
      /* not JSON — fall through to the comma split */
    }
  }
  return text.split(",").map((v) => v.trim()).filter((v) => !isJunk(v));
};

const methodOf = (record, shipment) => {
  const raw = shipment
    ? record.shipBy || record.method || record.shipmentMethod
    : record.shipmentMethod || record.shipBy || record.method;
  return String(raw || "").trim().toLowerCase() === "sea" ? "Sea" : "Air";
};

const kg = (value) => {
  const n = parseFloat(value);
  return n > 0 ? n : null;
};

/* One sheet row per order / request / booking */
const toRow = (kind, record) => {
  const shipment = kind === "Ship For Me";
  const id = kind === "1688 Order" ? record.orderId : record.bookingId;
  const product =
    kind === "1688 Order"
      ? (record.items || []).map((item) => item && item.name).filter(Boolean).join("; ")
      : kind === "Product Request"
        ? record.productType
        : record.othersProductName;
  const tracking = (shipment && Array.isArray(record.trackingNumbers) && record.trackingNumbers.length
    ? parseList(record.trackingNumbers)
    : parseList(record.trackingNo)
  ).filter((t) => t !== "0");
  return {
    key: `${kind}-${id}`,
    kind,
    id: String(id || ""),
    method: methodOf(record, shipment),
    cargo: record.cargoCompany || "—",
    marks: parseList(record.shippingMark),
    product: product || "—",
    tracking,
    cartons: parseList(record.ctnNo),
    cnWeight: kg(record.chineseWeight),
    bdWeight: kg(record.bdWeight) || kg(record.receivedWeight),
    rate: parseList(record.cargoRate).join(", "),
    bill: parseList(record.shippingChargeCargo).join(", "),
    releasedOn: record["Bangladesh warehouseDate"] || "",
  };
};

const pad = (n) => String(n).padStart(2, "0");
const newSheetNo = () => {
  const d = new Date();
  return `CS-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
};

const SHEET_PRINT_CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .cargo-sheet { box-shadow: none !important; border-radius: 0 !important; padding: 0 !important; }
  .cargo-sheet * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/* The printable document. showFinance only ever true on screen. */
const CargoSheet = ({ rows, showFinance, sheetNo, cargoLabel, sheetRef }) => {
  const groups = ["Air", "Sea"]
    .map((method) => ({ method, rows: rows.filter((r) => r.method === method) }))
    .filter((g) => g.rows.length);
  const cartonCount = rows.reduce((n, r) => n + r.cartons.length, 0);
  const bdTotal = rows.reduce((n, r) => n + (r.bdWeight || 0), 0);
  const th = {
    textAlign: "left",
    padding: "7px 8px",
    fontSize: 10,
    fontWeight: 800,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: "0.05em",
    borderBottom: `1px solid ${C.line}`,
    background: C.soft,
    whiteSpace: "nowrap",
  };
  const td = {
    padding: "7px 8px",
    fontSize: 11,
    color: C.text,
    borderBottom: `1px solid ${C.line}`,
    verticalAlign: "top",
  };
  const list = (items) =>
    items.length ? items.map((t, i) => <div key={i}>{t}</div>) : "—";

  return (
    <div
      ref={sheetRef}
      className="cargo-sheet"
      style={{
        background: "#fff",
        color: C.text,
        borderRadius: 10,
        padding: "10mm",
        boxShadow: "0 1px 3px rgba(17,24,39,.08)",
        fontFamily: "inherit",
      }}
    >
      <style>{SHEET_PRINT_CSS}</style>
      <div style={{ height: 5, background: C.brand, margin: "-10mm -10mm 8mm" }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
        <div>
          <img src={PaicartLogo} alt="Paicart" style={{ height: 30, display: "block", marginBottom: 6 }} />
          <div style={{ fontSize: 10, color: C.muted, lineHeight: 1.6 }}>
            Suite#F2, (2nd floor) Tropical Razia Shopping Complex, 26/1 Chamelibagh, Shantinagar, Dhaka 1217
            <br />
            +88-01629773885 · support@paicart.com
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", color: C.ink }}>
            CARGO COLLECTION SHEET
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
            Sheet <b style={{ color: C.ink }}>{sheetNo}</b> · {new Date().toLocaleDateString("en-GB")}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
            Cargo: <b style={{ color: C.ink }}>{cargoLabel}</b>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, margin: "14px 0 6px" }}>
        {[
          ["Orders / bookings", rows.length],
          ["Cartons", cartonCount],
          ["BD weight", `${Math.round(bdTotal * 100) / 100} kg`],
        ].map(([label, value]) => (
          <div key={label} style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "8px 12px", background: C.soft }}>
            <div style={{ fontSize: 9, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginTop: 2 }}>{value}</div>
          </div>
        ))}
      </div>

      {groups.length === 0 && (
        <p style={{ textAlign: "center", color: C.muted, padding: "40px 0" }}>Nothing selected.</p>
      )}

      {groups.map((group) => (
        <div key={group.method} style={{ marginTop: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span style={{ width: 4, height: 14, borderRadius: 2, background: C.brand, display: "inline-block" }} />
            <span style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>
              By {group.method} ({group.rows.length})
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.line}` }}>
            <thead>
              <tr>
                {["#", "Type", "Order / Booking ID", "Cargo", "Shipping Mark", "Product", "Tracking No", "Carton No", "CN Wt", "BD Wt"].map((h) => (
                  <th key={h} style={th}>{h}</th>
                ))}
                {showFinance && <th style={{ ...th, color: C.brand }}>Rate</th>}
                {showFinance && <th style={{ ...th, color: C.brand }}>Bill</th>}
              </tr>
            </thead>
            <tbody>
              {group.rows.map((r, i) => (
                <tr key={r.key}>
                  <td style={{ ...td, color: C.muted }}>{i + 1}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{r.kind}</td>
                  <td style={{ ...td, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{r.id}</td>
                  <td style={td}>{r.cargo}</td>
                  <td style={{ ...td, fontWeight: 700, color: C.ink }}>{list(r.marks)}</td>
                  <td style={{ ...td, maxWidth: 220 }}>{r.product}</td>
                  <td style={td}>{list(r.tracking)}</td>
                  <td style={{ ...td, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>{list(r.cartons)}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{r.cnWeight ? `${r.cnWeight} kg` : "—"}</td>
                  <td style={{ ...td, whiteSpace: "nowrap" }}>{r.bdWeight ? `${r.bdWeight} kg` : "—"}</td>
                  {showFinance && <td style={{ ...td, whiteSpace: "nowrap", color: C.brand }}>{r.rate || "—"}</td>}
                  {showFinance && <td style={{ ...td, whiteSpace: "nowrap", color: C.brand }}>{r.bill || "—"}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}

      <div style={{ display: "flex", gap: 40, marginTop: 40 }}>
        {["Handed over by (cargo)", "Collected by (Paicart)", "Date & time"].map((label) => (
          <div key={label} style={{ flex: 1 }}>
            <div style={{ borderTop: `1px solid ${C.ink}`, paddingTop: 6, fontSize: 10, color: C.muted }}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, fontSize: 9, color: C.muted, textAlign: "center" }}>
        Paicart · Please hand over every carton listed above to the bearer of this sheet.
      </div>
    </div>
  );
};

const buttonStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 10,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid #e5e7eb",
};

export class CargoCollection extends Component {
  state = {
    loading: true,
    rows: [],
    cargo: "All",
    method: "All",
    search: "",
    selected: {},
    forPrint: false,
    downloading: false,
    sheetNo: newSheetNo(),
  };

  componentDidMount = async () => {
    const { orders, productRequests, shipments } = await getCustomReleasedParcels();
    const rows = [
      ...orders.map((r) => toRow("1688 Order", r)),
      ...productRequests.map((r) => toRow("Product Request", r)),
      ...shipments.map((r) => toRow("Ship For Me", r)),
    ].sort((a, b) => a.cargo.localeCompare(b.cargo) || a.id.localeCompare(b.id));
    this.setState({ rows, loading: false });
  };

  visibleRows = () => {
    const { rows, cargo, method, search } = this.state;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (cargo === "All" || r.cargo === cargo) &&
        (method === "All" || r.method === method) &&
        (!q ||
          [r.id, r.product, ...r.marks, ...r.tracking, ...r.cartons].some((v) =>
            String(v).toLowerCase().includes(q)
          ))
    );
  };

  /* Ticked rows if any are ticked, otherwise everything the filters show */
  sheetRows = () => {
    const visible = this.visibleRows();
    const ticked = visible.filter((r) => this.state.selected[r.key]);
    return ticked.length ? ticked : visible;
  };

  toggle = (key) =>
    this.setState(({ selected }) => ({ selected: { ...selected, [key]: !selected[key] } }));

  toggleAll = (visible, on) =>
    this.setState(({ selected }) => {
      const next = { ...selected };
      visible.forEach((r) => {
        next[r.key] = on;
      });
      return { selected: next };
    });

  /* The sheet without Rate/Bill, for print and PDF */
  hideFinance = () =>
    new Promise((resolve) => this.setState({ forPrint: true, sheetNo: newSheetNo() }, resolve));

  downloadPdf = async () => {
    if (this.state.downloading) return;
    this.setState({ downloading: true });
    await this.hideFinance();
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(this.sheetRef, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const w = pdf.internal.pageSize.getWidth();
      const h = pdf.internal.pageSize.getHeight();
      const imgH = (canvas.height * w) / canvas.width;
      let left = imgH;
      let y = 0;
      pdf.addImage(img, "PNG", 0, y, w, imgH);
      left -= h;
      while (left > 0) {
        y = left - imgH;
        pdf.addPage();
        pdf.addImage(img, "PNG", 0, y, w, imgH);
        left -= h;
      }
      pdf.save(`Paicart-${this.state.sheetNo}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Could not generate the PDF. Try Print instead.");
    } finally {
      this.setState({ forPrint: false, downloading: false });
    }
  };

  render() {
    const { loading, rows, cargo, method, search, selected, forPrint, downloading, sheetNo } = this.state;
    const visible = this.visibleRows();
    const sheetRows = this.sheetRows();
    const cargos = Array.from(new Set(rows.map((r) => r.cargo))).sort();
    const tickedCount = visible.filter((r) => selected[r.key]).length;
    const allTicked = visible.length > 0 && tickedCount === visible.length;
    const sheetCargos = Array.from(new Set(sheetRows.map((r) => r.cargo)));
    const cargoLabel = sheetCargos.length === 1 ? sheetCargos[0] : sheetCargos.length ? "Multiple" : "—";
    const input = { padding: "7px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13 };

    return (
      <Fragment>
        <Breadcrumb title="Cargo Collection Sheet" parent="Custom Released" />
        <div className="container-fluid">
          <div className="card" style={{ borderRadius: 14, border: "1px solid #e9eef5" }}>
            <div className="card-body">
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
                Every 1688 order, product request and Ship For Me booking at <b>Custom released</b>.
                Tick the parcels to collect (or leave all unticked to include everything shown), then
                print or download the sheet. Cargo rate and bill are shown here only — they never appear
                on the printed sheet or the PDF.
              </p>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                <select value={cargo} onChange={(e) => this.setState({ cargo: e.target.value })} style={input}>
                  <option value="All">All cargo companies</option>
                  {cargos.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <select value={method} onChange={(e) => this.setState({ method: e.target.value })} style={input}>
                  <option value="All">Air & Sea</option>
                  <option value="Air">By Air</option>
                  <option value="Sea">By Sea</option>
                </select>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => this.setState({ search: e.target.value })}
                  placeholder="Search ID, shipping mark, tracking or carton no"
                  style={{ ...input, minWidth: 280 }}
                />
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  {loading ? "Loading…" : `${visible.length} shown · ${tickedCount} ticked`}
                </span>
              </div>

              <div style={{ overflowX: "auto", border: "1px solid #eef2f7", borderRadius: 10 }}>
                <table className="table" style={{ marginBottom: 0, fontSize: 12 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={allTicked} onChange={(e) => this.toggleAll(visible, e.target.checked)} />
                      </th>
                      {["Type", "ID", "Method", "Cargo", "Shipping Mark", "Product", "Cartons", "BD Wt", "Rate", "Bill", "Released"].map((h) => (
                        <th key={h}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={r.key} style={{ background: selected[r.key] ? "#fff7ed" : undefined }}>
                        <td>
                          <input type="checkbox" checked={!!selected[r.key]} onChange={() => this.toggle(r.key)} />
                        </td>
                        <td style={{ whiteSpace: "nowrap" }}>{r.kind}</td>
                        <td style={{ fontWeight: 700 }}>{r.id}</td>
                        <td>{r.method}</td>
                        <td>{r.cargo}</td>
                        <td>{r.marks.join(", ") || "—"}</td>
                        <td style={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={r.product}>
                          {r.product}
                        </td>
                        <td>{r.cartons.join(", ") || "—"}</td>
                        <td>{r.bdWeight ? `${r.bdWeight} kg` : "—"}</td>
                        <td style={{ color: "#FF6A00" }}>{r.rate || "—"}</td>
                        <td style={{ color: "#FF6A00" }}>{r.bill || "—"}</td>
                        <td>{r.releasedOn || "—"}</td>
                      </tr>
                    ))}
                    {!loading && visible.length === 0 && (
                      <tr>
                        <td colSpan={12} style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
                          Nothing at Custom released matches.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", margin: "22px 0 10px" }}>
                <div style={{ fontWeight: 800, color: "#111827" }}>
                  Sheet preview — {sheetRows.length} {tickedCount ? "ticked" : "shown"}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <ReactToPrint
                    trigger={() => (
                      <button style={{ ...buttonStyle, background: "#fff", color: "#374151" }} disabled={!sheetRows.length}>
                        <Printer size={14} /> Print sheet
                      </button>
                    )}
                    content={() => this.sheetRef}
                    onBeforeGetContent={this.hideFinance}
                    onAfterPrint={() => this.setState({ forPrint: false })}
                    documentTitle={`Paicart-${sheetNo}`}
                  />
                  <button
                    onClick={this.downloadPdf}
                    disabled={downloading || !sheetRows.length}
                    style={{ ...buttonStyle, background: "#FF6A00", color: "#fff", border: "1px solid #FF6A00", opacity: downloading ? 0.6 : 1 }}
                  >
                    <Download size={14} /> {downloading ? "Preparing…" : "Download PDF"}
                  </button>
                </div>
              </div>

              <div style={{ background: "#f3f4f6", padding: 16, borderRadius: 12, overflowX: "auto" }}>
                <div style={{ minWidth: 1000 }}>
                  <CargoSheet
                    rows={sheetRows}
                    showFinance={!forPrint}
                    sheetNo={sheetNo}
                    cargoLabel={cargoLabel}
                    sheetRef={(el) => (this.sheetRef = el)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default CargoCollection;
