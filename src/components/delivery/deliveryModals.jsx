import React, { useEffect, useState } from "react";
import { X, Box, FileText, Clock, CheckCircle, Navigation } from "react-feather";
import { WAREHOUSE, approvalAmounts, approvalMoney, money } from "../../constants/deliveryPanel";

/* The Delivery section's small popups: warehouse status, parcel info,
   bill breakdown and Pathao payment approval. */

const useEsc = (onClose) =>
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

const Shell = ({ width, onClose, children }) => {
  useEsc(onClose);
  return (
    <div className="dl-overlay" onClick={onClose}>
      <div className="dl-modal" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button type="button" className="dl-close" onClick={onClose} aria-label="Close">
          <X size={14} />
        </button>
        {children}
      </div>
    </div>
  );
};

/* ── Update Delivery Status (Office Pickup / Van / Sundorbon) ───────── */

export const WarehouseStatusModal = ({ row, onClose, onSave }) => {
  const [status, setStatus] = useState(row.deliveryStatus === WAREHOUSE.DELIVERED ? WAREHOUSE.DELIVERED : WAREHOUSE.IN);
  const [saving, setSaving] = useState(false);
  return (
    <Shell width={384} onClose={() => !saving && onClose()}>
      <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px" }}>Update Delivery Status</h3>
      <p className="dl-muted" style={{ margin: "0 0 14px" }}>
        Order ID: <b className="dl-mono" style={{ color: "#111827" }}>{row.id}</b> · <b style={{ color: "#e04500" }}>{row.deliveryType}</b>
      </p>
      <label className="dl-label" htmlFor="dl-wh-status">Delivery status</label>
      <select id="dl-wh-status" className="dl-field" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value={WAREHOUSE.IN}>Paicart Warehouse</option>
        <option value={WAREHOUSE.DELIVERED}>Delivered</option>
      </select>
      {status === WAREHOUSE.DELIVERED && (
        <p className="dl-muted" style={{ marginTop: 8 }}>The order is also marked Delivered and moves to History & Completed.</p>
      )}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <button type="button" className="dl-btn dl-btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        <button
          type="button"
          className="dl-btn dl-btn-dark"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            const ok = await onSave(status);
            if (!ok) setSaving(false);
          }}
        >
          {saving ? "Saving…" : "Save Status"}
        </button>
      </div>
    </Shell>
  );
};

/* ── Parcel Info & Carton Breakdown ─────────────────────────────────── */

export const ParcelInfoModal = ({ cartons, bookingId, onClose }) => (
  <Shell width={512} onClose={onClose}>
    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
      <Box size={16} color="#ff5000" /> Parcel Info &amp; Carton Breakdown
    </h3>
    <p className="dl-muted" style={{ margin: "0 0 12px" }}>Carton, Tracking No &amp; Individual Weight Details:</p>
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
      <table className="dl-table">
        <thead>
          <tr>
            <th>Parcel Info (Carton Name)</th>
            <th>Tracking No</th>
            <th>Carton Wt</th>
            {bookingId && <th>Order ID / Booking ID</th>}
          </tr>
        </thead>
        <tbody className="dl-mono">
          {(cartons || []).map((c, i) => (
            <tr key={`${c.name}-${i}`}>
              <td>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#e04500", fontWeight: 800 }}>
                  <Box size={12} /> {c.name}
                </span>
              </td>
              <td>{c.trackingNo || "-"}</td>
              <td><span className="dl-orange-chip">{Number(c.weight || 0).toFixed(1)} kg</span></td>
              {bookingId && <td style={{ color: "#4b5563" }}>{bookingId}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div style={{ textAlign: "right", marginTop: 16 }}>
      <button type="button" className="dl-btn dl-btn-primary" onClick={onClose}>Close</button>
    </div>
  </Shell>
);

/* ── Bill & Collection Breakdown ────────────────────────────────────── */

export const BillModal = ({ delivery, onClose }) => (
  <Shell width={384} onClose={onClose}>
    <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px", display: "flex", alignItems: "center", gap: 8 }}>
      <FileText size={16} color="#ff5000" /> Bill &amp; Collection Breakdown
    </h3>
    <div className="dl-infobox orange" style={{ fontSize: 12 }}>
      <div>Pathao Order ID: <b className="dl-mono" style={{ color: "#e04500" }}>{delivery.pathaoId}</b></div>
      <div style={{ marginTop: 4 }}>Customer Name: <b>{delivery.customer && delivery.customer.name}</b></div>
    </div>
    <div className="dl-breakdown" style={{ marginTop: 12 }}>
      <div><span>Due Bill:</span><b style={{ color: "#ea580c" }}>{money(delivery.due)}</b></div>
      <div><span>Delivery Charge:</span><b>{money(delivery.deliveryCharge)}</b></div>
      <div><span>COD Charge:</span><b>{money(delivery.codCharge)}</b></div>
      <div className="is-blue"><span>Total Collection Amount:</span><b className="dl-mono" style={{ color: "#2563eb" }}>{money(delivery.total)}</b></div>
    </div>
    <div style={{ textAlign: "right", marginTop: 16 }}>
      <button type="button" className="dl-btn dl-btn-primary" onClick={onClose}>Close</button>
    </div>
  </Shell>
);

/* ── Pathao Payment Approval ────────────────────────────────────────── */

const chargeColor = (next, old) => (next > old ? "#dc2626" : "#16a34a");

export const ApprovalModal = ({ delivery, canApprove, onClose, onApprove }) => {
  const approved = delivery.approval && delivery.approval.status === "approved";
  const base = approvalAmounts(delivery);
  /* staff enter what Pathao actually paid and charged (from Pathao's
     payment statement) before approving */
  const [paid, setPaid] = useState(base.paid);
  const [newDelivery, setNewDelivery] = useState(base.newDelivery);
  const [newCod, setNewCod] = useState(base.newCod);
  const [saving, setSaving] = useState(false);
  const a = approved
    ? base
    : approvalAmounts({ ...delivery, approval: { ...(delivery.approval || {}), paid, newDelivery, newCod, adjustment: 0 } });
  const numInput = (value, set) => (
    <input
      type="number"
      min={0}
      step={1}
      value={value}
      disabled={approved || saving}
      onChange={(e) => set(Math.max(0, parseFloat(e.target.value) || 0))}
      style={{ width: 96, textAlign: "right", border: "2px solid #fed7aa", borderRadius: 10, padding: "4px 8px", fontWeight: 800 }}
    />
  );

  return (
    <Shell width={430} onClose={() => !saving && onClose()}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, paddingRight: 30 }}>
        <Navigation size={22} color="#ff5000" />
        <h3 style={{ fontSize: 18, fontWeight: 800, margin: 0, flex: 1 }}>{approved ? "Pathao Payment Details" : "Pathao Payment Approval"}</h3>
        {approved ? (
          <span className="dl-pill" style={{ background: "#f0fdf4", color: "#15803d", borderColor: "#bbf7d0" }}><CheckCircle size={12} /> Approved</span>
        ) : (
          <span className="dl-pill" style={{ background: "#fff4ed", color: "#ff5000", borderColor: "#fed7aa" }}><Clock size={12} /> Pending Review</span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, margin: "10px 0", fontSize: 12 }}>
        <span>
          <b>{delivery.customer && delivery.customer.name}</b> <span className="dl-mono" style={{ color: "#e04500", fontWeight: 700 }}>({delivery.pathaoId})</span>
        </span>
        <span className="dl-weight-chip">{Number(delivery.totalWeight || 0).toFixed(1)} kg ({(delivery.cartons || []).length} Cartons)</span>
      </div>
      <div style={{ height: 2, background: "#ff5000", margin: "0 0 12px" }} />
      <div className="dl-breakdown">
        <div><span>Website Order Due</span><b className="dl-strong">{approvalMoney(a.due)}</b></div>
        <div><span>Pathao Paid</span>{approved ? <b className="dl-strong">{approvalMoney(a.paid)}</b> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>৳ {numInput(paid, setPaid)}</span>}</div>
        <div><span>Delivery Charge</span>{approved ? <b style={{ color: chargeColor(a.newDelivery, a.oldDelivery) }}>{approvalMoney(a.newDelivery)}</b> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>৳ {numInput(newDelivery, setNewDelivery)}</span>}</div>
        <div><span>COD Charge</span>{approved ? <b style={{ color: chargeColor(a.newCod, a.oldCod) }}>{approvalMoney(a.newCod)}</b> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>৳ {numInput(newCod, setNewCod)}</span>}</div>
        <div className="is-blue"><span>Collection Amount</span><b style={{ color: "#1d4ed8" }}>{approvalMoney(a.collection)}</b></div>
        {a.adjustment > 0 && (
          <div>
            <span>Adjustment Amount<br /><small style={{ color: "#9ca3af", fontWeight: 500 }}>Amount below the order due</small></span>
            <b style={{ color: "#ff5000" }}>-{approvalMoney(a.adjustment)}</b>
          </div>
        )}
      </div>
      {a.extra > 0 && <p style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: "#1d4ed8", margin: "8px 0 0" }}>Extra amount paid: {approvalMoney(a.extra)}</p>}
      {!approved && (
        <p className="dl-muted" style={{ marginTop: 10 }}>
          Enter what Pathao paid and its final delivery / COD charges from Pathao's payment statement. Approving records {approvalMoney(a.paid)} as a payment on the order.
        </p>
      )}
      {!approved && !canApprove && (
        <div className="dl-infobox amber" style={{ fontSize: 12, marginTop: 10 }}>Only Admin and Accounts staff can approve Pathao payments.</div>
      )}
      <div style={{ borderTop: "1px solid #e5e7eb", marginTop: 16, paddingTop: 14, textAlign: "right" }}>
        {approved || !canApprove ? (
          <button type="button" className="dl-btn dl-btn-ghost" onClick={onClose}><X size={13} /> Close Details</button>
        ) : (
          <button
            type="button"
            className="dl-btn dl-btn-primary"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              const ok = await onApprove(a);
              if (!ok) setSaving(false);
            }}
          >
            <CheckCircle size={14} /> {saving ? "Approving…" : "Approve Payment"}
          </button>
        )}
      </div>
    </Shell>
  );
};
