import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, X, Search, ExternalLink } from "react-feather";
import Breadcrumb from "../common/breadcrumb";
import { Badge, Button, SegmentTabs, StatTile, StatRow, TONES } from "../common/listUi";
import {
  getClientDueSources,
  getClientLedger,
  getCustomersForSearch,
} from "../../firebase/firebase.utils";
import {
  buildClientDues,
  buildTransactions,
  formatDateTime,
  KIND_LABEL,
  TXN_TYPE_LABELS,
} from "../../constants/clientDue";

/* Client Due.
 *
 * Every customer's outstanding due in one place — the same figure their own
 * dashboard Overview shows: only invoices from To Ship to Delivered, split
 * into Buy & Ship for me (website order), Ship for me (only shipment) and
 * Requested product. Opening a customer shows the invoices behind the figure
 * and their full transaction history (approved / pending / rejected). */

const tk = (n) => `৳ ${Math.round(Number(n) || 0).toLocaleString("en-IN")}`;

const C = { ink: "#0f172a", text: "#334155", muted: "#64748b", line: "#e9eef5", soft: "#f8fafc" };

const CATEGORY_TABS = [
  { key: "all", label: "All", field: "total" },
  { key: "order", label: "Website Order", field: "websiteOrderDue" },
  { key: "ship", label: "Ship for me", field: "shipmentDue" },
  { key: "request", label: "Requested Product", field: "requestedProductDue" },
];

const BUCKET_TONE = { "To Ship": "orange", "In Shipment": "blue", "To Receive": "violet", Delivered: "green" };
const STATUS_TONE = { approved: "green", pending: "orange", rejected: "red" };
const STATUS_LABEL = { approved: "Approved", pending: "Pending", rejected: "Rejected" };

const PERIODS = [
  { key: "all", label: "All time", months: null },
  { key: "1y", label: "Last 1 year", months: 12 },
  { key: "6m", label: "Last 6 months", months: 6 },
  { key: "2m", label: "Last 2 months", months: 2 },
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
const select = {
  height: 36,
  borderRadius: 9,
  border: `1px solid #e2e8f0`,
  padding: "0 10px",
  fontSize: 13,
  color: C.ink,
  background: "#fff",
};

const customerOf = (users, userId) =>
  users[userId] || { displayName: "", userId: "", mobileNo: "", email: "" };

/* ── Detail drawer ──────────────────────────────────────────────────── */

const TxnEntry = ({ t }) => {
  const isCash = t.type === "cash";
  return (
    <div style={{ border: `1px solid ${C.line}`, borderRadius: 12, padding: "12px 14px", marginBottom: 10, background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{t.methodLabel}</div>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2, wordBreak: "break-all" }}>
            {t.id}
            {t.trxId ? ` · TrxID ${t.trxId}` : t.reference && t.reference !== t.id ? ` · ${t.reference}` : ""}
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: t.status === "rejected" ? "#94a3b8" : C.ink,
              textDecoration: t.status === "rejected" ? "line-through" : "none",
            }}
          >
            {tk(t.amount)}
          </div>
          <Badge tone={STATUS_TONE[t.status]} style={{ marginTop: 4 }}>
            {isCash ? "Cash · confirmed" : STATUS_LABEL[t.status]}
          </Badge>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 10, fontSize: 12, color: C.muted }}>
        <span>{formatDateTime(t.time)}</span>
        <span style={{ background: C.soft, border: `1px solid ${C.line}`, borderRadius: 6, padding: "2px 8px", color: C.text }}>
          Invoice: {t.invoice}
        </span>
        {t.slipUrl && (
          <a href={t.slipUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#FF6A00", fontWeight: 700 }}>
            View slip
          </a>
        )}
      </div>

      {t.recorded && (
        <div style={{ marginTop: 10, background: TONES.green.bg, borderRadius: 10, padding: "9px 12px", fontSize: 12, color: TONES.green.fg }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Received by</span>
            <strong>{t.receivedBy}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Invoice due before</span>
            <strong>{tk(t.dueBefore)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Received</span>
            <strong>− {tk(t.amount)}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed rgba(15,123,53,.3)", marginTop: 4, paddingTop: 4 }}>
            <span>Remaining due after</span>
            <strong>{tk(t.dueAfter)}</strong>
          </div>
        </div>
      )}

      {t.status !== "approved" && (
        <div
          style={{
            marginTop: 10,
            fontSize: 12,
            borderRadius: 8,
            padding: "7px 10px",
            background: TONES[STATUS_TONE[t.status]].bg,
            color: TONES[STATUS_TONE[t.status]].fg,
          }}
        >
          {t.status === "pending" ? "Waiting for verification — does not reduce the due yet." : t.note}
        </div>
      )}
    </div>
  );
};

const ClientDrawer = ({ client, customer, onClose }) => {
  const [ledger, setLedger] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    let alive = true;
    setLedger(null);
    setError("");
    getClientLedger(client.userId)
      .then((data) => alive && setLedger(data))
      .catch((e) => alive && setError(String((e && e.message) || e)));
    return () => {
      alive = false;
    };
  }, [client.userId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const transactions = useMemo(() => (ledger ? buildTransactions(ledger) : []), [ledger]);

  const inPeriod = useMemo(() => {
    const p = PERIODS.find((x) => x.key === period);
    if (!p || !p.months) return transactions;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - p.months);
    return transactions.filter((t) => t.time >= cutoff.getTime());
  }, [transactions, period]);
  const ofType = useMemo(
    () => (type === "all" ? inPeriod : inPeriod.filter((t) => t.type === type)),
    [inPeriod, type],
  );
  const shown = status === "all" ? ofType : ofType.filter((t) => t.status === status);

  const totals = useMemo(() => {
    const sum = (s) => ofType.filter((t) => t.status === s).reduce((a, t) => a + t.amount, 0);
    const count = (s) => ofType.filter((t) => t.status === s).length;
    return {
      approved: sum("approved"),
      pending: sum("pending"),
      rejected: sum("rejected"),
      counts: { all: ofType.length, approved: count("approved"), pending: count("pending"), rejected: count("rejected") },
    };
  }, [ofType]);

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,23,42,.45)", zIndex: 1050, display: "flex", justifyContent: "flex-end" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(760px, 100%)", height: "100%", background: "#f6f8fb", overflowY: "auto", boxShadow: "-10px 0 30px rgba(15,23,42,.18)" }}
      >
        {/* Header */}
        <div style={{ position: "sticky", top: 0, zIndex: 2, background: "#fff", borderBottom: `1px solid ${C.line}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.ink }}>{customer.displayName || "Unnamed customer"}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
              {customer.userId ? `#${customer.userId}` : client.userId}
              {customer.mobileNo ? ` · ${customer.mobileNo}` : ""}
              {customer.email ? ` · ${customer.email}` : ""}
            </div>
            <Link
              to={`${process.env.PUBLIC_URL}/users/list-user/${client.userId}`}
              style={{ fontSize: 12, fontWeight: 700, color: "#FF6A00", display: "inline-flex", alignItems: "center", gap: 4, marginTop: 6 }}
            >
              Open customer profile <ExternalLink size={12} />
            </Link>
          </div>
          <button
            onClick={onClose}
            title="Close"
            style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 36, height: 36, cursor: "pointer", flexShrink: 0 }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {/* Outstanding */}
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", color: C.muted }}>TOTAL OUTSTANDING DUE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#FF6A00", margin: "2px 0 12px" }}>{tk(client.total)}</div>
            <StatRow>
              <StatTile label="Buy & Ship for me" hint="Website order" value={tk(client.websiteOrderDue)} tone="orange" />
              <StatTile label="Ship for me" hint="Only shipment" value={tk(client.shipmentDue)} tone="blue" />
              <StatTile label="Requested product" hint="Product request" value={tk(client.requestedProductDue)} tone="violet" />
            </StatRow>

            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, margin: "4px 0 8px" }}>
              Due invoices <span style={{ color: C.muted, fontWeight: 600 }}>({client.invoices.length})</span>
            </div>
            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Type</th>
                    <th style={th}>ID</th>
                    <th style={th}>Stage</th>
                    <th style={{ ...th, ...num }}>Bill</th>
                    <th style={{ ...th, ...num }}>Paid</th>
                    <th style={{ ...th, ...num }}>Due</th>
                  </tr>
                </thead>
                <tbody>
                  {client.invoices.map((inv) => (
                    <tr key={inv.key}>
                      <td style={td}>{KIND_LABEL[inv.kind]}</td>
                      <td style={{ ...td, fontWeight: 700, color: C.ink }}>{inv.id}</td>
                      <td style={td}>
                        <Badge tone={BUCKET_TONE[inv.bucket]}>{inv.bucket}</Badge>
                      </td>
                      <td style={{ ...td, ...num }}>{tk(inv.bill)}</td>
                      <td style={{ ...td, ...num }}>{tk(inv.paid)}</td>
                      <td style={{ ...td, ...num, fontWeight: 800, color: "#b91c1c" }}>{tk(inv.due)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Transaction history */}
          <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.ink }}>Transaction History</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>
              Every payment slip the customer uploaded, plus payments Paicart recorded directly (bKash gateway, cash, offline transfer).
            </div>

            {!ledger && !error && <div style={{ padding: 24, textAlign: "center", color: C.muted }}>Loading transactions…</div>}
            {error && <div style={{ padding: 16, color: TONES.red.fg, background: TONES.red.bg, borderRadius: 10 }}>Could not load: {error}</div>}

            {ledger && (
              <Fragment>
                <StatRow>
                  <StatTile label="Approved" value={tk(totals.approved)} hint={`${totals.counts.approved} payments`} tone="green" />
                  <StatTile label="Pending" value={tk(totals.pending)} hint={`${totals.counts.pending} slips`} tone="orange" />
                  <StatTile label="Rejected" value={tk(totals.rejected)} hint={`${totals.counts.rejected} slips`} tone="red" />
                </StatRow>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
                  <SegmentTabs
                    value={status}
                    onChange={setStatus}
                    items={[
                      { key: "all", label: "All", count: totals.counts.all },
                      { key: "approved", label: "Approved", count: totals.counts.approved },
                      { key: "pending", label: "Pending", count: totals.counts.pending },
                      { key: "rejected", label: "Rejected", count: totals.counts.rejected },
                    ]}
                  />
                  <select style={select} value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="all">All payment types</option>
                    {Object.keys(TXN_TYPE_LABELS).map((k) => (
                      <option key={k} value={k}>
                        {TXN_TYPE_LABELS[k]}
                      </option>
                    ))}
                  </select>
                  <select style={select} value={period} onChange={(e) => setPeriod(e.target.value)}>
                    {PERIODS.map((p) => (
                      <option key={p.key} value={p.key}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {shown.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: C.muted, border: `1px dashed ${C.line}`, borderRadius: 12 }}>
                    No transactions for this filter.
                  </div>
                ) : (
                  shown.map((t) => <TxnEntry key={t.key} t={t} />)
                )}
              </Fragment>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Page ───────────────────────────────────────────────────────────── */

const ClientDue = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState({});
  const [category, setCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

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
        setClients(buildClientDues(sources));
      })
      .catch((e) => setError(String((e && e.message) || e)))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const totals = useMemo(
    () =>
      clients.reduce(
        (a, c) => ({
          total: a.total + c.total,
          websiteOrderDue: a.websiteOrderDue + c.websiteOrderDue,
          shipmentDue: a.shipmentDue + c.shipmentDue,
          requestedProductDue: a.requestedProductDue + c.requestedProductDue,
        }),
        { total: 0, websiteOrderDue: 0, shipmentDue: 0, requestedProductDue: 0 },
      ),
    [clients],
  );

  const tab = CATEGORY_TABS.find((t) => t.key === category);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients
      .filter((c) => c[tab.field] > 0)
      .filter((c) => {
        if (!q) return true;
        const u = customerOf(users, c.userId);
        return [u.displayName, u.userId, u.mobileNo, u.email, c.userId, ...c.invoices.map((i) => i.id)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q));
      })
      .sort((a, b) => b[tab.field] - a[tab.field]);
  }, [clients, users, query, tab]);

  const tabCounts = useMemo(() => {
    const counts = {};
    CATEGORY_TABS.forEach((t) => {
      counts[t.key] = clients.filter((c) => c[t.field] > 0).length;
    });
    return counts;
  }, [clients]);

  const openClient = openId ? clients.find((c) => c.userId === openId) : null;

  return (
    <Fragment>
      <Breadcrumb title="Client Due" parent="Payment Request" />
      <div className="container-fluid">
        <div className="card" style={{ borderRadius: 14, border: `1px solid ${C.line}` }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
              <div>
                <h5 style={{ margin: 0, fontWeight: 800, color: C.ink }}>All clients' outstanding due</h5>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 4, maxWidth: 640 }}>
                  Counts invoices from <b>To Ship</b> to <b>Delivered</b>. To Pay, pending, rejected and refunded items are not
                  included, and payment slips still pending verification do not reduce the due — the same figure
                  each customer sees on their dashboard.
                </div>
              </div>
              <Button variant="ghost" onClick={load} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <RefreshCw size={14} /> {loading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            <StatRow>
              <StatTile label="Total outstanding due" value={tk(totals.total)} hint={`${clients.length} clients`} tone="red" />
              <StatTile label="Buy & Ship for me" value={tk(totals.websiteOrderDue)} hint="Website order" tone="orange" />
              <StatTile label="Ship for me" value={tk(totals.shipmentDue)} hint="Only shipment" tone="blue" />
              <StatTile label="Requested product" value={tk(totals.requestedProductDue)} hint="Product request" tone="violet" />
            </StatRow>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <SegmentTabs
                value={category}
                onChange={setCategory}
                items={CATEGORY_TABS.map((t) => ({ key: t.key, label: t.label, count: tabCounts[t.key] }))}
              />
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: C.muted }} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name, customer no, phone, order id…"
                  style={{ ...select, width: 300, paddingLeft: 30 }}
                />
              </div>
            </div>

            {error && (
              <div style={{ padding: 14, marginBottom: 12, color: TONES.red.fg, background: TONES.red.bg, borderRadius: 10 }}>
                Could not load due: {error}
              </div>
            )}

            <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>#</th>
                    <th style={th}>Customer</th>
                    <th style={{ ...th, ...num }}>Buy &amp; Ship for me</th>
                    <th style={{ ...th, ...num }}>Ship for me</th>
                    <th style={{ ...th, ...num }}>Requested product</th>
                    <th style={{ ...th, ...num }}>Total due</th>
                    <th style={{ ...th, ...num }}>Invoices</th>
                    <th style={th} />
                  </tr>
                </thead>
                <tbody>
                  {loading && clients.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>
                        Loading due across all clients…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...td, textAlign: "center", padding: 32, color: C.muted }}>
                        No clients with due{query ? " match this search" : ""}.
                      </td>
                    </tr>
                  ) : (
                    rows.map((c, i) => {
                      const u = customerOf(users, c.userId);
                      return (
                        <tr key={c.userId} onClick={() => setOpenId(c.userId)} style={{ cursor: "pointer" }}>
                          <td style={{ ...td, color: C.muted }}>{i + 1}</td>
                          <td style={td}>
                            <div style={{ fontWeight: 700, color: C.ink }}>{u.displayName || "Unnamed customer"}</div>
                            <div style={{ fontSize: 12, color: C.muted }}>
                              {u.userId ? `#${u.userId}` : c.userId}
                              {u.mobileNo ? ` · ${u.mobileNo}` : ""}
                            </div>
                          </td>
                          <td style={{ ...td, ...num, color: c.websiteOrderDue ? C.text : "#cbd5e1" }}>{tk(c.websiteOrderDue)}</td>
                          <td style={{ ...td, ...num, color: c.shipmentDue ? C.text : "#cbd5e1" }}>{tk(c.shipmentDue)}</td>
                          <td style={{ ...td, ...num, color: c.requestedProductDue ? C.text : "#cbd5e1" }}>{tk(c.requestedProductDue)}</td>
                          <td style={{ ...td, ...num, fontWeight: 800, color: "#b91c1c" }}>{tk(c.total)}</td>
                          <td style={{ ...td, ...num }}>{c.invoices.length}</td>
                          <td style={{ ...td, textAlign: "right" }}>
                            <Button variant="subtle" style={{ padding: "5px 12px", fontSize: 12 }}>
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
        />
      )}
    </Fragment>
  );
};

export default ClientDue;
