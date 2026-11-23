import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { X, Bell } from "react-feather";
import { Button, TONES } from "../common/listUi";
import { sendInAppNotifications } from "../../firebase/firebase.utils";

/* Send an in-app notification to one client, a selection, or everyone.
 *
 * `targets` is a list of { key, label, userIds, audience } the admin picks
 * from — one entry for a single client; for a broadcast, e.g. "All billed
 * clients" and "All registered customers". `templates` are optional
 * ready-made messages ({ label, title, body }). */

const field = {
  width: "100%",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
};

const NotifyModal = ({ heading, targets, templates = [], onClose }) => {
  const admin = useSelector((s) => s.admins && s.admins.currentAdmin);
  const [targetKey, setTargetKey] = useState(targets[0] && targets[0].key);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !sending && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, sending]);

  const target = targets.find((t) => t.key === targetKey) || targets[0];
  const count = target ? target.userIds.length : 0;

  const send = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !count) return;
    if (count > 1 && !window.confirm(`Send this notification to ${count} customers?`)) return;
    setSending(true);
    try {
      const sent = await sendInAppNotifications(target.userIds, {
        title,
        body,
        audience: target.audience,
        sentBy: (admin && (admin.name || admin.email)) || "Paicart",
      });
      toast.success(`Notification sent to ${sent} customer${sent === 1 ? "" : "s"}`);
      onClose();
    } catch (err) {
      toast.error(`Could not send: ${(err && err.message) || err}`);
      setSending(false);
    }
  };

  return (
    <div
      onClick={() => !sending && onClose()}
      style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, background: "rgba(15,23,42,.5)", zIndex: 1060, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={send}
        style={{ width: "min(560px, 100%)", background: "#fff", borderRadius: 16, boxShadow: "0 20px 50px rgba(15,23,42,.3)", overflow: "hidden" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #e9eef5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: TONES.orange.bg, color: TONES.orange.solid, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={18} />
            </span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Send in-app notification</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>{heading}</div>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={sending} style={{ border: "none", background: "#f1f5f9", borderRadius: 10, width: 34, height: 34, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {targets.length > 1 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6 }}>Send to</div>
              {targets.map((t) => (
                <label key={t.key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: "#0f172a", marginBottom: 4, cursor: "pointer" }}>
                  <input type="radio" name="target" checked={targetKey === t.key} onChange={() => setTargetKey(t.key)} />
                  {t.label} <span style={{ color: "#64748b" }}>({t.userIds.length})</span>
                </label>
              ))}
            </div>
          )}

          {templates.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {templates.map((t) => (
                <button
                  key={t.label}
                  type="button"
                  onClick={() => {
                    setTitle(t.title);
                    setBody(t.body);
                  }}
                  style={{ border: "1px solid #fed7aa", background: TONES.orange.bg, color: TONES.orange.fg, borderRadius: 999, padding: "4px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <input style={{ ...field, marginBottom: 10 }} placeholder="Title" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} required />
          <textarea style={{ ...field, minHeight: 140, resize: "vertical" }} placeholder="Message" value={body} maxLength={2000} onChange={(e) => setBody(e.target.value)} required />
          <div style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
            Shows in the customer's notification list on the Paicart website and app.
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "12px 20px", borderTop: "1px solid #e9eef5", background: "#f8fafc" }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={sending}>
            Cancel
          </Button>
          <Button type="submit" disabled={sending || !count || !title.trim() || !body.trim()}>
            {sending ? "Sending…" : `Send to ${count} customer${count === 1 ? "" : "s"}`}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default NotifyModal;
