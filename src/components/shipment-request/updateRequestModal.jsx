import React, { Component } from "react";
import "./updateRequestModal.css";
import { updateShipmentRequestRedux } from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  getSingleUser,
  getSingleShipForMe,
  uploadImage,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import { statusDisplay } from "../../constants/statusDisplay";
class UpdateRequestModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      perKg: "",
      note: "",
      status: "",
      trackingNo: "",
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
      cursor: -1,
      customer: "",
      customerUid: "",
      showSuggestion: false,
      displayName: "",
      subCategory: "",
      waybillImage: "",
      waybillImage_loader: false,
      packingListUrl: "",
      packingList_loader: false,
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { singleRequest } = nextProps;

    if (singleRequest) {
      console.log(singleRequest.warehouse);
      this.setState({
        perKg: (singleRequest.result && singleRequest.result.perKg) || "",
        note: singleRequest.note || "",
        displayName: singleRequest.displayName || "",
        customer: singleRequest.displayName || "",
        customerUid: singleRequest
          ? singleRequest.customerUid
            ? singleRequest.customerUid
            : singleRequest.userId
          : "",
        subCategory: singleRequest
          ? singleRequest.subCategory
            ? singleRequest.subCategory
            : singleRequest.displayName
          : "",
        status: singleRequest.status || "",
        trackingNo: singleRequest.trackingNo || "",
        warehouse: singleRequest.warehouse || "",
        shippingMark: singleRequest.shippingMark || "",
        cargoCompany: singleRequest.cargoCompany || "",
        lotNo: singleRequest.lotNo || "",
        ctnNo: singleRequest.ctnNo || "",
        receivedWeight: singleRequest.receivedWeight || "",
        cargoRate: singleRequest.cargoRate || "",
        customerRate: singleRequest.customerRate || "",
        refund: singleRequest.refund || "",
        discount: singleRequest.discount || "",
        otherCost: singleRequest.otherCost || "",
        shippingChargeCargo: singleRequest.shippingChargeCargo || "",
        shippingChargeCustomer: singleRequest.shippingChargeCustomer || "",
        refundNote: singleRequest.refundNote || "",
        abroadWarehouseAddress: singleRequest.abroadWarehouseAddress || "",
        bangladeshWarehouseAddress:
          singleRequest.bangladeshWarehouseAddress || "",
        deliveredBy: singleRequest.deliveredBy || "",
        waybillImage: singleRequest.waybillImage || "",
        packingListUrl: singleRequest.packingListUrl || "",
      });
    }
  };

  _handleWaybillChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({ waybillImage_loader: true });
      const imgUrl = await uploadImage(file);
      this.setState({ waybillImage: imgUrl, waybillImage_loader: false });
    }
  };

  _handlePackingListChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      this.setState({ packingList_loader: true });
      const fileUrl = await uploadImage(file);
      this.setState({ packingListUrl: fileUrl, packingList_loader: false });
    }
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { singleRequest } = this.props;
    console.log(this.state);
    let date = new Date();
    if (this.state.customerUid == "") {
      alert("Please select a customer first.");
      return;
    }
    let shipmentStatusScore = 1;
    if (this.state.status == "Rates Provided") {
      shipmentStatusScore = 2;
    } else if (this.state.status == "Received in Warehouse") {
      shipmentStatusScore = 3;
    } else if (this.state.status == "Ready for fly") {
      shipmentStatusScore = 4;
    } else if (this.state.status == "Bangladesh customs") {
      shipmentStatusScore = 5;
    } else if (this.state.status == "Bangladesh warehouse") {
      shipmentStatusScore = 5;
    } else if (this.state.status == "Paicart warehouse") {
      shipmentStatusScore = 6;
    } else if (this.state.status == "Delivered") {
      shipmentStatusScore = 7;
    }

    await this.props.updateShipmentRequestRedux({
      ...this.props.singleRequest,
      ...this.state,
      trackingNumbers: this.state.trackingNo
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      shippingChargeCustomer: parseInt(
        (this.state.otherCost ? parseInt(this.state.otherCost) : 0) +
          this.state.receivedWeight * this.state.customerRate -
          this.state.refund -
          this.state.discount
      ),
      [`${this.state.status}Date`]: this.props.singleRequest[
        `${this.state.status}Date`
      ]
        ? this.props.singleRequest[`${this.state.status}Date`]
        : date.toLocaleDateString("en-GB"),
      [`${this.state.status}Time`]: this.props.singleRequest[
        `${this.state.status}Time`
      ]
        ? this.props.singleRequest[`${this.state.status}Time`]
        : date.toLocaleTimeString("en-GB"),
      result: {
        perKg: this.state.perKg,
        result: parseFloat(this.state.perKg) * parseFloat(singleRequest.weight),
      },
      status: this.state.status || singleRequest.status,
      shipmentStatusScore,
      userId: this.state.customerUid,
      displayName: this.state.subCategory,
    });
    toast.success("successfully updated Shipment Reqeust");
    const newRequest = await getSingleShipForMe(singleRequest.bookingId);
    const msg = this.createNotification(singleRequest, newRequest);
    console.log(msg);
    const user = await getSingleUser(singleRequest.userId);
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

    this.setState({
      perKg: "",
      note: "",
      status: "",
      trackingNo: "",
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
      cursor: -1,
      customer: "",
      customerUid: "",
      showSuggestion: false,
      waybillImage: "",
      waybillImage_loader: false,
      packingListUrl: "",
      packingList_loader: false,
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
        body: `Now You can track your shipment. orderId:-${order.bookingId} with Tracking no:-${order.trackingNo}.`,
      };
      return msg;
    }
    if (!prevOrder.warehouse && order.warehouse) {
      msg = {
        title: "Rate is provided",
        body: `Total Shipment cost is-${order.result.result}Tk. Send your orderId:-${order.bookingId} to our warehouse:-${order.warehouse}.`,
      };
      return msg;
    }

    msg = {
      title: "Order Status",
      body: `Your orderId:-${order.bookingId} is ${statusDisplay(order.status)}.`,
    };
    return msg;
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleChangeCustomer = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, showSuggestion: true, cursor: -1 });
  };

  handleKeyDown = (e) => {
    const { cursor } = this.state;
    let result = [];
    if (this.state.customer) {
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      result = [...suggestionById, ...suggestionByName].slice(0, 10);

      // arrow up/down button should select next/previous list element
      if (e.keyCode === 38 && cursor > -1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor - 1,
        }));
      } else if (e.keyCode === 40 && cursor < result.length - 1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor + 1,
        }));
      } else if (e.keyCode === 13 && cursor > -1) {
        this.setState({
          customer: result[cursor].userId,
          customerUid: result[cursor].uid,
          displayName: result[cursor].displayName,
          subCategory: `${result[cursor].userId}-${result[cursor].displayName}`,
          showSuggestion: false,
        });
      }
    } else {
      result = [];
    }
  };

  renderShowSuggestion = () => {
    let suggestionArray = [];
    console.log(this.state.customer);
    if (this.state.customer) {
      console.log(this.state.customer);
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      suggestionArray = [...suggestionById, ...suggestionByName];
      const uniqueUser = [...new Set(suggestionArray)];
      console.log(suggestionArray);
      return uniqueUser.slice(0, 10).map((user, index) => (
        <li
          key={user.userId}
          style={{
            minWidth: "195px",
            backgroundColor: this.state.cursor == index ? "gainsboro" : "white",
          }}
          onClick={() =>
            this.setState({
              customer: user.userId,
              customerUid: user.uid,
              displayName: user.displayName,
              showSuggestion: false,
              subCategory: `${user.userId}-${user.displayName}`,
            })
          }
        >
          {user.userId}-{user.displayName ? user.displayName.slice(0, 13) : ""}
        </li>
      ));
    }
  };

  /* Shared by the corner X and the Cancel button: reset the form, close. */
  closeModal = () => {
    this.setState({
      unitPrice: "",

      note: "",
      localShipping: "",
      status: "",
      orderId: "",
      trackingNo: "",
      warehouse: "",
    });
    this.props.startToggleModal(null);
  };

  render() {
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
                maxHeight: 700,
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
                            Booking Id:{" "}
                            {this.props.singleRequest &&
                              this.props.singleRequest.bookingId}
                          </h2>
                          <form
                            onSubmit={(e) => {
                              this.handleSubmit(e);
                            }}
                            className="rounded-field mt-2"
                          >
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  SELECT CUSTOMER
                                </label>
                                <input
                                  title="Please choose a package"
                                  style={{ padding: 18 }}
                                  type="text"
                                  name="customer"
                                  className="form-control"
                                  placeholder="Enter customer Id"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChangeCustomer}
                                  value={this.state.customer}
                                  required
                                  autoComplete="off"
                                  onKeyDown={this.handleKeyDown}
                                />
                                {this.state.customer && (
                                  <ul
                                    className="below-searchbar-recommendation"
                                    style={{
                                      display: this.state.showSuggestion
                                        ? "flex"
                                        : "none",
                                    }}
                                  >
                                    {this.renderShowSuggestion()}
                                  </ul>
                                )}
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
                                  Per Kg
                                </label>

                                <input
                                  type="text"
                                  name="perKg"
                                  className="form-control"
                                  placeholder="Enter Rate/Kg"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.perKg}
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
                                  Tracking No
                                </label>

                                <input
                                  type="text"
                                  name="trackingNo"
                                  className="form-control"
                                  placeholder="tracking No"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.trackingNo}
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
                                  Change Status
                                </label>

                                <select
                                  title=""
                                  name="status"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  style={{ fontSize: ".8rem" }}
                                  value={this.state.status}
                                  required
                                >
                                  <option value="">Change Status</option>
                                  <option value="Rates Provided">
                                    Rates Provided
                                  </option>
                                  <option value="Received in Warehouse">
                                    Received in Warehouse
                                  </option>
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
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Select Warehouse
                                </label>

                                <select
                                  title=""
                                  style={{ fontSize: ".8rem" }}
                                  name="warehouse"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  value={this.state.warehouse}
                                >
                                  <option value="">Select Warehouse</option>
                                  {this.props.warehouses.map((warehouse) => (
                                    <option
                                      value={`${warehouse.country}-${warehouse.address}`}
                                    >
                                      {warehouse.companyName}-
                                      {warehouse.country}-{warehouse.address}
                                    </option>
                                  ))}
                                </select>
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
                                  Note{" "}
                                </label>
                                <textarea
                                  type="text"
                                  name="note"
                                  className="form-control"
                                  placeholder="Enter Additional Note"
                                  style={{ fontSize: ".8rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.note}
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
                                  Waybill Picture
                                </label>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={this._handleWaybillChange}
                                  />
                                  {this.state.waybillImage_loader && (
                                    <span
                                      style={{ color: "white", marginLeft: 8 }}
                                    >
                                      Uploading…
                                    </span>
                                  )}
                                  {this.state.waybillImage && (
                                    <img
                                      src={this.state.waybillImage}
                                      alt="waybill"
                                      style={{
                                        width: 40,
                                        height: 40,
                                        objectFit: "cover",
                                        borderRadius: 4,
                                        marginLeft: 8,
                                      }}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    marginBottom: 0,
                                    fontSize: 13,
                                  }}
                                >
                                  Packing List (PDF/Image/Word)
                                </label>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    type="file"
                                    accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    onChange={this._handlePackingListChange}
                                  />
                                  {this.state.packingList_loader && (
                                    <span
                                      style={{ color: "white", marginLeft: 8 }}
                                    >
                                      Uploading…
                                    </span>
                                  )}
                                  {this.state.packingListUrl && (
                                    <a
                                      href={this.state.packingListUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{ color: "white", marginLeft: 8 }}
                                    >
                                      View file
                                    </a>
                                  )}
                                </div>
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
                                  Customer rate
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
                                  type="submit"
                                  style={{ display: "none" }}
                                  disabled
                                  className="btn btn-secondary"
                                >
                                  Update
                                  <i className="icofont-rounded-right"></i>
                                </button>
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
    warehouses: state.warehouses.warehouses,
    allUsers: state.users.users,
  };
};
export default connect(mapStateToProps, { updateShipmentRequestRedux })(
  UpdateRequestModal
);
