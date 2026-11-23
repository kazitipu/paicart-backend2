import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RefreshCw, X, Search, ExternalLink, Bell } from "react-feather";
import Breadcrumb from "../common/breadcrumb";
import { Badge, Button, SegmentTabs, StatTile, StatRow, TONES } from "../common/listUi";
import NotifyModal from "./notifyModal";
import { getClientDueSources, getCustomersForSearch } from "../../firebase/firebase.utils";
import { buildClientBills, KIND_LABEL } from "../../constants/clientDue";

/* Accounts → Client Bills.
 *
 * Every client who has been billed — a website order or product request that
 * reached To Ship (payment approved) or beyond, or a weighed Ship For Me
 * parcel — each with what they were billed, paid, got refunded and still owe.
 * Every client can be sent an in-app notification, and so can a selection or
 * everyone at once. */

const tk = (n) => `৳ ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;
const dateOf = (ms) =>
  ms ? new Date(ms).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const C = { ink: "#0f172a", text: "#334155", muted: "#64748b", line: "#e9eef5", soft: "#f8fafc" };

const BUCKET_TONE = { "To Ship": "orange", "In Shipment": "blue", "To Receive": "violet", Delivered: "green", Refunded: "gray" };
const REFUND_TONE = { requested: "orange", given: "teal", rejected: "red" };
const REFUND_LABEL = { requested: "Refund requested", given: "Refund given", rejected: "Refund rejected" };

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "due", label: "With due", test: (c) => c.due > 0 },
  { key: "paid", label: "Fully paid", test: (c) => c.due <= 0 },
  { key: "refund", label: "With refund", test: (c) => c.refund > 0 || c.refundPending > 0 },
];

const th = {
  padding: "10px 12px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: C.muted,
  borderBottom: `1px solid ${C.line}`,
  whiteSpace: "nowrap",
  background: C.soft,
};
const td = { padding: "11px 12px", fontSize: 13, color: C.text, borderBottom: `1px solid ${C.line}`, verticalAlign: "middle" };
const num = { textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" };
const input = { height: 36, borderRadius: 9, border: "1px solid #e2e8f0", padding: "0 10px", fontSize: 13, color: C.ink, background: "#fff" };

const customerOf = (users, userId) => users[userId] || { displayName: "", userId: "", mobileNo: "", email: "" };
const nameOf = (u) => u.displayName || "Customer";

const dueReminder = (client, u) => ({
  label: "Due reminder",
  title: "Payment due reminder",
  body: `Dear ${nameOf(u)}, you have an outstanding due of ${tk(client.due)} on your Paicart account. Please pay from your dashboard to avoid delays in delivery. Thank you.`,
});
const billSummary = (client, u) => ({
  label: "Bill summary",
  title: "Your Paicart bill summary",
  body: `Dear ${nameOf(u)}, total billed ${tk(client.billed)}, paid ${tk(client.paid)}${
    client.refund ? `, refunded ${tk(client.refund)}` : ""
  }, due ${tk(client.due)}. See your dashboard for details.`,
});

/* ── Client detail drawer ───────────────────────────────────────────── */

const ClientDrawer = ({ client, customer, onClose, onNotify }) => {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const kinds = ["order", "ship", "request"];
  return (
    <div onClick={onClose} style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,23,42,.45)", zIndex: 1050, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "min(820px, 100%)", height: "100%", background: "#f6f8fb", overflowY: "auto", boxShadow: "-10px 0 30px rgba(15,23,42,.18)" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{customer.displayName || "Unnamed customer"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {customer.userId ? `#${customer.userId}` : client.userId}
              {customer.mobileNo ? ` · ${customer.mobileNo}` : ""}
              {customer.email ? ` · ${customer.email}` : ""}
            </div>
            <Link to={`${process.env.PUBLIC_URL}/users/list-user/${client.userId}`} style={{ fontSize: 12, fontWeight: 700, color: "#FF6A00", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6 }}>
              Open customer profile <ExternalLink size={12} />
            </Link>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexShrink: 0 }}>
            <Button onClick={onNotify} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Bell size={14} /> Notify
            </Button>
            <button onClick={onClose} title="Close" style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 36, height: 36, cursor: "pointer" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <StatRow>
            <StatTile label="Total billed" value={tk(client.billed)} hint={`${client.invoices.length} bills`} tone="blue" />
            <StatTile label="Paid" value={tk(client.paid)} tone="green" />
            <StatTile label="Refund given" value={tk(client.refund)} hint={client.refundPending ? `${client.refundPending} pending request` : undefined} tone="teal" />
            <StatTile label="Net received" value={tk(client.netReceived)} hint="Paid − refund" tone="gray" />
            <StatTile label="Due" value={tk(client.due)} tone={client.due > 0 ? "red" : "green"} />
          </StatRow>

          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 10 }}>Breakdown by service</div>
            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Service</th>
                    <th style={{ ...th, ...num }}>Bills</th>
                    <th style={{ ...th, ...num }}>Billed</th>
                    <th style={{ ...th, ...num }}>Paid</th>
                    <th style={{ ...th, ...num }}>Refund</th>
                    <th style={{ ...th, ...num }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {kinds.map((k) => {
                    const r = client.byKind[k];
                    return (
                      <tr key={k} style={{ opacity: r.count ? 1 : 0.45 }}>
                        <td style={{ ...td, fontWeight: 700, color: C.ink }}>
                          {k === "order" ? "Buy & Ship for me (website order)" : k === "ship" ? "Ship for me (only shipment)" : "Requested product"}
                        </td>
                        <td style={{ ...td, ...num }}>{r.count}</td>
                        <td style={{ ...td, ...num }}>{tk(r.billed)}</td>
                        <td style={{ ...td, ...num }}>{tk(r.paid)}</td>
                        <td style={{ ...td, ...num }}>{tk(r.refund)}</td>
                        <td style={{ ...td, ...num, fontWeight: 800, color: r.due > 0 ? "#b91c1c" : C.text }}>{tk(r.due)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 10 }}>
              Bills <span style={{ color: C.muted, fontWeight: 600 }}>({client.invoices.length})</span>
            </div>
            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Date</th>
                    <th style={th}>Type</th>
                    <th style={th}>ID</th>
                    <th style={th}>Stage</th>
                    <th style={{ ...th, ...num }}>Bill</th>
                    <th style={{ ...th, ...num }}>Paid</th>
                    <th style={{ ...th, ...num }}>Refund</th>
                    <th style={{ ...th, ...num }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((inv) => (
                    <tr key={inv.key}>
                      <td style={{ ...td, whiteSpace: "nowrap" }}>{dateOf(inv.time)}</td>
                      <td style={td}>{KIND_LABEL[inv.kind]}</td>
                      <td style={{ ...td, fontWeight: 700, color: C.ink }}>{inv.id}</td>
                      <td style={td}>
                        <Badge tone={BUCKET_TONE[inv.bucket]}>{inv.bucket}</Badge>
                        {inv.refundStatus && REFUND_LABEL[inv.refundStatus] && (
                          <div style={{ marginTop: 4 }}>
                            <Badge tone={REFUND_TONE[inv.refundStatus]} style={{ fontSize: 10 }}>
                              {REFUND_LABEL[inv.refundStatus]}
                            </Badge>
                          </div>
                        )}
                      </td>
                      <td style={{ ...td, ...num }}>{tk(inv.bill)}</td>
                      <td style={{ ...td, ...num }}>{tk(inv.paid)}</td>
                      <td style={{ ...td, ...num, color: inv.refund ? TONES.teal.fg : "#cbd5e1" }} title={inv.refundNote || undefined}>
                        {inv.refund ? `− ${tk(inv.refund)}` : tk(0)}
                      </td>
                      <td style={{ ...td, ...num, fontWeight: 800, color: inv.due > 0 ? "#b91c1c" : C.text }}>{tk(inv.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────── */

const ClientBills = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState({});
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState({});
  const [openId, setOpenId] = useState(null);
  const [notify, setNotify] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([getClientDueSources(), getCustomersForSearch()])
      .then(([sources, userList]) => {
        const index = {};
        (userList || []).forEach((u) => {
          if (u && u.id) index[u.id] = u;
        });
        setUsers(index);
        setClients(buildClientBills(sources));
      })
      .catch((e) => setError(String((e && e.message) || e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const totals = useMemo(
    () =>
      clients.reduce(
        (a, c) => ({
          billed: a.billed + c.billed,
          paid: a.paid + c.paid,
          refund: a.refund + c.refund,
          due: a.due + c.due,
          withDue: a.withDue + (c.due > 0 ? 1 : 0),
        }),
        { billed: 0, paid: 0, refund: 0, due: 0, withDue: 0 },
      ),
    [clients],
  );

  const rows = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) || FILTERS[0];
    const q = query.trim().toLowerCase();
    return clients.filter(f.test).filter((c) => {
      if (!q) return true;
      const u = customerOf(users, c.userId);
      return [u.displayName, u.userId, u.mobileNo, u.email, c.userId, ...c.invoices.map((i) => i.id)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [clients, users, filter, query]);

  const counts = useMemo(() => {
    const out = {};
    FILTERS.forEach((f) => {
      out[f.key] = clients.filter(f.test).length;
    });
    return out;
  }, [clients]);

  const selectedIds = Object.keys(selected).filter((id) => selected[id]);
  const allShownSelected = rows.length > 0 && rows.every((c) => selected[c.userId]);
  const toggleAllShown = () => {
    const next = { ...selected };
    rows.forEach((c) => {
      next[c.userId] = !allShownSelected;
    });
    setSelected(next);
  };

  const notifyOne = (c) => {
    const u = customerOf(users, c.userId);
    setNotify({
      heading: `${nameOf(u)}${u.userId ? ` · #${u.userId}` : ""}`,
      targets: [{ key: "one", label: nameOf(u), userIds: [c.userId], audience: "single" }],
      templates: [dueReminder(c, u), billSummary(c, u)],
    });
  };
  const notifySelected = () =>
    setNotify({
      heading: `${selectedIds.length} selected clients`,
      targets: [{ key: "sel", label: "Selected clients", userIds: selectedIds, audience: "selected" }],
    });
  const notifyAll = () =>
    setNotify({
      heading: "Broadcast",
      targets: [
        { key: "billed", label: "All billed clients", userIds: clients.map((c) => c.userId), audience: "all" },
        { key: "due", label: "Clients with due", userIds: clients.filter((c) => c.due > 0).map((c) => c.userId), audience: "selected" },
        { key: "everyone", label: "All registered customers", userIds: Object.keys(users), audience: "all" },
      ],
    });

  const openClient = openId ? clients.find((c) => c.userId === openId) : null;

  return (
    <Fragment>
      <Breadcrumb title="Client Bills" parent="Accounts" />
      <ToastContainer />
      <div className="container-fluid">
        <div className="card" style={{ borderRadius: 14, border: `1px solid ${C.line}` }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: C.ink }}>Client-wise bills</h5>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, maxWidth: 680 }}>
                  Every client who has been billed — website orders and product requests from To Ship (payment approved)
                  onward, and Ship For Me parcels once weighed — with what they paid, the refunds given and the remaining
                  due. To Pay, pending and rejected items are not bills.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Button variant="ghost" onClick={load} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh"}
                </Button>
                <Button onClick={notifyAll} disabled={loading || !clients.length} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Bell size={14} /> Notify all
                </Button>
              </div>
            </div>

            <StatRow>
              <StatTile label="Billed clients" value={clients.length} hint={`${totals.withDue} with due`} tone="gray" />
              <StatTile label="Total billed" value={tk(totals.billed)} tone="blue" />
              <StatTile label="Total paid" value={tk(totals.paid)} tone="green" />
              <StatTile label="Refund given" value={tk(totals.refund)} tone="teal" />
              <StatTile label="Net received" value={tk(totals.paid - totals.refund)} hint="Paid − refund" tone="violet" />
              <StatTile label="Outstanding due" value={tk(totals.due)} tone="red" />
            </StatRow>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SegmentTabs value={filter} onChange={setFilter} items={FILTERS.map((f) => ({ key: f.key, label: f.label, count: counts[f.key] }))} />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {selectedIds.length > 0 && (
                  <Fragment>
                    <Button variant="subtle" onClick={() => setSelected({})}>
                      Clear ({selectedIds.length})
                    </Button>
                    <Button onClick={notifySelected} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <Bell size={14} /> Notify selected ({selectedIds.length})
                    </Button>
                  </Fragment>
                )}
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: C.muted }} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, customer no, phone, order id…" style={{ ...input, width: 300, paddingLeft: 30 }} />
                </div>
              </div>
            </div>

            {error && <div style={{ padding: 14, marginBottom: 12, color: TONES.red.fg, background: TONES.red.bg, borderRadius: 10 }}>Could not load bills: {error}</div>}

            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: 36 }}>
                      <input type="checkbox" checked={allShownSelected} onChange={toggleAllShown} title="Select all shown" />
                    </th>
                    <th style={th}>#</th>
                    <th style={th}>Customer</th>
                    <th style={{ ...th, ...num }}>Bills</th>
                    <th style={{ ...th, ...num }}>Billed</th>
                    <th style={{ ...th, ...num }}>Paid</th>
                    <th style={{ ...th, ...num }}>Refund</th>
                    <th style={{ ...th, ...num }}>Net received</th>
                    <th style={{ ...th, ...num }}>Due</th>
                    <th style={th}>Last bill</th>
                    <th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {loading && clients.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>Loading bills across all clients…</td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={11} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>No clients{query ? " match this search" : " in this view"}.</td>
                    </tr>
                  ) : (
                    rows.map((c, i) => {
                      const u = customerOf(users, c.userId);
                      return (
                        <tr key={c.userId} onClick={() => setOpenId(c.userId)} style={{ cursor: "pointer", background: selected[c.userId] ? "#fff7ed" : undefined }}>
                          <td style={td} onClick={(e) => e.stopPropagation()}>
                            <input type="checkbox" checked={!!selected[c.userId]} onChange={(e) => setSelected({ ...selected, [c.userId]: e.target.checked })} />
                          </td>
                          <td style={{ ...td, color: C.muted }}>{i + 1}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 700, color: C.ink }}>{u.displayName || "Unnamed customer"}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>
                              {u.userId ? `#${u.userId}` : c.userId}
                              {u.mobileNo ? ` · ${u.mobileNo}` : ""}
                            </div>
                          </td>
                          <td style={{ ...td, ...num }}>{c.invoices.length}</td>
                          <td style={{ ...td, ...num }}>{tk(c.billed)}</td>
                          <td style={{ ...td, ...num, color: TONES.green.fg }}>{tk(c.paid)}</td>
                          <td style={{ ...td, ...num, color: c.refund ? TONES.teal.fg : "#cbd5e1" }}>
                            {c.refund ? `− ${tk(c.refund)}` : tk(0)}
                            {c.refundPending > 0 && (
                              <div>
                                <Badge tone="orange" style={{ fontSize: 10, padding: "1px 7px" }}>{c.refundPending} requested</Badge>
                              </div>
                            )}
                          </td>
                          <td style={{ ...td, ...num }}>{tk(c.netReceived)}</td>
                          <td style={{ ...td, ...num, fontWeight: 800, color: c.due > 0 ? "#b91c1c" : TONES.green.fg }}>{c.due > 0 ? tk(c.due) : "Paid"}</td>
                          <td style={{ ...td, whiteSpace: "nowrap" }}>{dateOf(c.lastTime)}</td>
                          <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                            <Button variant="subtle" onClick={() => notifyOne(c)} style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 5, marginRight: 6 }}>
                              <Bell size={12} /> Notify
                            </Button>
                            <Button variant="ghost" onClick={() => setOpenId(c.userId)} style={{ padding: "5px 10px", fontSize: 12 }}>
                              Details
                            </Button>
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

      {openClient && (
        <ClientDrawer
          client={openClient}
          customer={customerOf(users, openClient.userId)}
          onClose={() => setOpenId(null)}
          onNotify={() => notifyOne(openClient)}
        />
      )}
      {notify && <NotifyModal {...notify} onClose={() => setNotify(null)} />}
    </Fragment>
  );
};

export default ClientBills;
