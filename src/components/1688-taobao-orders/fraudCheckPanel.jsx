import React, { Component } from "react";
import { ClipLoader } from "react-spinners";
import { TONES } from "../common/listUi.jsx";
import {
  checkCustomerFraud,
  formatPathaoRating,
  RISK_LEVELS,
} from "../../constants/pathao";

/* Customer delivery history from Pathao, shown inside the Pick modal so the
 * agent sees a risky customer before money is spent on the 1688 order.
 * Re-runs whenever the phone changes, i.e. whenever Pick opens for another
 * order. */
export default class FraudCheckPanel extends Component {
  state = { loading: false, result: null, error: null };

  componentDidMount() {
    this.run();
  }

  componentDidUpdate(prevProps) {
    if (prevProps.phone !== this.props.phone) this.run();
  }

  componentWillUnmount() {
    this.unmounted = true;
  }

  run = async (force) => {
    const { phone } = this.props;
    this.requestedFor = phone;
    if (!phone) {
      this.setState({
        loading: false,
        result: null,
        error: "This order has no customer mobile number.",
      });
      return;
    }
    this.setState({ loading: true, error: null, result: null });
    try {
      const result = await checkCustomerFraud(phone, { force });
      if (this.unmounted || this.requestedFor !== phone) return;
      this.setState({ loading: false, result });
    } catch (err) {
      if (this.unmounted || this.requestedFor !== phone) return;
      this.setState({ loading: false, error: err.message });
    }
  };

  render() {
    const { loading, result, error } = this.state;
    const { phone, name } = this.props;
    const level = result ? RISK_LEVELS[result.risk] : null;
    const c = level ? TONES[level.tone] : TONES.gray;

    return (
      <div
        style={{
          border: `1px solid ${level ? c.solid : "#e2e8f0"}`,
          borderLeftWidth: 5,
          borderRadius: 10,
          background: level ? c.bg : "#f8fafc",
          padding: "12px 16px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#64748b",
              }}
            >
              Pathao fraud check
            </div>
            <div style={{ fontSize: 13, color: "#334155", marginTop: 2 }}>
              {name ? `${name} · ` : ""}
              {phone || "No phone"}
            </div>
          </div>
          {level && (
            <span
              style={{
                background: c.solid,
                color: "#fff",
                borderRadius: 999,
                padding: "4px 12px",
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              {level.label}
            </span>
          )}
        </div>

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 10,
              fontSize: 13,
              color: "#475569",
            }}
          >
            <ClipLoader size={16} color="#64748b" /> Checking delivery history…
          </div>
        )}

        {error && !loading && (
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: TONES.red.fg,
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            <span>⚠ {error}</span>
            {phone && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={() => this.run(true)}
              >
                Retry
              </button>
            )}
          </div>
        )}

        {result && !loading && (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: 8,
                marginTop: 12,
              }}
            >
              <Stat label="Total parcels" value={result.total} />
              <Stat
                label="Delivered"
                value={result.success}
                color={TONES.green.fg}
              />
              <Stat
                label="Returned"
                value={result.cancel}
                color={TONES.red.fg}
              />
              <Stat
                label="Success rate"
                value={result.total ? `${result.successRate}%` : "—"}
                color={c.fg}
              />
            </div>
            {result.total > 0 && (
              <div
                style={{
                  height: 8,
                  borderRadius: 999,
                  background: TONES.red.bg,
                  overflow: "hidden",
                  marginTop: 10,
                }}
              >
                <div
                  style={{
                    width: `${result.successRate}%`,
                    height: "100%",
                    background: TONES.green.solid,
                  }}
                />
              </div>
            )}
            <div style={{ fontSize: 12, color: c.fg, marginTop: 8 }}>
              {level.advice}
              {result.rating
                ? ` Pathao rating: ${formatPathaoRating(result.rating)}.`
                : ""}
              {result.fraudReason ? ` Pathao note: ${result.fraudReason}` : ""}
            </div>
          </>
        )}
      </div>
    );
  }
}

const Stat = ({ label, value, color }) => (
  <div
    style={{
      background: "#fff",
      borderRadius: 8,
      padding: "8px 10px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 18, fontWeight: 800, color: color || "#0f172a" }}>
      {value}
    </div>
    <div style={{ fontSize: 10, color: "#94a3b8" }}>{label}</div>
  </div>
);
