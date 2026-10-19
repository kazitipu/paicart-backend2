import React from "react";

/* Result panel for the bulk 1688 sync.
 *
 * Replaces a native alert(), which blocked the whole tab and threw away the
 * breakdown in one line of text. Self-contained overlay rather than a
 * bootstrap modal, so it needs no data-toggle wiring to open. */

const Row = ({ color, label, value, muted }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 14px",
      borderRadius: 8,
      background: muted ? "#f7f7f9" : "white",
      border: "1px solid #ececf1",
      marginBottom: 8,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          display: "inline-block",
        }}
      />
      <span style={{ fontSize: 13, color: "#444" }}>{label}</span>
    </span>
    <span style={{ fontSize: 15, fontWeight: "bold", color }}>{value}</span>
  </div>
);

const SyncResultModal = ({ result, onClose }) => {
  if (!result) return null;
  const { total = 0, synced = 0, moved = 0, failed = 0, message } = result;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(15, 23, 42, .45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: "92vw",
          background: "white",
          borderRadius: 14,
          overflow: "hidden",
          boxShadow: "0 18px 50px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            background: "rgb(0, 37, 76)",
            color: "white",
            padding: "16px 20px",
          }}
        >
          <div style={{ fontSize: 16, fontWeight: "bold" }}>
            {message ? "Nothing to sync" : "1688 sync complete"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
            Actual total, shipping fee and order status
          </div>
        </div>

        <div style={{ padding: 18 }}>
          {message ? (
            <div style={{ fontSize: 14, color: "#444", padding: "4px 2px" }}>
              {message}
            </div>
          ) : (
            <>
              <Row
                color="#0f766e"
                label="Orders synced"
                value={`${synced} of ${total}`}
              />
              <Row
                color="#6f42c1"
                label="Moved to a new order status"
                value={moved}
              />
              {failed > 0 && (
                <Row
                  color="#c1666b"
                  label="1688 returned no details"
                  value={failed}
                  muted
                />
              )}
              {moved > 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#777",
                    marginTop: 10,
                    lineHeight: 1.5,
                  }}
                >
                  Orders that moved stay listed here until you reload the tab.
                </div>
              )}
            </>
          )}
        </div>

        <div
          style={{
            padding: "0 18px 18px",
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            onClick={onClose}
            className="btn"
            style={{
              background: "rgb(0, 37, 76)",
              color: "white",
              borderRadius: 8,
              padding: "6px 22px",
              fontSize: 13,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SyncResultModal;
