import React from "react";
import {
  summarisePayments,
  getOrderPayable,
  PAYMENT_STATES,
} from "../../constants/paymentMath";

/* Summary strip for the rows currently on screen.
 *
 * Sits at the top of the list card: these are the figures an admin wants
 * before reading the table, not after scrolling past it. The list pages
 * filter by user id, so with a customer searched this reads as "everything
 * this one customer owes" - the number that cannot be eyeballed off the
 * table once offline payments are in play. */

const STATE_TONES = {
  Paid: { fg: "#0f7b35", bg: "#e7f8ec" },
  "Partially Paid": { fg: "#c2410c", bg: "#fff1e6" },
  "Not Paid": { fg: "#b91c1c", bg: "#fdeaea" },
};

const money = (amount) => `৳${Math.round(amount).toLocaleString("en-US")}`;

/* Headline figure: accent stripe, small caps label, one large number. */
const Tile = ({ accent, label, value, hint }) => (
  <div
    style={{
      position: "relative",
      background: "#fff",
      border: "1px solid #e9eef5",
      borderRadius: 12,
      padding: "13px 16px 13px 18px",
      overflow: "hidden",
      minWidth: 0,
    }}
  >
    <span
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: accent,
      }}
    />
    <p
      style={{
        margin: 0,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "#94a3b8",
      }}
    >
      {label}
    </p>
    <p
      style={{
        margin: "3px 0 0",
        fontSize: 19,
        fontWeight: 800,
        color: "#0f172a",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      }}
    >
      {value}
    </p>
    {hint && (
      <p style={{ margin: "1px 0 0", fontSize: 11, color: "#94a3b8" }}>
        {hint}
      </p>
    )}
  </div>
);

/* Payment-state breakdown: count leads, amount supports it. */
const StatePill = ({ state, bucket }) => {
  const tone = STATE_TONES[state] || STATE_TONES["Not Paid"];
  const amount = state === "Paid" ? bucket.paid : bucket.due;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        background: tone.bg,
        borderRadius: 10,
        padding: "8px 12px",
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 16, fontWeight: 800, color: tone.fg }}>
        {bucket.count}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: tone.fg }}>
        {state}
      </span>
      <span
        style={{
          fontSize: 11,
          color: tone.fg,
          opacity: 0.8,
          marginLeft: "auto",
          whiteSpace: "nowrap",
        }}
      >
        {money(amount)} {state === "Paid" ? "paid" : "due"}
      </span>
    </div>
  );
};

/* extraTiles lets a page fold its own figures (weight, RMB, profit...) into
   this same grid instead of running a second summary row above it. */
const PaymentSummaryBar = ({
  orders,
  filtered,
  payableOf = getOrderPayable,
  countLabel = "Total Orders",
  extraTiles = [],
}) => {
  const summary = summarisePayments(orders, payableOf);
  const singleCustomer =
    summary.userIds.length === 1
      ? (orders || []).find((order) => order && (order.userId || order.uid))
      : null;

  return (
    <div style={{ padding: "0 24px 18px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 10,
          flexWrap: "wrap",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "#94a3b8",
          }}
        >
          Summary
          {filtered ? " · filtered rows only" : ""}
        </p>
        {singleCustomer ? (
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#fff",
              background: "rgb(0, 37, 76)",
              borderRadius: 999,
              padding: "3px 12px",
            }}
          >
            {/* displayName is already stored as "835 - Abhishek Roy", so
                printing the raw uid beside it just adds noise. */}
            {singleCustomer.displayName ||
              singleCustomer.userId ||
              singleCustomer.uid}
          </span>
        ) : summary.userIds.length > 1 ? (
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {summary.userIds.length} customers
          </span>
        ) : null}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(165px, 1fr))",
          gap: 12,
        }}
      >
        <Tile accent="#64748b" label={countLabel} value={summary.count} />
        <Tile accent="#7c3aed" label="Total Bill" value={money(summary.payable)} />
        <Tile accent="#16a34a" label="Total Paid" value={money(summary.paid)} />
        <Tile
          accent={summary.due > 0 ? "#FF6A00" : "#16a34a"}
          label="Total Due"
          value={money(summary.due)}
          hint={summary.due > 0 ? "outstanding" : "all settled"}
        />
        {extraTiles.map((tile) => (
          <Tile
            key={tile.label}
            accent={tile.accent}
            label={tile.label}
            value={tile.value}
            hint={tile.hint}
          />
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
          gap: 10,
          marginTop: 10,
        }}
      >
        {PAYMENT_STATES.map((state) => (
          <StatePill key={state} state={state} bucket={summary.byState[state]} />
        ))}
      </div>
    </div>
  );
};

export default PaymentSummaryBar;
