import React, { Component, Fragment } from "react";
import { getSingleOrderApiRedux } from "../../actions/index";
import { connect } from "react-redux";
import "./invoice-by-order.css";
import Alg from "./alg.png";
import Paid from "./paid.png";
import { withRouter } from "react-router-dom";
import { getSingleUser } from "../../firebase/firebase.utils";

export class OnlyInvoieToPrint extends Component {
  state = {
    user: null,
    orderObj: null,
  };
  componentDidMount = async () => {
    await this.props.getSingleOrderApiRedux(this.props.match.params.bookingId);
  };

  componentWillReceiveProps = async (nextProps) => {
    if (nextProps.orderObj && nextProps.orderObj.userId) {
      const user = await getSingleUser(nextProps.orderObj.userId);
      this.setState({
        user: user,
      });
    }
  };

  componentWillUnmount = () => {};

  render() {
    const { orderObj, admin, currency } = this.props;
    const { user } = this.state;
    console.log(currency);
    let total;
    if (orderObj) {
      total = parseInt(orderObj.customerRate * orderObj.receivedWeight);
    }

    console.log(user);
    let addressBook = null;
    if (user && user.addressBook && user.addressBook.length > 0) {
      addressBook = user.addressBook.find((address) => address.defaultShipping);
    }
    let totalShippingCharge = 0;
    if (orderObj && orderObj.receivedWeight && orderObj.customerRate) {
      totalShippingCharge = parseInt(
        orderObj.receivedWeight * orderObj.customerRate
      );
    }

    let totalPayableAmount = 0;
    if (orderObj) {
      totalPayableAmount =
        parseInt(orderObj.orderTotal) +
        parseInt(orderObj.otherCost) -
        orderObj.discount -
        (orderObj.refund ? orderObj.refund : 0);
    }
    let totalPaid = 0;
    if (orderObj && orderObj.payments && orderObj.payments.length > 0) {
      orderObj.payments.map((payment) => {
        totalPaid += parseInt(payment.amount);
      });
    }
    if (!totalPayableAmount) {
      totalPayableAmount = 0;
    }
    let totalPayableAmountIncludingShipping = 0;
    if (orderObj) {
      totalPayableAmountIncludingShipping =
        parseInt(totalPayableAmount) +
        parseInt(orderObj.shippingChargeCustomer) +
        parseInt(orderObj.localShipping);
    }
    return (
      <>
        <div
          id="container"
          style={{
            maxWidth: "1000px",
            borderRadius: ".2rem",
            border: "1px solid gainsboro",
          }}
        >
          <section id="memo" style={{ height: "auto" }}>
            <div className="logo">
              <img src={Alg} style={{ height: "auto", width: "200px" }} />
            </div>
            <div style={{ marginLeft: 5 }} className="company-info">
              <span>
                Suit#2F, (2nd floor) Tropical Razia Shopping Complex &nbsp;
              </span>{" "}
              <br />
              <span>26/10 Chamelibagh, Santinagar, Dhaka 1217</span>
              <br />
              <span>Hotline: 01979653009</span>
              <br />
              <span>
                {" "}
                <span>info@paicart.com</span>
              </span>
            </div>
          </section>

          <section id="invoice-title-number">
            <span id="title" style={{ backgroundColor: "#18768f" }}>
              INVOICE
            </span>
            <span id="number" style={{ fontSize: "200%" }}>
              #PC-{this.props.match.params.bookingId}
            </span>
          </section>

          <div className="clearfix" />

          <section id="client-info">
            <span>TO:</span>
            <div>
              <span className="bold">
                {(user && user.displayName) ||
                  (addressBook && addressBook.name) ||
                  ""}
              </span>
            </div>

            <div>
              <span>{(addressBook && addressBook.address) || ""}</span>
            </div>

            {addressBook && addressBook.thana && (
              <div>
                <span>
                  {(addressBook && addressBook.thana) || ""},
                  {(addressBook && addressBook.district) || ""},
                  {(addressBook && addressBook.division) || ""}
                </span>
              </div>
            )}
            <div>
              <span>Mobile: {addressBook && addressBook.mobileNo}</span>
            </div>

            <div>
              <span>{user && user.email}</span>
            </div>
          </section>
          <section id="client-info-2">
            <div className="bold">
              Submitted on:{" "}
              <span style={{ fontWeight: "lighter" }}>
                {orderObj && orderObj.orderedDate}{" "}
              </span>
            </div>
            <div className="bold">
              Invoice no:{" "}
              <span style={{ fontWeight: "lighter" }}>
                #PC-{this.props.match.params.bookingId}{" "}
              </span>
            </div>
            <div className="bold">
              Order ID:{" "}
              <span style={{ fontWeight: "lighter" }}>
                {this.props.match.params.bookingId}
              </span>
            </div>
            <div className="bold">
              Shipping Mark:{" "}
              <span style={{ fontWeight: "lighter" }}>
                {orderObj && orderObj.shippingMark}
              </span>
            </div>
            <div className="bold">
              Carton No:{" "}
              <span style={{ fontWeight: "lighter" }}>
                {orderObj &&
                  orderObj.ctnNo &&
                  orderObj.ctnNo.toString().replace("CB", "AR")}{" "}
              </span>
            </div>
            <div className="bold">
              Tracking no:{" "}
              <span style={{ fontWeight: "lighter" }}>
                {orderObj && orderObj.trackingNo}
              </span>
            </div>
          </section>

          <div className="clearfix" />

          <section id="items" style={{ paddingTop: 0, marginTop: 10 }}>
            <table cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <th>#</th>
                  <th style={{ maxWidth: "50px" }}>Product Title</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>

                  <th>Total</th>
                </tr>
                {orderObj &&
                  orderObj.items &&
                  orderObj.items.map((item) =>
                    item.skus.map((sku, index) => (
                      <tr data-iterate="item">
                        <td>{index + 1}</td>
                        <td style={{ maxWidth: "50px" }}>
                          {item.name.slice(0, 20)}
                          ...
                        </td>
                        <td>{sku.totalQuantity}pc</td>
                        <td>
                          {parseInt(sku.price)}
                          Tk
                        </td>

                        <td>
                          {parseInt(parseFloat(sku.price) * sku.totalQuantity)}
                          Tk
                        </td>
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
            <div style={{ float: "left", marginTop: 10, marginLeft: 5 }}>
              <div>
                {" "}
                <span style={{ fontWeight: "bold" }}>Total Weight:</span>{" "}
                {orderObj && orderObj.receivedWeight}Kg
              </div>
              <div style={{ marginTop: 5 }}>
                {" "}
                <span style={{ fontWeight: "bold" }}>Shipment Method:</span>{" "}
                {orderObj &&
                  (orderObj.shipmentMethod === "Sea" ? "By Sea" : "By Air")}
              </div>
              <div style={{ marginTop: 5 }}>
                {" "}
                <span style={{ fontWeight: "bold" }}>
                  Customs & Shipping Rate:
                </span>{" "}
                {orderObj && orderObj.customerRate}
                Tk/Kg
              </div>
              <div style={{ marginTop: 5 }}>
                {" "}
                <span style={{ fontWeight: "bold" }}>
                  Total Shipping charge:
                </span>{" "}
                {orderObj && orderObj.shippingChargeCustomer}
                Tk
              </div>
            </div>
          </section>

          {orderObj && orderObj.payments && orderObj.payments.length > 0 && (
            <div style={{ maxWidth: "35%", position: "relative" }}>
              <div style={{ position: "absolute", top: 100, left: 35 }}>
                <div
                  style={{
                    paddingLeft: 0,
                    color: "#18768f",
                    fontWeight: "bold",
                  }}
                >
                  Previous Payments
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead style={{ color: "black" }}>
                    <tr>
                      <td style={{ fontWeight: "bold", color: "black" }}>
                        Date
                      </td>
                      <td style={{ fontWeight: "bold", color: "black" }}>
                        Method
                      </td>
                      <td style={{ fontWeight: "bold", color: "black" }}>
                        Amount
                      </td>
                    </tr>
                  </thead>
                  <tbody>
                    {orderObj.payments.map((payment) => (
                      <tr>
                        <td>{payment.date}</td>
                        <td>{payment.method}</td>
                        <td>{payment.amount}Tk</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <section id="sums" style={{ marginTop: 0, paddingTop: 0 }}>
            <table cellPadding="0" cellSpacing="0">
              <tbody>
                <tr>
                  <th>Subtotal</th>
                  <td>
                    {orderObj && parseInt(orderObj.actualTotal)}
                    Tk
                  </td>
                </tr>

                <tr data-iterate="tax">
                  <th>Repackaging Charge</th>
                  <td>
                    +{orderObj && orderObj.otherCost ? orderObj.otherCost : 0}
                    Tk
                  </td>
                </tr>

                {orderObj && orderObj.otherCharges ? (
                  <tr data-hide-on-quote="true">
                    <th>Other Charges</th>
                    <td>+{orderObj.otherCharge}Tk</td>
                  </tr>
                ) : null}
                {orderObj && orderObj.refund ? (
                  <tr data-hide-on-quote="true">
                    <th>Refund Amount</th>
                    <td>-{orderObj.refund}Tk</td>
                  </tr>
                ) : null}

                <tr data-hide-on-quote="true">
                  <th>Discount</th>
                  <td>
                    -{orderObj && orderObj.discount ? orderObj.discount : 0}
                    Tk
                  </td>
                </tr>
                {orderObj && orderObj.couponAmount && (
                  <tr data-hide-on-quote="true">
                    <th>Coupon</th>
                    <td>
                      -{orderObj.couponAmount}
                      Tk
                    </td>
                  </tr>
                )}
                {orderObj && orderObj.offer && (
                  <tr data-hide-on-quote="true">
                    <th>Discount on payment</th>
                    <td>
                      -
                      {parseInt(orderObj.actualTotal) -
                        parseInt(
                          orderObj.couponAmount ? orderObj.couponAmount : 0
                        ) -
                        parseInt(orderObj.orderTotal)}
                      Tk
                    </td>
                  </tr>
                )}
                <tr data-hide-on-quote="true">
                  <th>
                    Total{" "}
                    <span style={{ fontSize: 10 }}>
                      (without shipping charge)
                    </span>
                  </th>
                  <td>
                    {totalPayableAmount}
                    Tk
                  </td>
                </tr>
                <tr data-iterate="tax">
                  <th>Local Shipping (CN)</th>
                  <td>
                    +
                    {orderObj && orderObj.localShipping
                      ? orderObj.localShipping
                      : 0}
                    Tk
                  </td>
                </tr>
                <tr data-iterate="tax">
                  <th>Shipping Charge (CN to BD)</th>
                  <td>
                    +
                    {orderObj && orderObj.shippingChargeCustomer
                      ? orderObj.shippingChargeCustomer
                      : 0}
                    Tk
                  </td>
                </tr>
                <tr data-hide-on-quote="true">
                  <th>
                    Total{" "}
                    <span style={{ fontSize: 10 }}>
                      (including shipping charge)
                    </span>
                  </th>
                  <td>
                    {totalPayableAmountIncludingShipping}
                    Tk
                  </td>
                </tr>
                <tr data-hide-on-quote="true">
                  <th>Total Paid</th>
                  <td>
                    {totalPaid}
                    Tk
                  </td>
                </tr>

                <tr data-hide-on-quote="true">
                  <th>
                    TOTAL Bill Due{" "}
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "none",
                        fontWeight: "lighter",
                      }}
                    ></span>{" "}
                  </th>
                  <td>
                    {totalPayableAmountIncludingShipping - totalPaid}
                    Tk
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="clearfix" />
          </section>

          <div className="clearfix" />

          <section id="invoice-info">
            <div>
              <span style={{ color: "#464242" }}>Delivered By</span>
            </div>
            <div>
              <span>Anwar</span>
            </div>
          </section>

          <section id="terms">
            <div className="notes">
              <span style={{ fontWeight: "bold", color: "darkorange" }}>
                {(user && user.displayName) ||
                  (addressBook && addressBook.name) ||
                  ""}
              </span>
              , thank you very much.We really appreciate your buisness. <br />
              Stay with us.
            </div>
            {orderObj && orderObj.chineseNote ? (
              <div style={{ marginTop: "2rem", color: "gray" }}>
                {orderObj && orderObj.chineseNote}
              </div>
            ) : null}

            <br />

            <div className="payment-info">
              <div>Delivery Address</div>
              <span style={{ color: "gray" }}>Paicart Office</span>
            </div>
          </section>

          <div className="clearfix" />
          <div style={{ bottom: 15, position: "absolute", left: "25%" }}>
            ******Freight,approx customs duty and 5% service charge included.{" "}
          </div>
          <div className="thank-you" style={{ backgroundColor: "#18768f" }}>
            THANKS!
          </div>

          <div className="clearfix" />
        </div>
        {orderObj && orderObj.invoiceStatus === "Paid" ? (
          <div>
            <img
              style={{
                position: "absolute",
                height: "220px",
                width: "220px",
                top: "50%",
                left: "25%",
              }}
              src={Paid}
            />
          </div>
        ) : null}
      </>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    orderObj: state.orders.orderObj,
    users: [],
    admin: null,
    user: null,
    currency: state.users.currency,
  };
};
export default withRouter(
  connect(mapStateToProps, {
    getSingleOrderApiRedux,
  })(OnlyInvoieToPrint)
);
