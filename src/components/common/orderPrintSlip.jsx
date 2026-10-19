import React, { Component } from "react";
import ReactToPrint from "react-to-print";
import { Printer } from "react-feather";
import PaicartLogo from "./paicart_logo.png";
import { getSingleUser } from "../../firebase/firebase.utils";

/* Print button for the 1688 order / product request detail popups.
 *
 * Prints a handling slip — ID, product pictures and details, quantity, and
 * the shipping info (customer, mobile, delivery address, cargo, shipping
 * mark, tracking, cartons, received weight). Deliberately carries NO prices:
 * it travels with the parcel.
 *
 * The slip is rendered off-screen (not display:none, which react-to-print
 * would copy and print blank) and only appears on paper. */

const C = { brand: "#FF6A00", ink: "#111827", text: "#374151", muted: "#6B7280", line: "#E5E7EB", soft: "#F9FAFB" };

/* 1688's cbu01 host blocks hotlinking */
const cdn = (url) => (url ? String(url).replace("cbu01.alicdn.com", "global-img-cdn.1688.com") : "");

/* Arrays, JSON-encoded arrays ('["CB_739mix-389"]') or comma strings; drops
   junk like "undefined Tk" left by earlier saves. */
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
      /* fall through */
    }
  }
  return text.split(",").map((v) => v.trim()).filter((v) => !isJunk(v));
};

const SLIP_PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  .order-slip * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}`;

/* Delivery address of the record, else the customer's default address */
const shippingOf = (record, user) => {
  const book = (user && Array.isArray(user.addressBook) && user.addressBook) || [];
  const a = record.deliveryAddress || book.find((x) => x && x.defaultShipping) || book[0] || null;
  return {
    name: (a && a.name) || (user && user.displayName) || record.displayName || "—",
    mobile: (a && a.mobileNo) || (user && user.mobileNo) || "—",
    address: a
      ? [a.address, a.thana, a.district, a.division].filter(Boolean).join(", ")
      : "—",
  };
};

/* Product lines without prices */
const productLines = (record, kind) => {
  if (kind === "productRequest") {
    return [
      {
        image: record.imageUrl,
        name: record.productType || record.productName || "Requested product",
        detail: [record.productVariant, record.store && `Store: ${record.store}`].filter(Boolean).join(" · "),
        qty: record.productQuantity || "—",
      },
    ];
  }
  const lines = [];
  (record.items || []).forEach((item) => {
    const skus = item.skus && item.skus.length ? item.skus : [null];
    skus.forEach((sku) => {
      lines.push({
        image: (sku && sku.image) || item.picture,
        name: item.name,
        detail: sku ? [sku.color, sku.size].filter(Boolean).join(" / ") : "",
        qty: sku ? parseInt(sku.totalQuantity || 0) : "—",
      });
    });
  });
  return lines;
};

const Slip = ({ record, kind, user }) => {
  const id = kind === "productRequest" ? record.bookingId : record.orderId;
  const ship = shippingOf(record, user);
  const lines = productLines(record, kind);
  const totalQty = lines.reduce((n, l) => n + (parseInt(l.qty) || 0), 0);
  const marks = parseList(record.shippingMark);
  const tracking = parseList(record.trackingNo).filter((t) => t !== "0");
  const cartons = parseList(record.ctnNo);
  const weight = parseFloat(record.receivedWeight) > 0 ? `${record.receivedWeight} kg` : "—";
  const th = { textAlign: "left", padding: "7px 8px", fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: `1px solid ${C.line}`, background: C.soft };
  const td = { padding: "8px", fontSize: 12, color: C.text, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" };
  const field = (label, value) => (
    <tr>
      <td style={{ padding: "5px 12px 5px 0", fontSize: 11, color: C.muted, whiteSpace: "nowrap", verticalAlign: "top" }}>{label}</td>
      <td style={{ padding: "5px 0", fontSize: 12, color: C.ink, fontWeight: 600 }}>{value}</td>
    </tr>
  );
  const list = (items) => (items.length ? items.join(", ") : "—");

  return (
    <div className="order-slip" style={{ background: "#fff", color: C.text, fontFamily: "inherit", width: "186mm" }}>
      <style>{SLIP_PRINT_CSS}</style>
      <div style={{ height: 5, background: C.brand, marginBottom: 14 }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <img src={PaicartLogo} alt="Paicart" style={{ height: 30, display: "block", marginBottom: 6 }} />
          <div style={{ fontSize: 10, color: C.muted }}>+88-01629773885 · support@paicart.com</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "0.08em", color: C.ink }}>
            {kind === "productRequest" ? "PRODUCT REQUEST SLIP" : "ORDER SLIP"}
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.brand, marginTop: 4 }}>
            {kind === "productRequest" ? "Booking ID" : "Order ID"}: #{id}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Printed {new Date().toLocaleDateString("en-GB")}</div>
        </div>
      </div>

      <div style={{ fontSize: 12, fontWeight: 800, color: C.ink, margin: "18px 0 6px" }}>Products ({totalQty || "—"} pcs)</div>
      <table style={{ width: "100%", borderCollapse: "collapse", border: `1px solid ${C.line}` }}>
        <thead>
          <tr>
            <th style={{ ...th, width: 26 }}>#</th>
            <th style={{ ...th, width: 64 }}>Picture</th>
            <th style={th}>Product</th>
            <th style={{ ...th, width: 60, textAlign: "right" }}>Qty</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, i) => (
            <tr key={i}>
              <td style={{ ...td, color: C.muted }}>{i + 1}</td>
              <td style={td}>
                {l.image ? (
                  <img src={cdn(l.image)} alt="" referrerPolicy="no-referrer" style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 6, border: `1px solid ${C.line}` }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 6, background: C.soft, border: `1px solid ${C.line}` }} />
                )}
              </td>
              <td style={td}>
                <div style={{ fontWeight: 700, color: C.ink }}>{l.name || "—"}</div>
                {l.detail && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{l.detail}</div>}
              </td>
              <td style={{ ...td, textAlign: "right", fontWeight: 700, color: C.ink }}>{l.qty}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 24, marginTop: 18 }}>
        <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Deliver To</div>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {field("Customer", ship.name)}
              {field("Mobile", ship.mobile)}
              {field("Address", ship.address)}
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, border: `1px solid ${C.line}`, borderRadius: 8, padding: "10px 14px" }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Shipping Info</div>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {field("Cargo", record.cargoCompany || "—")}
              {field("Shipping Mark", list(marks))}
              {field("Tracking No", list(tracking))}
              {field("Carton No", list(cartons))}
              {field("Received Weight", weight)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

class OrderPrintSlip extends Component {
  state = { user: null, userFor: null };

  componentDidMount() {
    this.loadUser();
  }

  componentDidUpdate() {
    this.loadUser();
  }

  /* Product requests (and older orders) carry no delivery address — fall
     back to the customer's profile. */
  loadUser = async () => {
    const { record } = this.props;
    const userId = record && record.userId;
    if (!userId || this.state.userFor === userId || this.loadingFor === userId) return;
    this.loadingFor = userId;
    const user = await getSingleUser(userId);
    this.setState({ user, userFor: userId });
  };

  render() {
    const { record, kind = "order" } = this.props;
    if (!record) return null;
    const user = this.state.userFor === record.userId ? this.state.user : null;
    const id = kind === "productRequest" ? record.bookingId : record.orderId;
    return (
      <>
        <ReactToPrint
          trigger={() => (
            <button
              type="button"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,.5)",
                background: "rgba(255,255,255,.12)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Printer size={13} /> Print
            </button>
          )}
          content={() => this.slipRef}
          documentTitle={`Paicart-${kind === "productRequest" ? "Request" : "Order"}-${id}`}
        />
        <div style={{ position: "absolute", left: -10000, top: 0 }} aria-hidden="true">
          <div ref={(el) => (this.slipRef = el)}>
            <Slip record={record} kind={kind} user={user} />
          </div>
        </div>
      </>
    );
  }
}

export default OrderPrintSlip;
