import React, { Component } from "react";
import ReactDOM from "react-dom";
import DeliveryAddressPicker from "./deliveryAddressPicker.jsx";
import { X, Edit2, AlertTriangle } from "react-feather";
import { Badge, Button, TONES } from "./listUi";
import "./modalAnim.css";
import { showDialog } from "./appDialog.jsx";
import { AddressCard } from "./addressAndChips.jsx";
import { Link } from "react-router-dom";
import { isInDeliverySection } from "../../constants/deliveryPanel";
import { addAddressToUserBook, getSingleUser, saveDeliveryRequest, sendInAppNotifications, updateParcelRecordFields } from "../../firebase/firebase.utils";
import {
  DELIVERY_METHODS,
  DELIVERY_STATUSES,
  buildAdminDeliveryRequest,
  deliveryAddressOf,
  deliveryDue,
  deliveryMethod,
  isBilled,
  isFullyPaid,
  recordIdOf,
} from "../../constants/deliveryRequest";

/* Delivery request of one record, for the Paicart warehouse lists (website
 * orders, product requests, Ship For Me). Shows what was chosen and who
 * chose it — the customer, or Paicart staff — or "None"; Edit lets staff
 * set or change it. Keeps its own copy after a save so the row updates
 * without reloading the list. kind: 'order' | 'request' | 'ship'. */

/* must match the close animation in modalAnim.css */
const CLOSE_MS = 180;

const field = { width: "100%", border: "1px solid #e2e8f0", borderRadius: 9, padding: "8px 10px", fontSize: 13, color: "#0f172a" };

export const SourceLine = ({ request }) => {
  if (!request) return null;
  const by = request.source === "admin" ? `Set by ${request.enteredBy || "Paicart"}` : "Requested by customer";
  return (
    <div style={{ fontSize: 11, color: "#64748b", marginTop: 3, lineHeight: 1.35 }}>
      {by}
      {request.requestedDate ? ` · ${request.source === "admin" && request.handledDate ? request.handledDate : request.requestedDate}` : ""}
      {request.source === "admin" && request.customerChoice && request.customerChoice.label && (
        <div>Customer asked: {request.customerChoice.label}</div>
      )}
      {request.groupSize > 1 && <div>With {request.groupSize - 1} other item{request.groupSize > 2 ? "s" : ""}</div>}
    </div>
  );
};

export class AdminDeliveryModal extends Component {
  constructor(props) {
    super(props);
    const r = (props.record && props.record.deliveryRequest) || {};
    this.state = {
      method: r.method || "",
      status: r.status && r.status !== "cancelled" ? r.status : "requested",
      note: r.note || "",
      user: null,
      saving: false,
      notify: true,
      closing: false,
      /* chosen delivery address (null = the record's / customer's default) */
      address: null,
      addressIsNew: false,
      saveToBook: true,
    };
  }

  componentDidMount() {
    const { record } = this.props;
    if (record && record.userId) getSingleUser(record.userId).then((user) => this.setState({ user })).catch(() => {});
    window.addEventListener("keydown", this.onKey);
  }

  componentWillUnmount() {
    window.removeEventListener("keydown", this.onKey);
    clearTimeout(this.closeTimer);
  }

  onKey = (e) => {
    if (e.key === "Escape") this.requestClose();
  };

  /* play the close animation, then let the parent remove the dialog */
  requestClose = (force) => {
    if ((this.state.saving && !force) || this.state.closing) return;
    this.setState({ closing: true });
    this.closeTimer = setTimeout(() => this.props.onClose(), CLOSE_MS);
  };

  save = async () => {
    const { kind, record, admin, onSaved } = this.props;
    const { method, status, note, user, notify } = this.state;
    const m = deliveryMethod(method);
    if (!m) return showDialog({ tone: "warning", title: "Choose a delivery method", message: "Pick one of the four delivery methods first." });
    this.setState({ saving: true });
    const who = (admin && (admin.name || admin.email)) || "Paicart";
    try {
      const address = this.state.address || deliveryAddressOf(record, user);
      if (m.key !== "office_pickup" && !address) {
        this.setState({ saving: false });
        return showDialog({ tone: "warning", title: "Add a delivery address", message: "Choose one of the customer's addresses or add a new one with the Pathao picker." });
      }
      if (this.state.address && this.state.addressIsNew && this.state.saveToBook && record.userId) {
        await addAddressToUserBook(record.userId, this.state.address);
      }
      const request = buildAdminDeliveryRequest(kind, record, { method, status, note, enteredBy: who, address });
      await saveDeliveryRequest(kind, recordIdOf(kind, record), request);
      /* keep the record's own delivery address in step (orders / requests /
         bookings that were placed without one get it here) */
      if (address && (this.state.address || !record.deliveryAddress)) {
        await updateParcelRecordFields(kind, recordIdOf(kind, record), { deliveryAddress: address });
      }
      let notified = "";
      if (notify && record.userId) {
        try {
          await sendInAppNotifications([record.userId], {
            title: "Delivery method updated",
            body: `Paicart set ${m.label} for your ${kind === "order" ? "order" : kind === "request" ? "product request" : "shipment"} #${recordIdOf(kind, record)} (${DELIVERY_STATUSES[status].label.toLowerCase()}).`,
            audience: "single",
            sentBy: who,
          });
          notified = " The customer was notified.";
        } catch (e) {
          notified = " (Customer notification could not be sent.)";
        }
      }
      onSaved(request);
      this.setState({ saving: false });
      this.requestClose(true);
      showDialog({ tone: "success", title: "Delivery request saved", message: `${m.label} · ${DELIVERY_STATUSES[status].label}.${notified}` });
    } catch (e) {
      this.setState({ saving: false });
      alert(e);
    }
  };

  render() {
    const { kind, record } = this.props;
    const { method, status, note, user, saving, notify, closing } = this.state;
    const onClose = () => this.requestClose();
    const paid = isFullyPaid(kind, record);
    const due = deliveryDue(kind, record);
    const chosen = deliveryMethod(method);
    const address = deliveryAddressOf(record, user);
    const current = record.deliveryRequest;

    /* rendered at page level: inside a table cell the row's overflow and
       transforms clipped the dialog and shifted it sideways */
    return ReactDOM.createPortal(
      <div
        className={`pc-modal-backdrop${closing ? " is-closing" : ""}`}
        onClick={onClose}
        style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 1080, background: "rgba(15,23,42,.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      >
        <div className="pc-modal-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', width: "min(520px,100%)", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: 16, boxShadow: "0 24px 60px rgba(15,23,42,.3)", textAlign: "left" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid #e9eef5" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Delivery request</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>#{recordIdOf(kind, record)}</div>
            </div>
            <button type="button" onClick={onClose} disabled={saving} style={{ border: "none", background: "#f1f5f9", borderRadius: 9, width: 32, height: 32, cursor: "pointer" }}>
              <X size={15} />
            </button>
          </div>

          <div style={{ padding: 18 }}>
            {current && current.method ? (
              <div style={{ background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 10, padding: "9px 12px", fontSize: 12, marginBottom: 12 }}>
                Current: <b>{current.label}</b> · {(DELIVERY_STATUSES[current.status] || DELIVERY_STATUSES.requested).label}
                <SourceLine request={current} />
                {current.note && <div style={{ marginTop: 3, color: "#334155" }}>Note: “{current.note}”</div>}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>The customer hasn't requested a delivery method yet.</div>
            )}

            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Delivery method</div>
            {DELIVERY_METHODS.map((m) => (
              <label key={m.key} style={{ display: "flex", gap: 10, alignItems: "flex-start", border: `1px solid ${method === m.key ? "#FF6A00" : "#e2e8f0"}`, background: method === m.key ? "#fff8f2" : "#fff", borderRadius: 10, padding: "8px 10px", marginBottom: 6, cursor: "pointer" }}>
                <input type="radio" name="admin-delivery-method" checked={method === m.key} onChange={() => this.setState({ method: m.key })} style={{ marginTop: 3 }} />
                <span>
                  <b style={{ fontSize: 13, color: "#0f172a" }}>{m.label}</b>
                  <span style={{ display: "block", fontSize: 11, color: "#64748b" }}>{m.hint}</span>
                </span>
              </label>
            ))}
            {chosen && chosen.needsFullPayment && !paid && (
              <div style={{ display: "flex", gap: 8, background: TONES.orange.bg, color: TONES.orange.fg, borderRadius: 10, padding: "8px 10px", fontSize: 12, marginBottom: 8 }}>
                <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>
                  This invoice is not fully paid ({isBilled(kind, record) ? `৳${Math.round(due).toLocaleString("en-IN")} due` : "not billed yet"}). Customers can't pick {chosen.label} until it is — you can still set it.
                </span>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 6 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 4 }}>Status</div>
                <select value={status} onChange={(e) => this.setState({ status: e.target.value })} style={field}>
                  {Object.keys(DELIVERY_STATUSES).map((k) => (
                    <option key={k} value={k}>{DELIVERY_STATUSES[k].label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "10px 0 4px" }}>Note</div>
            <textarea value={note} maxLength={500} onChange={(e) => this.setState({ note: e.target.value })} rows={2} style={{ ...field, resize: "vertical" }} placeholder="Phone, time, vehicle…" />

            <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", margin: "12px 0 6px" }}>Deliver to</div>
            {user === null && record.userId ? (
              <div style={{ fontSize: 12, color: "#8391a5" }}>Loading the customer's addresses…</div>
            ) : (
              <DeliveryAddressPicker
                current={(record.deliveryRequest && record.deliveryRequest.address) || record.deliveryAddress || null}
                book={(user && user.addressBook) || []}
                value={this.state.address || address}
                customerName={(user && user.displayName) || record.displayName || ""}
                customerPhone={(user && (user.mobileNo || user.phoneNumber)) || ""}
                onChange={(a, isNew) => this.setState({ address: a, addressIsNew: !!isNew })}
              />
            )}
            {this.state.addressIsNew && record.userId && (
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4b5a70", marginTop: 8 }}>
                <input type="checkbox" checked={this.state.saveToBook} onChange={(e) => this.setState({ saveToBook: e.target.checked })} />
                Also save this address to the customer's address book
              </label>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#334155", marginTop: 12 }}>
              <input type="checkbox" checked={notify} onChange={(e) => this.setState({ notify: e.target.checked })} />
              Notify the customer (in-app)
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 18px", borderTop: "1px solid #e9eef5", background: "#f8fafc" }}>
            <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={this.save} disabled={saving || !method}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }
}

export default class DeliveryRequestCell extends Component {
  state = { saved: null, open: false };

  render() {
    const { kind, record, admin, compact } = this.props;
    if (!record) return null;
    const fromRecord = record.deliveryRequest && record.deliveryRequest.method ? record.deliveryRequest : null;
    const request = this.state.saved || fromRecord;
    const m = request ? deliveryMethod(request.method) : null;
    const st = request ? DELIVERY_STATUSES[request.status] || DELIVERY_STATUSES.requested : null;
    const effective = request ? { ...record, deliveryRequest: request } : record;

    return (
      <div style={{ minWidth: compact ? 0 : 150 }} onClick={(e) => e.stopPropagation()}>
        {request ? (
          <div>
            <Badge tone={(m && m.tone) || "gray"} style={{ fontSize: 11 }}>{request.label || request.method}</Badge>{" "}
            <Badge tone={st.tone} style={{ fontSize: 10, padding: "1px 7px" }}>{st.label}</Badge>
            <SourceLine request={request} />
            {isInDeliverySection(effective) ? (
              <Link
                to={`${process.env.PUBLIC_URL}/delivery?type=${encodeURIComponent(request.method)}&focus=${kind}-${recordIdOf(kind, record)}`}
                style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 4, fontSize: 11, fontWeight: 600, color: "#2f8a5b" }}
              >
                ✓ In Delivery section ↗
              </Link>
            ) : (
              request.status === "requested" && (
                <div style={{ marginTop: 4, fontSize: 10.5, color: "#a66a14" }}>Set to Arranged to send it to the Delivery section</div>
              )
            )}
          </div>
        ) : (
          <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 600 }}>None</span>
        )}
        <button
          type="button"
          onClick={() => this.setState({ open: true })}
          style={{ marginTop: 5, border: "1px solid #e2e8f0", background: "#fff", borderRadius: 7, padding: "2px 8px", fontSize: 11, fontWeight: 700, color: "#334155", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
        >
          <Edit2 size={11} /> {request ? "Change" : "Set"}
        </button>
        {this.state.open && (
          <AdminDeliveryModal
            kind={kind}
            record={effective}
            admin={admin}
            onClose={() => this.setState({ open: false })}
            onSaved={(saved) => this.setState({ saved })}
          />
        )}
      </div>
    );
  }
}
