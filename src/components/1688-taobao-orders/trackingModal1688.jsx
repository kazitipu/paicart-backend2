import React, { Component } from "react";
import { has1688OrderNo, refresh1688Trace, traceNeedsRefresh } from "../common/parcelDetails/store1688";
import { trackingNumbersOf } from "../../constants/cartons";
import "./pickOrderModal.css";

/* China courier tracking for a website order (#trackingModal, opened by the
 * tracking-number badge in the list).
 *
 * Shows the 1688 logistics trace stored on the order (trace1688 — the same
 * copy the details page uses) and only calls 1688 when nothing is stored or
 * it's stale, or when the admin clicks Refetch; the result is saved back.
 * Never throws while rendering: no trace / no steps / 1688 errors all have
 * their own state, so the page can't freeze behind the backdrop. */

const toDate = (s) => {
  const m = String(s || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null;
};
const ago = (d) => {
  if (!d) return "";
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
};
const fmt = (d) =>
  d ? d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";

export default class TrackingModal1688 extends Component {
  state = { fetched: null, loading: false, error: "" };
  tried = new Set();

  componentDidUpdate(prev) {
    const o = this.props.order;
    const id = o && o.orderId;
    if (id && (!prev.order || prev.order.orderId !== id || prev.openKey !== this.props.openKey)) {
      this.setState({ fetched: null, error: "", loading: false });
      if (traceNeedsRefresh(o) && !this.tried.has(o.orderNumber)) {
        this.tried.add(o.orderNumber);
        this.load();
      }
    }
  }

  load = async () => {
    const o = this.props.order;
    if (!o || !has1688OrderNo(o)) return;
    this.setState({ loading: true, error: "" });
    try {
      const fetched = await refresh1688Trace("order", o);
      /* still the same order? */
      if (this.props.order && this.props.order.orderId === o.orderId) this.setState({ fetched, loading: false });
    } catch (e) {
      this.setState({ loading: false, error: (e && e.message) || "Could not reach 1688" });
    }
  };

  close = () => {
    if (window.$) window.$("#trackingModal").modal("hide");
  };

  render() {
    const o = this.props.order;
    const { fetched, loading, error } = this.state;
    const stored = fetched || (o && Array.isArray(o.trace1688) ? { trace1688: o.trace1688, trace1688CheckedAt: o.trace1688CheckedAt } : null);
    const trace = (stored && stored.trace1688) || [];
    const checkedAt = stored && stored.trace1688CheckedAt ? new Date(Number(stored.trace1688CheckedAt)) : null;
    const events = [];
    trace.forEach((t) => (t.steps || []).forEach((s) => events.push({ at: toDate(s.at), raw: s.at, remark: s.remark, bill: t.bill, company: t.company })));
    events.sort((a, b) => (b.at ? b.at.getTime() : 0) - (a.at ? a.at.getTime() : 0));
    const ours = o ? trackingNumbersOf(o) : [];
    const theirs = trace.map((t) => t.bill).filter(Boolean);
    /* the number on the order isn't one 1688 knows for this 1688 order */
    const mismatch = theirs.length > 0 && ours.length > 0 && !ours.some((n) => theirs.includes(n));
    const company = (trace[0] && trace[0].company) || "";

    return (
      <div className="modal fade pk-modal" id="trackingModal" tabIndex="-1" role="dialog" aria-labelledby="trackingModalTitle" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered pk-dialog" role="document" style={{ maxWidth: 720 }}>
          <div className="modal-content pk-content">
            <div className="pk-head">
              <div>
                <div className="pk-kicker">China courier tracking · from 1688</div>
                <div className="pk-title" id="trackingModalTitle">{ours.join(", ") || "No tracking number"}</div>
                {o && (
                  <div className="pk-head-chips">
                    <span>Order #{o.orderId}</span>
                    {o.orderNumber && <span>1688 #{o.orderNumber}</span>}
                    {company && <span>{company}</span>}
                  </div>
                )}
              </div>
              <button type="button" className="pk-x" onClick={this.close} aria-label="Close">
                &times;
              </button>
            </div>

            <div className="pk-body">
              <div className="tm-fetch">
                <span>
                  <i className="fa fa-clock-o" />{" "}
                  {checkedAt ? `Last fetched: ${fmt(checkedAt)} (${ago(checkedAt)})` : "Not fetched from 1688 yet"}
                  {error && <em> · last try failed ({error})</em>}
                </span>
                {o && has1688OrderNo(o) && (
                  <button type="button" className="pk-btn pk-btn-ghost tm-refetch" onClick={this.load} disabled={loading}>
                    <i className={`fa fa-refresh${loading ? " fa-spin" : ""}`} /> {loading ? "Fetching…" : "Refetch"}
                  </button>
                )}
              </div>

              {mismatch && (
                <div className="pk-error" style={{ background: "#fffbeb", borderColor: "#fde68a", color: "#92400e" }}>
                  <i className="fa fa-exclamation-triangle" />
                  <div>
                    <b>Tracking number doesn't match 1688</b>
                    <span>
                      This order has {ours.join(", ")}, but 1688 reports {theirs.join(", ")} for 1688 order {o.orderNumber}. Check the number with Update
                      order.
                    </span>
                  </div>
                </div>
              )}

              {o && !has1688OrderNo(o) ? (
                <div className="tm-empty">
                  <i className="fa fa-info-circle" />
                  This order has no 1688 order number, so 1688 can't be asked for its courier tracking.
                </div>
              ) : loading && !events.length ? (
                <div className="tm-empty">
                  <i className="fa fa-spinner fa-spin" /> Loading tracking from 1688…
                </div>
              ) : events.length ? (
                <section className="pk-section">
                  <div className="pk-section-title">
                    <span className="pk-step"><i className="fa fa-truck" /></span> {events.length} courier update{events.length === 1 ? "" : "s"}
                  </div>
                  <ol className="tm-steps">
                    {events.map((e, i) => (
                      <li key={i} className={i === 0 ? "is-latest" : ""}>
                        <span className="tm-dot" />
                        <div>
                          <span className="tm-text">{e.remark || "—"}</span>
                          <small>
                            {e.at ? `${fmt(e.at)} · ${ago(e.at)}` : e.raw}
                            {theirs.length > 1 && e.bill ? ` · ${e.bill}` : ""}
                          </small>
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              ) : (
                <div className="tm-empty">
                  <i className="fa fa-hourglass-half" />
                  {error
                    ? "Couldn't load the tracking from 1688. Try Refetch in a moment."
                    : checkedAt
                      ? "1688 has no courier updates for this order yet — the seller may not have shipped, or the tracking number belongs to another order."
                      : "No tracking loaded yet."}
                </div>
              )}
            </div>

            <div className="pk-foot" style={{ justifyContent: "flex-end" }}>
              <button type="button" className="pk-btn pk-btn-ghost" onClick={this.close}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
