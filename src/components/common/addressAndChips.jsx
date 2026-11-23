import React, { useState } from "react";
import { User, Phone, MapPin } from "react-feather";

/* Small shared display pieces for admin pages.
 *
 *  <AddressCard address={...} />  a delivery address laid out like one:
 *     name and phone, then the street and thana · district · division.
 *     Full card for dialogs/panels; `compact` for table cells.
 *  <ChipList items={[...]} />     a list as chips — the first few shown,
 *     the rest behind "+N more", so a long list never floods a card. */

const C = { ink: "#0f172a", text: "#334155", muted: "#64748b", line: "#e9eef5" };
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

/* every element sets its own margin / padding / font: the admin theme adds
   spacing and a serif font to bare divs and paragraphs */
const reset = { margin: 0, padding: 0, fontFamily: SANS, lineHeight: 1.4 };

export const AddressCard = ({ address, compact, empty = "No address on record" }) => {
  if (!address || ![address.name, address.mobileNo, address.address, address.thana, address.district].some(Boolean)) {
    return <span style={{ ...reset, fontSize: compact ? 12 : 13, color: "#94a3b8" }}>{empty}</span>;
  }
  /* area (Pathao), zone/thana, city/district, division — each once */
  const area = [address.area, address.thana, address.district, address.division]
    .filter(Boolean)
    .filter((v, i, arr) => arr.indexOf(v) === i);
  const phone = address.mobileNo && (
    <a
      href={`tel:${address.mobileNo}`}
      onClick={(e) => e.stopPropagation()}
      style={{ ...reset, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700, color: "#1d4ed8", fontSize: compact ? 11.5 : 12.5, whiteSpace: "nowrap", textDecoration: "none" }}
    >
      <Phone size={compact ? 11 : 12} /> {address.mobileNo}
    </a>
  );

  /* table cells: four tight lines */
  if (compact) {
    return (
      <div className="pd-addr" style={{ ...reset, minWidth: 0, display: "grid", gap: 2 }}>
        {address.name && (
          <span style={{ ...reset, display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 800, color: C.ink, fontSize: 12.5 }}>
            <User size={12} color="#FF6A00" /> {address.name}
          </span>
        )}
        {phone}
        {(address.address || area.length > 0) && (
          <span style={{ ...reset, display: "flex", gap: 5, alignItems: "flex-start", fontSize: 12, color: C.text }}>
            <MapPin size={12} color={C.muted} style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ ...reset }}>
              {address.address}
              {area.length > 0 && (
                <span style={{ ...reset, display: "block", fontSize: 11.5, fontWeight: 600, color: C.muted }}>{area.join(" · ")}</span>
              )}
            </span>
          </span>
        )}
      </div>
    );
  }

  /* dialogs and panels: a small address card */
  return (
    <div className="pd-addr" style={{ ...reset, minWidth: 0, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ ...reset, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", padding: "10px 12px" }}>
        <span style={{ ...reset, display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <span style={{ ...reset, width: 30, height: 30, borderRadius: 10, background: "#fff7ed", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <User size={15} color="#FF6A00" />
          </span>
          <span style={{ ...reset, fontWeight: 800, color: C.ink, fontSize: 14, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {address.name || "—"}
          </span>
        </span>
        {phone && (
          <span style={{ ...reset, background: "#eff6ff", border: "1px solid #dbeafe", borderRadius: 999, padding: "3px 10px" }}>{phone}</span>
        )}
      </div>
      {(address.address || area.length > 0) && (
        <div style={{ ...reset, borderTop: `1px dashed ${C.line}`, padding: "10px 12px", display: "flex", gap: 10, alignItems: "flex-start", background: "#fafbfc" }}>
          <MapPin size={15} color={C.muted} style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ ...reset, minWidth: 0, display: "grid", gap: 6 }}>
            <span style={{ ...reset, fontSize: 10.5, fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: C.muted }}>Address</span>
            {address.address && <span style={{ ...reset, color: C.ink, fontSize: 13.5, fontWeight: 600 }}>{address.address}</span>}
            {area.length > 0 && (
              <span style={{ ...reset, display: "flex", flexWrap: "wrap", gap: 5 }}>
                {area.map((part, i) => (
                  <span
                    key={`${part}-${i}`}
                    style={{ ...reset, fontSize: 11.5, fontWeight: 700, color: C.text, background: "#fff", border: `1px solid ${C.line}`, borderRadius: 999, padding: "2px 9px" }}
                  >
                    {part}
                  </span>
                ))}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export const ChipList = ({ items, max = 6, tone = "gray" }) => {
  const [all, setAll] = useState(false);
  const list = Array.from(new Set((items || []).map((v) => String(v == null ? "" : v).trim()).filter(Boolean)));
  if (!list.length) return <span style={{ color: "#94a3b8" }}>—</span>;
  const shown = all ? list : list.slice(0, max);
  const colors =
    tone === "orange" ? { bg: "#fff7ed", fg: "#9a3412", line: "#fed7aa" } : { bg: "#f1f5f9", fg: "#334155", line: "#e2e8f0" };
  const chip = {
    display: "inline-flex",
    alignItems: "center",
    maxWidth: "100%",
    padding: "2px 9px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    lineHeight: 1.6,
    color: colors.fg,
    background: colors.bg,
    border: `1px solid ${colors.line}`,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: 5, verticalAlign: "middle" }}>
      {shown.map((v, i) => (
        <span key={`${v}-${i}`} style={chip} title={v}>
          {v}
        </span>
      ))}
      {list.length > max && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setAll(!all);
          }}
          style={{ ...chip, cursor: "pointer", color: "#c2410c", background: "#fff7ed", borderColor: "#fed7aa", fontWeight: 700 }}
        >
          {all ? "Show less" : `+${list.length - max} more`}
        </button>
      )}
    </span>
  );
};
