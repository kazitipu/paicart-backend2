import React, { Component } from "react";
import { CheckCircle, AlertTriangle, XCircle, Info, X } from "react-feather";

/* App-wide dialog that replaces the browser's native alert().
 *
 * The admin calls alert() in ~350 places — mostly `alert(error)` straight
 * out of a Firestore catch. The native box blocked the tab, looked like a
 * browser warning, and showed raw text such as "FirebaseError: Missing or
 * insufficient permissions." <AppDialogHost/> is mounted once at the root and
 * takes over window.alert, so every one of those calls now opens this dialog:
 *   - the tone (error / warning / success / info) is read from the message;
 *   - known Firebase / network errors get a plain-English explanation, with
 *     the original text kept under "Technical details";
 *   - several alerts in a row queue up instead of stacking.
 *
 * New code can call showDialog({ tone, title, message, details, items })
 * directly for richer feedback (e.g. a per-order result list).
 *
 * window.confirm / window.prompt are left native: callers rely on them
 * blocking until answered. */

const TONES = {
  success: { Icon: CheckCircle, fg: "#0f7b35", bg: "#e7f8ec", ring: "#bbf0cb", title: "Done" },
  error: { Icon: XCircle, fg: "#b91c1c", bg: "#fdeaea", ring: "#f8caca", title: "Something went wrong" },
  warning: { Icon: AlertTriangle, fg: "#b45309", bg: "#fff4e5", ring: "#fde0b3", title: "Please check" },
  info: { Icon: Info, fg: "#1d4ed8", bg: "#e8f1fe", ring: "#c9dcfb", title: "Notice" },
};

/* Raw error text → what it means for the admin, and what to do about it */
const KNOWN_ERRORS = [
  [/permission|insufficient|unauthori[sz]ed|PERMISSION_DENIED/i,
    "You don't have permission to do this. Your admin role may not allow it, or your login has expired — sign out and in again, then retry."],
  [/network|failed to fetch|ERR_INTERNET|offline|unavailable|timeout|timed out|ECONN/i,
    "Couldn't reach the server. Check your internet connection and try again."],
  [/not[- ]found|No document to update|does not exist/i,
    "The record wasn't found — it may have been deleted or moved. Refresh the page and try again."],
  [/quota|resource[- ]exhausted|too many requests|429/i,
    "Too many requests in a short time. Wait a minute and try again."],
  [/already[- ]exists/i, "This record already exists."],
  [/invalid[- ]argument|Unsupported field value: undefined/i,
    "Some information on this record is missing or invalid, so it couldn't be saved. Check the fields and try again."],
  [/Request failed with status code 5\d\d/i, "The server had a problem handling this request. Try again in a moment."],
  [/Request failed with status code 4\d\d/i, "The server rejected this request. Check the details and try again."],
];

const textOf = (value) => {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message ? `${value.name || "Error"}: ${value.message}` : String(value);
  if (typeof value === "object") {
    if (value.message) return String(value.message);
    try {
      return JSON.stringify(value, null, 2);
    } catch (e) {
      return String(value);
    }
  }
  return String(value);
};

const looksLikeError = (raw, text) =>
  raw instanceof Error ||
  /error|failed|failure|couldn'?t|could not|cannot|can't|denied|invalid|unable|not allowed|wrong|exception/i.test(text);
const looksLikeSuccess = (text) =>
  /success|successfully|updated|added|saved|created|deleted|removed|done|completed|sent|approved/i.test(text);
const looksLikeWarning = (text) =>
  /please|select|at least|required|must|enter|no .* found|not found|nothing|empty|already/i.test(text);

/* alert(anything) → dialog options */
export const describeAlert = (raw) => {
  const text = textOf(raw).trim() || "Something happened.";
  if (looksLikeError(raw, text)) {
    const known = KNOWN_ERRORS.find(([re]) => re.test(text));
    return {
      tone: "error",
      title: "Something went wrong",
      message: known ? known[1] : text.replace(/^FirebaseError:\s*/i, ""),
      details: known || /^[A-Z][a-zA-Z]*Error:/.test(text) ? text : "",
    };
  }
  if (looksLikeSuccess(text)) return { tone: "success", title: "Done", message: text };
  if (looksLikeWarning(text)) return { tone: "warning", title: "Please check", message: text };
  return { tone: "info", title: "Notice", message: text };
};

let host = null;
const pending = [];

/* Open a dialog. Options: tone, title, message, details (collapsed technical
   text), items ([{ label, value, tone }] rows), okLabel. */
export const showDialog = (options) => {
  const opts = typeof options === "string" ? describeAlert(options) : options || {};
  if (host) host.push(opts);
  else pending.push(opts);
};

export class AppDialogHost extends Component {
  state = { queue: [], showDetails: false };

  componentDidMount() {
    host = this;
    this.nativeAlert = window.alert;
    window.alert = (message) => this.push(describeAlert(message));
    pending.splice(0).forEach((opts) => this.push(opts));
    window.addEventListener("keydown", this.onKey);
  }

  componentWillUnmount() {
    if (host === this) host = null;
    if (this.nativeAlert) window.alert = this.nativeAlert;
    window.removeEventListener("keydown", this.onKey);
  }

  push = (opts) => this.setState(({ queue }) => ({ queue: [...queue, opts] }));

  close = () => this.setState(({ queue }) => ({ queue: queue.slice(1), showDetails: false }));

  onKey = (e) => {
    if (!this.state.queue.length) return;
    if (e.key === "Escape" || e.key === "Enter") {
      e.preventDefault();
      this.close();
    }
  };

  render() {
    const current = this.state.queue[0];
    if (!current) return null;
    const tone = TONES[current.tone] || TONES.info;
    const { Icon } = tone;
    const more = this.state.queue.length - 1;

    return (
      <div
        role="presentation"
        onClick={this.close}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 3000,
          background: "rgba(15,23,42,.45)", display: "flex", alignItems: "flex-start",
          justifyContent: "center", padding: "12vh 16px 16px",
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="app-dialog-title"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "min(480px, 100%)", maxHeight: "76vh", display: "flex", flexDirection: "column",
            background: "#fff", borderRadius: 16, overflow: "hidden",
            boxShadow: "0 24px 60px rgba(15,23,42,.28)", fontFamily: "inherit",
          }}
        >
          <div style={{ height: 4, background: tone.fg }} />
          <div style={{ display: "flex", gap: 14, padding: "20px 20px 8px", alignItems: "flex-start" }}>
            <span
              style={{
                flex: "0 0 40px", width: 40, height: 40, borderRadius: 12, background: tone.bg,
                color: tone.fg, display: "inline-flex", alignItems: "center", justifyContent: "center",
                boxShadow: `0 0 0 4px ${tone.ring}55`,
              }}
            >
              <Icon size={20} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div id="app-dialog-title" style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", lineHeight: 1.3 }}>
                {current.title || tone.title}
              </div>
              {current.message && (
                <div style={{ fontSize: 14, color: "#334155", marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-line", wordBreak: "break-word" }}>
                  {current.message}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={this.close}
              aria-label="Close"
              style={{ border: "none", background: "#f1f5f9", borderRadius: 9, width: 30, height: 30, cursor: "pointer", flex: "0 0 30px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={15} />
            </button>
          </div>

          {(current.items && current.items.length > 0) || current.details ? (
            <div style={{ padding: "4px 20px 4px 74px", overflowY: "auto" }}>
              {current.items && current.items.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "6px 0" }}>
                  {current.items.map((item, i) => {
                    const t = TONES[item.tone] || null;
                    return (
                      <div
                        key={i}
                        style={{
                          display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline",
                          padding: "8px 10px", borderRadius: 9, background: "#f8fafc", border: "1px solid #eef2f7",
                          fontSize: 13,
                        }}
                      >
                        <span style={{ color: "#334155", minWidth: 0, wordBreak: "break-word" }}>{item.label}</span>
                        <span style={{ fontWeight: 700, color: t ? t.fg : "#0f172a", textAlign: "right", wordBreak: "break-word" }}>{item.value}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {current.details && (
                <div style={{ margin: "6px 0" }}>
                  <button
                    type="button"
                    onClick={() => this.setState(({ showDetails }) => ({ showDetails: !showDetails }))}
                    style={{ border: "none", background: "none", padding: 0, color: "#64748b", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    {this.state.showDetails ? "Hide technical details" : "Show technical details"}
                  </button>
                  {this.state.showDetails && (
                    <pre style={{ marginTop: 6, padding: 10, background: "#0f172a", color: "#e2e8f0", borderRadius: 8, fontSize: 11, whiteSpace: "pre-wrap", wordBreak: "break-word", maxHeight: 180, overflow: "auto" }}>
                      {current.details}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ) : null}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "14px 20px 18px" }}>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>{more > 0 ? `${more} more message${more === 1 ? "" : "s"}` : ""}</span>
            <button
              type="button"
              autoFocus
              onClick={this.close}
              style={{
                border: "none", borderRadius: 10, padding: "9px 22px", fontSize: 14, fontWeight: 700,
                cursor: "pointer", color: "#fff", background: current.tone === "error" ? "#dc2626" : "#FF6A00",
              }}
            >
              {current.okLabel || (more > 0 ? "Next" : "OK")}
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppDialogHost;
