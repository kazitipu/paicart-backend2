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
import CartonManager from "../common/cartons/CartonManager";
import {
  trackingNumbersOf,
  legacyFieldsFromCartons,
  cargoFieldsFromCartons,
  cartonTotals,
} from "../../constants/cartons";
class UpdateRequestModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      perKg: "",
      note: "",
      status: "",
      trackingNo: "",
      trackingNumbers: [],
      cartons: [],
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
        trackingNumbers: trackingNumbersOf(singleRequest),
        cartons: singleRequest.cartons || [],
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
      trackingNumbers: this.state.trackingNumbers,
      trackingNo: this.state.trackingNumbers.join(","),
      cartons: this.state.cartons,
      ...(this.state.cartons.length
        ? legacyFieldsFromCartons(this.state.cartons)
        : {}),
      /* per-carton cargo rate / charge (ALG or typed in the carton table) */
      ...cargoFieldsFromCartons(this.state.cartons || []),
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
        /* booking estimate = rate × the customer's est. weight; older
           bookings have no weight, which used to save NaN */
        result: Number.isFinite(parseFloat(this.state.perKg) * parseFloat(singleRequest.weight))
          ? parseFloat(this.state.perKg) * parseFloat(singleRequest.weight)
          : null,
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
      trackingNumbers: [],
      cartons: [],
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
  /* Play the closing animation, then reset and close for real. */
  closeModal = () => {
    if (this.state.closing) return;
    this.setState({ closing: true });
    setTimeout(() => {
      this.setState({ closing: false });
      this.closeModalNow();
    }, 200);
  };

  closeModalNow = () => {
    this.setState({
      unitPrice: "",

      note: "",
      localShipping: "",
      status: "",
      orderId: "",
      trackingNo: "",
      trackingNumbers: [],
      cartons: [],
      warehouse: "",
    });
    this.props.startToggleModal(null);
  };

  /* Live figure shown (read-only) and saved as shippingChargeCustomer — same
     formula handleSubmit uses. */
  customerTotal = () =>
    parseInt(
      (this.state.otherCost ? parseInt(this.state.otherCost) : 0) +
        this.state.receivedWeight * this.state.customerRate -
        this.state.refund -
        this.state.discount
    );

  field = (label, name, { type = "text", placeholder, hint, span } = {}) => (
    <label className={`urm-field ${span ? "urm-span-2" : ""}`}>
      <span className="urm-label">{label}</span>
      <input
        type={type}
        name={name}
        className="urm-input"
        placeholder={placeholder || label}
        onChange={this.handleChange}
        value={this.state[name]}
        step={type === "number" ? "any" : undefined}
      />
      {hint && <span className="urm-hint">{hint}</span>}
    </label>
  );

  render() {
    if (this.props.toggleModal) return null;
    const req = this.props.singleRequest || {};
    const estWeight = parseFloat(req.weight) > 0 ? req.weight : null;
    const total = this.customerTotal();
    /* cargo charge = sum of the cartons' charges (ALG or typed in the carton
       table); older bookings without cartons fall back to the stored list */
    const cargoTotal = (this.state.cartons || []).length
      ? cartonTotals(this.state.cartons).cargoCharge
      : String(this.state.shippingChargeCargo || "")
          .split(",")
          .reduce((a, v) => a + (parseFloat(v) || 0), 0);
    const margin = cargoTotal ? (Number.isFinite(total) ? total : 0) - cargoTotal : null;
    const tk = (n) => `৳${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN")}`;

    return (
      <div className={`urm-overlay ${this.state.closing ? "is-closing" : ""}`} role="dialog" aria-modal="true">
        <form
          className="urm-modal"
          onSubmit={(e) => {
            this.handleSubmit(e);
          }}
        >
          {/* Header */}
          <div className="urm-head">
            {req.imageUrl ? (
              <img className="urm-thumb" src={req.imageUrl} alt="" />
            ) : (
              <div className="urm-thumb urm-thumb-empty">📦</div>
            )}
            <div className="urm-head-text">
              <div className="urm-kicker">Update shipment booking</div>
              <h3 className="urm-title">Booking #{req.bookingId}</h3>
              <div className="urm-chips">
                {req.othersProductName && <span className="urm-chip">{req.othersProductName}</span>}
                {req.status && <span className="urm-chip">Status: {statusDisplay(req.status)}</span>}
                {(req.shipBy || req.method) && (
                  <span className="urm-chip">{String(req.shipBy || req.method).toUpperCase()}</span>
                )}
                {req.ctnQuantity && <span className="urm-chip">{req.ctnQuantity} box</span>}
                {req.totalCbm && <span className="urm-chip">{req.totalCbm} cbm</span>}
                {estWeight && <span className="urm-chip">Est. {estWeight} kg</span>}
                {req.validTo && <span className="urm-chip">Valid to {req.validTo}</span>}
              </div>
            </div>
            <button type="button" className="urm-x" onClick={this.closeModal} aria-label="Close">
              &times;
            </button>
          </div>

          <div className="urm-body">
            {/* Customer & status */}
            <section className="urm-card">
              <div className="urm-card-title"><span className="urm-dot" />Customer &amp; Status</div>
              <div className="urm-grid">
                <label className="urm-field urm-span-2 urm-pos">
                  <span className="urm-label">Customer *</span>
                  <input
                    type="text"
                    name="customer"
                    className="urm-input"
                    placeholder="Search by customer ID or name"
                    onChange={this.handleChangeCustomer}
                    value={this.state.customer}
                    required
                    autoComplete="off"
                    onKeyDown={this.handleKeyDown}
                  />
                  {this.state.customer && (
                    <ul
                      className="urm-suggest"
                      style={{ display: this.state.showSuggestion ? "block" : "none" }}
                    >
                      {this.renderShowSuggestion()}
                    </ul>
                  )}
                </label>
                <label className="urm-field">
                  <span className="urm-label">Status *</span>
                  <select
                    name="status"
                    className="urm-input"
                    onChange={this.handleChange}
                    value={this.state.status}
                    required
                  >
                    <option value="">Change status</option>
                    <option value="Rates Provided">Rates Provided</option>
                    <option value="Received in Warehouse">Received in Warehouse</option>
                    <option value="Ready for fly">Ready for fly</option>
                    <option value="Bangladesh customs">Bangladesh customs</option>
                    <option value="Bangladesh warehouse">Custom released</option>
                    <option value="Paicart warehouse">Paicart warehouse</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Reject">Reject</option>
                  </select>
                </label>
                <label className="urm-field">
                  <span className="urm-label">Warehouse</span>
                  <select
                    name="warehouse"
                    className="urm-input"
                    onChange={this.handleChange}
                    value={this.state.warehouse}
                  >
                    <option value="">Select warehouse</option>
                    {this.props.warehouses.map((warehouse) => (
                      <option
                        key={`${warehouse.country}-${warehouse.address}`}
                        value={`${warehouse.country}-${warehouse.address}`}
                      >
                        {warehouse.companyName}-{warehouse.country}-{warehouse.address}
                      </option>
                    ))}
                  </select>
                </label>
                {this.field("Rate per kg (booking)", "perKg", { placeholder: "Enter rate/kg" })}
                <label className="urm-field urm-span-2">
                  <span className="urm-label">Note</span>
                  <textarea
                    name="note"
                    className="urm-input urm-textarea"
                    placeholder="Additional note for this booking"
                    onChange={this.handleChange}
                    value={this.state.note}
                  />
                </label>
              </div>
            </section>

            {/* Shipping information */}
            <section className="urm-card">
              <div className="urm-card-title"><span className="urm-dot" />Shipping Information</div>
              <div className="urm-grid">
                {this.field("Shipping Mark", "shippingMark")}
                {this.field("Cargo company", "cargoCompany")}
                {this.field("Lot Number", "lotNo")}
                {this.field("Carton Number", "ctnNo")}
                <div className="urm-field">
                  <span className="urm-label">Waybill Picture</span>
                  <label className="urm-upload">
                    {this.state.waybillImage ? (
                      <img src={this.state.waybillImage} alt="waybill" className="urm-upload-preview" />
                    ) : (
                      <span className="urm-upload-icon">🖼️</span>
                    )}
                    <span className="urm-upload-text">
                      {this.state.waybillImage_loader
                        ? "Uploading…"
                        : this.state.waybillImage
                        ? "Replace image"
                        : "Upload image"}
                    </span>
                    <input type="file" accept="image/*" onChange={this._handleWaybillChange} hidden />
                  </label>
                </div>
                <div className="urm-field">
                  <span className="urm-label">Packing List (PDF / Image / Word)</span>
                  <label className="urm-upload">
                    <span className="urm-upload-icon">📄</span>
                    <span className="urm-upload-text">
                      {this.state.packingList_loader
                        ? "Uploading…"
                        : this.state.packingListUrl
                        ? "Replace file"
                        : "Upload file"}
                    </span>
                    {this.state.packingListUrl && !this.state.packingList_loader && (
                      <a
                        href={this.state.packingListUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="urm-upload-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View ↗
                      </a>
                    )}
                    <input
                      type="file"
                      accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      onChange={this._handlePackingListChange}
                      hidden
                    />
                  </label>
                </div>
              </div>
            </section>

            {/* Tracking numbers & cartons */}
            <section className="urm-card urm-span-full">
              <div className="urm-card-title"><span className="urm-dot" />Tracking &amp; Cartons</div>
              <CartonManager
                trackingNumbers={this.state.trackingNumbers}
                cartons={this.state.cartons}
                onChange={({ trackingNumbers, cartons }) =>
                  this.setState({ trackingNumbers, cartons })
                }
                estWeight={estWeight}
                onUseTotalWeight={(kg) => this.setState({ receivedWeight: kg })}
              />
            </section>

            {/* Weight & charges */}
            <section className="urm-card urm-span-full">
              <div className="urm-card-title"><span className="urm-dot" />Weight &amp; Charges</div>
              <div className="urm-grid urm-grid-4">
                {this.field("Received (actual) weight, kg", "receivedWeight", {
                  type: "number",
                  placeholder: "Actual weight",
                  hint: estWeight ? `Customer est. ${estWeight} kg` : "Customer gave no estimate",
                })}
                {this.field("Customer rate / kg", "customerRate", { type: "number" })}
                {this.field("Packaging & other cost", "otherCost", { type: "number" })}
                {this.field("Discount", "discount", { type: "number" })}
                {this.field("Refund amount", "refund", { type: "number" })}
                <label className="urm-field">
                  <span className="urm-label">Shipping charge (customer)</span>
                  <input
                    type="text"
                    name="shippingChargeCustomer"
                    className="urm-input urm-readonly"
                    value={Number.isFinite(total) ? total : 0}
                    readOnly
                  />
                  <span className="urm-hint">Calculated automatically</span>
                </label>
              </div>
              <div className="urm-summary">
                <div className="urm-sum-item">
                  <span>Weight × rate</span>
                  <b>
                    {this.state.receivedWeight || 0} kg × ৳{this.state.customerRate || 0}
                  </b>
                </div>
                <div className="urm-sum-item">
                  <span>+ Other cost</span>
                  <b>{tk(parseInt(this.state.otherCost) || 0)}</b>
                </div>
                <div className="urm-sum-item">
                  <span>− Discount &amp; refund</span>
                  <b>{tk((parseFloat(this.state.discount) || 0) + (parseFloat(this.state.refund) || 0))}</b>
                </div>
                <div className="urm-sum-item urm-sum-total">
                  <span>Customer pays</span>
                  <b>{tk(total)}</b>
                </div>
                {margin !== null && (
                  <div className={`urm-sum-item ${margin >= 0 ? "urm-pos-margin" : "urm-neg-margin"}`}>
                    <span>Margin vs cargo</span>
                    <b>{margin >= 0 ? "" : "−"}{tk(Math.abs(margin))}</b>
                  </div>
                )}
              </div>
            </section>

            {/* Addresses & delivery */}
            <section className="urm-card urm-span-full">
              <div className="urm-card-title"><span className="urm-dot" />Addresses, Delivery &amp; Refund</div>
              <div className="urm-grid urm-grid-3">
                {this.field("Abroad warehouse address", "abroadWarehouseAddress")}
                {this.field("Bangladesh warehouse address", "bangladeshWarehouseAddress")}
                {this.field("Delivered by", "deliveredBy")}
                <label className="urm-field urm-span-3">
                  <span className="urm-label">Refund note</span>
                  <textarea
                    name="refundNote"
                    className="urm-input urm-textarea"
                    placeholder="Enter refund note"
                    onChange={this.handleChange}
                    value={this.state.refundNote}
                  />
                </label>
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="urm-foot">
            <span className="urm-foot-total">
              Customer pays <b>{tk(total)}</b>
            </span>
            <div className="urm-foot-actions">
              <button type="button" className="urm-btn urm-btn-ghost" onClick={this.closeModal}>
                Cancel
              </button>
              <button type="submit" className="urm-btn urm-btn-primary">
                Update booking →
              </button>
            </div>
          </div>
        </form>
      </div>
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
