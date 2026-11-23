import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { RefreshCw, Search, X, ExternalLink } from "react-feather";
import Breadcrumb from "../common/breadcrumb";
import { Badge, Button, SegmentTabs, StatTile, StatRow, TONES } from "../common/listUi";
import { showDialog } from "../common/appDialog.jsx";
import { SourceLine } from "../common/deliveryRequestCell.jsx";
import { AddressCard, ChipList } from "../common/addressAndChips.jsx";
import {
  getCustomersForSearch,
  getDeliveryRequests,
  sendInAppNotifications,
  updateDeliveryRequestStatus,
} from "../../firebase/firebase.utils";
import { KIND_LABEL, orderBill, requestBill, shipmentBill } from "../../constants/clientDue";
import {
  DELIVERY_METHODS,
  DELIVERY_STATUSES,
  ADDRESS_SOURCE_LABEL,
  deliveryAddressOf,
  deliveryAddressSource,
  deliveryDue,
  deliveryMethod,
  isBilled,
  recordIdOf,
  stageOf,
} from "../../constants/deliveryRequest";

/* Delivery Requests.
 *
 * Every delivery request — sent by a customer from To Receive on the website
 * or app, or entered by staff on a Paicart warehouse list — in one queue.
 * Items the customer requested together (bulk) are one group and are handled
 * together. "Review" shows every item's details before approving. Changing
 * the status here only tracks the delivery; the record's shipment status is
 * changed the usual way. */

const tk = (n) => `৳${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const C = { ink: "#0f172a", text: "#334155", muted: "#64748b", line: "#e9eef5", soft: "#f8fafc" };
const TABS = ["requested", "arranged", "delivered", "cancelled", "all"];
const DETAIL_PATH = {
  order: "/1688-taobao-orders/details/",
  request: "/product-request/details/",
  ship: "/shipment-request/details/",
};
const cdn = (url) => (url ? String(url).replace("cbu01.alicdn.com", "global-img-cdn.1688.com") : "");
const paidOf = (r) => ((r && r.payments) || []).reduce((a, p) => a + Math.max(parseInt(p && p.amount, 10) || 0, 0), 0);
const billOf = (kind, r) => (kind === "order" ? orderBill(r) : kind === "request" ? requestBill(r) : shipmentBill(r));
const list = (v) => (Array.isArray(v) ? v : String(v || "").split(",")).map((x) => String(x).trim()).filter((x) => x && x !== "0");

/* What staff see about each item before approving */
const itemLines = (kind, r) => {
  if (kind === "order") {
    const lines = [];
    (r.items || []).forEach((item) =>
      (item.skus && item.skus.length ? item.skus : [null]).forEach((sku) =>
        lines.push({
          image: cdn((sku && sku.image) || item.picture),
          name: item.name,
          detail: sku ? [sku.color, sku.size].filter(Boolean).join(" / ") : "",
          qty: sku ? parseInt(sku.totalQuantity || 0, 10) : "",
        }),
      ),
    );
    return lines;
  }
  return [
    {
      image: cdn(r.imageUrl),
      name: kind === "request" ? r.productType || r.productName || "Requested product" : r.othersProductName || r.productType || "Shipment",
      detail: kind === "request" ? r.productVariant || "" : r.productType || "",
      qty: r.productQuantity || "",
    },
  ];
};

const notifyText = (group, status) => {
  const refs = group.items.map((it) => `#${it.id}`).join(", ");
  const method = group.methodLabel;
  if (status === "arranged") return { title: "Your delivery is being arranged", body: `We are arranging ${method} for ${refs}. We'll contact you with the details.` };
  if (status === "delivered") return { title: "Delivered", body: `${refs} handed over via ${method}. Thank you for shopping with Paicart.` };
  if (status === "cancelled")
    return { title: "Delivery request rejected", body: `Your ${method} request for ${refs} was not accepted. Please choose a delivery option again from your dashboard or contact Paicart.` };
  return null;
};

const th = { padding: "10px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: C.muted, borderBottom: `1px solid ${C.line}`, whiteSpace: "nowrap", background: C.soft, textAlign: "left" };
const td = { padding: "11px 12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.line}`, verticalAlign: "top" };
const control = { height: 36, borderRadius: 9, border: "1px solid #e2e8f0", padding: "0 10px", fontSize: 13, color: C.ink, background: "#fff" };

/* Says whether the address is fixed (saved with the request) or the
   customer's current default, which follows their profile */
const AddressSourceTag = ({ source }) => (
  <div
    style={{
      display: "inline-block",
      marginTop: 5,
      fontSize: 10.5,
      fontWeight: 700,
      borderRadius: 6,
      padding: "1px 7px",
      color: source === "default" ? TONES.orange.fg : TONES.green.fg,
      background: source === "default" ? TONES.orange.bg : TONES.green.bg,
    }}
  >
    {ADDRESS_SOURCE_LABEL[source] || ""}
  </div>
);

/* ── Review drawer ────────────────────────────────────────────────── */

const ReviewDrawer = ({ group, user, onClose, actions }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  const m = deliveryMethod(group.method);
  const totals = group.items.reduce((a, it) => ({ bill: a.bill + it.bill, paid: a.paid + it.paid, due: a.due + (it.billed ? it.due : 0) }), { bill: 0, paid: 0, due: 0 });
  const unpaid = group.items.filter((it) => !it.billed || it.due > 0);

  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,23,42,.45)", zIndex: 1050, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(860px,100%)", height: "100%", background: "#f6f8fb", overflowY: "auto" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "14px 20px", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>
              {group.methodLabel} · {group.items.length} item{group.items.length === 1 ? "" : "s"}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {(user && user.displayName) || "Customer"}
              {user && user.userId ? ` · #${user.userId}` : ""}
              {user && user.mobileNo ? ` · ${user.mobileNo}` : ""}
            </div>
            <div style={{ marginTop: 6 }}>
              <Badge tone={(DELIVERY_STATUSES[group.status] || DELIVERY_STATUSES.requested).tone}>{(DELIVERY_STATUSES[group.status] || DELIVERY_STATUSES.requested).label}</Badge>
              <SourceLine request={group.request} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "flex-end" }}>
            {actions}
            <button onClick={onClose} title="Close" style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 36, height: 36, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <StatRow>
            <StatTile label="Method" value={group.methodLabel} hint={m ? m.hint : ""} tone={(m && m.tone) || "gray"} />
            <StatTile label="Total bill" value={tk(totals.bill)} tone="blue" />
            <StatTile label="Paid" value={tk(totals.paid)} tone="green" />
            <StatTile label="Due now" value={tk(totals.due)} hint={unpaid.length ? `${unpaid.length} item${unpaid.length === 1 ? "" : "s"} not fully paid` : "all fully paid"} tone={unpaid.length ? "red" : "green"} />
          </StatRow>

          {m && m.needsFullPayment && unpaid.length > 0 && (
            <div style={{ background: TONES.red.bg, color: TONES.red.fg, borderRadius: 10, padding: "10px 12px", fontSize: 13, marginBottom: 14 }}>
              <b>{m.label}</b> needs every item fully paid. Not fully paid:{" "}
              {unpaid.map((it) => `#${it.id} (${it.billed ? `${tk(it.due)} due` : "not billed yet"})`).join(", ")}.
            </div>
          )}

          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 6 }}>Deliver to</div>
            {group.method === "office_pickup" && (
              <div style={{ fontSize: 12, fontWeight: 700, color: TONES.blue.fg, marginBottom: 8 }}>Office pickup — the customer collects from the Paicart warehouse</div>
            )}
            <AddressCard address={group.address} empty="No address — the customer has no default shipping address" />
            {group.address && <AddressSourceTag source={group.addressSource} />}
            {group.note && (
              <div style={{ fontSize: 13, color: C.text, marginTop: 10, padding: "8px 10px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, whiteSpace: "pre-line" }}>
                <b>Customer note:</b> {group.note}
              </div>
            )}
          </div>

          {group.items.map((it) => {
            const r = it.record;
            const lines = itemLines(it.kind, r);
            const marks = list(r.shippingMark);
            const tracking = list(r.trackingNo);
            return (
              <div key={it.key} style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 14, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 11, color: C.muted }}>{KIND_LABEL[it.kind]} </span>
                    <Link to={{ pathname: `${process.env.PUBLIC_URL}${DETAIL_PATH[it.kind]}${it.id}`, state: { from: `${process.env.PUBLIC_URL}/delivery-requests` } }} style={{ fontWeight: 800, color: "#FF6A00" }}>
                      #{it.id} <ExternalLink size={11} />
                    </Link>{" "}
                    <Badge tone="violet" style={{ fontSize: 10, padding: "1px 7px" }}>{it.stage}</Badge>
                  </div>
                  <div style={{ fontSize: 13, textAlign: "right" }}>
                    Bill <b>{tk(it.bill)}</b> · Paid <b style={{ color: TONES.green.fg }}>{tk(it.paid)}</b> ·{" "}
                    {!it.billed ? <Badge tone="gray">Not billed</Badge> : it.due > 0 ? <b style={{ color: TONES.red.fg }}>Due {tk(it.due)}</b> : <Badge tone="green">Fully paid</Badge>}
                  </div>
                </div>
                {lines.map((l, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "6px 0", borderTop: i ? `1px dashed ${C.line}` : "none" }}>
                    {l.image ? (
                      <img src={l.image} alt="" referrerPolicy="no-referrer" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 8, border: `1px solid ${C.line}` }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: C.soft }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.ink }}>{l.name || "—"}</div>
                      {l.detail && <div style={{ fontSize: 12, color: C.muted }}>{l.detail}</div>}
                    </div>
                    {l.qty !== "" && <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, whiteSpace: "nowrap" }}>× {l.qty}</div>}
                  </div>
                ))}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: 12, color: C.muted, marginTop: 8 }}>
                  <span>Weight: <b style={{ color: C.text }}>{parseFloat(r.receivedWeight) > 0 ? `${r.receivedWeight} kg` : "—"}</b></span>
                  <span>Cartons: <b style={{ color: C.text }}>{r.ctnQuantity || list(r.ctnNo).length || "—"}</b></span>
                  {marks.length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      Shipping mark{marks.length > 1 ? ` (${marks.length})` : ""}: <ChipList items={marks} max={4} tone="orange" />
                    </span>
                  )}
                  {tracking.length > 0 && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      Tracking{tracking.length > 1 ? ` (${tracking.length})` : ""}: <ChipList items={tracking} max={4} />
                    </span>
                  )}
                  {r.pathaoBooking && r.pathaoBooking.consignmentId && <span>Pathao: <b style={{ color: TONES.orange.fg }}>{r.pathaoBooking.consignmentId}</b></span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ── Page ─────────────────────────────────────────────────────────── */

const DeliveryRequests = () => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState({});
  const [tab, setTab] = useState("requested");
  const [method, setMethod] = useState("all");
  const [query, setQuery] = useState("");
  const [busyKey, setBusyKey] = useState("");
  const [notify, setNotify] = useState(true);
  const [reviewKey, setReviewKey] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([getDeliveryRequests(), getCustomersForSearch()])
      .then(([list, userList]) => {
        const index = {};
        (userList || []).forEach((u) => {
          if (u && u.id) index[u.id] = u;
        });
        setUsers(index);
        setRecords(list);
      })
      .catch((e) => alert(e))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  /* one entry per request — a bulk request's items together */
  const groups = useMemo(() => {
    const byKey = {};
    records.forEach(({ kind, record }) => {
      const dr = record.deliveryRequest || {};
      const id = recordIdOf(kind, record);
      const billed = isBilled(kind, record);
      const item = {
        key: `${kind}-${id}`,
        kind,
        id,
        record,
        stage: stageOf(kind, record),
        bill: billOf(kind, record),
        paid: paidOf(record),
        due: deliveryDue(kind, record),
        billed,
        status: dr.status || "requested",
      };
      const gk = dr.groupId ? `${record.userId}|${dr.groupId}` : item.key;
      if (!byKey[gk]) {
        const m = deliveryMethod(dr.method);
        byKey[gk] = {
          key: gk,
          userId: record.userId,
          method: dr.method,
          methodLabel: (m && m.label) || dr.label || dr.method || "—",
          request: dr,
          note: dr.note || "",
          requestedAt: Number(dr.requestedAt) || 0,
          address: deliveryAddressOf(record, users[record.userId]),
          addressSource: deliveryAddressSource(record),
          items: [],
        };
      }
      byKey[gk].items.push(item);
    });
    return Object.values(byKey)
      .map((g) => {
        const statuses = Array.from(new Set(g.items.map((it) => it.status)));
        /* a group moves together; if staff changed one item on its own, the
           least-advanced status is what still needs doing */
        const order = ["requested", "arranged", "delivered", "cancelled"];
        const status = statuses.length === 1 ? statuses[0] : statuses.sort((a, b) => order.indexOf(a) - order.indexOf(b))[0];
        const unpaid = g.items.filter((it) => !it.billed || it.due > 0);
        return { ...g, status, mixed: statuses.length > 1, unpaid };
      })
      .sort((a, b) => b.requestedAt - a.requestedAt);
  }, [records, users]);

  const counts = useMemo(() => {
    const c = { all: groups.length };
    TABS.forEach((t) => {
      if (t !== "all") c[t] = groups.filter((g) => g.status === t).length;
    });
    return c;
  }, [groups]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups.filter((g) => {
      if (tab !== "all" && g.status !== tab) return false;
      if (method !== "all" && g.method !== method) return false;
      if (!q) return true;
      const u = users[g.userId] || {};
      return [u.displayName, u.userId, u.mobileNo, u.email, g.note, g.methodLabel, ...g.items.map((it) => it.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [groups, users, tab, method, query]);

  const byMethod = useMemo(() => {
    const open = groups.filter((g) => g.status === "requested" || g.status === "arranged");
    const c = {};
    DELIVERY_METHODS.forEach((m) => {
      c[m.key] = open.filter((g) => g.method === m.key).length;
    });
    return c;
  }, [groups]);

  const setStatus = async (group, status) => {
    if (status === "cancelled" && !window.confirm(`Reject this ${group.methodLabel} request for ${group.items.map((it) => `#${it.id}`).join(", ")}? The customer will be able to request delivery again.`)) return;
    setBusyKey(group.key);
    const who = (admin && (admin.name || admin.email)) || "Paicart";
    try {
      await Promise.all(group.items.map((it) => updateDeliveryRequestStatus(it.kind, it.id, status, who)));
      const ids = new Set(group.items.map((it) => it.key));
      setRecords((list) =>
        list.map((x) =>
          ids.has(`${x.kind}-${recordIdOf(x.kind, x.record)}`)
            ? { ...x, record: { ...x.record, deliveryRequest: { ...x.record.deliveryRequest, status, handledBy: who, handledDate: new Date().toLocaleDateString("en-GB") } } }
            : x,
        ),
      );
      let notified = "";
      const text = notifyText(group, status);
      if (notify && text && group.userId) {
        try {
          await sendInAppNotifications([group.userId], { ...text, audience: "single", sentBy: who });
          notified = " The customer was notified.";
        } catch (e) {
          notified = " (The customer notification could not be sent.)";
        }
      }
      showDialog({ tone: "success", title: `Marked ${DELIVERY_STATUSES[status].label.toLowerCase()}`, message: `${group.methodLabel} · ${group.items.length} item${group.items.length === 1 ? "" : "s"}.${notified}` });
    } catch (e) {
      alert(e);
    } finally {
      setBusyKey("");
    }
  };

  const actionsFor = (g) => {
    const busy = busyKey === g.key;
    const btn = { padding: "5px 10px", fontSize: 12, marginRight: 6, marginBottom: 4 };
    if (g.status === "requested")
      return (
        <Fragment>
          <Button disabled={busy} onClick={() => setStatus(g, "arranged")} style={btn}>Approve · arranged</Button>
          <Button variant="danger" disabled={busy} onClick={() => setStatus(g, "cancelled")} style={btn}>Reject</Button>
        </Fragment>
      );
    if (g.status === "arranged")
      return (
        <Fragment>
          <Button disabled={busy} onClick={() => setStatus(g, "delivered")} style={btn}>Mark delivered</Button>
          <Button variant="danger" disabled={busy} onClick={() => setStatus(g, "cancelled")} style={btn}>Reject</Button>
        </Fragment>
      );
    if (g.status === "cancelled")
      return <Button variant="ghost" disabled={busy} onClick={() => setStatus(g, "requested")} style={btn}>Reopen</Button>;
    return null;
  };

  const reviewing = reviewKey ? groups.find((g) => g.key === reviewKey) : null;

  return (
    <Fragment>
      <Breadcrumb title="Delivery Requests" parent="Payment Request" />
      <div className="container-fluid">
        <div className="card" style={{ borderRadius: 14, border: `1px solid ${C.line}` }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: C.ink }}>Delivery requests</h5>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, maxWidth: 720 }}>
                  Sent by customers from <b>To Receive</b> (one item or several together), or entered by staff on the Paicart
                  warehouse lists. Customers can only pick Van / Truck and Sundorbon when every item is fully paid. Use{" "}
                  <b>Review</b> to see every item before approving. Status here only tracks the delivery — change the order's
                  shipment status the usual way.
                </div>
              </div>
              <Button variant="ghost" onClick={load} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            <StatRow>
              {DELIVERY_METHODS.map((m) => (
                <StatTile key={m.key} label={m.label} value={byMethod[m.key]} hint="open requests" tone={m.tone} />
              ))}
            </StatRow>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SegmentTabs value={tab} onChange={setTab} items={TABS.map((t) => ({ key: t, label: t === "all" ? "All" : DELIVERY_STATUSES[t].label, count: counts[t] || 0 }))} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.text, margin: 0 }}>
                  <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
                  Notify customer on change
                </label>
                <select value={method} onChange={(e) => setMethod(e.target.value)} style={control}>
                  <option value="all">All methods</option>
                  {DELIVERY_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>{m.label}</option>
                  ))}
                </select>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: C.muted }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ID, customer, phone, note…" style={{ ...control, width: 260, paddingLeft: 30 }} />
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
              {/* auto layout: a global stylesheet forces fixed, equal columns */}
              <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead>
                  <tr>
                    <th style={th}>Requested</th>
                    <th style={th}>Items</th>
                    <th style={th}>Customer</th>
                    <th style={th}>Method</th>
                    <th style={th}>Payment</th>
                    <th style={th}>Delivery address / note</th>
                    <th style={th}>Status</th>
                    <th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {loading && groups.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>Loading delivery requests…</td></tr>
                  ) : shown.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>No delivery requests here.</td></tr>
                  ) : (
                    shown.map((g) => {
                      const u = users[g.userId] || {};
                      const m = deliveryMethod(g.method);
                      const st = DELIVERY_STATUSES[g.status] || DELIVERY_STATUSES.requested;
                      return (
                        <tr key={g.key}>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>
                            {g.requestedAt ? new Date(g.requestedAt).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                          </td>
                          <td style={td}>
                            {g.items.map((it) => (
                              <div key={it.key} style={{ marginBottom: 3, whiteSpace: "nowrap" }}>
                                <span style={{ fontSize: 11, color: C.muted }}>{KIND_LABEL[it.kind]} </span>
                                <Link to={{ pathname: `${process.env.PUBLIC_URL}${DETAIL_PATH[it.kind]}${it.id}`, state: { from: `${process.env.PUBLIC_URL}/delivery-requests` } }} style={{ fontWeight: 800, color: "#FF6A00" }}>
                                  #{it.id}
                                </Link>
                              </div>
                            ))}
                            {g.items.length > 1 && <Badge tone="blue" style={{ fontSize: 10, padding: "1px 7px" }}>{g.items.length} together</Badge>}
                          </td>
                          <td style={td}>
                            <div style={{ fontWeight: 700, color: C.ink }}>{u.displayName || "Unnamed customer"}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>
                              {u.userId ? `#${u.userId}` : ""}
                              {u.mobileNo ? ` · ${u.mobileNo}` : ""}
                            </div>
                          </td>
                          <td style={td}>
                            <Badge tone={(m && m.tone) || "gray"}>{g.methodLabel}</Badge>
                            <SourceLine request={g.request} />
                          </td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>
                            {g.unpaid.length === 0 ? (
                              <Badge tone="green">Fully paid</Badge>
                            ) : (
                              <div>
                                <Badge tone="red">{g.unpaid.length} not fully paid</Badge>
                                <div style={{ fontSize: 11, color: TONES.red.fg, marginTop: 3 }}>
                                  {g.unpaid.map((it) => `#${it.id}${it.billed ? ` ${tk(it.due)}` : " not billed"}`).join(", ")}
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={td}>
                            {/* table cells ignore min-width — the wrapper holds it */}
                            <div style={{ minWidth: 260, maxWidth: 340 }}>
                              <AddressCard address={g.address} compact />
                              {g.address && <AddressSourceTag source={g.addressSource} />}
                              {g.note && <div style={{ fontSize: 12, color: "#92400e", marginTop: 6, whiteSpace: "pre-line" }}>“{g.note}”</div>}
                            </div>
                          </td>
                          <td style={td}>
                            <Badge tone={st.tone}>{st.label}</Badge>
                            {g.mixed && <div style={{ fontSize: 11, color: TONES.orange.fg, marginTop: 3 }}>Items differ — review</div>}
                            {g.request.handledBy && g.status !== "requested" && (
                              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>{g.request.handledBy} · {g.request.handledDate}</div>
                            )}
                          </td>
                          <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                            <Button variant="subtle" onClick={() => setReviewKey(g.key)} style={{ padding: "5px 10px", fontSize: 12, marginRight: 6, marginBottom: 4 }}>
                              Review
                            </Button>
                            {actionsFor(g)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {reviewing && (
        <ReviewDrawer group={reviewing} user={users[reviewing.userId]} onClose={() => setReviewKey(null)} actions={actionsFor(reviewing)} />
      )}
    </Fragment>
  );
};

export default DeliveryRequests;
