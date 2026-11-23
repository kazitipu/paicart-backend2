import React, { Component } from "react";
import { ClipLoader } from "react-spinners";
import {
  allocateProportionally,
  PAYMENT_METHODS,
} from "../../constants/bulkActions";
import { statusDisplay } from "../../constants/statusDisplay";
import "./bulkActions.css";

/* Bulk "change status" and "receive payment" for the 1688 orders, product
 * request and shipment request lists.
 *
 * Each list keeps its own selection and passes plain items in:
 *   { id, label, sub, status, due, raw }
 * plus an async apply function per action, so how a status or payment is
 * written stays in the list that owns that data. */

const taka = (n) =>
  `৳${Math.trunc(Number(n) || 0).toLocaleString("en-US")}`;

const CLOSE_MS = 200;

/* Selection ------------------------------------------------------------- */

/* A react-table column with a checkbox per row and select-all in the header.
 * getId(row.original) -> the id kept in `selected`. */
export const selectionColumn = ({ allIds, selected, onToggle, onToggleAll, getId }) => {
  const all = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const some = !all && allIds.some((id) => selected.includes(id));
  return {
    id: "bulk-select",
    Header: (
      <input
        type="checkbox"
        className="bk-check"
        title={all ? "Clear selection" : "Select all listed"}
        checked={all}
        ref={(el) => el && (el.indeterminate = some)}
        onChange={() => onToggleAll(!all)}
      />
    ),
    accessor: (row) => getId(row),
    sortable: false,
    resizable: false,
    width: 46,
    style: { justifyContent: "center" },
    Cell: (row) => {
      const id = getId(row.original);
      return (
        <input
          type="checkbox"
          className="bk-check"
          checked={selected.includes(id)}
          onChange={() => onToggle(id)}
        />
      );
    },
  };
};

export const toggleId = (list, id) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const BulkActionBar = ({ count, totalDue, onStatus, onPayment, onClear }) =>
  count > 0 ? (
    <div className="bk-bar" role="toolbar" aria-label="Bulk actions">
      <span className="bk-bar-count">
        <b>{count}</b> selected
      </span>
      <span className="bk-bar-due">
        Total due <strong>{taka(totalDue)}</strong>
      </span>
      <span className="bk-bar-sep" />
      <button type="button" className="bk-act" onClick={onStatus}>
        <i className="fa fa-exchange" /> Change status
      </button>
      <button type="button" className="bk-act primary" onClick={onPayment}>
        <i className="fa fa-money" /> Receive payment
      </button>
      <button type="button" className="bk-clear" onClick={onClear} title="Clear selection">
        <i className="fa fa-times" /> Clear
      </button>
    </div>
  ) : null;

/* Shared modal shell with enter/exit animation ---------------------------- */

class Shell extends Component {
  componentDidMount() {
    document.addEventListener("keydown", this.onKey);
    document.body.style.overflow = "hidden";
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKey);
    document.body.style.overflow = "";
  }
  onKey = (e) => {
    if (e.key === "Escape") this.props.onRequestClose();
  };
  render() {
    const { closing, icon, tone, title, sub, children, onRequestClose } = this.props;
    return (
      <div
        className={`bk-backdrop ${closing ? "is-closing" : ""}`}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.target === e.currentTarget && onRequestClose()}
      >
        <div className="bk-modal">
          <header className="bk-head">
            <div className={`bk-icon ${tone}`}>
              <i className={`fa ${icon}`} />
            </div>
            <div>
              <h2 className="bk-title">{title}</h2>
              <div className="bk-sub">{sub}</div>
            </div>
            <button type="button" className="bk-close" aria-label="Close" onClick={onRequestClose}>
              ×
            </button>
          </header>
          {children}
        </div>
      </div>
    );
  }
}

/* Runs `apply` over items one at a time, reporting progress. Sequential on
 * purpose: every update is a Firestore write plus a redux dispatch, and a
 * burst of parallel writes made the list flicker between states. */
const runAll = async (items, apply, onProgress) => {
  const done = [];
  const failed = [];
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];
    try {
      await apply(item);
      done.push(item);
    } catch (err) {
      failed.push({ item, error: (err && err.message) || "Failed" });
    }
    onProgress(i + 1);
  }
  return { done, failed };
};

class Runner extends Component {
  /* phase: form | running | done */
  state = { closing: false, phase: "form", progress: 0, total: 0, result: null };

  requestClose = () => {
    if (this.state.phase === "running" || this.state.closing) return;
    this.setState({ closing: true });
    setTimeout(() => {
      if (this.state.phase === "done") this.props.onFinished(this.state.result);
      this.props.onClose();
    }, CLOSE_MS);
  };

  run = async (items, apply) => {
    this.setState({ phase: "running", progress: 0, total: items.length });
    const result = await runAll(items, apply, (progress) => this.setState({ progress }));
    this.setState({ phase: "done", result });
  };

  renderRunning(verb) {
    const { progress, total } = this.state;
    return (
      <div className="bk-progress">
        <ClipLoader size={28} color="#ff6a00" />
        <h3 style={{ marginTop: 14 }}>
          {verb} {progress} of {total}…
        </h3>
        <div className="bk-progress-bar">
          <div style={{ width: `${total ? (progress / total) * 100 : 0}%` }} />
        </div>
        <p>Please keep this window open.</p>
      </div>
    );
  }

  renderDone(successText) {
    const { done, failed } = this.state.result;
    return (
      <div className="bk-progress">
        <div className={`bk-done-icon ${failed.length ? "partial" : "ok"}`}>
          <i className={`fa ${failed.length ? "fa-exclamation" : "fa-check"}`} />
        </div>
        <h3>
          {done.length} {successText}
        </h3>
        <p>
          {failed.length
            ? `${failed.length} could not be updated.`
            : "Everything went through."}
        </p>
        {failed.length > 0 && (
          <div className="bk-fail-list">
            {failed.map(({ item, error }) => (
              <div key={item.id}>
                <b>{item.label}</b> — {error}
              </div>
            ))}
          </div>
        )}
        <button type="button" className="bk-btn ghost" onClick={this.requestClose}>
          Done
        </button>
      </div>
    );
  }
}

/* Change status --------------------------------------------------------- */

/* props: items, statusOptions [{ value, label?, icon?, danger? }],
 * validate(item, status) -> reason string | null,
 * apply(item, status, { notify }) -> Promise, notifyAvailable, onClose,
 * onFinished(result) */
export class BulkStatusModal extends Runner {
  state = { ...this.state, status: "", notify: true };

  render() {
    const { items, statusOptions, validate, apply, notifyAvailable } = this.props;
    const { closing, phase, status, notify } = this.state;
    const checked = items.map((item) => ({
      item,
      reason: status
        ? item.status === status
          ? "Already in this status"
          : validate
            ? validate(item, status)
            : null
        : null,
    }));
    const ready = checked.filter((c) => !c.reason);
    const skipped = checked.filter((c) => c.reason);

    return (
      <Shell
        closing={closing}
        tone="status"
        icon="fa-exchange"
        title="Change status"
        sub={`${items.length} selected`}
        onRequestClose={this.requestClose}
      >
        {phase === "running" && this.renderRunning("Updating")}
        {phase === "done" && this.renderDone(`updated to “${statusDisplay(status)}”`)}
        {phase === "form" && (
          <>
            <div className="bk-body">
              <div>
                <span className="bk-label">Move selected to</span>
                <div className="bk-status-grid">
                  {statusOptions.map((o) => (
                    <button
                      type="button"
                      key={o.value}
                      className={`bk-status ${o.danger ? "danger" : ""} ${status === o.value ? "active" : ""}`}
                      onClick={() => this.setState({ status: o.value })}
                    >
                      <i className={`fa ${o.icon || (o.danger ? "fa-ban" : "fa-circle-o")}`} />
                      {o.label || statusDisplay(o.value)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bk-table-wrap">
                <table className="bk-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Current status</th>
                      <th>{status ? "Will become" : "New status"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checked.map(({ item, reason }) => (
                      <tr key={item.id} className={reason ? "bk-row-skip" : ""}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.label}</div>
                          {item.sub && <div className="bk-row-sub">{item.sub}</div>}
                        </td>
                        <td>
                          <span className="bk-pill gray">{statusDisplay(item.status) || "—"}</span>
                        </td>
                        <td>
                          {!status ? (
                            <span className="muted">—</span>
                          ) : reason ? (
                            <span style={{ color: "#b45309", fontSize: 11 }}>
                              <i className="fa fa-minus-circle" /> Skipped: {reason}
                            </span>
                          ) : (
                            <span className="bk-pill blue">{statusDisplay(status)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {status && skipped.length > 0 && (
                <div className="bk-alert warn">
                  <i className="fa fa-info-circle" />
                  <span>
                    {skipped.length} of {items.length} will be skipped (see the
                    highlighted rows). The other {ready.length} will be updated.
                  </span>
                </div>
              )}

              {notifyAvailable && (
                <label className="bk-toggle">
                  <input
                    type="checkbox"
                    className="bk-check"
                    checked={notify}
                    onChange={(e) => this.setState({ notify: e.target.checked })}
                  />
                  Send each customer a push notification about the new status
                </label>
              )}
            </div>
            <footer className="bk-foot">
              <span className="bk-foot-note">
                {status
                  ? `${ready.length} will move to “${statusDisplay(status)}”.`
                  : "Pick a status."}
              </span>
              <button type="button" className="bk-btn ghost" onClick={this.requestClose}>
                Cancel
              </button>
              <button
                type="button"
                className="bk-btn blue"
                disabled={!status || ready.length === 0}
                onClick={() =>
                  this.run(
                    ready.map((c) => c.item),
                    (item) => apply(item, status, { notify: notifyAvailable && notify }),
                  )
                }
              >
                <i className="fa fa-check" /> Update {ready.length || ""}
              </button>
            </footer>
          </>
        )}
      </Shell>
    );
  }
}

/* Receive payment ------------------------------------------------------- */

/* props: items (with due), apply(item, { amount, method, paymentStatus })
 * -> Promise, onClose, onFinished(result) */
export class BulkPaymentModal extends Runner {
  state = { ...this.state, mode: "full", amount: "", method: "" };

  plan = () => {
    const payable = this.props.items.filter((item) => item.due > 0);
    const totalDue = payable.reduce((sum, item) => sum + item.due, 0);
    const amount =
      this.state.mode === "full"
        ? totalDue
        : Math.max(Math.trunc(Number(this.state.amount) || 0), 0);
    const shares = allocateProportionally(
      payable.map((item) => item.due),
      Math.min(amount, totalDue),
    );
    const rows = payable.map((item, i) => ({
      item,
      pays: shares[i],
      remaining: item.due - shares[i],
    }));
    return { payable, totalDue, amount, rows };
  };

  render() {
    const { items, apply } = this.props;
    const { closing, phase, mode, amount: rawAmount, method } = this.state;
    const { payable, totalDue, amount, rows } = this.plan();
    const settled = items.filter((item) => !(item.due > 0));
    const over = mode === "partial" && amount > totalDue;
    const percent = totalDue ? Math.min((amount / totalDue) * 100, 100) : 0;
    const valid = method && amount > 0 && !over && payable.length > 0;
    const toPay = rows.filter((r) => r.pays > 0);

    return (
      <Shell
        closing={closing}
        tone="pay"
        icon="fa-money"
        title="Receive payment"
        sub={`${items.length} selected · ${taka(totalDue)} due`}
        onRequestClose={this.requestClose}
      >
        {phase === "running" && this.renderRunning("Recording payment")}
        {phase === "done" && this.renderDone("payments recorded")}
        {phase === "form" && (
          <>
            <div className="bk-body">
              <div className="bk-seg">
                <button
                  type="button"
                  className={mode === "full" ? "active" : ""}
                  onClick={() => this.setState({ mode: "full" })}
                >
                  <i className="fa fa-check-circle" /> Full payment
                </button>
                <button
                  type="button"
                  className={mode === "partial" ? "active" : ""}
                  onClick={() => this.setState({ mode: "partial" })}
                >
                  <i className="fa fa-adjust" /> Partial payment
                </button>
              </div>

              <div className="bk-grid">
                <div>
                  <span className="bk-label">Amount received (৳)</span>
                  {mode === "full" ? (
                    <input className="bk-input big" value={taka(totalDue)} disabled />
                  ) : (
                    <>
                      <input
                        className="bk-input big"
                        type="number"
                        min="1"
                        max={totalDue}
                        autoFocus
                        placeholder="0"
                        value={rawAmount}
                        onChange={(e) => this.setState({ amount: e.target.value })}
                      />
                      <div className="bk-chips">
                        {[25, 50, 75].map((p) => {
                          const value = String(Math.round((totalDue * p) / 100));
                          return (
                            <button
                              type="button"
                              key={p}
                              className={`bk-chip ${rawAmount === value ? "active" : ""}`}
                              onClick={() => this.setState({ amount: value })}
                            >
                              {p}% · {taka(value)}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {over && (
                    <div className="bk-help error">
                      More than the total due ({taka(totalDue)}). Use Full payment instead.
                    </div>
                  )}
                </div>
                <div>
                  <span className="bk-label">Payment method</span>
                  <select
                    className="bk-input"
                    value={method}
                    onChange={(e) => this.setState({ method: e.target.value })}
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <div className="bk-help">Recorded on every order with today’s date.</div>
                </div>
              </div>

              <div>
                <div className="bk-meter">
                  <div style={{ width: `${percent}%` }} />
                </div>
                <div className="bk-meter-legend">
                  <span>
                    Paying <b>{taka(Math.min(amount, totalDue))}</b> of {taka(totalDue)}
                  </span>
                  <span>
                    <b>{Math.round(percent * 10) / 10}%</b> of each order’s due
                  </span>
                </div>
              </div>

              <div className="bk-table-wrap">
                <table className="bk-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th className="num">Due now</th>
                      <th className="num">Pays</th>
                      <th className="num">Still due</th>
                      <th>Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(({ item, pays, remaining }) => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.label}</div>
                          {item.sub && <div className="bk-row-sub">{item.sub}</div>}
                        </td>
                        <td className="num">{taka(item.due)}</td>
                        <td className="num" style={{ fontWeight: 700, color: pays ? "#15803d" : "#94a3b8" }}>
                          {taka(pays)}
                        </td>
                        <td className="num">{taka(remaining)}</td>
                        <td>
                          {pays === 0 ? (
                            <span className="bk-pill gray">No change</span>
                          ) : remaining === 0 ? (
                            <span className="bk-pill green">Paid</span>
                          ) : (
                            <span className="bk-pill orange">Partially Paid</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {settled.map((item) => (
                      <tr key={item.id} className="bk-row-skip">
                        <td>
                          <div style={{ fontWeight: 700 }}>{item.label}</div>
                          {item.sub && <div className="bk-row-sub">{item.sub}</div>}
                        </td>
                        <td className="num muted">{taka(0)}</td>
                        <td className="num muted">—</td>
                        <td className="num muted">—</td>
                        <td>
                          <span className="bk-pill gray">Nothing due · skipped</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>Total</td>
                      <td className="num">{taka(totalDue)}</td>
                      <td className="num" style={{ color: "#15803d" }}>
                        {taka(Math.min(amount, totalDue))}
                      </td>
                      <td className="num">{taka(Math.max(totalDue - amount, 0))}</td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>

              {payable.length === 0 && (
                <div className="bk-alert warn">
                  <i className="fa fa-info-circle" />
                  <span>None of the selected items has anything due.</span>
                </div>
              )}
            </div>
            <footer className="bk-foot">
              <span className="bk-foot-note">
                {valid
                  ? `${toPay.length} payment${toPay.length === 1 ? "" : "s"} will be recorded.`
                  : !method
                    ? "Choose a payment method."
                    : "Enter the amount received."}
              </span>
              <button type="button" className="bk-btn ghost" onClick={this.requestClose}>
                Cancel
              </button>
              <button
                type="button"
                className="bk-btn green"
                disabled={!valid}
                onClick={() =>
                  this.run(
                    toPay.map((r) => ({ ...r.item, pays: r.pays, remaining: r.remaining })),
                    (item) =>
                      apply(item, {
                        amount: item.pays,
                        method,
                        paymentStatus: item.remaining === 0 ? "Paid" : "Partially Paid",
                      }),
                  )
                }
              >
                <i className="fa fa-check" /> Receive {taka(Math.min(amount, totalDue))}
              </button>
            </footer>
          </>
        )}
      </Shell>
    );
  }
}
