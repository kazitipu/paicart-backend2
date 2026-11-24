import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { showDialog } from "../common/appDialog.jsx";
import { getPathaoInvoiceReceipts, previewPathaoInvoiceReceive, receivePathaoInvoice } from "../../firebase/firebase.utils";
import { KIND_LABEL, planTotals, recordEffects, ledgerEntries } from "../../constants/pathaoReceive";
import { ChevronDown, ChevronRight, RefreshCw, FileText, ExternalLink, CheckCircle, Clock } from "react-feather";
import { getPathaoInvoiceBreakdown, getPathaoInvoices, getPathaoInvoiceSummary } from "../../constants/pathao";

/* Pathao Payment tab — Pathao's own invoices (the merchant panel's
 * Courier → Invoices, read through setupProxy.js):
 *   - summary: lifetime earning, last payment, in process, invoiced not paid
 *   - invoice list (paged) with collected / fees / payout / status
 *   - each invoice opens into its parcels, matched to our Pathao bookings by
 *     consignment id
 * onMatch({ [consignmentId]: { invoiceId, status, payout, … } }) feeds the
 * approval table below with the invoice each parcel was paid in. */

const PAGE_SIZE = 10;
const MERCHANT_INVOICES_URL = "https://merchant.pathao.com/courier/invoices/list";
const n = (v) => {
  const x = parseFloat(v);
  return Number.isFinite(x) ? x : 0;
};
const tk = (v, d = 0) => `৳${n(v).toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d })}`;
const fmtDate = (s) => {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return s || "—";
  const d = new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0));
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", ...(m[4] ? { hour: "2-digit", minute: "2-digit" } : {}) });
};
const isPaid = (st) => String(st || "").toLowerCase() === "paid";
/* what the Paicart records still owe, as the preview computed it */
const dueOfConsignment = (p) =>
  p && !p.unmatched && !p.charge ? p.lines.reduce((a, l) => a + Math.max(l.payable - l.paidBefore, 0), 0) : null;
const dueOfInvoice = (plan) => {
  if (!plan) return null;
  const parts = plan.map(dueOfConsignment).filter((v) => v !== null);
  return parts.length ? parts.reduce((a, v) => a + v, 0) : null;
};
const StatusPill = ({ status }) =>
  isPaid(status) ? (
    <span className="pi-pill pi-paid"><CheckCircle size={11} /> Paid</span>
  ) : (
    <span className="pi-pill pi-proc"><Clock size={11} /> {String(status || "processing").replace(/^\w/, (c) => c.toUpperCase())}</span>
  );

const PathaoInvoices = ({ deliveries = [], onMatch, onAwaiting }) => {
  const admin = useSelector((st) => st.admins && st.admins.currentAdmin);
  /* invoiceId → receipt (received in Paicart) */
  const [receipts, setReceipts] = useState({});
  /* invoiceId → { plan } | { error } — Paicart records per consignment */
  const [plans, setPlans] = useState({});
  /* invoiceId being confirmed / saving */
  const [confirming, setConfirming] = useState(null);
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);
  const [list, setList] = useState({ rows: [], total: 0, lastPage: 1 });
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState({});
  const [breakdowns, setBreakdowns] = useState({});

  const byConsignment = useMemo(() => {
    const m = {};
    deliveries.forEach((d) => {
      if (d.pathaoId) m[String(d.pathaoId)] = d;
    });
    return m;
  }, [deliveries]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [s, l] = await Promise.all([getPathaoInvoiceSummary().catch(() => null), getPathaoInvoices({ page, limit: PAGE_SIZE })]);
      if (s) setSummary(s);
      const rows = (l && l.data) || [];
      setList({ rows, total: n(l && l.total), lastPage: n(l && (l.last_page || l.total_page)) || 1 });
      /* parcels of every invoice on this page — matches our bookings */
      getPathaoInvoiceReceipts(rows.map((r) => r.order_invoice_id))
        .then((rc) => setReceipts((old) => ({ ...old, ...rc })))
        .catch(() => {});
      rows.forEach((inv) =>
        getPathaoInvoiceBreakdown(inv.order_invoice_id)
          .then((items) => {
            setBreakdowns((b) => ({ ...b, [inv.order_invoice_id]: { items } }));
            /* which Paicart records each consignment pays (no writes) */
            return previewPathaoInvoiceReceive(items).then((plan) => setPlans((pl) => ({ ...pl, [inv.order_invoice_id]: { plan } })));
          })
          .catch((e) => setBreakdowns((b) => ({ ...b, [inv.order_invoice_id]: b[inv.order_invoice_id] || { error: e.message } })))
      );
    } catch (e) {
      setError((e && e.message) || "Could not load Pathao invoices");
    } finally {
      setLoading(false);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);

  /* consignment → invoice, for the approval table */
  useEffect(() => {
    if (!onMatch) return;
    const m = {};
    list.rows.forEach((inv) => {
      const b = breakdowns[inv.order_invoice_id];
      ((b && b.items) || []).forEach((it) => {
        m[String(it.consignment_id)] = {
          invoiceId: inv.order_invoice_id,
          status: inv.status,
          invoiceDate: inv.invoice_created_at,
          collected: n(it.collected_amount),
          deliveryFee: n(it.delivery_fee),
          codFee: n(it.cash_on_delivery_fee),
          finalFee: n(it.final_fee),
          payout: n(it.payout),
        };
      });
    });
    onMatch(m);
  }, [list.rows, breakdowns, onMatch]);

  useEffect(() => {
    if (!onAwaiting) return;
    onAwaiting(list.rows.filter((r) => isPaid(r.status) && !receipts[r.order_invoice_id]).length);
  }, [list.rows, receipts, onAwaiting]);

  const receive = async (inv) => {
    const id = inv.order_invoice_id;
    const b = breakdowns[id];
    if (!b || !b.items) return;
    setSaving(true);
    try {
      const plan = await receivePathaoInvoice(inv, b.items, admin);
      const t = planTotals(plan);
      setReceipts((r) => ({ ...r, [id]: { receivedDate: new Date().toLocaleDateString("en-GB"), receivedBy: (admin && admin.name) || "you", payout: t.payout } }));
      setConfirming(null);
      showDialog({
        tone: "success",
        title: `Pathao invoice ${id} received`,
        message: `৳${t.payout.toLocaleString("en-IN")} entered in Paicart.`,
        items: [
          { label: "Paid into orders", value: `৳${t.applied.toLocaleString("en-IN")}`, tone: "success" },
          ...(t.extra > 0 ? [{ label: "Extra over due (kept on the order)", value: `৳${t.extra.toLocaleString("en-IN")}` }] : []),
          ...(t.cashInOnly > 0 ? [{ label: "Cash in only (no Paicart order)", value: `৳${t.cashInOnly.toLocaleString("en-IN")}` }] : []),
          ...(t.charges > 0 ? [{ label: "Pathao charges (expense)", value: `৳${t.charges.toLocaleString("en-IN")}` }] : []),
        ],
      });
    } catch (e) {
      showDialog({ tone: "error", title: "Nothing was received", message: (e && e.message) || "The invoice could not be received. No payment or cash-in was saved." });
    } finally {
      setSaving(false);
    }
  };

  const recordCell = (p) =>
    p.charge ? (
      <span className="dl-muted">Charge kept by Pathao — expense</span>
    ) : p.unmatched ? (
      <span className="dl-muted">No Paicart order — cash in only</span>
    ) : (
      <span className="pi-recs">
        {p.lines.map((l) => (
          <span key={`${l.kind}${l.id}`} className="pi-rec">
            <em>{KIND_LABEL[l.kind]}</em> #{l.id}
          </span>
        ))}
      </span>
    );

  const shown = list.rows.filter((r) => filter === "all" || (filter === "paid" ? isPaid(r.status) : !isPaid(r.status)));
  const pageTotals = shown.reduce(
    (a, r) => ({ collected: a.collected + n(r.collected_amount), fees: a.fees + n(r.total_fee), payout: a.payout + n(r.receivable_amount) }),
    { collected: 0, fees: 0, payout: 0 }
  );

  const tile = (label, value, sub, tone) => (
    <div className={`pi-tile${tone ? ` pi-tile-${tone}` : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      {sub && <small>{sub}</small>}
    </div>
  );

  return (
    <div className="dl-card pi-card">
      <div className="dl-card-head">
        <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span className="dl-icon-tile"><FileText size={16} /></span>
          <div>
            <h2 className="dl-h2">Pathao Invoices</h2>
            <p className="dl-sub">Live from the Pathao merchant panel — what Pathao collected, its fees, and what it pays Paicart.</p>
          </div>
        </div>
        <div className="dl-controls">
          <div className="dl-seg">
            {[["all", "All"], ["paid", "Paid"], ["processing", "Processing"]].map(([k, l]) => (
              <button key={k} type="button" className={filter === k ? "is-on" : ""} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
          <button type="button" className="dl-btn dl-btn-ghost" onClick={load} disabled={loading}>
            <RefreshCw size={13} /> {loading ? "Loading…" : "Refresh"}
          </button>
          <a className="dl-btn dl-btn-ghost" href={MERCHANT_INVOICES_URL} target="_blank" rel="noopener noreferrer">
            Pathao panel <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {summary && (
        <div className="pi-tiles">
          {tile("Lifetime earning", tk(summary.lifetime_earning), "paid out by Pathao", "green")}
          {tile("Last payment sent", tk(summary.payment_sent), [summary.last_invoice_date, summary.payment_method_name].filter(Boolean).join(" · "))}
          {tile("Payment in process", tk(summary.payment_in_process), "being paid now", "blue")}
          {tile("Invoiced, not paid", tk(summary.invoiced_not_paid), "on invoices still processing", "orange")}
          {tile("Preparing for invoice", tk(summary.payment_preparing_for_invoice), "delivered, not invoiced yet")}
        </div>
      )}

      {error ? (
        <div className="dl-infobox red" style={{ margin: 16 }}>
          {error}
          {/pathao-api|Not allowed|404/i.test(error) && " — restart npm start so the new Pathao invoice route loads."}
        </div>
      ) : (
        <div className="dl-table-wrap">
          <table className="dl-table pi-table">
            <thead>
              <tr>
                <th style={{ width: 28 }} />
                <th>Invoice</th>
                <th>Created</th>
                <th>Parcels</th>
                <th className="right">Collected</th>
                <th className="right">Delivery fee</th>
                <th className="right">COD fee</th>
                <th className="right">Total fee</th>
                <th className="right">Payout to Paicart</th>
                <th className="right">Website due</th>
                <th>Pathao status</th>
                <th>Receive in Paicart</th>
              </tr>
            </thead>
            <tbody>
              {loading && !list.rows.length ? (
                <tr><td colSpan={12} className="dl-empty">Loading Pathao invoices…</td></tr>
              ) : shown.length === 0 ? (
                <tr><td colSpan={12} className="dl-empty">No invoices to show.</td></tr>
              ) : (
                shown.map((inv) => {
                  const id = inv.order_invoice_id;
                  const b = breakdowns[id];
                  const items = (b && b.items) || [];
                  const ours = items.filter((it) => byConsignment[String(it.consignment_id)]).length;
                  const isOpen = !!open[id];
                  return (
                    <React.Fragment key={id}>
                      <tr className={`pi-row${isOpen ? " is-open" : ""}`} onClick={() => setOpen((o) => ({ ...o, [id]: !o[id] }))}>
                        <td>{isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td><span className="pi-id">{id}</span></td>
                        <td className="dl-muted">{fmtDate(inv.invoice_created_at)}</td>
                        <td>
                          {b ? (
                            b.error ? <span className="dl-muted">—</span> : (
                              <span className="pi-count">
                                {items.length} parcel{items.length === 1 ? "" : "s"}
                                {ours > 0 && <em>{ours} Paicart</em>}
                              </span>
                            )
                          ) : <span className="dl-muted">…</span>}
                        </td>
                        <td className="right">{tk(inv.collected_amount, 2)}</td>
                        <td className="right">{tk(inv.delivery_fee, 2)}</td>
                        <td className="right">{tk(inv.cod_fee, 2)}</td>
                        <td className="right pi-fee">−{tk(inv.total_fee, 2)}</td>
                        <td className="right pi-payout">{tk(inv.receivable_amount, 2)}</td>
                        <td className="right">
                          {!plans[id] ? (
                            <span className="dl-muted">…</span>
                          ) : dueOfInvoice(plans[id].plan) === null ? (
                            <span className="dl-muted" title="No Paicart order in this invoice">—</span>
                          ) : (
                            <b className={dueOfInvoice(plans[id].plan) > 0 ? "pi-due" : "pi-nodue"}>{tk(dueOfInvoice(plans[id].plan), 2)}</b>
                          )}
                        </td>
                        <td><StatusPill status={inv.status} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          {receipts[id] ? (
                            <span className="pi-recv" title={`Received ${receipts[id].receivedDate || ""} by ${receipts[id].receivedBy || ""}`}>
                              <CheckCircle size={11} /> Received
                              <small>{[receipts[id].receivedDate, receipts[id].receivedBy].filter(Boolean).join(" · ")}</small>
                            </span>
                          ) : isPaid(inv.status) ? (
                            <button
                              type="button"
                              className="dl-btn dl-btn-primary dl-btn-sm"
                              disabled={!plans[id] || saving}
                              onClick={() => {
                                setConfirming(id);
                                setOpen((o) => ({ ...o, [id]: true }));
                              }}
                            >
                              {plans[id] ? "Receive" : "Checking…"}
                            </button>
                          ) : (
                            <span className="dl-muted" style={{ fontSize: 11 }}>Awaiting Pathao payout</span>
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="pi-detail">
                          <td />
                          <td colSpan={11}>
                            {confirming === id && plans[id] && plans[id].plan && !receipts[id] && (
                              <div className="pi-confirm">
                                <div className="pi-confirm-head">
                                  <b>Receive Pathao invoice {id} into Paicart</b>
                                  <span>All or nothing — every payment line and cash-in below is saved together, once.</span>
                                </div>

                                {/* 1 — what happens to each Paicart record */}
                                <div className="pi-sec-title">What happens to each order</div>
                                {recordEffects(plans[id].plan).length === 0 ? (
                                  <div className="pi-none">No Website Order, Product Request or Ship For Me in this invoice — nothing is paid into an order.</div>
                                ) : (
                                  <table className="pi-sub pi-effects">
                                    <thead>
                                      <tr>
                                        <th>Record</th><th>Customer</th><th className="right">Total bill</th><th className="right">Paid so far</th>
                                        <th className="right">Due now</th><th className="right">Pathao payment</th><th className="right">Paid after</th>
                                        <th className="right">Due after</th><th>Payment status</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {recordEffects(plans[id].plan).map((r) => (
                                        <tr key={`${r.kind}${r.id}`}>
                                          <td>
                                            <span className="pi-rec"><em>{KIND_LABEL[r.kind]}</em> #{r.id}</span>
                                            <small className="dl-muted" style={{ display: "block", marginTop: 2 }}>via {r.consignments.join(", ")}</small>
                                          </td>
                                          <td>{[r.userCode, r.customer].filter(Boolean).join(" · ") || <span className="dl-muted">—</span>}</td>
                                          <td className="right">{tk(r.payable, 2)}</td>
                                          <td className="right">{tk(r.paidBefore, 2)}</td>
                                          <td className="right"><b className={r.dueBefore > 0 ? "pi-due" : "pi-nodue"}>{tk(r.dueBefore, 2)}</b></td>
                                          <td className="right">
                                            <b className="pi-payout">+{tk(r.apply + r.extra, 2)}</b>
                                            {r.extra > 0 && <small style={{ display: "block", color: "#1d4ed8", fontWeight: 700 }}>incl. {tk(r.extra, 2)} extra</small>}
                                          </td>
                                          <td className="right">{tk(r.paidAfter, 2)}</td>
                                          <td className="right"><b className={r.dueAfter > 0 ? "pi-due" : "pi-nodue"}>{tk(r.dueAfter, 2)}</b></td>
                                          <td>
                                            <span className="pi-trans">
                                              <span className={`pi-pill ${r.stateBefore === "Paid" ? "pi-paid" : "pi-proc"}`}>{r.stateBefore}</span>
                                              <span className="pi-arrow">→</span>
                                              <span className={`pi-pill ${r.stateAfter === "Paid" ? "pi-paid" : "pi-proc"}`}>{r.stateAfter}</span>
                                            </span>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}

                                {/* 2 — accounts entries */}
                                <div className="pi-sec-title">Cash in &amp; expense entries</div>
                                <div className="pi-ledger">
                                  {ledgerEntries(plans[id].plan).map((e, i) => (
                                    <div key={i} className={`pi-led ${e.type === "Expense" ? "is-exp" : ""}`}>
                                      <span className="pi-led-type">{e.type}</span>
                                      <span className="pi-led-cat">{e.category} · Pathao</span>
                                      <span className="pi-led-what">{e.what}</span>
                                      <b>{e.type === "Expense" ? "−" : "+"}{tk(e.amount, 2)}</b>
                                    </div>
                                  ))}
                                </div>

                                <div className="pi-sec-title">Per parcel</div>
                                <table className="pi-sub">
                                  <thead>
                                    <tr>
                                      <th>Consignment</th><th>Paicart record</th><th className="right">Payout</th>
                                      <th className="right">Into the order</th><th className="right">Extra over due</th><th>Order after</th><th>Cash in</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {plans[id].plan.map((p) =>
                                      p.charge ? (
                                        <tr key={p.consignmentId}>
                                          <td><span className="pi-id pi-id-sm">{p.consignmentId}</span></td>
                                          <td className="dl-muted">
                                            Charge kept by Pathao
                                            {(p.chargeFor || []).length > 0 && ` · ${p.chargeFor.map((r) => `${KIND_LABEL[r.kind]} #${r.id}`).join(", ")}`}
                                          </td>
                                          <td className="right pi-fee">{tk(p.payout, 2)}</td>
                                          <td className="right dl-muted">—</td>
                                          <td className="right dl-muted">—</td>
                                          <td className="dl-muted">—</td>
                                          <td><span className="pi-fee">Expense {tk(Math.abs(p.payout), 2)}</span></td>
                                        </tr>
                                      ) : p.unmatched ? (
                                        <tr key={p.consignmentId}>
                                          <td><span className="pi-id pi-id-sm">{p.consignmentId}</span></td>
                                          <td className="dl-muted">No Paicart order{p.merchantOrderId ? ` (merchant order ${p.merchantOrderId})` : ""}</td>
                                          <td className="right">{tk(p.payout, 2)}</td>
                                          <td className="right dl-muted">—</td>
                                          <td className="right dl-muted">—</td>
                                          <td className="dl-muted">—</td>
                                          <td>{tk(p.payout, 2)} <small className="dl-muted">Pathao</small></td>
                                        </tr>
                                      ) : (
                                        p.lines.map((l, i) => (
                                          <tr key={`${p.consignmentId}${l.kind}${l.id}`}>
                                            <td>{i === 0 && <span className="pi-id pi-id-sm">{p.consignmentId}</span>}</td>
                                            <td><span className="pi-rec"><em>{KIND_LABEL[l.kind]}</em> #{l.id}</span></td>
                                            <td className="right">{i === 0 ? tk(p.payout, 2) : ""}</td>
                                            <td className="right pi-payout">{tk(l.apply, 2)}</td>
                                            <td className="right">{l.extra > 0 ? <b style={{ color: "#1d4ed8" }}>+{tk(l.extra, 2)}</b> : <span className="dl-muted">—</span>}</td>
                                            <td>
                                              <span className={`pi-pill ${l.stateAfter === "Paid" ? "pi-paid" : "pi-proc"}`}>{l.stateAfter}</span>
                                              <small className="dl-muted" style={{ display: "block" }}>due was {tk(Math.max(l.payable - l.paidBefore, 0))}</small>
                                            </td>
                                            <td>{tk(l.apply + l.extra, 2)}</td>
                                          </tr>
                                        ))
                                      )
                                    )}
                                  </tbody>
                                </table>
                                {(() => {
                                  const t = planTotals(plans[id].plan);
                                  return (
                                    <div className="pi-confirm-foot">
                                      <span>
                                        Total <b>{tk(t.payout, 2)}</b> · into orders <b>{tk(t.applied, 2)}</b>
                                        {t.extra > 0 && <> · extra <b>{tk(t.extra, 2)}</b></>}
                                        {t.cashInOnly > 0 && <> · cash in only <b>{tk(t.cashInOnly, 2)}</b></>}
                                        {t.charges > 0 && <> · Pathao charges (expense) <b>{tk(t.charges, 2)}</b></>}
                                      </span>
                                      <span style={{ display: "flex", gap: 8 }}>
                                        <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" onClick={() => setConfirming(null)} disabled={saving}>Cancel</button>
                                        <button type="button" className="dl-btn dl-btn-primary dl-btn-sm" onClick={() => receive(inv)} disabled={saving}>
                                          {saving ? "Receiving…" : `Confirm & receive ${tk(t.payout, 2)}`}
                                        </button>
                                      </span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            {!b ? (
                              <div className="dl-muted">Loading parcels…</div>
                            ) : b.error ? (
                              <div className="dl-infobox red">{b.error}</div>
                            ) : (
                              <table className="pi-sub">
                                <thead>
                                  <tr>
                                    <th>Consignment</th><th>Paicart order</th><th>Merchant order ID</th><th>Created</th>
                                    <th className="right">Collected</th><th className="right">Delivery</th><th className="right">COD</th>
                                    <th className="right">Final fee</th><th className="right">Payout</th><th className="right">Website due</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((it) => {
                                    const p = plans[id] && plans[id].plan && plans[id].plan.find((x) => x.consignmentId === String(it.consignment_id));
                                    return (
                                      <tr key={it.consignment_id}>
                                        <td><span className="pi-id pi-id-sm">{it.consignment_id}</span></td>
                                        <td>{p ? recordCell(p) : <span className="dl-muted">…</span>}</td>
                                        <td className="dl-muted">{it.merchant_order_id || "—"}</td>
                                        <td className="dl-muted">{fmtDate(it.created_at)}</td>
                                        <td className="right">{tk(it.collected_amount, 2)}</td>
                                        <td className="right">{tk(it.delivery_fee, 2)}</td>
                                        <td className="right">{tk(it.cash_on_delivery_fee, 2)}</td>
                                        <td className="right pi-fee">−{tk(it.final_fee, 2)}</td>
                                        <td className="right pi-payout">{tk(it.payout, 2)}</td>
                                        <td className="right">
                                          {!p ? (
                                            <span className="dl-muted">…</span>
                                          ) : dueOfConsignment(p) === null ? (
                                            <span className="dl-muted">—</span>
                                          ) : (
                                            <b className={dueOfConsignment(p) > 0 ? "pi-due" : "pi-nodue"}>{tk(dueOfConsignment(p), 2)}</b>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr>
                                    <td colSpan={4}>Invoice total</td>
                                    <td className="right">{tk(items.reduce((a, it) => a + n(it.collected_amount), 0), 2)}</td>
                                    <td className="right">{tk(items.reduce((a, it) => a + n(it.delivery_fee), 0), 2)}</td>
                                    <td className="right">{tk(items.reduce((a, it) => a + n(it.cash_on_delivery_fee), 0), 2)}</td>
                                    <td className="right pi-fee">−{tk(items.reduce((a, it) => a + n(it.final_fee), 0), 2)}</td>
                                    <td className="right pi-payout">{tk(items.reduce((a, it) => a + n(it.payout), 0), 2)}</td>
                                    <td className="right">
                                      {plans[id] && dueOfInvoice(plans[id].plan) !== null ? (
                                        <b className={dueOfInvoice(plans[id].plan) > 0 ? "pi-due" : "pi-nodue"}>{tk(dueOfInvoice(plans[id].plan), 2)}</b>
                                      ) : (
                                        <span className="dl-muted">—</span>
                                      )}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
            {shown.length > 0 && (
              <tfoot>
                <tr>
                  <td colSpan={4}>This page</td>
                  <td className="right">{tk(pageTotals.collected, 2)}</td>
                  <td colSpan={2} />
                  <td className="right pi-fee">−{tk(pageTotals.fees, 2)}</td>
                  <td className="right pi-payout">{tk(pageTotals.payout, 2)}</td>
                  <td className="right">
                    {tk(shown.reduce((a, r) => a + (dueOfInvoice(plans[r.order_invoice_id] && plans[r.order_invoice_id].plan) || 0), 0), 2)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      <div className="pi-pager">
        <span className="dl-muted">
          {list.total ? `${list.total} invoices · page ${page} of ${list.lastPage}` : ""}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>‹ Newer</button>
          <button type="button" className="dl-btn dl-btn-ghost dl-btn-sm" disabled={page >= list.lastPage || loading} onClick={() => setPage(page + 1)}>Older ›</button>
        </div>
      </div>
    </div>
  );
};

export default PathaoInvoices;
