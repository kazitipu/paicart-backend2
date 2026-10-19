import React, { Component } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { Search, RotateCcw, AlertTriangle, Check } from "react-feather";
import {
  createDirectRefund,
  getSingleOrderApi,
  getSingleProductRequest,
  getSingleShipForMe,
  getSingleUser,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import {
  getOrderPayable,
  getShipmentPayable,
  getOrderPaid,
  getOrderDue,
} from "../../constants/paymentMath";
import { Badge, Button, StatRow, StatTile } from "../common/listUi.jsx";

/* The three refundable record types, in the order the search tries them.
   A shipment booking carries no orderTotal - its bill IS the shipping
   charge - so each type brings its own payable formula. */
const TYPES = {
  order: {
    label: "1688 Order",
    tone: "blue",
    expense: "1688 Orders",
    payable: getOrderPayable,
    lookup: getSingleOrderApi,
  },
  productRequest: {
    label: "Product Request",
    tone: "violet",
    expense: "Product Request",
    payable: getOrderPayable,
    lookup: getSingleProductRequest,
  },
  shipmentRequest: {
    label: "Ship For Me",
    tone: "teal",
    expense: "Ship For Me",
    payable: getShipmentPayable,
    lookup: getSingleShipForMe,
  },
};

const TYPE_ORDER = ["order", "productRequest", "shipmentRequest"];

const METHODS = [
  "Cash",
  "bKash",
  "Nagad",
  "Rocket",
  "Bank Transfer",
  "Balance Adjustment",
];

/* Delivered = score 7 or status Delivered, as in the customer apps */
const isDelivered = (record) =>
  (parseInt(record && record.shipmentStatusScore) || 1) >= 7 ||
  String((record && (record.orderStatus || record.status)) || "").toLowerCase() === "delivered";

/* Quick refunds are for parcels not yet delivered (the customer app then
   moves the order to Refunds and offers Buy / Book Again); after-sale
   refunds are for delivered ones (the order stays Delivered). Returns why
   this panel can't refund the record, or "". */
const wrongPanelReason = (record, quickRefund) => {
  if (!record) return "";
  if (quickRefund && isDelivered(record))
    return "This one is already delivered — give its refund from After sale service instead.";
  if (!quickRefund && !isDelivered(record))
    return "This one is not delivered yet — give its refund from Quick Refund Request instead.";
  return "";
};

const money = (value) =>
  `৳${Math.round(parseFloat(value) || 0).toLocaleString()}`;

const LABEL = {
  margin: "0 0 6px",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#94a3b8",
};

const INPUT = {
  width: "100%",
  border: "1px solid #e2e8f0",
  background: "#fff",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
};

/**
 * Refund an order that has no refund request behind it.
 *
 * Look the order up by its Order Id (1688 order) or Booking Id (product
 * request), read the preview, then release the money. Writing goes through
 * createDirectRefund, which files the approved refund row, stamps the order
 * and books the cash-out for the exact amount.
 */
export class DirectRefundPanel extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      query: "",
      searching: false,
      error: "",
      order: null,
      type: "",
      refundAmount: "",
      paymentMethod: "Cash",
      reason: "",
      confirming: false,
      saving: false,
    };
  }

  reset = () =>
    this.setState({
      query: "",
      searching: false,
      error: "",
      order: null,
      type: "",
      refundAmount: "",
      paymentMethod: "Cash",
      reason: "",
      confirming: false,
      saving: false,
    });

  handleChange = (event) => {
    const { name, value } = event.target;
    /* Any edit invalidates a pending confirmation - nobody should be able to
       raise the amount after the confirm step has appeared. */
    this.setState({ [name]: value, confirming: false });
  };

  handleSearch = async (event) => {
    if (event) event.preventDefault();
    const id = this.state.query.trim();
    if (!id) return;

    this.setState({
      searching: true,
      error: "",
      order: null,
      confirming: false,
    });

    /* Orders, then product requests, then shipments. The id spaces are
       separate collections, so whichever answers first is the record meant;
       the preview names the type it landed on. */
    let order = null;
    let type = "";
    for (const candidate of TYPE_ORDER) {
      order = await TYPES[candidate].lookup(id);
      if (order) {
        type = candidate;
        break;
      }
    }

    if (!order) {
      this.setState({
        searching: false,
        error: `Nothing found for "${id}". Check the Order Id or Booking Id and try again.`,
      });
      return;
    }

    this.setState({
      searching: false,
      order,
      type,
      refundAmount: "",
      reason: "",
    });
  };

  handleSubmit = async () => {
    const { order, type, refundAmount, paymentMethod, reason } = this.state;
    const amount = parseFloat(refundAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      this.setState({ error: "Enter a refund amount above zero." });
      return;
    }
    const wrongPanel = wrongPanelReason(order, this.props.quickRefund);
    if (wrongPanel) {
      this.setState({ error: wrongPanel, confirming: false });
      return;
    }

    if (!this.state.confirming) {
      this.setState({ confirming: true, error: "" });
      return;
    }

    this.setState({ saving: true, error: "" });
    const refund = await createDirectRefund({
      order,
      type,
      quickRefund: Boolean(this.props.quickRefund),
      refundAmount: amount,
      paymentMethod,
      reason,
      admin: this.props.currentAdmin || null,
    });
    this.setState({ saving: false, confirming: false });

    if (!refund) {
      this.setState({ error: "The refund could not be saved. Nothing was written." });
      return;
    }

    toast.success(
      `Refund ${money(amount)} released - cash-out entry created.`
    );
    this.notifyCustomer(order, type, amount);
    this.reset();
    if (this.props.onRefunded) this.props.onRefunded();
  };

  /* Same push notification an approved refund request sends */
  notifyCustomer = async (order, type, amount) => {
    try {
      const user = order.userId ? await getSingleUser(order.userId) : null;
      if (!user || !user.deviceToken || !user.deviceToken.length) return;
      const id = type === "order" ? order.orderId : order.bookingId;
      const message = {
        title: "Refund given",
        body: `A refund of ${money(amount)} for ${
          type === "order" ? "order" : "booking"
        } #${id} has been given.`,
      };
      user.deviceToken.forEach((token) => sendNotifications(token, message));
    } catch (err) {
      console.error(err);
    }
  };

  renderPreview() {
    const { order, type } = this.state;
    const meta = TYPES[type] || TYPES.order;
    const id = type === "order" ? order.orderId : order.bookingId;
    const payable = meta.payable(order);
    const paid = getOrderPaid(order);
    const due = getOrderDue(order, meta.payable);
    const alreadyRefunded = parseFloat(order.refund) || 0;
    const amount = parseFloat(this.state.refundAmount) || 0;
    const overPaid = amount > paid && paid > 0;

    return (
      <div
        style={{
          border: "1px solid #e9eef5",
          borderRadius: 12,
          background: "#fbfdff",
          padding: "16px 18px",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
            #{id}
          </span>
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {order.refundStatus === "given" && (
            <Badge tone="red">Already refunded</Badge>
          )}
          {(order.orderStatus || order.status) && (
            <Badge tone="gray">{order.orderStatus || order.status}</Badge>
          )}
        </div>

        <StatRow>
          <StatTile tone="gray" label="Payable" value={money(payable)} />
          <StatTile tone="green" label="Paid" value={money(paid)} />
          <StatTile
            tone={due > 0 ? "orange" : "gray"}
            label="Due"
            value={money(due)}
          />
          <StatTile
            tone={alreadyRefunded > 0 ? "red" : "gray"}
            label="Already refunded"
            value={money(alreadyRefunded)}
            hint={order.refundNote || undefined}
          />
        </StatRow>

        <div
          style={{
            display: "flex",
            gap: 24,
            flexWrap: "wrap",
            fontSize: 12.5,
            color: "#64748b",
          }}
        >
          <span>
            Customer:{" "}
            <b style={{ color: "#0f172a" }}>
              {order.displayName || order.userId || "—"}
            </b>
          </span>
          {order.date && <span>Ordered: {order.date}</span>}
          {order.store && <span>Store: {order.store}</span>}
        </div>

        {overPaid && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "12px 0 0",
              fontSize: 12.5,
              color: "#b45309",
            }}
          >
            <AlertTriangle size={14} />
            {money(amount)} is more than this order has been paid (
            {money(paid)}).
          </p>
        )}
        {alreadyRefunded > 0 && (
          <p
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "8px 0 0",
              fontSize: 12.5,
              color: "#b91c1c",
            }}
          >
            <AlertTriangle size={14} />
            A refund of {money(alreadyRefunded)} is already recorded on this
            order. This one is added to it
            {amount > 0 ? ` (total refunded ${money(alreadyRefunded + amount)})` : ""}
            , and books a second cash-out.
          </p>
        )}
        {wrongPanelReason(order, this.props.quickRefund) ? (
          <p style={{ display: "flex", alignItems: "center", gap: 6, margin: "8px 0 0", fontSize: 12.5, color: "#b91c1c", fontWeight: 600 }}>
            <AlertTriangle size={14} />
            {wrongPanelReason(order, this.props.quickRefund)}
          </p>
        ) : (
          <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "#475569" }}>
            {this.props.quickRefund
              ? "After this refund the customer sees the order under Refunds, and Pay Now is replaced by Buy Again / Book Again."
              : "The order stays Delivered; the customer sees \"Refunded\" with the amount, and Pay Now is replaced by Buy Again / Book Again."}
          </p>
        )}
      </div>
    );
  }

  renderForm() {
    const { refundAmount, paymentMethod, reason, confirming, saving } =
      this.state;
    const amount = parseFloat(refundAmount) || 0;

    return (
      <div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
            gap: 14,
            marginBottom: 14,
          }}
        >
          <div>
            <p style={LABEL}>Refund amount (৳)</p>
            <input
              name="refundAmount"
              type="number"
              min="0"
              value={refundAmount}
              onChange={this.handleChange}
              placeholder="0"
              style={INPUT}
            />
          </div>
          <div>
            <p style={LABEL}>Paid out by</p>
            <select
              name="paymentMethod"
              value={paymentMethod}
              onChange={this.handleChange}
              style={INPUT}
            >
              {METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
          <div style={{ gridColumn: "span 2", minWidth: 220 }}>
            <p style={LABEL}>Reason</p>
            <input
              name="reason"
              value={reason}
              onChange={this.handleChange}
              placeholder="Why is this being refunded?"
              style={INPUT}
            />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant={confirming ? "danger" : "primary"}
            onClick={this.handleSubmit}
            disabled={saving || amount <= 0}
            style={saving || amount <= 0 ? { opacity: 0.55 } : undefined}
          >
            {saving ? (
              "Releasing…"
            ) : confirming ? (
              <>
                <Check size={14} style={{ marginRight: 6 }} />
                Confirm refund of {money(amount)}
              </>
            ) : (
              `Give refund${amount > 0 ? ` of ${money(amount)}` : ""}`
            )}
          </Button>
          <Button variant="ghost" onClick={this.reset} disabled={saving}>
            Clear
          </Button>
          <span style={{ fontSize: 12.5, color: "#94a3b8" }}>
            {confirming
              ? "Press again to release the money."
              : `Books a REFUND cash-out of the same amount under ${
                  (TYPES[this.state.type] || TYPES.order).expense
                }.`}
          </span>
        </div>
      </div>
    );
  }

  render() {
    const { open, query, searching, error, order } = this.state;

    return (
      <div
        className="card"
        style={{
          border: "1px solid #e9eef5",
          borderRadius: 14,
          boxShadow: "0 1px 2px rgba(15,23,42,.04)",
          overflow: "hidden",
          marginBottom: 22,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
            padding: open ? "18px 24px 4px" : "18px 24px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#fff1e6",
                color: "#c2410c",
              }}
            >
              <RotateCcw size={18} />
            </span>
            <div>
              <h6
                style={{
                  margin: 0,
                  fontWeight: 700,
                  fontSize: 15,
                  color: "#0f172a",
                }}
              >
                Direct refund
              </h6>
              <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>
                Refund an order, product request or shipment with no refund
                request behind it.
              </p>
            </div>
          </div>
          <Button
            variant={open ? "ghost" : "subtle"}
            onClick={() =>
              this.setState({ open: !open }, () => {
                if (!this.state.open) this.reset();
              })
            }
          >
            {open ? "Close" : "Give a refund (no request needed)"}
          </Button>
        </div>

        {open && (
          <div style={{ padding: "12px 24px 22px" }}>
            <form
              onSubmit={this.handleSearch}
              style={{
                display: "flex",
                gap: 10,
                flexWrap: "wrap",
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flex: "1 1 300px",
                  maxWidth: 440,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  padding: "0 12px",
                }}
              >
                <Search size={16} color="#94a3b8" />
                <input
                  name="query"
                  value={query}
                  onChange={this.handleChange}
                  type="search"
                  placeholder="Order Id or Booking Id"
                  style={{
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    padding: "10px 0",
                    fontSize: 13,
                    width: "100%",
                    color: "#0f172a",
                  }}
                />
              </div>
              <Button
                variant="dark"
                type="submit"
                disabled={searching || !query.trim()}
                style={
                  searching || !query.trim() ? { opacity: 0.55 } : undefined
                }
              >
                {searching ? "Searching…" : "Find order"}
              </Button>
            </form>

            {error && (
              <p
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  margin: "0 0 14px",
                  fontSize: 13,
                  color: "#b91c1c",
                }}
              >
                <AlertTriangle size={14} />
                {error}
              </p>
            )}

            {order && (
              <>
                {this.renderPreview()}
                {this.renderForm()}
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  currentAdmin: state.admins.currentAdmin,
});

export default connect(mapStateToProps, null)(DirectRefundPanel);
