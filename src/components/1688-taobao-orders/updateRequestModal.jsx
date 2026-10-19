import React, { Component } from "react";
import "./updateRequestModal.css";
import {
  updateOrderApiRedux,
  uploadTransactionRedux,
} from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  getSingleOrderApi,
  getSingleUser,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import { statusDisplay } from "../../constants/statusDisplay";
class UpdateRequestModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      orderTotal: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
      purchaseLink: "",
      purchasingSupplier: "",
      purchasingSupplierPayment: "",
      purchasingSupplierQr: "",
      purchasingRmb: "",
      exchangeRate: "",
      warehouse: "",
      shippingMark: "",
      cargoCompany: "",
      lotNo: "",
      ctnNo: "",
      receivedWeight: 0,
      cargoRate: "",
      customerRate: 0,
      refund: 0,
      discount: 0,
      otherCost: 0,
      shippingChargeCargo: "",
      shippingChargeCustomer: "",
      refundNote: "",
      abroadWarehouseAddress: "",
      bangladeshWarehouseAddress: "",
      deliveredBy: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { order } = nextProps;
    if (order) {
      this.setState({
        orderTotal: order.orderTotal || "",
        note: order.note || "",
        localShipping: order.localShipping || "",
        orderStatus: order.orderStatus || "",
        orderNumber: order.orderNumber || "",
        trackingNo: order.trackingNo || "",
        purchaseLink: order.purchaseLink || "",
        purchasingSupplier: order.purchasingSupplier || "",
        purchasingSupplierPayment: order.purchasingSupplierPayment || "",
        purchasingSupplierQr: order.purchasingSupplierQr || "",
        purchasingRmb: order.purchasingRmb || "",
        exchangeRate: order.exchangeRate || "",
        warehouse: order.warehouse || "",
        shippingMark: order.shippingMark || "",
        cargoCompany: order.cargoCompany || "",
        lotNo: order.lotNo || "",
        ctnNo: order.ctnNo || "",
        receivedWeight: order.receivedWeight || 0,
        cargoRate: order.cargoRate || "",
        customerRate: order.customerRate || 0,
        refund: order.refund || 0,
        discount: order.discount || 0,
        otherCost: order.otherCost || 0,
        shippingChargeCargo: order.shippingChargeCargo || "",
        shippingChargeCustomer: order.shippingChargeCustomer || "",
        refundNote: order.refundNote || "",
        abroadWarehouseAddress: order.abroadWarehouseAddress || "",
        bangladeshWarehouseAddress: order.bangladeshWarehouseAddress || "",
        deliveredBy: order.deliveredBy || "",
      });
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { order, ordersApi } = this.props;
    if (!order.purchasingRmb && this.state.purchasingRmb == "") {
      alert("You must enter purchasing rmb");
      return;
    }
    console.log(order);
    let date = new Date();
    let shipmentStatusScore = 1;
    if (this.state.orderStatus == "Purchased") {
      shipmentStatusScore = 2;
    } else if (this.state.orderStatus == "Received in Warehouse") {
      shipmentStatusScore = 3;
    } else if (this.state.orderStatus == "Ready for fly") {
      shipmentStatusScore = 4;
    } else if (this.state.orderStatus == "Bangladesh customs") {
      shipmentStatusScore = 5;
    } else if (this.state.orderStatus == "Bangladesh warehouse") {
      shipmentStatusScore = 5;
    } else if (this.state.orderStatus == "Paicart warehouse") {
      shipmentStatusScore = 6;
    } else if (this.state.orderStatus == "Delivered") {
      shipmentStatusScore = 7;
    }
    await this.props.updateOrderApiRedux({
      ...order,
      ...this.state,
      // Keep actualTotal (the customer-facing "Product Subtotal" reference)
      // in sync whenever an admin manually corrects the order total here —
      // otherwise the customer panel keeps showing the old price forever,
      // since getGoodsTotal() in the storefront prefers actualTotal.
      actualTotal: this.state.orderTotal,
      shippingChargeCustomer:
        this.state.receivedWeight * this.state.customerRate,
      orderStatus: this.state.orderStatus || order.orderStatus,
      [`${this.state.orderStatus}Date`]: order[`${this.state.orderStatus}Date`]
        ? order[`${this.state.orderStatus}Date`]
        : date.toLocaleDateString("en-GB"),
      [`${this.state.orderStatus}Time`]: order[`${this.state.orderStatus}Time`]
        ? order[`${this.state.orderStatus}Time`]
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore,
    });

    console.log(order);
    const newOrder = await getSingleOrderApi(order.orderId);
    console.log(order, newOrder);
    const msg = this.createNotification(order, newOrder);
    console.log(msg);
    const user = await getSingleUser(order.userId);
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

    toast.success("successfully updated Order");
    this.setState({
      orderTotal: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
      purchaseLink: "",
      purchasingSupplier: "",
      purchasingSupplierPayment: "",
      purchasingSupplierQr: "",
      purchasingRmb: "",
      exchangeRate: "",
      warehouse: "",
      shippingMark: "",
      cargoCompany: "",
      lotNo: "",
      ctnNo: "",
      receivedWeight: 0,
      cargoRate: "",
      customerRate: 0,
      refund: 0,
      discount: 0,
      otherCost: 0,
      shippingChargeCargo: "",
      shippingChargeCustomer: "",
      refundNote: "",
      abroadWarehouseAddress: "",
      bangladeshWarehouseAddress: "",
      deliveredBy: "",
    });
    this.props.startToggleModal(null);
  };

  createNotification = (prevOrder, order) => {
    let msg;
    console.log(prevOrder);
    console.log(order);

    if (!prevOrder.trackingNo && order.trackingNo) {
      msg = {
        title: "Track your order",
        body: `Now You can track orderId:-${order.orderId} with Tracking no:-${order.trackingNo}.`,
      };
      return msg;
    }
    if (!prevOrder.orderNumber && order.orderNumber) {
      msg = {
        title: "Ordered",
        body: `Your orderId:-${order.orderId} has been ordered to the supplier.`,
      };
      return msg;
    }
    if (!prevOrder.localShipping && order.localShipping) {
      msg = {
        title: `orderId:-${order.orderId}`,
        body: `Local shipping charge for this order is ${order.localShipping} Tk.`,
      };
      return msg;
    }
    msg = {
      title: "Order Status",
      body: `Your orderId:-${order.orderId} is ${statusDisplay(order.orderStatus)}.`,
    };
    return msg;
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  /* Shared by the corner X and the Cancel button: reset the form, close. */
  closeModal = () => {
    this.setState({
      orderTotal: "",
      note: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
    });
    this.props.startToggleModal(null);
  };

  render() {
    const { order, currency } = this.props;

    let totalRmbAmount = 0;
    if (order) {
      order.items.map((item) => {
        item.skus.map((sku) => {
          totalRmbAmount += parseFloat(
            (sku.price * sku.totalQuantity) /
              (order.currency ? order.currency : currency.taka)
          );

          console.log(
            parseFloat(
              (sku.price * sku.totalQuantity) /
                (order.currency ? order.currency : currency.taka)
            )
          );
        });
      });
    }

    return (
      <>
        <div
          className={
            this.props.toggleModal
              ? "modal fade show"
              : "modal fade show visible-modal"
          }
          id="request_popup"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div
            className="modal-dialog modal-dialog-centered request_popup"
            role="document"
          >
            <div
              className="modal-content visible-modal-content-3"
              style={{
                backgroundColor: "rgb(68 0 97)",
                maxHeight: "700px",
                overflowY: "scroll",
              }}
            >
              <div className="modal-body p-0">
                <section className="pos-rel bg-light-gray">
                  <div className="container-fluid p-3">
                    <a
                      onClick={this.closeModal}
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <i
                        className="icofont-close-line"
                        style={{ color: "#334155", fontSize: 22, cursor: "pointer" }}
                      ></i>
                    </a>
                    <div className="d-lg-flex justify-content-end no-gutters mb-spacer-md">
                      {/* <div className="col bg-fixed bg-img-7 request_pag_img">
                        &nbsp;
                      </div> */}

                      <div className="col">
                        <div className="px-3 m-5">
                          <h2
                            className="h2-xl mb-3 fw-6 pb-2"
                            style={{
                              color: "white",
                              textTransform: "none",
                              fontSize: "200%",
                              borderBottom: "2px dotted white",
                            }}
                          >
                            Order Id: {order && order.orderId}
                          </h2>
                          <div
                            className="row"
                            style={{
                              color: "white",
                              fontWeight: "bold",
                              paddingLeft: 10,
                            }}
                          >
                            Total Order: {parseFloat(totalRmbAmount).toFixed(2)}{" "}
                            Rmb
                          </div>
                          <form
                            onSubmit={this.handleSubmit}
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Order Total (in tk)
                                </label>

                                <input
                                  type="text"
                                  name="orderTotal"
                                  className="form-control"
                                  placeholder="Enter Total Price"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.orderTotal}
                                  required
                                />
                              </div>

                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Local Courier Charge (in tk)
                                </label>

                                <input
                                  type="text"
                                  name="localShipping"
                                  className="form-control"
                                  placeholder="Enter Local shipping charge in china"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.localShipping}
                                  required
                                />
                              </div>
                            </div>

                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Change Status
                                </label>

                                <select
                                  title=""
                                  name="orderStatus"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  value={this.state.orderStatus}
                                  style={{ fontSize: ".8rem" }}
                                >
                                  <option value="">Change Status</option>

                                  <option value="Purchased">Purchased</option>
                                  <option value="Ready for fly">
                                    Ready for fly
                                  </option>
                                  <option value="Bangladesh customs">
                                    Bangladesh customs
                                  </option>
                                  <option value="Bangladesh warehouse">
                                    Custom released
                                  </option>
                                  <option value="Paicart warehouse">
                                    Paicart warehouse
                                  </option>
                                  <option value="Delivered">Delivered</option>
                                  <option value="Reject">Reject</option>
                                </select>
                              </div>
                            </div>

                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Order Number (china website)
                                </label>

                                <input
                                  type="text"
                                  name="orderNumber"
                                  className="form-control"
                                  placeholder="Enter 1688/taobao/aliexpress order Number"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.orderNumber}
                                />
                              </div>

                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Tracking No (china website)
                                </label>

                                <input
                                  type="text"
                                  name="trackingNo"
                                  className="form-control"
                                  placeholder="Enter 1688/taobao/aliexpress tracking No"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.trackingNo}
                                />
                              </div>
                            </div>

                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Purchase link (china website)
                                </label>

                                <input
                                  type="text"
                                  name="purchaseLink"
                                  className="form-control"
                                  placeholder="Enter Product purchase link"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.purchaseLink}
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Purchasing RMB (china website)
                                </label>

                                <input
                                  type="number"
                                  name="purchasingRmb"
                                  className="form-control"
                                  placeholder="Enter Product purchasing RMB"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.purchasingRmb}
                                  required
                                />
                              </div>
                            </div>
                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Purchasing supplier Info
                                </label>
                                <input
                                  type="text"
                                  name="purchasingSupplier"
                                  className="form-control"
                                  placeholder="Enter Supplier information"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.purchasingSupplier}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Purchasing supplier Payment method
                                </label>

                                <input
                                  type="text"
                                  name="purchasingSupplierPayment"
                                  className="form-control"
                                  placeholder="Enter purchasing supplier payment method"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.purchasingSupplierPayment}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Purchasing supplier (QR code)
                                </label>

                                <input
                                  type="text"
                                  name="purchasingSupplierQr"
                                  className="form-control"
                                  placeholder="Enter purchasing supplier qr"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.purchasingSupplierQr}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-4">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Today exchage rate
                                </label>

                                <input
                                  type="text"
                                  name="exchangeRate"
                                  className="form-control"
                                  placeholder="Enter Exchange Rate"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.exchangeRate}
                                />
                              </div>
                            </div>

                            <div
                              className="form-row"
                              style={{
                                color: "white",
                                marginTop: 10,
                                marginBottom: 10,
                                borderBottom: "1px solid white",
                              }}
                            >
                              Shipping Information
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Shipping Mark
                                </label>

                                <input
                                  type="text"
                                  name="shippingMark"
                                  className="form-control"
                                  placeholder="Shipping Mark"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.shippingMark}
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Cargo company
                                </label>

                                <input
                                  type="text"
                                  name="cargoCompany"
                                  className="form-control"
                                  placeholder="Cargo company"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.cargoCompany}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Lot Number
                                </label>

                                <input
                                  type="text"
                                  name="lotNo"
                                  className="form-control"
                                  placeholder="Lot Number"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.lotNo}
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Carton Number
                                </label>

                                <input
                                  type="text"
                                  name="ctnNo"
                                  className="form-control"
                                  placeholder="Carton Number"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.ctnNo}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Received weight
                                </label>

                                <input
                                  type="number"
                                  name="receivedWeight"
                                  className="form-control"
                                  placeholder="Received weight"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.receivedWeight}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Cargo rate
                                </label>

                                <input
                                  type="text"
                                  name="cargoRate"
                                  className="form-control"
                                  placeholder="Cargo Rate"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.cargoRate}
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Customs & Shipping rate
                                </label>

                                <input
                                  type="number"
                                  name="customerRate"
                                  className="form-control"
                                  placeholder="Customer rate"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.customerRate}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Refund amount
                                </label>

                                <input
                                  type="number"
                                  name="refund"
                                  className="form-control"
                                  placeholder="Refund amount"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.refund}
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Discount
                                </label>

                                <input
                                  type="number"
                                  name="discount"
                                  className="form-control"
                                  placeholder="Discount"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.discount}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Packaging & other cost
                                </label>

                                <input
                                  type="number"
                                  name="otherCost"
                                  className="form-control"
                                  placeholder="Packaging & other cost"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.otherCost}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Total shipping charge (cargo company)
                                </label>

                                <input
                                  type="text"
                                  name="shippingChargeCargo"
                                  className="form-control"
                                  placeholder="Total shipping charge (cargo company)"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.shippingChargeCargo}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Total shipping charge (customer)
                                </label>

                                <input
                                  type="text"
                                  name="shippingChargeCustomer"
                                  className="form-control"
                                  placeholder="Total shipping charge (customer)"
                                  style={{ fontSize: ".8rem" }}
                                  value={parseInt(
                                    (this.state.otherCost
                                      ? parseInt(this.state.otherCost)
                                      : 0) +
                                      this.state.receivedWeight *
                                        this.state.customerRate -
                                      this.state.refund -
                                      this.state.discount
                                  )}
                                  readOnly={true}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Abroad warehouse address
                                </label>
                                <textarea
                                  type="text"
                                  name="abroadWarehouseAddress"
                                  className="form-control"
                                  placeholder="Abroad warehouse address"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.abroadWarehouseAddress}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Bangladesh warehouse address
                                </label>
                                <textarea
                                  type="text"
                                  name="bangladeshWarehouseAddress"
                                  className="form-control"
                                  placeholder="Bangladesh warehouse address"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.bangladeshWarehouseAddress}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Delivered Through (include reference)
                                </label>
                                <textarea
                                  type="text"
                                  name="deliveredBy"
                                  className="form-control"
                                  placeholder="Enter delivered by"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.deliveredBy}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Refund note
                                </label>
                                <textarea
                                  type="text"
                                  name="refundNote"
                                  className="form-control"
                                  placeholder="Enter refund note"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.refundNote}
                                />
                              </div>
                            </div>

                            <div className="form-row">
                              <div
                                className="col pt-3"
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  type="button"
                                  className="btn btn-light"
                                  onClick={this.closeModal}
                                  data-dismiss="modal"
                                  style={{
                                    marginRight: 8,
                                    border: "1px solid #cbd5e1",
                                    color: "#334155",
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="submit"
                                  className="btn btn-secondary"
                                >
                                  Update
                                  <i className="icofont-rounded-right"></i>
                                </button>
                              </div>
                            </div>
                          </form>
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
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    singleLotFromRedux: ownProps.singleLot
      ? state.lots.lots.find((lot) => lot.lotNo === ownProps.singleLot.Lot)
      : null,
    ordersApi: state.orders.ordersApi,
    currency: state.users.currency,
  };
};
export default connect(mapStateToProps, {
  updateOrderApiRedux,
  uploadTransactionRedux,
})(UpdateRequestModal);
