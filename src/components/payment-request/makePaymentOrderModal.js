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
        ? order.orderTotal +
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

  render = () => {
    const { payableOrders, currency, paymentRequestObj } = this.props;
    console.log(paymentRequestObj);

    console.log(payableOrders);
    let total = 0;

    payableOrders.forEach((order) => {
      return (total += order.orderTotal);
    });

    console.log(total);
    return (
      <>
        <div
          className={
            this.props.toggleModal
              ? "modal fade show"
              : "modal fade show visible-modal"
          }
          id="request_make_payment_popup"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div
            className="modal-dialog modal-dialog-centered request_popup"
            role="document"
          >
            <div
              className="modal-content login-modal order-details-modal-container"
              style={{ backgroundColor: "white" }}
            >
              <div className="modal-body p-0">
                <section className="pos-rel bg-light-gray">
                  <div className="container-fluid p-3 order-details-main-container">
                    <a
                      id="modal-close-icon-payment-modal"
                      onClick={() => this.props.startToggleModal(null, [])}
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <i
                        className="icofont-close-line"
                        style={{ color: "black", fontWeight: "bolder" }}
                      ></i>
                    </a>
                    <div className="d-lg-flex justify-content-end no-gutters mb-spacer-md">
                      <div className="col">
                        <div className="order-details-container">
                          <h2 className="h2-xl mb-2 fw-6 pb-2 order-details-header">
                            Order Details
                          </h2>
                          <div style={{ marginTop: "20px" }}></div>

                          {paymentRequestObj && paymentRequestObj.productRequest
                            ? payableOrders.length > 0 &&
                              payableOrders.map((booking) => {
                                return (
                                  <>
                                    <div>
                                      <div className="each-order-container-1">
                                        <div
                                          className="order-header-1"
                                          style={{
                                            borderBottom: "1px solid gainsboro",
                                          }}
                                        >
                                          <div style={{ fontSize: 12 }}>
                                            Booking Id: {booking.bookingId}{" "}
                                            <br />
                                            <span
                                              style={{
                                                fontSize: 11,
                                                color: "gray",
                                              }}
                                            >
                                              Tracking no:{" "}
                                              {booking.trackingNo ||
                                                "Not given yet"}
                                            </span>{" "}
                                          </div>
                                        </div>
                                      </div>
                                      <div
                                        className="products-box"
                                        style={{
                                          borderBottomLeftRadius: 10,
                                          borderBottomRightRadius: 10,
                                        }}
                                      >
                                        <div>
                                          <div
                                            className="row"
                                            style={{ marginTop: 10 }}
                                          >
                                            <div>
                                              <div
                                                style={{
                                                  minHeight: 60,
                                                  minWidth: 60,
                                                  maxHeight: 60,
                                                  maxWidth: 60,
                                                  overflow: "hidden",
                                                  backgroundImage: `url(${booking.imageUrl})`,
                                                  backgroundPosition: "center",
                                                  backgroundSize: "cover",
                                                  backgroundRepeat: "no-repeat",
                                                  border: "1px solid gainsboro",
                                                  borderRadius: 5,
                                                }}
                                              />
                                            </div>
                                            <div
                                              className="col"
                                              style={{
                                                padding: "0px 10px",
                                                paddingLeft: 20,
                                              }}
                                            >
                                              <div
                                                style={{
                                                  color: "#4a4a4a",
                                                  fontSize: 8,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  Date:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                    }}
                                                  >
                                                    {booking.date}
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  Store: {booking.store}
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  Product type:{" "}
                                                  {booking.productType}
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 10,
                                                  }}
                                                >
                                                  Shipping Rate:{" "}
                                                  {booking.customerRate
                                                    ? `${booking.customerRate}tk/kg`
                                                    : booking.shippingRate
                                                    ? `${booking.shippingRate}tk/kg`
                                                    : "Not given yet"}
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 10,
                                                    marginTop: 20,
                                                  }}
                                                >
                                                  {booking.productVariant}{" "}
                                                </div>
                                              </div>
                                            </div>
                                            <div
                                              style={{
                                                display: "flex",
                                                flexDirection: "column",
                                                textAlign: "end",
                                              }}
                                              className="col-3"
                                            >
                                              <div
                                                style={{
                                                  color: "rgb(98 98 98)",
                                                  fontSize: 11,
                                                }}
                                              >
                                                {booking.unitPrice ? (
                                                  `${booking.unitPrice}Tk`
                                                ) : (
                                                  <div
                                                    style={{
                                                      color: "gray",
                                                      fontSize: 10,
                                                      fontWeight: "lighter",
                                                    }}
                                                  >
                                                    unit Price: not given yet
                                                  </div>
                                                )}
                                              </div>
                                              <div
                                                style={{
                                                  color: "gray",
                                                  fontSize: 11,
                                                  marginLeft: 10,
                                                }}
                                              >
                                                X{booking.productQuantity}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "space-between",
                                            marginBottom: 5,
                                            marginTop: 10,
                                          }}
                                        >
                                          <div>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Order status:{" "}
                                              <span
                                                style={{
                                                  color: "#ff8084",
                                                  fontWeight: "bold",
                                                  fontSize: 10,
                                                }}
                                              >
                                                {booking.orderStatus ==
                                                "Bangladesh warehouse"
                                                  ? "Custom released"
                                                  : booking.orderStatus}
                                              </span>{" "}
                                              <br />
                                            </div>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Payment Status:{" "}
                                              {booking.paymentStatus ==
                                                "Paid" ||
                                              booking.paymentStatus ==
                                                "Partially Paid" ||
                                              !booking.paymentStatus ? (
                                                <div
                                                  style={{
                                                    color: "white",
                                                    background:
                                                      booking.paymentStatus ==
                                                      "Paid"
                                                        ? "darkgreen"
                                                        : booking.paymentStatus ==
                                                          "Partially Paid"
                                                        ? "darkorange"
                                                        : !booking.paymentStatus
                                                        ? "#596fa8"
                                                        : "white",
                                                    border:
                                                      "1px solid gainsboro",
                                                    borderRadius: 5,
                                                    padding: "1px 5px",
                                                    display: "inline",
                                                    fontSize: 7,
                                                    marginTop: 5,
                                                    fontWeight: "bold",
                                                  }}
                                                >
                                                  {booking.paymentStatus ==
                                                  "Paid"
                                                    ? "Paid"
                                                    : booking.paymentStatus ==
                                                      "Partially Paid"
                                                    ? "Partially Paid"
                                                    : !booking.paymentStatus
                                                    ? "Not Paid"
                                                    : "Not Paid"}
                                                </div>
                                              ) : (
                                                <span
                                                  style={{
                                                    position: "relative",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      color: "white",
                                                      background: "#da62da",
                                                      border:
                                                        "1px solid gainsboro",
                                                      borderRadius: 5,
                                                      padding: "1px 5px",
                                                      display: "inline",
                                                      fontSize: 7,
                                                      marginTop: 5,
                                                      fontWeight: "bold",
                                                    }}
                                                    className="myDIV"
                                                  >
                                                    {booking.paymentStatus}
                                                  </div>
                                                </span>
                                              )}
                                            </div>

                                            {booking.shippingChargeCustomer &&
                                            booking.shippingChargeCustomer !==
                                              0 ? (
                                              <>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Total weight:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    {booking.receivedWeight} kg
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Customs & Shippping rate:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    {booking.customerRate} tk/kg
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Total Shipping charge (CN to
                                                  BD):{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    +
                                                    {
                                                      booking.shippingChargeCustomer
                                                    }{" "}
                                                    Tk
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  China local courier charge:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    +{booking.localShipping} Tk
                                                  </span>
                                                </div>
                                                {booking.otherCost && (
                                                  <div
                                                    style={{
                                                      color: "gray",
                                                      fontSize: 11,
                                                    }}
                                                  >
                                                    Other Cost:{" "}
                                                    <span
                                                      style={{
                                                        fontWeight: "bold",
                                                        color: "#444",
                                                      }}
                                                    >
                                                      +{booking.otherCost} Tk
                                                    </span>
                                                  </div>
                                                )}
                                                {booking.discount && (
                                                  <div
                                                    style={{
                                                      color: "gray",
                                                      fontSize: 11,
                                                    }}
                                                  >
                                                    Discount:{" "}
                                                    <span
                                                      style={{
                                                        fontWeight: "bold",
                                                        color: "#444",
                                                      }}
                                                    >
                                                      -{booking.discount} Tk
                                                    </span>
                                                  </div>
                                                )}
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Product Price:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    +
                                                    {booking.actualTotal
                                                      ? booking.actualTotal
                                                      : this.getSingleShopTotal(
                                                          booking
                                                        )}
                                                    Tk
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    fontWeight: "bold",
                                                    fontSize: 16,
                                                    marginTop: 20,
                                                  }}
                                                >
                                                  {booking.actualTotal
                                                    ? parseInt(
                                                        booking.actualTotal
                                                      ) +
                                                      parseInt(
                                                        booking.shippingChargeCustomer
                                                      ) +
                                                      parseInt(
                                                        booking.localShipping
                                                      ) +
                                                      parseInt(
                                                        booking.otherCost
                                                          ? booking.otherCost
                                                          : 0
                                                      ) -
                                                      parseInt(
                                                        booking.discount
                                                          ? booking.discount
                                                          : 0
                                                      )
                                                    : this.getSingleShopTotal(
                                                        booking
                                                      ) +
                                                      parseInt(
                                                        booking.shippingChargeCustomer
                                                      ) +
                                                      parseInt(
                                                        booking.localShipping
                                                      ) +
                                                      parseInt(
                                                        booking.otherCost
                                                          ? booking.otherCost
                                                          : 0
                                                      ) -
                                                      parseInt(
                                                        booking.discount
                                                          ? booking.discount
                                                          : 0
                                                      )}
                                                  Tk
                                                  <div
                                                    style={{
                                                      fontSize: 10,
                                                      color: "gray",
                                                      fontWeight: "lighter",
                                                      marginTop: -3,
                                                    }}
                                                  >
                                                    including shipping charge
                                                  </div>
                                                </div>
                                              </>
                                            ) : (
                                              <>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  China local courier charge:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                      fontSize: 10,
                                                    }}
                                                  >
                                                    {booking.localShipping
                                                      ? `${booking.localShipping}Tk`
                                                      : "Not given yet"}
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Customs & Shippping rate:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                      fontSize: 10,
                                                    }}
                                                  >
                                                    {booking.customerRate
                                                      ? `${booking.customerRate}tk/kg`
                                                      : "Not given yet"}
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                  }}
                                                >
                                                  Product Price:{" "}
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      color: "#444",
                                                    }}
                                                  >
                                                    {booking.actualTotal
                                                      ? booking.actualTotal
                                                      : this.getSingleShopTotal(
                                                          booking
                                                        )}
                                                    Tk
                                                  </span>
                                                </div>
                                                <div
                                                  style={{
                                                    fontWeight: "bold",
                                                    fontSize: 16,
                                                    marginTop: 20,
                                                  }}
                                                >
                                                  {booking.actualTotal
                                                    ? `${booking.actualTotal}Tk`
                                                    : this.getSingleShopTotal(
                                                        booking
                                                      ) > 0
                                                    ? `${this.getSingleShopTotal(
                                                        booking
                                                      )} Tk`
                                                    : "Not given yet"}

                                                  <div
                                                    style={{
                                                      fontSize: 10,
                                                      color: "gray",
                                                      fontWeight: "lighter",
                                                      marginTop: -3,
                                                    }}
                                                  >
                                                    excluding shipping charge
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                          <div>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Total Paid{" "}
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#444",
                                                }}
                                              >
                                                Tk {this.getTotalPaid2(booking)}
                                              </span>
                                            </div>
                                            {booking.couponAmount &&
                                            booking.couponAmount !== 0 ? (
                                              <div
                                                style={{
                                                  color: "gray",
                                                  fontSize: 11,
                                                }}
                                              >
                                                Coupon{" "}
                                                <span
                                                  style={{
                                                    fontWeight: "bold",
                                                    color: "#444",
                                                  }}
                                                >
                                                  Tk {booking.couponAmount}
                                                </span>
                                              </div>
                                            ) : null}
                                            {booking.offer &&
                                            booking.offer !== 0 ? (
                                              <div
                                                style={{
                                                  color: "gray",
                                                  fontSize: 11,
                                                }}
                                              >
                                                Discount{" "}
                                                <span
                                                  style={{
                                                    fontWeight: "bold",
                                                    color: "#444",
                                                  }}
                                                >
                                                  Tk{" "}
                                                  {getOfferDiscount(booking)}
                                                </span>
                                              </div>
                                            ) : null}
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Total Due{" "}
                                              <span
                                                style={{
                                                  color: "#ff8084",
                                                  fontWeight: "bold",
                                                }}
                                              >
                                                Tk {this.getTotalDue2(booking)}
                                              </span>
                                            </div>

                                            <div>
                                              {booking.refund &&
                                              booking.refund != 0 ? (
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 11,
                                                    marginLeft: 3,
                                                  }}
                                                >
                                                  Refunded amount: <br />
                                                  <span
                                                    style={{
                                                      fontWeight: "bold",
                                                      fontSize: 10,
                                                      color: "#555",
                                                    }}
                                                  >
                                                    {booking.refund}Tk
                                                  </span>
                                                </div>
                                              ) : null}
                                            </div>
                                          </div>
                                        </div>
                                        {booking.orderStatus !== "Reject" && (
                                          <div
                                            className="row"
                                            style={{
                                              margin: 0,
                                              marginBottom: 20,
                                              marginTop: 30,
                                            }}
                                          >
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 1
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-paper" />
                                              <span>Pending</span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 2
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-tick-boxed" />
                                              <span>Approved</span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 3
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-building-alt" />
                                              <span>Abroad</span>
                                              <br />
                                              <span style={{ top: "-10px" }}>
                                                Warehouse
                                              </span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 4
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-airplane-alt" />
                                              <span style={{ left: "-15px" }}>
                                                Ready{" "}
                                              </span>
                                              <br />
                                              <span
                                                style={{
                                                  top: "-10px",
                                                  left: "-15px",
                                                }}
                                              >
                                                fly
                                              </span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 5
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-shield-alt" />
                                              <span>Bangladesh</span>
                                              <br />
                                              <span style={{ top: "-10px" }}>
                                                {" "}
                                                customs
                                              </span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 6
                                                  ? "each-progress-3"
                                                  : "each-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-castle" />
                                              <span>Paicart</span>
                                              <br />
                                              <span style={{ top: "-10px" }}>
                                                {" "}
                                                warehouse
                                              </span>
                                            </div>
                                            <div
                                              className={`col ${
                                                booking.shipmentStatusScore >= 7
                                                  ? "last-progress-3"
                                                  : "last-progress-4"
                                              }`}
                                            >
                                              <i className="icofont-tick-mark" />
                                              <span>Delivered</span>
                                            </div>
                                          </div>
                                        )}
                                        <div
                                          style={{
                                            color:
                                              booking.shippingChargeCustomer &&
                                              booking.shippingChargeCustomer !==
                                                0
                                                ? "green"
                                                : "#ff8084",
                                            fontSize: 10,
                                            marginTop: 10,
                                          }}
                                        >
                                          {booking.shippingChargeCustomer &&
                                          booking.shippingChargeCustomer !== 0
                                            ? "***China to Bangladesh customs & shipping charge included."
                                            : "***China to Bangladesh customs & shipping charge will be included later."}
                                        </div>
                                      </div>
                                    </div>
                                  </>
                                );
                              })
                            : payableOrders.length > 0 &&
                              payableOrders.map((order) => (
                                <div>
                                  <div className="each-order-container-1">
                                    <div
                                      className="order-header-1"
                                      style={{
                                        borderBottom: "1px solid gainsboro",
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 12,
                                          fontWeight: "bold",
                                        }}
                                      >
                                        Order Id:{" "}
                                        {order.orderId || order.bookingId}{" "}
                                        <div style={{ fontSize: 10 }}>
                                          Tracking No:
                                          {order.trackingNo || "Not given yet"}
                                        </div>
                                      </div>

                                      <div></div>
                                    </div>
                                  </div>
                                  <div
                                    className="products-box"
                                    style={{
                                      borderBottomLeftRadius: 10,
                                      borderBottomRightRadius: 10,
                                    }}
                                  >
                                    {order && order.items && (
                                      <div>
                                        {order.items.map((item) =>
                                          item.skus.map((sku, index) => (
                                            <div
                                              style={{
                                                padding: 5,
                                                paddingBottom: 10,
                                                display: "flex",
                                                flexDirection: "row",
                                                justifyContent: "space-between",
                                                borderBottom:
                                                  index + 1 == item.skus.length
                                                    ? "none"
                                                    : "1px solid gainsboro",
                                              }}
                                              key={index}
                                            >
                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "row",
                                                  justifyContent: "flex-start",
                                                  marginLeft: 5,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    minHeight: 60,
                                                    minWidth: 60,
                                                    maxHeight: 60,
                                                    maxWidth: 60,
                                                    overflow: "hidden",
                                                    backgroundImage: `url(${
                                                      sku.image
                                                        ? sku.image
                                                        : item.picture
                                                    })`,
                                                    backgroundPosition:
                                                      "center",
                                                    backgroundSize: "cover",
                                                    backgroundRepeat:
                                                      "no-repeat",
                                                    border:
                                                      "1px solid gainsboro",
                                                    borderRadius: 5,
                                                  }}
                                                />
                                                <div
                                                  style={{
                                                    padding: "0px 10px",
                                                  }}
                                                >
                                                  <div
                                                    style={{
                                                      color: "#222",
                                                      fontSize: 13,
                                                    }}
                                                  >
                                                    {item.name &&
                                                      item.name.slice(0, 20)}
                                                    ...
                                                  </div>
                                                  <div
                                                    style={{
                                                      color: "gray",
                                                      fontSize: 10,
                                                    }}
                                                  >
                                                    Product type:{" "}
                                                    {item.productType}
                                                  </div>
                                                  <div
                                                    style={{
                                                      color: "gray",
                                                      fontSize: 10,
                                                    }}
                                                  >
                                                    Shipping Rate:{" "}
                                                    {order.customerRate
                                                      ? `${order.customerRate}tk/kg`
                                                      : item.shippingRate
                                                      ? `${item.shippingRate}tk/kg`
                                                      : "Not given yet"}
                                                  </div>
                                                  {item.propertyNames &&
                                                    item.propertyNames.length >
                                                      0 && (
                                                      <div
                                                        style={{
                                                          color: "gray",
                                                          fontSize: 10,
                                                        }}
                                                      >
                                                        {item.propertyNames[0]}:{" "}
                                                        {sku.color}
                                                        , <br />
                                                        {sku.size &&
                                                          `${item.propertyNames[1]}: ${sku.size}`}
                                                      </div>
                                                    )}
                                                </div>
                                              </div>

                                              <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    color: "rgb(98 98 98)",
                                                    fontSize: 12,
                                                  }}
                                                >
                                                  Tk{" "}
                                                  {parseInt(
                                                    parseFloat(sku.price)
                                                  )}
                                                </div>
                                                <div
                                                  style={{
                                                    color: "gray",
                                                    fontSize: 12,
                                                    marginLeft: 20,
                                                  }}
                                                >
                                                  X{sku.totalQuantity}
                                                </div>
                                              </div>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        display: "flex",
                                        flexDirection: "row",
                                        justifyContent: "space-between",
                                        marginBottom: 5,
                                        marginTop: 10,
                                      }}
                                    >
                                      <div>
                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Order Date:{" "}
                                          <span
                                            style={{
                                              color: "#333",
                                              fontWeight: "bold",
                                              fontSize: 10,
                                            }}
                                          >
                                            {order.orderedDate}
                                          </span>{" "}
                                          <br />
                                        </div>
                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Order status:{" "}
                                          <span
                                            style={{
                                              color: "#ff8084",
                                              fontWeight: "bold",
                                              fontSize: 10,
                                            }}
                                          >
                                            {order.orderStatus}
                                          </span>{" "}
                                          <br />
                                        </div>
                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Payment Status:{" "}
                                          {order.paymentStatus == "Paid" ||
                                          order.paymentStatus ==
                                            "Partially Paid" ||
                                          order.paymentStatus ==
                                            "purchaseLater" ? (
                                            <div
                                              style={{
                                                color: "white",
                                                background:
                                                  order.paymentStatus == "Paid"
                                                    ? "darkgreen"
                                                    : order.paymentStatus ==
                                                      "Partially Paid"
                                                    ? "darkorange"
                                                    : order.paymentStatus ==
                                                      "purchaseLater"
                                                    ? "#596fa8"
                                                    : "white",
                                                border: "1px solid gainsboro",
                                                borderRadius: 5,
                                                padding: "1px 5px",
                                                display: "inline",
                                                fontSize: 7,
                                                marginTop: 5,
                                                fontWeight: "bold",
                                              }}
                                            >
                                              {order.paymentStatus == "Paid"
                                                ? "Paid"
                                                : order.paymentStatus ==
                                                  "Partially Paid"
                                                ? "Partially Paid"
                                                : order.paymentStatus ==
                                                  "purchaseLater"
                                                ? "Not Paid"
                                                : "Not Paid"}
                                            </div>
                                          ) : (
                                            <span
                                              style={{ position: "relative" }}
                                            >
                                              <div
                                                style={{
                                                  color: "white",
                                                  background: "#da62da",
                                                  border: "1px solid gainsboro",
                                                  borderRadius: 5,
                                                  padding: "1px 5px",
                                                  display: "inline",
                                                  fontSize: 7,
                                                  marginTop: 5,
                                                  fontWeight: "bold",
                                                }}
                                                className="myDIV"
                                              >
                                                {order.paymentStatus}
                                              </div>
                                            </span>
                                          )}
                                        </div>

                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Product Price:{" "}
                                          <span
                                            style={{
                                              fontWeight: "bold",
                                              color: "#444",
                                            }}
                                          >
                                            {order.actualTotal
                                              ? order.actualTotal
                                              : this.getSingleShopTotal(order)}
                                            Tk
                                          </span>
                                        </div>
                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          China local courier charge:{" "}
                                          <span
                                            style={{
                                              fontWeight: "bold",
                                              color: "#444",
                                            }}
                                          >
                                            {order.localShipping
                                              ? `${order.localShipping}Tk`
                                              : "Not given yet"}{" "}
                                          </span>
                                        </div>
                                        {order.shippingChargeCustomer &&
                                        order.shippingChargeCustomer !== 0 ? (
                                          <>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Total weight:{" "}
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#444",
                                                }}
                                              >
                                                {order.receivedWeight} kg
                                              </span>
                                            </div>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Customs & Shippping rate:{" "}
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#444",
                                                }}
                                              >
                                                {order.customerRate} tk/kg
                                              </span>
                                            </div>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Total Shipping charge (CN to BD):{" "}
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#444",
                                                }}
                                              >
                                                {order.shippingChargeCustomer}{" "}
                                                Tk
                                              </span>
                                            </div>

                                            <div
                                              style={{
                                                fontWeight: "bold",
                                                fontSize: 16,
                                                marginTop: 20,
                                              }}
                                            >
                                              {order.actualTotal
                                                ? parseInt(order.actualTotal) +
                                                  parseInt(
                                                    order.shippingChargeCustomer
                                                  ) +
                                                  parseInt(order.localShipping)
                                                : this.getSingleShopTotal(
                                                    order
                                                  ) +
                                                  parseInt(
                                                    order.shippingChargeCustomer
                                                  ) +
                                                  parseInt(order.localShipping)}
                                              Tk
                                              <div
                                                style={{
                                                  fontSize: 10,
                                                  color: "gray",
                                                  fontWeight: "lighter",
                                                  marginTop: -3,
                                                }}
                                              >
                                                including shipping charge
                                              </div>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                              }}
                                            >
                                              Customs & Shippping rate:{" "}
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  color: "#444",
                                                }}
                                              >
                                                {order.customerRate
                                                  ? `${order.customerRate}tk/kg`
                                                  : "Not given yet"}
                                              </span>
                                            </div>

                                            <div
                                              style={{
                                                fontWeight: "bold",
                                                fontSize: 16,
                                                marginTop: 20,
                                              }}
                                            >
                                              {order.actualTotal
                                                ? order.actualTotal
                                                : this.getSingleShopTotal(
                                                    order
                                                  )}
                                              Tk
                                              <div
                                                style={{
                                                  fontSize: 10,
                                                  color: "gray",
                                                  fontWeight: "lighter",
                                                  marginTop: -3,
                                                }}
                                              >
                                                excluding shipping charge
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                      <div>
                                        {order.otherCost ? (
                                          <div
                                            style={{
                                              color: "gray",
                                              fontSize: 11,
                                            }}
                                          >
                                            Packaging & other cost{" "}
                                            <span
                                              style={{
                                                fontWeight: "bold",
                                                color: "#444",
                                              }}
                                            >
                                              +Tk {order.otherCost}
                                            </span>
                                          </div>
                                        ) : null}
                                        {order.couponAmount &&
                                        order.couponAmount !== 0 ? (
                                          <div
                                            style={{
                                              color: "gray",
                                              fontSize: 11,
                                            }}
                                          >
                                            Coupon amout{" "}
                                            <span
                                              style={{
                                                fontWeight: "bold",
                                                color: "#444",
                                              }}
                                            >
                                              -Tk {order.couponAmount}
                                            </span>
                                          </div>
                                        ) : null}
                                        {order.offer && order.offer !== 0 ? (
                                          <div
                                            style={{
                                              color: "gray",
                                              fontSize: 11,
                                            }}
                                          >
                                            Discount (on pay now%){" "}
                                            <span
                                              style={{
                                                fontWeight: "bold",
                                                color: "#444",
                                              }}
                                            >
                                              -Tk{" "}
                                              {getOfferDiscount(order)}
                                            </span>
                                          </div>
                                        ) : null}
                                        {order.discount ? (
                                          <div
                                            style={{
                                              color: "gray",
                                              fontSize: 11,
                                            }}
                                          >
                                            Discount (on shipping){" "}
                                            <span
                                              style={{
                                                fontWeight: "bold",
                                                color: "#444",
                                              }}
                                            >
                                              -Tk {Math.round(order.discount)}
                                            </span>
                                          </div>
                                        ) : null}
                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Total Paid{" "}
                                          <span
                                            style={{
                                              fontWeight: "bold",
                                              color: "#444",
                                            }}
                                          >
                                            -Tk {this.getTotalPaid(order)}
                                          </span>
                                        </div>

                                        <div
                                          style={{
                                            color: "gray",
                                            fontSize: 11,
                                          }}
                                        >
                                          Total Due{" "}
                                          <span
                                            style={{
                                              color: "#ff8084",
                                              fontWeight: "bold",
                                            }}
                                          >
                                            Tk {this.getTotalDue(order)}
                                          </span>
                                        </div>
                                        <div style={{ marginTop: 30 }} />

                                        <div>
                                          {order.refund && order.refund != 0 ? (
                                            <div
                                              style={{
                                                color: "gray",
                                                fontSize: 11,
                                                marginLeft: 3,
                                              }}
                                            >
                                              Refunded amount: <br />
                                              <span
                                                style={{
                                                  fontWeight: "bold",
                                                  fontSize: 10,
                                                  color: "#555",
                                                }}
                                              >
                                                {order.refund}Tk
                                              </span>
                                            </div>
                                          ) : null}
                                        </div>
                                      </div>
                                    </div>
                                    {order.status !== "Reject" && (
                                      <div
                                        className="row"
                                        style={{
                                          margin: 0,
                                          marginBottom: 20,
                                          marginTop: 30,
                                        }}
                                      >
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 1
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-paper" />
                                          <span>Pending</span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 2
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-tick-boxed" />
                                          <span>Approved</span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 3
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-building-alt" />
                                          <span>Abroad</span>
                                          <br />
                                          <span style={{ top: "-10px" }}>
                                            Warehouse
                                          </span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 4
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-airplane-alt" />
                                          <span style={{ left: "-15px" }}>
                                            Ready{" "}
                                          </span>
                                          <br />
                                          <span
                                            style={{
                                              top: "-10px",
                                              left: "-15px",
                                            }}
                                          >
                                            fly
                                          </span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 5
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-shield-alt" />
                                          <span>Bangladesh</span>
                                          <br />
                                          <span style={{ top: "-10px" }}>
                                            {" "}
                                            customs
                                          </span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 6
                                              ? "each-progress-3"
                                              : "each-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-castle" />
                                          <span>Paicart</span>
                                          <br />
                                          <span style={{ top: "-10px" }}>
                                            {" "}
                                            warehouse
                                          </span>
                                        </div>
                                        <div
                                          className={`col ${
                                            order.shipmentStatusScore >= 7
                                              ? "last-progress-3"
                                              : "last-progress-4"
                                          }`}
                                        >
                                          <i className="icofont-tick-mark" />
                                          <span>Delivered</span>
                                        </div>
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        color:
                                          order.shippingChargeCustomer &&
                                          order.shippingChargeCustomer !== 0
                                            ? "green"
                                            : "#ff8084",
                                        fontSize: 10,
                                        marginTop: 10,
                                      }}
                                    >
                                      {order.shippingChargeCustomer &&
                                      order.shippingChargeCustomer !== 0
                                        ? "***China to Bangladesh customs & shipping charge included."
                                        : "***China to Bangladesh customs & shipping charge will be included later."}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              marginBottom: 20,
                              justifyContent: "flex-end",
                              fontWeight: "bold",
                              marginBottom: 20,
                            }}
                          >
                            <div>
                              Total paid:
                              {paymentRequestObj && paymentRequestObj.amount}Tk
                            </div>
                          </div>
                          <div
                            style={{ display: "flex", flexDirectioin: "row" }}
                          >
                            <input
                              className="terms-condition-checkbox"
                              style={{ marginLeft: 10 }}
                              type="checkbox"
                              name="termsAndCondition"
                              checked={this.state.termsAndCondition}
                              onChange={(e) =>
                                this.setState({
                                  termsAndCondition:
                                    !this.state.termsAndCondition,
                                })
                              }
                            ></input>
                            <div className="agree-terms-condition">
                              I checked and paying the invoices.
                              <span
                                style={{ color: "#ff8084", cursor: "pointer" }}
                              >
                                &nbsp; For any kind of fault
                              </span>
                              &nbsp;
                              <span
                                style={{ color: "#ff8084", cursor: "pointer" }}
                              >
                                I will be responsible.
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "flex-end",
                            }}
                          >
                            {this.state.termsAndCondition && (
                              <div className="procced-to-checkout">
                                <button
                                  onClick={() => {
                                    this.handleSubmit();
                                  }}
                                  className="mt-3 btn btn-secondary "
                                  data-dismiss="modal"
                                  data-toggle="modal"
                                  data-target="#request_payment_popup"
                                  style={{ minWidth: 120, minHeight: 40 }}
                                >
                                  {!this.state.loader && <>Approve Payment</>}
                                  <CircleLoader
                                    loading={this.state.loader}
                                    color="white"
                                    size={15}
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </>
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
