import React, { useState } from "react";
import "./paymentModal.css";

/* One "Make New Payment" dialog for 1688 orders, product requests and
 * shipment requests.
 *
 * It still lives inside a bootstrap `.modal` with id="paymentModal" so the
 * existing `data-toggle="modal" data-target="#paymentModal"` triggers and the
 * `#close-button-for-payment-modal` hook the pages click after saving keep
 * working. Form state stays in the page (method / amount / paymentStatus via
 * the page's handleChange), this component only lays it out. */

const toNum = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export const tk = (v) => `৳${Math.round(toNum(v)).toLocaleString("en-IN")}`;

const ORDER_STATUS_TONE = {
  pending: "gray",
  Purchased: "gray",
  "Received in Warehouse": "orange",
  "Ready for fly": "orange",
  "Bangladesh customs": "orange",
  "Paicart warehouse": "green",
  "Bangladesh warehouse": "teal",
  Delivered: "green",
};
export const orderStatusTone = (status) => ORDER_STATUS_TONE[status] || "blue";

const PAYMENT_STATE_TONE = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "orange",
};
export const paymentStateTone = (state) => PAYMENT_STATE_TONE[state] || "gray";

export const PmBadge = ({ tone = "gray", children }) => (
  <span className={`pm-badge pm-tone-${tone}`}>
    <i className="pm-badge-dot" />
    {children}
  </span>
);

/* Official logos live in public/payment-logos (bKash / City Bank from the
   customer site, BRAC Bank from Wikipedia, Nagad and Rocket from their own
   websites). Cash and Loan aren't brands, so they get an icon. */
const LOGO = (file) => `${process.env.PUBLIC_URL || ""}/payment-logos/${file}`;
const METHOD_STYLE = {
  Cash: { bg: "#16a34a", short: "৳", icon: "cash" },
  Bkash: { bg: "#e2136e", short: "bK", logo: LOGO("bkash.png") },
  Nagad: { bg: "#f6921e", short: "N", logo: LOGO("nagad.png") },
  Rocket: { bg: "#8c3494", short: "R", logo: LOGO("rocket.png") },
  City: { bg: "#0b4ea2", short: "CB", logo: LOGO("city-bank.png") },
  "City Bank": { bg: "#0b4ea2", short: "CB", logo: LOGO("city-bank.png") },
  "Brack Bank": { bg: "#1f3f8f", short: "BB", logo: LOGO("brac-bank.svg") },
  "Brac Bank": { bg: "#1f3f8f", short: "BB", logo: LOGO("brac-bank.svg") },
  "BRAC Bank": { bg: "#1f3f8f", short: "BB", logo: LOGO("brac-bank.svg") },
  Loan: { bg: "#64748b", short: "L", icon: "loan" },
};
export const methodStyle = (value) =>
  METHOD_STYLE[value] ||
  METHOD_STYLE[Object.keys(METHOD_STYLE).find((k) => k.toLowerCase() === String(value || "").toLowerCase())] ||
  { bg: "#475569", short: String(value || "?")[0] };

const ICONS = {
  cash: (
    <svg viewBox="0 0 24 24" width="60%" height="60%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" />
    </svg>
  ),
  loan: (
    <svg viewBox="0 0 24 24" width="62%" height="62%" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" />
      <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" />
      <path d="m2 16 6 6" /><circle cx="16" cy="9" r="2.9" /><circle cx="6" cy="5" r="3" />
    </svg>
  ),
};

/* The payment method's mark: real logo on a white tile, else an icon/letter
   on its brand colour. `className` carries the size (pm-/ap- classes). */
export const MethodLogo = ({ method, className = "pm-method-logo" }) => {
  const s = methodStyle(method);
  if (s.logo) {
    return (
      <span className={`${className} has-logo`}>
        <img src={s.logo} alt={method || ""} />
      </span>
    );
  }
  return (
    <span className={className} style={{ background: s.bg }}>
      {s.icon ? ICONS[s.icon] : s.short}
    </span>
  );
};

const STATUS_OPTIONS = [
  { value: "Partially Paid", label: "Partially Paid", tone: "orange" },
  { value: "Paid", label: "Full Paid", tone: "green" },
];

/* breakdown: array of
 *   { section: "Title" }                       group heading
 *   { label, value, sign: "+"|"-", strong }    money line (value = number)
 *   { label, text }                            free-text line
 *   { divider: true }
 * facts: [{ label, value }] small key/value chips (weights, rates, ...). */
const PaymentModal = ({
  idLabel,
  idValue,
  badges,
  summary,
  breakdown = [],
  facts = [],
  methods = [],
  form,
  onChange,
  onSubmit,
  payments = [],
  historyPerson = (p) => p.receivedBy || p.approvedBy,
  historyPersonLabel = "Received by",
}) => {
  const [submitting, setSubmitting] = useState(false);

  const total = toNum(summary && summary.total);
  const paid = toNum(summary && summary.paid);
  const rawDue = total - paid;
  const due = Math.max(rawDue, 0);
  const pct = total > 0 ? Math.min(Math.round((paid / total) * 100), 100) : 0;
  const amount = toNum(form.amount);
  const remainingAfter = rawDue - amount;

  const set = (name, value) => onChange({ target: { name, value } });

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(e);
    } finally {
      setSubmitting(false);
    }
  };

  const history = (payments || []).filter(Boolean);

  return (
    <div
      className="modal fade pm-modal"
      id="paymentModal"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="paymentModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog pm-dialog" role="document">
        <div className="modal-content pm-content">
          {/* Header */}
          <div className="pm-head">
            <div className="pm-head-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M2 10h20M6 15h4" />
              </svg>
            </div>
            <div className="pm-head-text">
              <h5 className="pm-title" id="paymentModalLabel">
                Make New Payment
              </h5>
              <div className="pm-sub">
                {idLabel}: <b>#{idValue || "—"}</b>
              </div>
              {badges && <div className="pm-head-badges">{badges}</div>}
            </div>
            <button
              type="button"
              className="pm-x"
              data-dismiss="modal"
              aria-label="Close"
            >
              &times;
            </button>
          </div>

          <div className="pm-body">
            {/* Summary hero */}
            <div className="pm-hero">
              <div className="pm-hero-cell">
                <span className="pm-hero-label">Total Payable</span>
                <span className="pm-hero-value">{tk(total)}</span>
                {summary && summary.totalHint && (
                  <span className="pm-hero-hint">{summary.totalHint}</span>
                )}
              </div>
              <div className="pm-hero-cell">
                <span className="pm-hero-label">Paid</span>
                <span className="pm-hero-value pm-c-green">{tk(paid)}</span>
                <span className="pm-hero-hint">
                  {history.length} payment{history.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className={`pm-hero-cell pm-hero-due ${due > 0 ? "is-due" : "is-settled"}`}>
                <span className="pm-hero-label">
                  {due > 0 ? "Due" : rawDue < 0 ? "Overpaid" : "Settled"}
                </span>
                <span className="pm-hero-value">
                  {tk(rawDue < 0 ? -rawDue : due)}
                </span>
              </div>
              <div className="pm-progress" title={`${pct}% paid`}>
                <div className="pm-progress-bar" style={{ width: `${pct}%` }} />
                <span className="pm-progress-text">{pct}% paid</span>
              </div>
            </div>

            <div className="pm-grid">
              {/* Bill breakdown */}
              <div className="pm-card pm-bill">
                <div className="pm-card-title">Bill breakdown</div>
                <div className="pm-lines">
                  {breakdown.map((row, i) => {
                    if (row.section)
                      return (
                        <div key={i} className="pm-line-section">
                          {row.section}
                        </div>
                      );
                    if (row.divider) return <div key={i} className="pm-line-divider" />;
                    const v = toNum(row.value);
                    return (
                      <div
                        key={i}
                        className={`pm-line ${row.strong ? "is-strong" : ""}`}
                      >
                        <span className="pm-line-label">{row.label}</span>
                        <span
                          className={`pm-line-value ${
                            row.sign === "-" && v ? "pm-c-green" : ""
                          }`}
                        >
                          {row.text !== undefined
                            ? row.text
                            : `${row.sign && v ? (row.sign === "-" ? "− " : "+ ") : ""}${tk(Math.abs(v))}`}
                        </span>
                      </div>
                    );
                  })}
                  <div className="pm-line pm-line-total">
                    <span className="pm-line-label">Total payable</span>
                    <span className="pm-line-value">{tk(total)}</span>
                  </div>
                </div>

                {facts.length > 0 && (
                  <div className="pm-facts">
                    {facts.map((f, i) => (
                      <div key={i} className="pm-fact">
                        <span className="pm-fact-label">{f.label}</span>
                        <span className="pm-fact-value">{f.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment form */}
              <form className="pm-card pm-form" onSubmit={submit}>
                <div className="pm-card-title">Record a payment</div>

                <div className="pm-field">
                  <span className="pm-label">Payment method</span>
                  <div className="pm-methods" role="radiogroup">
                    {methods.map((m) => {
                      const active = form.method === m.value;
                      return (
                        <label
                          key={m.value}
                          className={`pm-method ${active ? "is-active" : ""}`}
                        >
                          <input
                            type="radio"
                            name="method"
                            value={m.value}
                            checked={active}
                            onChange={onChange}
                            required
                          />
                          <MethodLogo method={m.value} />
                          <span className="pm-method-name">{m.label}</span>
                          {active && <span className="pm-check">✓</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="pm-field">
                  <label className="pm-label" htmlFor="pm-amount">
                    Amount received
                  </label>
                  <div className="pm-amount">
                    <span className="pm-amount-cur">৳</span>
                    <input
                      id="pm-amount"
                      type="number"
                      name="amount"
                      min="0"
                      placeholder="0"
                      value={form.amount}
                      onChange={onChange}
                      required
                    />
                  </div>
                  {due > 0 && (
                    <div className="pm-quick">
                      <button
                        type="button"
                        onClick={() => {
                          set("amount", String(due));
                          set("paymentStatus", "Paid");
                        }}
                      >
                        Full due · {tk(due)}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          set("amount", String(Math.round(due / 2)));
                          set("paymentStatus", "Partially Paid");
                        }}
                      >
                        Half · {tk(due / 2)}
                      </button>
                    </div>
                  )}
                  {form.amount !== "" && form.amount !== undefined && (
                    <div className={`pm-after ${remainingAfter > 0 ? "" : remainingAfter < 0 ? "is-over" : "is-clear"}`}>
                      {remainingAfter > 0
                        ? `${tk(remainingAfter)} will remain due after this payment`
                        : remainingAfter < 0
                        ? `${tk(-remainingAfter)} more than the due amount`
                        : "This payment clears the full due"}
                    </div>
                  )}
                </div>

                <div className="pm-field">
                  <span className="pm-label">Payment status</span>
                  <div className="pm-seg" role="radiogroup">
                    {STATUS_OPTIONS.map((o) => (
                      <label
                        key={o.value}
                        className={`pm-seg-opt pm-tone-${o.tone} ${
                          form.paymentStatus === o.value ? "is-active" : ""
                        }`}
                      >
                        <input
                          type="radio"
                          name="paymentStatus"
                          value={o.value}
                          checked={form.paymentStatus === o.value}
                          onChange={onChange}
                          required
                        />
                        {o.label}
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" className="pm-submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <span className="pm-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      Confirm payment{amount > 0 ? ` · ${tk(amount)}` : ""}
                      <span aria-hidden="true">→</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* History */}
            <div className="pm-card pm-history">
              <div className="pm-card-title">
                Payment history
                <span className="pm-count">{history.length}</span>
              </div>
              {history.length === 0 ? (
                <div className="pm-empty">No payments recorded yet.</div>
              ) : (
                <ul className="pm-timeline">
                  {history.map((p, i) => {
                    return (
                      <li key={i} className="pm-tl-item">
                        <MethodLogo method={p.method} className="pm-method-logo sm" />
                        <div className="pm-tl-main">
                          <div className="pm-tl-top">
                            <b>{p.method || "—"}</b>
                            <span className="pm-tl-date">{p.date}</span>
                          </div>
                          <div className="pm-tl-meta">
                            {p.paidBy && <>Paid by {p.paidBy} · </>}
                            {historyPersonLabel}: {historyPerson(p) || "—"}
                          </div>
                        </div>
                        <span className="pm-tl-amount">{tk(p.amount)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="pm-foot">
            <button
              type="button"
              className="pm-close"
              data-dismiss="modal"
              id="close-button-for-payment-modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
