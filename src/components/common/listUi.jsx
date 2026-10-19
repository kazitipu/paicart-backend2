import React from "react";

/* Shared presentation pieces for the Shipment Request screens.
 *
 * The list and its modals were a mix of raw bootstrap buttons, coloured
 * <div>s and bare font-awesome glyphs. Routing them all through these keeps
 * one visual language across the table rows and every dialog. */

export const TONES = {
  gray: { bg: "#f1f5f9", fg: "#475569", solid: "#64748b" },
  green: { bg: "#e7f8ec", fg: "#0f7b35", solid: "#16a34a" },
  orange: { bg: "#fff1e6", fg: "#c2410c", solid: "#FF6A00" },
  red: { bg: "#fdeaea", fg: "#b91c1c", solid: "#dc2626" },
  blue: { bg: "#e8f1fe", fg: "#1d4ed8", solid: "#2563eb" },
  teal: { bg: "#e6f6f4", fg: "#0f766e", solid: "#0d9488" },
  violet: { bg: "#f1ecfe", fg: "#6d28d9", solid: "#7c3aed" },
};

/* Soft-filled pill. Reads clearly at table density without shouting like the
   old saturated blocks did. */
export const Badge = ({ tone = "gray", children, style }) => {
  const c = TONES[tone] || TONES.gray;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: c.bg,
        color: c.fg,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1.6,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/* Purpose-drawn freight marks rather than system emoji, which render as a
   different picture on every OS and sit on their own colour. These inherit
   the badge's colour and optical weight. */
export const PlaneIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    style={{ flexShrink: 0 }}
  >
    <path d="M22 15.5v-1.86a1 1 0 0 0-.5-.87L14.5 8.7V3.6a1.85 1.85 0 0 0-1.75-1.85A1.8 1.8 0 0 0 11 3.55V8.7L4 12.77a1 1 0 0 0-.5.87v1.86a.5.5 0 0 0 .66.47L11 13.9v3.9l-2.2 1.6a.6.6 0 0 0-.25.49v1.32a.4.4 0 0 0 .5.39l3.7-.95 3.7.95a.4.4 0 0 0 .5-.39V19.9a.6.6 0 0 0-.25-.49L14.5 17.8v-3.9l6.84 2.07a.5.5 0 0 0 .66-.47Z" />
  </svg>
);

export const ShipIcon = ({ size = 13 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    focusable="false"
    style={{ flexShrink: 0 }}
  >
    {/* Kept to three solid masses - hull, deck house, funnel. Finer detail
        (containers, mast) turned to mud at badge size. */}
    <path d="M2.4 13.9h19.2a.75.75 0 0 1 .7 1.02l-1.45 3.62A3.5 3.5 0 0 1 17.6 20.8H6.4a3.5 3.5 0 0 1-3.25-2.26L1.7 14.92a.75.75 0 0 1 .7-1.02Z" />
    <path d="M6.2 7.6a1 1 0 0 1 1-1h9.6a1 1 0 0 1 1 1v4.9H6.2V7.6Z" />
    <path d="M13.1 3.2h2.5a.8.8 0 0 1 .8.8v2.6h-4.1V4a.8.8 0 0 1 .8-.8Z" />
  </svg>
);

/* Air / Sea, with a glyph so the mode is scannable down a column. */
export const ModeBadge = ({ mode }) => (
  <Badge tone={mode === "Sea" ? "teal" : "blue"}>
    {mode === "Sea" ? <ShipIcon /> : <PlaneIcon />}
    {mode}
  </Badge>
);

const BUTTON_BASE = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  border: "1px solid transparent",
  borderRadius: 9,
  fontSize: 12,
  fontWeight: 700,
  padding: "7px 14px",
  cursor: "pointer",
  lineHeight: 1.2,
  textDecoration: "none",
};

export const Button = ({ variant = "primary", style, children, ...rest }) => {
  const variants = {
    primary: { background: "#FF6A00", color: "#fff" },
    dark: { background: "rgb(0, 37, 76)", color: "#fff" },
    subtle: {
      background: "#f1f5f9",
      color: "#0f172a",
      borderColor: "#e2e8f0",
    },
    danger: { background: "#fdeaea", color: "#b91c1c", borderColor: "#f8d4d4" },
    ghost: {
      background: "#fff",
      color: "#334155",
      borderColor: "#e2e8f0",
    },
  };
  return (
    <button
      {...rest}
      style={{ ...BUTTON_BASE, ...(variants[variant] || variants.primary), ...style }}
    >
      {children}
    </button>
  );
};

/* Square icon button - replaces the bare 20px font-awesome glyphs, which had
   no hit area and no affordance that they were clickable. */
export const IconButton = ({ tone = "gray", title, children, ...rest }) => {
  const c = TONES[tone] || TONES.gray;
  return (
    <span
      {...rest}
      title={title}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 32,
        height: 32,
        borderRadius: 9,
        background: c.bg,
        color: c.fg,
        cursor: "pointer",
        marginRight: 6,
      }}
    >
      {children}
    </span>
  );
};

/* Compact figure tile for the modal summary strips. */
export const StatTile = ({ label, value, tone = "gray", hint }) => {
  const c = TONES[tone] || TONES.gray;
  return (
    <div
      style={{
        flex: "1 1 130px",
        background: c.bg,
        borderRadius: 10,
        padding: "10px 12px",
        minWidth: 120,
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color: c.fg,
          opacity: 0.75,
        }}
      >
        {label}
      </p>
      <p
        style={{
          margin: "2px 0 0",
          fontSize: 16,
          fontWeight: 800,
          color: c.fg,
        }}
      >
        {value}
      </p>
      {hint && (
        <p style={{ margin: 0, fontSize: 10, color: c.fg, opacity: 0.7 }}>
          {hint}
        </p>
      )}
    </div>
  );
};

export const StatRow = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
    {children}
  </div>
);

/* Modal chrome ---------------------------------------------------------- */

export const ModalHeader = ({ title, subtitle, badges, closeId }) => (
  <div
    className="modal-header"
    style={{
      background: "rgb(0, 37, 76)",
      color: "#fff",
      alignItems: "flex-start",
      padding: "16px 20px",
      border: "none",
    }}
  >
    <div>
      <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
        {title}
      </h5>
      {subtitle && (
        <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.7 }}>
          {subtitle}
        </p>
      )}
      {badges && (
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>{badges}</div>
      )}
    </div>
    <button
      type="button"
      className="close"
      data-dismiss="modal"
      aria-label="Close"
      id={closeId}
      style={{ color: "#fff", opacity: 0.8, textShadow: "none" }}
    >
      <span aria-hidden="true">&times;</span>
    </button>
  </div>
);

/* Titled block inside a modal body. */
export const ModalSection = ({ title, children, style }) => (
  <div style={{ marginBottom: 18, ...style }}>
    {title && (
      <p
        style={{
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#94a3b8",
          marginBottom: 8,
        }}
      >
        {title}
      </p>
    )}
    {children}
  </div>
);

export const FieldGrid = ({ children, columns = 2 }) => (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      gap: 12,
    }}
  >
    {children}
  </div>
);

export const Field = ({ label, value, capitalize }) => (
  <div style={{ minWidth: 0 }}>
    <p style={{ fontSize: 10, color: "#94a3b8", margin: 0 }}>{label}</p>
    <p
      style={{
        fontSize: 13,
        fontWeight: 700,
        color: "#1f2937",
        margin: "1px 0 0",
        textTransform: capitalize ? "capitalize" : "none",
        wordBreak: "break-word",
      }}
    >
      {value === 0 || value ? value : "—"}
    </p>
  </div>
);

/* Air / Sea / All segmented control. Shared by every list page so the
   freight split looks and behaves identically across them. */
export const SHIPMENT_TABS = ["All", "Air", "Sea"];

export const ModeTabs = ({ value, counts = {}, onChange }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      marginTop: 18,
      background: "#f1f5f9",
      borderRadius: 10,
      padding: 4,
      width: "fit-content",
    }}
  >
    {SHIPMENT_TABS.map((tab) => {
      const active = value === tab;
      return (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: 8,
            padding: "7px 16px",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: active ? "white" : "transparent",
            color: active ? "#0f172a" : "#64748b",
            boxShadow: active ? "0 1px 3px rgba(15,23,42,.12)" : "none",
          }}
        >
          {tab === "Air" && <PlaneIcon size={14} />}
          {tab === "Sea" && <ShipIcon size={14} />}
          {tab}
          <span
            style={{
              marginLeft: 1,
              fontSize: 11,
              fontWeight: 700,
              color: active ? "#FF6A00" : "#94a3b8",
            }}
          >
            {counts[tab]}
          </span>
        </button>
      );
    })}
  </div>
);

/* Generic segmented tabs. Same shell as ModeTabs but takes arbitrary items,
   for pages whose tabs are not a freight split. Replaces the default
   react-tabs strip, which rendered as plain underlined text. */
export const SegmentTabs = ({ items, value, onChange }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      background: "#f1f5f9",
      borderRadius: 10,
      padding: 4,
      width: "fit-content",
    }}
  >
    {items.map((item) => {
      const active = value === item.key;
      return (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          style={{
            border: "none",
            cursor: "pointer",
            borderRadius: 8,
            padding: "7px 18px",
            fontSize: 13,
            fontWeight: 700,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            background: active ? "white" : "transparent",
            color: active ? "#0f172a" : "#64748b",
            boxShadow: active ? "0 1px 3px rgba(15,23,42,.12)" : "none",
          }}
        >
          {item.label}
          {item.count !== undefined && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: active ? "#FF6A00" : "#94a3b8",
              }}
            >
              {item.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);
