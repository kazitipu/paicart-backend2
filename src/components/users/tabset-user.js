import React, { Component, Fragment } from "react";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";

import { connect } from "react-redux";

export class Tabset_user extends Component {
  toDateTime = (secs) => {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);

    return t.toLocaleDateString("en-US");
  };

  getPaymentMethod = (recharge) => {
    if (recharge.paymentMethod === "Cash") {
      return "Cash";
    }
    if (recharge.paymentMethod === "Bank") {
      return recharge.bankName;
    }
    if (recharge.paymentMethod === "Mobile Banking") {
      return recharge.mobileBanking;
    }
  };
  getColor = (booking) => {
    if (booking.status === "Delivered") {
      return "darkgreen";
    }
    if (booking.status === "Pending") {
      return "orange";
    }
    if (booking.status === "Paicart warehouse") {
      return "green";
    }
    if (booking.status === "Received in Warehouse") {
      return "#18768f";
    }
    if (booking.status === "Rates Provided") {
      return "orange";
    }
    if (booking.status === "Reject") {
      return "red";
    }
    if (booking.status === "Bangladesh warehouse") {
      return "purple";
    }
  };
  getColor2 = (booking) => {
    if (booking.orderStatus === "Delivered") {
      return "darkgreen";
    }
    if (booking.orderStatus == "Pending" || booking.orderStatus == "pending") {
      return "orange";
    }
    if (
      booking.orderStatus === "Paicart warehouse" ||
      booking.orderStatus == "approved"
    ) {
      return "green";
    }
    if (
      booking.orderStatus === "Received in Warehouse" ||
      booking.orderStatus == "Purchased"
    ) {
      return "#18768f";
    }

    if (booking.orderStatus === "Reject") {
      return "red";
    }
    if (booking.orderStatus === "Bangladesh warehouse") {
      return "purple";
    }
  };
  render() {
    const { user, shipForMe, orders, productRequest, payments } = this.props;
    let shippingAddress = null;
    if (
      user &&
      user.addressBook &&
      user.addressBook.length > 0 &&
      user.addressBook.find((address) => address.defaultShipping)
    ) {
      shippingAddress = user.addressBook.find(
        (address) => address.defaultShipping
      );
    }
    return (
      <Fragment>
        <Tabs>
          <TabList
            className="nav nav-tabs tab-coupon"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <Tab className="nav-link">Account info</Tab>
            <Tab className="nav-link">Ship for me</Tab>
            <Tab className="nav-link">Orders</Tab>
            <Tab className="nav-link">Product Request</Tab>
            <Tab className="nav-link">Payment history</Tab>
          </TabList>
          <TabPanel>
            <form className="needs-validation user-add" noValidate="">
              <h4>Account Details</h4>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Name
                </label>
                <div
                  className="col-xl-8 col-md-7"
                  style={{ textTransform: "capitalize" }}
                >
                  {user && user.displayName}
                </div>
              </div>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Status
                </label>
                <div className="col-xl-8 col-md-7" style={{ color: "#18768f" }}>
                  {user && user.status}
                </div>
              </div>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Mobile No
                </label>
                <div className="col-xl-8 col-md-7">{user && user.mobileNo}</div>
              </div>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Email
                </label>
                <div className="col-xl-8 col-md-7">{user && user.email}</div>
              </div>
              <div className="form-group row">
                <div
                  className="col-xl-3 col-md-4"
                  style={{ alignSelf: "flex-start" }}
                >
                  <span>*</span> Address
                </div>
                {shippingAddress && (
                  <div className="col-xl-8 col-md-7">
                    <div>{shippingAddress.name}</div>
                    <div>{shippingAddress.mobileNo}</div>
                    <div>{shippingAddress.address}</div>
                    <div>
                      {shippingAddress.thana},{shippingAddress.district}
                    </div>
                    <div>{shippingAddress.division}</div>
                  </div>
                )}
              </div>
              <div className="form-group row">
                <div
                  className="col-xl-3 col-md-4"
                  style={{ alignSelf: "flex-start" }}
                >
                  <span>*</span> Company
                </div>
                <div className="col-xl-8 col-md-7">
                  {user && user.company && (
                    <>
                      <div>{user.company.name}</div>
                      <div>{user.company.mobileNo}</div>
                      <div>{user.company.businessType}</div>
                      <div>{user.company.address}</div>
                    </>
                  )}
                </div>
              </div>

              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Shipping Mark
                </label>
                <div className="col-xl-8 col-md-7" style={{ color: "#ff8084" }}>
                  ({user && user.userId}-{user ? user.displayName : "Name"})
                </div>
              </div>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Uid
                </label>
                <div className="col-xl-8 col-md-7">{user && user.uid}</div>
              </div>
              <div className="form-group row">
                <label className="col-xl-3 col-md-4">
                  <span>*</span> Created At
                </label>
                <div className="col-xl-8 col-md-7">
                  {user && this.toDateTime(user.createdAt.seconds)}
                </div>
              </div>
            </form>
          </TabPanel>
          <TabPanel>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Date</th>
                  <th scope="col">Booking Id</th>
                  <th scope="col">Method</th>
                  <th scope="col">Total</th>

                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {shipForMe.length > 0
                  ? shipForMe.map((booking, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td style={{ fontWeight: "bold" }}>{booking.date}</td>
                        <td>{booking.bookingId}</td>
                        <td>{booking.method}</td>
                        <td>{booking.shippingChargeCustomer || 0}Tk</td>

                        <td
                          style={{
                            color: this.getColor(booking),
                          }}
                        >
                          {booking.status}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </TabPanel>
          <TabPanel>
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Date</th>
                  <th scope="col">Order Id</th>

                  <th scope="col">Tracking No</th>
                  <th scope="col">Total</th>
                  <th scope="col">Order Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.length > 0
                  ? orders.map((parcel, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <th style={{ fontWeight: "bold" }}>
                          {parcel.orderedDate}
                        </th>
                        <td>{parcel.orderId}</td>

                        <td>{parcel.trackingNo}</td>
                        <td>{parcel.orderTotal}Tk</td>
                        <td style={{ color: this.getColor2(parcel) }}>
                          {parcel.orderStatus}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </TabPanel>
          <TabPanel>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Date</th>
                  <th scope="col">Booking Id</th>
                  <th scope="col">Store</th>

                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                </tr>
              </thead>
              <tbody>
                {productRequest.length > 0
                  ? productRequest.map((recharge, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td style={{ fontWeight: "bold" }}>{recharge.date}</td>
                        <td>{recharge.bookingId}</td>
                        <td>{recharge.country}</td>
                        <td>{recharge.totalRate || 0}Tk</td>

                        <td style={{ color: "orange" }}>{recharge.status}</td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </TabPanel>

          <TabPanel>
            <table class="table table-bordered">
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Date</th>
                  <th scope="col">Payment Id</th>
                  <th scope="col">Payment Method</th>

                  <th scope="col">Amount</th>
                  <th scope="col">Status</th>
                  <th scope="col">Paid Invoice</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0
                  ? payments.map((payment, index) => (
                      <tr key={index}>
                        <th scope="row">{index + 1}</th>
                        <td style={{ fontWeight: "bold" }}>{payment.date}</td>
                        <td>{payment.paymentId}</td>
                        <td>{payment.method}</td>
                        <td>{payment.amount}Tk</td>
                        <td
                          style={{
                            color:
                              payment.status == "approved"
                                ? "green"
                                : payment.status == "pending"
                                ? "orange"
                                : "red",
                            fontWeight: "bold",
                          }}
                        >
                          {payment.status}
                        </td>
                        <td>
                          {payment.pendingOrders.map(
                            (order) => `${order.orderId}, `
                          )}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
          </TabPanel>
        </Tabs>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    payments: state.users.payments,
    shipForMe: state.users.shipForMe,
    orders: state.users.orders,
    productRequest: state.users.productRequest,
  };
};
export default connect(mapStateToProps)(Tabset_user);
