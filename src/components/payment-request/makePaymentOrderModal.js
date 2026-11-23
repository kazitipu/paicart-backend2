import { getOfferDiscount } from "../../constants/offerMath";
import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  makePaymentRedux,
  updatePaymentRequestOrderStatusRedux,
} from "../../actions/index";
import "./makePaymentModal.css";
import { Link } from "react-router-dom";
import {
  getSingleUser,
  getSinglePaymentRequestOrder,
} from "../../firebase/firebase.utils";
import { CircleLoader } from "react-spinners";
import Currency from "../localization/currency";
import { sendNotifications } from "../../firebase/fcmRestApi";
import "./payment-modal.css";
import "./approvePaymentModal.css";
import { statusDisplay } from "../../constants/statusDisplay";
import { MethodLogo } from "../common/paymentModal.jsx";

const STEPS = [
  "Pending",
  "Approved",
  "Abroad warehouse",
  "Ready to fly",
  "BD customs",
  "Paicart warehouse",
  "Delivered",
];
class MakePaymentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      termsAndCondition: false,
      loader: false,
    };
  }

  handleSubmit = async () => {
    const { userObj, admin, paymentRequestObj, rechargeUser, payableOrders } =
      this.props;

    // admin payment korle admin jabe, user payment korle user jabe
    this.setState({
      loader: true,
    });

    await this.props.updatePaymentRequestOrderStatusRedux({
      ...paymentRequestObj,
      status: "approved",
      admin: admin,
    });
    this.setState({
      loader: false,
    });
    toast.success("Payment is successful");

    const newRequest = await getSinglePaymentRequestOrder(
      paymentRequestObj.paymentId
    );

    const msg = this.createNotification(newRequest);
    console.log(msg);
    const user = await getSingleUser(paymentRequestObj.userId);
    console.log(user);
    const message = {
      title: msg.title,
      body: msg.body,
    };
    if (user.deviceToken && user.deviceToken.length > 0) {
      user.deviceToken.map((token) => {
        console.log(token);
        sendNotifications(token, message);
      });
    }
    this.props.startToggleModal(null, []);
  };

  createNotification = (paymentRequestObj) => {
    let msg;
    if (paymentRequestObj.status === "approved") {
      msg = {
        title: `Payment ${paymentRequestObj.status}`,
        body: `Your payment for Payment Id:-${paymentRequestObj.paymentId} is ${paymentRequestObj.status}.`,
      };
      return msg;
    } else {
      msg = {
        title: `Payment ${paymentRequestObj.status}`,
        body: `Your payment for Payment Id:-${paymentRequestObj.paymentId} is ${paymentRequestObj.status}. Please Pay again or contact us for details.`,
      };
      return msg;
    }
  };
  handleChange = (event) => {
    const { value, name } = event.target;
    this.setState({ [name]: value });
  };

  getTotalPaid2 = (booking) => {
    let totalPaid = 0;
    if (booking.payments && booking.payments.length > 0) {
      booking.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    return totalPaid;
  };

  getTotalDue2 = (booking) => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalBill = 0;
    if (booking.payments && booking.payments.length > 0) {
      booking.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    if (booking.shippingChargeCustomer && booking.shippingChargeCustomer != 0) {
      totalBill = booking.orderTotal
        ? parseInt(booking.orderTotal) +
          parseInt(booking.shippingChargeCustomer) +
          (booking.localShipping ? parseInt(booking.localShipping) : 0) +
          parseInt(booking.otherCost ? booking.otherCost : 0) -
          parseInt(booking.discount ? booking.discount : 0)
        : this.getSingleShopTotal(booking) +
          parseInt(booking.shippingChargeCustomer) +
          (booking.localShipping ? parseInt(booking.localShipping) : 0) +
          parseInt(booking.otherCost ? booking.otherCost : 0) -
          parseInt(booking.discount ? booking.discount : 0);
    } else {
      totalBill = booking.orderTotal
        ? parseInt(booking.orderTotal) +
          (booking.localShipping ? parseInt(booking.localShipping) : 0) +
          (booking.otherCost ? parseInt(booking.otherCost) : 0) -
          (booking.discount ? parseInt(booking.discount) : 0)
        : this.getSingleShopTotal(booking) +
          (booking.localShipping ? parseInt(booking.localShipping) : 0) +
          (booking.otherCost ? parseInt(booking.otherCost) : 0) -
          (booking.discount ? parseInt(booking.discount) : 0);
    }
    totalDue = parseInt(totalBill) - parseInt(totalPaid);
    return totalDue;
  };

  getTotalPaid = (order) => {
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    return totalPaid;
  };

  getSingleShopTotal = (shop) => {
    const { currency } = this.props;
    let total = 0;
    shop.items.map((item) => {
      item.skus.map((sku) => {
        total += parseInt(parseFloat(sku.price) * parseInt(sku.totalQuantity));
      });
    });
    return total;
  };

  getTotalDue = (order) => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalBill = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    if (order.shippingChargeCustomer && order.shippingChargeCustomer != 0) {
      totalBill = order.orderTotal
        ? parseInt(order.orderTotal) +
          parseInt(order.shippingChargeCustomer) +
          (order.localShipping ? parseInt(order.localShipping) : 0) +
          (order.otherCost ? parseInt(order.otherCost) : 0) -
          (order.discount ? parseInt(order.discount) : 0)
        : this.getSingleShopTotal(order) +
          parseInt(order.shippingChargeCustomer) +
          (order.localShipping ? parseInt(order.localShipping) : 0) +
          (order.otherCost ? parseInt(order.otherCost) : 0) -
          (order.discount ? parseInt(order.discount) : 0);
    } else {
      totalBill = order.orderTotal
        ? parseInt(order.orderTotal) +
          (order.localShipping ? parseInt(order.localShipping) : 0) +
          (order.otherCost ? parseInt(order.otherCost) : 0) -
          (order.discount ? parseInt(order.discount) : 0)
        : this.getSingleShopTotal(order) +
          (order.localShipping ? parseInt(order.localShipping) : 0) +
          (order.otherCost ? parseInt(order.otherCost) : 0) -
          (order.discount ? parseInt(order.discount) : 0);
    }
    totalDue = parseInt(totalBill) - parseInt(totalPaid);
    return totalDue;
  };

  componentDidUpdate(prevProps) {
    /* A fresh request must be confirmed again — the tick used to carry over
       from the previous payment that was opened. */
    if (prevProps.paymentRequestObj !== this.props.paymentRequestObj) {
      if (this.state.termsAndCondition) this.setState({ termsAndCondition: false });
    }
  }

  /* Play the closing animation, then close for real. */
  close = () => {
    if (this.state.loader || this.state.closing) return;
    this.setState({ closing: true });
    setTimeout(() => {
      this.setState({ termsAndCondition: false, closing: false });
      this.props.startToggleModal(null, []);
    }, 200);
  };

  /* Everything the item card needs, for a product-request booking or a 1688
     order, in one shape. Totals come from the same getTotalDue helpers the
     old layout used. */
  describeItem = (item, isProductRequest) => {
    const num = (v) => parseInt(v) || 0;
    const productPrice = item.actualTotal
      ? num(item.actualTotal)
      : item.items
        ? this.getSingleShopTotal(item)
        : 0;
    const hasShipping =
      !!item.shippingChargeCustomer && item.shippingChargeCustomer != 0;
    const paid = isProductRequest
      ? this.getTotalPaid2(item)
      : this.getTotalPaid(item);
    const due = isProductRequest
      ? this.getTotalDue2(item)
      : this.getTotalDue(item);

    const lines = [
      { label: "Product price", value: productPrice },
      { label: "Coupon", value: num(item.couponAmount), sign: "-" },
      {
        label: "Discount (pay now %)",
        value: item.offer && item.offer != 0 ? num(getOfferDiscount(item)) : 0,
        sign: "-",
      },
      { label: "China local courier", value: num(item.localShipping), sign: "+" },
      { label: "Packaging & other cost", value: num(item.otherCost), sign: "+" },
      {
        label: "Shipping charge (CN → BD)",
        value: num(item.shippingChargeCustomer),
        sign: "+",
      },
      { label: "Discount (on shipping)", value: num(item.discount), sign: "-" },
    ].filter((l, i) => i === 0 || l.value);

    const rate = item.customerRate
      ? `${item.customerRate} ৳/kg`
      : item.shippingRate
        ? `${item.shippingRate} ৳/kg`
        : null;

    return {
      id: isProductRequest ? item.bookingId : item.orderId || item.bookingId,
      idLabel: isProductRequest ? "Booking" : "Order",
      date: isProductRequest ? item.date : item.orderedDate || item.date,
      status: isProductRequest ? item.orderStatus : item.orderStatus || item.status,
      rejected: isProductRequest
        ? item.orderStatus === "Reject"
        : item.status === "Reject",
      paymentStatus: item.paymentStatus,
      trackingNo: item.trackingNo,
      hasShipping,
      lines,
      paid,
      due,
      bill: due + paid,
      facts: [
        hasShipping && item.receivedWeight
          ? ["Received weight", `${item.receivedWeight} kg`]
          : null,
        ["Customs & shipping rate", rate || "Not given yet"],
        isProductRequest && item.store ? ["Store", item.store] : null,
        item.refund && item.refund != 0 ? ["Refunded", `৳${item.refund}`] : null,
      ].filter(Boolean),
      score: parseInt(item.shipmentStatusScore) || 0,
    };
  };

  renderProducts = (item, isProductRequest) => {
    if (isProductRequest) {
      return (
        <div className="ap-product">
          <div
            className="ap-thumb"
            style={{ backgroundImage: `url(${item.imageUrl || ""})` }}
          />
          <div className="ap-product-main">
            <div className="ap-product-name">
              {item.productType || item.othersProductName || "Product"}
            </div>
            {item.productVariant && (
              <div className="ap-product-variant">{item.productVariant}</div>
            )}
          </div>
          <div className="ap-product-price">
            {item.unitPrice ? (
              <b>৳{item.unitPrice}</b>
            ) : (
              <span className="ap-muted">Unit price not set</span>
            )}
            <span className="ap-qty">× {item.productQuantity || 0}</span>
          </div>
        </div>
      );
    }
    return (item.items || []).map((product, pi) =>
      (product.skus || []).map((sku, si) => (
        <div className="ap-product" key={`${pi}-${si}`}>
          <div
            className="ap-thumb"
            style={{ backgroundImage: `url(${sku.image || product.picture || ""})` }}
          />
          <div className="ap-product-main">
            <div className="ap-product-name" title={product.name}>
              {product.name}
            </div>
            <div className="ap-product-variant">
              {product.propertyNames && product.propertyNames.length > 0 && (
                <>
                  {product.propertyNames[0]}: {sku.color}
                  {sku.size && product.propertyNames[1]
                    ? ` · ${product.propertyNames[1]}: ${sku.size}`
                    : ""}
                </>
              )}
            </div>
          </div>
          <div className="ap-product-price">
            <b>৳{parseInt(parseFloat(sku.price)) || 0}</b>
            <span className="ap-qty">× {sku.totalQuantity}</span>
          </div>
        </div>
      ))
    );
  };

  render = () => {
    const { payableOrders = [], paymentRequestObj, toggleModal } = this.props;
    if (toggleModal || !paymentRequestObj) return null;

    const isProductRequest = !!paymentRequestObj.productRequest;
    const items = payableOrders.map((o) => ({
      raw: o,
      ...this.describeItem(o, isProductRequest),
    }));
    const amount =
      parseInt(paymentRequestObj.amount || paymentRequestObj.payableTotal) || 0;
    const combinedDue = items.reduce((s, i) => s + Math.max(i.due, 0), 0);
    const remaining = combinedDue - amount;
    const tk = (v) => `৳${(parseInt(v) || 0).toLocaleString("en-IN")}`;

    return (
      <div className={`ap-overlay ${this.state.closing ? "is-closing" : ""}`} role="dialog" aria-modal="true">
        <div className="ap-modal">
          {/* Header */}
          <div className="ap-head">
            <div className="ap-head-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
              </svg>
            </div>
            <div className="ap-head-text">
              <h4 className="ap-title">Review &amp; Approve Payment</h4>
              <div className="ap-sub">
                Payment ID <b>#{paymentRequestObj.paymentId}</b>
              </div>
              <div className="ap-chips">
                <span className="ap-chip">
                  {isProductRequest ? "Product Request" : "Website Order"}
                </span>
                {paymentRequestObj.displayName && (
                  <span className="ap-chip">👤 {paymentRequestObj.displayName}</span>
                )}
                {paymentRequestObj.date && (
                  <span className="ap-chip">📅 {paymentRequestObj.date}</span>
                )}
                <span className="ap-chip">
                  {items.length} {isProductRequest ? "booking" : "order"}
                  {items.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <button type="button" className="ap-x" onClick={this.close} aria-label="Close">
              &times;
            </button>
          </div>

          <div className="ap-body">
            {/* Payment proof + summary */}
            <div className="ap-top">
              <div className="ap-card ap-proof">
                <div className="ap-card-title">Payment proof</div>
                {paymentRequestObj.imageUrl ? (
                  <a
                    href={paymentRequestObj.imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ap-proof-img"
                    title="Open full screenshot"
                  >
                    <img src={paymentRequestObj.imageUrl} alt="Payment screenshot" />
                    <span className="ap-proof-open">Open full size ↗</span>
                  </a>
                ) : (
                  <div className="ap-proof-empty">
                    No screenshot attached
                    {paymentRequestObj.method === "Bkash" ? " (bKash gateway)" : ""}
                  </div>
                )}
                <div className="ap-proof-meta">
                  <MethodLogo method={paymentRequestObj.method} className="ap-method-logo" />
                  <div>
                    <div className="ap-proof-method">
                      {paymentRequestObj.method || "—"}
                    </div>
                    {paymentRequestObj.trxID && (
                      <div className="ap-muted">TrxID: {paymentRequestObj.trxID}</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="ap-card ap-summary">
                <div className="ap-card-title">Payment summary</div>
                <div className="ap-amount">
                  <span className="ap-amount-label">Amount submitted</span>
                  <span className="ap-amount-value">{tk(amount)}</span>
                </div>
                <div className="ap-sum-rows">
                  <div className="ap-sum-row">
                    <span>Current due ({items.length} item{items.length === 1 ? "" : "s"})</span>
                    <b>{tk(combinedDue)}</b>
                  </div>
                  <div className="ap-sum-row">
                    <span>This payment</span>
                    <b className="ap-green">− {tk(amount)}</b>
                  </div>
                  <div className="ap-sum-row ap-sum-total">
                    <span>
                      {remaining > 0 ? "Due after approval" : remaining < 0 ? "Overpaid by" : "Due after approval"}
                    </span>
                    <b className={remaining > 0 ? "ap-orange" : remaining < 0 ? "ap-red" : "ap-green"}>
                      {tk(Math.abs(remaining))}
                    </b>
                  </div>
                </div>
                {remaining < 0 ? (
                  <div className="ap-alert ap-alert-red">
                    The amount is more than the current due. Double-check before approving.
                  </div>
                ) : remaining === 0 ? (
                  <div className="ap-alert ap-alert-green">
                    This payment clears the full due.
                  </div>
                ) : (
                  <div className="ap-alert ap-alert-orange">
                    Partial payment: {tk(remaining)} will still be due.
                  </div>
                )}
              </div>
            </div>

            {/* Items */}
            <div className="ap-section-title">
              {isProductRequest ? "Bookings" : "Orders"} covered by this payment
            </div>
            {items.map((item, idx) => (
              <div className="ap-card ap-item" key={`${item.id}-${idx}`}>
                <div className="ap-item-head">
                  <div>
                    <div className="ap-item-id">
                      {item.idLabel} #{item.id}
                    </div>
                    <div className="ap-muted">
                      {item.date ? `${item.date} · ` : ""}
                      Tracking: {item.trackingNo || "not given yet"}
                    </div>
                  </div>
                  <div className="ap-item-badges">
                    {item.status && (
                      <span className="ap-badge ap-tone-blue">{statusDisplay(item.status)}</span>
                    )}
                    <span
                      className={`ap-badge ${
                        item.paymentStatus === "Paid"
                          ? "ap-tone-green"
                          : item.paymentStatus === "Partially Paid"
                            ? "ap-tone-orange"
                            : item.paymentStatus === "pending"
                              ? "ap-tone-violet"
                              : "ap-tone-gray"
                      }`}
                    >
                      {item.paymentStatus === "pending"
                        ? "Payment in review"
                        : item.paymentStatus && item.paymentStatus !== "purchaseLater"
                          ? item.paymentStatus
                          : "Not Paid"}
                    </span>
                  </div>
                </div>

                <div className="ap-products">
                  {this.renderProducts(item.raw, isProductRequest)}
                </div>

                <div className="ap-item-grid">
                  <div className="ap-facts">
                    {item.facts.map(([k, v]) => (
                      <div className="ap-fact" key={k}>
                        <span>{k}</span>
                        <b>{v}</b>
                      </div>
                    ))}
                    <div className={`ap-note ${item.hasShipping ? "ap-note-green" : ""}`}>
                      {item.hasShipping
                        ? "China → Bangladesh customs & shipping charge included."
                        : "China → Bangladesh customs & shipping charge will be added later."}
                    </div>
                  </div>

                  <div className="ap-bill">
                    {item.lines.map((l) => (
                      <div className="ap-bill-line" key={l.label}>
                        <span>{l.label}</span>
                        <b className={l.sign === "-" ? "ap-green" : ""}>
                          {l.sign === "-" ? "− " : l.sign === "+" ? "+ " : ""}
                          {tk(l.value)}
                        </b>
                      </div>
                    ))}
                    <div className="ap-bill-line ap-bill-strong">
                      <span>Total bill</span>
                      <b>{tk(item.bill)}</b>
                    </div>
                    <div className="ap-bill-line">
                      <span>Already paid</span>
                      <b className="ap-green">− {tk(item.paid)}</b>
                    </div>
                    <div className="ap-bill-due">
                      <span>Due now</span>
                      <b>{tk(item.due)}</b>
                    </div>
                  </div>
                </div>

                {!item.rejected && (
                  <div className="ap-steps">
                    {STEPS.map((label, i) => {
                      const done = item.score >= i + 1;
                      const current = item.score === i + 1;
                      return (
                        <div
                          key={label}
                          className={`ap-step ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}
                        >
                          <span className="ap-step-dot">{done ? "✓" : i + 1}</span>
                          <span className="ap-step-label">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="ap-foot">
            <label className={`ap-confirm ${this.state.termsAndCondition ? "is-checked" : ""}`}>
              <input
                type="checkbox"
                name="termsAndCondition"
                checked={this.state.termsAndCondition}
                onChange={() =>
                  this.setState({ termsAndCondition: !this.state.termsAndCondition })
                }
              />
              <span className="ap-confirm-box">{this.state.termsAndCondition ? "✓" : ""}</span>
              <span>
                I checked the screenshot and the invoices.{" "}
                <span className="ap-red">I am responsible for any mistake.</span>
              </span>
            </label>
            <div className="ap-actions">
              <button type="button" className="ap-btn ap-btn-ghost" onClick={this.close}>
                Cancel
              </button>
              <button
                type="button"
                className="ap-btn ap-btn-primary"
                disabled={!this.state.termsAndCondition || this.state.loader}
                onClick={() => this.handleSubmit()}
              >
                {this.state.loader ? (
                  <CircleLoader loading color="white" size={15} />
                ) : (
                  <>Approve {tk(amount)}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
}
const mapStateToProps = (state, ownProps) => {
  console.log(ownProps.paymentRequestObj);
  return {
    allUsers: state.users.users,
    rechargeUser: ownProps.paymentRequestObj
      ? state.users.users.find(
          (user) => user.uid === ownProps.paymentRequestObj.userId
        )
      : null,
    admin: state.admins.currentAdmin,
    currency: state.users.currency,
  };
};
export default withRouter(
  connect(mapStateToProps, {
    makePaymentRedux,
    updatePaymentRequestOrderStatusRedux,
  })(MakePaymentModal)
);
