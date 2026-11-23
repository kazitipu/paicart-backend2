import React, { Component } from "react";
import "./updateRequestModal.css";
import "../shipment-request/updateRequestModal.css";
import { updateProductRequestRedux } from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import {
  getSingleOrderApi,
  getSingleUser,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import {
  isInBatch,
  requiresBatch,
} from "../../constants/productRequestPayment";
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
      orderTotal: "",
      unitPrice: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
      trackingNumbers: [],
      cartons: [],
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
      /* Chosen by the customer on the request form; the team can override it
         here when the parcel actually moves the other way. */
      shipmentMethod: "Air",
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
        unitPrice: order.unitPrice || "",
        note: order.note || "",
        localShipping: order.localShipping || "",
        orderStatus: order.orderStatus || "",
        orderNumber: order.orderNumber || "",
        trackingNo: order.trackingNo || "",
        trackingNumbers: trackingNumbersOf(order),
        cartons: order.cartons || [],
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
        shipmentMethod: order.shipmentMethod || "Air",
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
    if (!this.state.orderTotal) {
      alert("You must give order total.");
      return;
    }
    /* The purchase batch IS the purchase, so a request cannot be advanced past
       Rates Provided until it belongs to one.
       The `!== order.orderStatus` test is essential: componentWillReceiveProps
       seeds state.orderStatus from the order and handleSubmit spreads
       ...this.state, so every save on an already-Purchased request re-submits
       its current status. Without it, every request purchased before this
       feature shipped would become permanently un-editable. */
    const nextStatus = this.state.orderStatus;
    if (
      nextStatus &&
      nextStatus !== order.orderStatus &&
      requiresBatch(nextStatus) &&
      !isInBatch(order)
    ) {
      alert(
        `This request is not in a payment batch yet. Select it on the New or ` +
          `Rates Provided list and create a payment batch before marking it ` +
          `\u201c${nextStatus}\u201d.`
      );
      return;
    }
    console.log(order);
    let date = new Date();
    let shipmentStatusScore = 1;
    if (
      this.state.orderStatus == "Purchased" ||
      this.state.orderStatus == "Rates Provided"
    ) {
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
    await this.props.updateProductRequestRedux({
      ...order,
      ...this.formState(),
      trackingNumbers: this.state.trackingNumbers || [],
      trackingNo: (this.state.trackingNumbers || []).join(","),
      cartons: this.state.cartons || [],
      ...(this.state.cartons && this.state.cartons.length
        ? legacyFieldsFromCartons(this.state.cartons)
        : {}),
      /* per-carton cargo rate / charge (ALG or typed in the carton table) */
      ...cargoFieldsFromCartons(this.state.cartons || []),
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
      unitPrice: parseFloat(
        this.state.orderTotal / order.productQuantity
      ).toFixed(2),
      actualTotal: this.state.orderTotal,
    });
    console.log(order);
    // const newOrder = await getSingleOrderApi(order.orderId);
    // console.log(order, newOrder);
    // const msg = this.createNotification(order, newOrder);
    // console.log(msg);
    // const user = await getSingleUser(order.userId);
    // console.log(user);
    // const message = {
    //   title: msg.title,
    //   body: msg.body,
    // };
    // if (user.deviceToken && user.deviceToken.length > 0) {
    //   user.deviceToken.map((token) => {
    //     console.log(token);
    //     sendNotifications(token, message);
    //   });
    // }

    toast.success("successfully updated Booking Reqeust");
    this.setState({
      orderTotal: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
      trackingNumbers: [],
      cartons: [],
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
      /* Chosen by the customer on the request form; the team can override it
         here when the parcel actually moves the other way. */
      shipmentMethod: "Air",
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
  /* the form's fields — UI flags (closing animation) aren't saved */
  formState = () => {
    const { closing, ...fields } = this.state;
    return fields;
  };

  closeModalNow = () => {
    this.setState({
      orderTotal: "",
      note: "",
      localShipping: "",
      orderStatus: "",
      orderNumber: "",
      trackingNo: "",
      trackingNumbers: [],
      cartons: [],
    });
    this.props.startToggleModal(null);
  };

  /* Play the closing animation, then reset and close for real. */
  closeModal = () => {
    if (this.state.closing) return;
    this.setState({ closing: true });
    setTimeout(() => {
      this.setState({ closing: false });
      this.closeModalNow();
    }, 200);
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

  field = (label, name, { type = "text", placeholder, hint, span, required } = {}) => (
    <label className={`urm-field ${span ? `urm-span-${span}` : ""}`}>
      <span className="urm-label">{label}{required ? " *" : ""}</span>
      <input
        type={type}
        name={name}
        className="urm-input"
        placeholder={placeholder || label}
        onChange={this.handleChange}
        value={this.state[name]}
        step={type === "number" ? "any" : undefined}
        required={required}
      />
      {hint && <span className="urm-hint">{hint}</span>}
    </label>
  );

  textarea = (label, name, placeholder, span = 3) => (
    <label className={`urm-field urm-span-${span}`}>
      <span className="urm-label">{label}</span>
      <textarea
        name={name}
        className="urm-input urm-textarea"
        placeholder={placeholder}
        onChange={this.handleChange}
        value={this.state[name] || ""}
      />
    </label>
  );

  render() {
    if (this.props.toggleModal) return null;
    const order = this.props.order || {};
    /* Locked until the request is in a purchase batch. */
    const locked = !isInBatch(order);
    const lockNote = locked ? " — needs payment batch" : "";
    const total = this.customerTotal();
    const cargoTotal = (this.state.cartons || []).length
      ? cartonTotals(this.state.cartons).cargoCharge
      : String(this.state.shippingChargeCargo || "").split(",").reduce((a, v) => a + (parseFloat(v) || 0), 0);
    const margin = cargoTotal ? (Number.isFinite(total) ? total : 0) - cargoTotal : null;
    const tk = (n) => `৳${(Number.isFinite(n) ? n : 0).toLocaleString("en-IN")}`;
    const thumb = order.imageUrl || order.productImage;

    return (
      <div className={`urm-overlay ${this.state.closing ? "is-closing" : ""}`} role="dialog" aria-modal="true">
        <form className="urm-modal" onSubmit={this.handleSubmit}>
          {/* Header */}
          <div className="urm-head">
            {thumb ? <img className="urm-thumb" src={thumb} alt="" /> : <div className="urm-thumb urm-thumb-empty">📦</div>}
            <div className="urm-head-text">
              <div className="urm-kicker">Update product request</div>
              <h3 className="urm-title">Booking #{order.bookingId}</h3>
              <div className="urm-chips">
                {(order.productName || order.productType) && <span className="urm-chip">{String(order.productName || order.productType).slice(0, 48)}</span>}
                {order.orderStatus && <span className="urm-chip">Status: {statusDisplay(order.orderStatus)}</span>}
                {order.productQuantity && <span className="urm-chip">{order.productQuantity} pcs</span>}
                {order.unitPrice && <span className="urm-chip">৳{order.unitPrice} / pc</span>}
                {order.shipmentMethod && <span className="urm-chip">{String(order.shipmentMethod).toUpperCase()}</span>}
                {order.displayName && <span className="urm-chip">👤 {order.displayName}</span>}
              </div>
            </div>
            <button type="button" className="urm-x" onClick={this.closeModal} aria-label="Close">
              &times;
            </button>
          </div>

          <div className="urm-body">
            {/* Order & status */}
            <section className="urm-card">
              <div className="urm-card-title"><span className="urm-dot" />Order &amp; Status</div>
              <div className="urm-grid">
                {this.field("Order total (৳)", "orderTotal", { required: true, placeholder: "Enter total price" })}
                {this.field("Local courier charge (৳)", "localShipping", { required: true, placeholder: "China local shipping" })}
                <label className="urm-field">
                  <span className="urm-label">Status *</span>
                  <select name="orderStatus" className="urm-input" onChange={this.handleChange} value={this.state.orderStatus} required>
                    <option value="">Change status</option>
                    <option value="Rates Provided">Rates Provided</option>
                    <option value="Purchased" disabled={locked}>Purchased{lockNote}</option>
                    <option value="Received in Warehouse" disabled={locked}>Received in Warehouse{lockNote}</option>
                    <option value="Ready for fly" disabled={locked}>Ready for fly{lockNote}</option>
                    <option value="Bangladesh customs" disabled={locked}>Bangladesh customs{lockNote}</option>
                    <option value="Bangladesh warehouse" disabled={locked}>Custom released{lockNote}</option>
                    <option value="Paicart warehouse" disabled={locked}>Paicart warehouse{lockNote}</option>
                    <option value="Delivered" disabled={locked}>Delivered{lockNote}</option>
                    <option value="Reject">Reject</option>
                  </select>
                  {locked && <span className="urm-hint urm-hint-warn">Not in a payment batch — status can go no further than Rates Provided.</span>}
                </label>
                {this.field("Order number (china website)", "orderNumber", { placeholder: "1688 / taobao / aliexpress order number" })}
              </div>
              <div className="urm-summary">
                <div className="urm-sum-item">
                  <span>Quantity</span>
                  <b>{order.productQuantity || 0} pcs</b>
                </div>
                <div className="urm-sum-item urm-sum-total">
                  <span>Order total + courier</span>
                  <b>{tk((parseFloat(this.state.orderTotal) || 0) + (parseFloat(this.state.localShipping) || 0))}</b>
                </div>
              </div>
            </section>

            {/* Purchase (China side) */}
            <section className="urm-card">
              <div className="urm-card-title"><span className="urm-dot" />Purchase (China)</div>
              <div className="urm-grid">
                {this.field("Purchase link (china website)", "purchaseLink", { span: 2, placeholder: "https://…" })}
                {this.field("Purchasing RMB", "purchasingRmb", { placeholder: "¥ paid to the supplier" })}
                {this.field("Exchange rate (৳ / ¥)", "exchangeRate", { placeholder: "Today's rate" })}
                {this.field("Purchasing supplier info", "purchasingSupplier")}
                {this.field("Supplier payment method", "purchasingSupplierPayment")}
                {this.field("Supplier QR code (link)", "purchasingSupplierQr", { span: 2 })}
              </div>
              <div className="urm-summary">
                <div className="urm-sum-item">
                  <span>Purchasing RMB</span>
                  <b>¥{(parseFloat(this.state.purchasingRmb) || 0).toFixed(2)}</b>
                </div>
                <div className="urm-sum-item">
                  <span>× Exchange rate</span>
                  <b>৳{parseFloat(this.state.exchangeRate) || 0}</b>
                </div>
                <div className="urm-sum-item urm-sum-total">
                  <span>Buying cost</span>
                  <b>{tk(Math.round((parseFloat(this.state.purchasingRmb) || 0) * (parseFloat(this.state.exchangeRate) || 0)))}</b>
                </div>
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
              </div>
            </section>

            {/* Tracking numbers & cartons */}
            <section className="urm-card urm-span-full">
              <div className="urm-card-title"><span className="urm-dot" />Tracking &amp; Cartons</div>
              <CartonManager
                trackingNumbers={this.state.trackingNumbers || []}
                cartons={this.state.cartons || []}
                onChange={({ trackingNumbers, cartons }) => this.setState({ trackingNumbers, cartons })}
                onUseTotalWeight={(kg) => this.setState({ receivedWeight: kg })}
                fetchKey={!this.props.toggleModal && order ? order.orderId || order.bookingId || "open" : null}
              />
            </section>

            {/* Weight & charges */}
            <section className="urm-card urm-span-full">
              <div className="urm-card-title"><span className="urm-dot" />Weight &amp; Charges</div>
              <div className="urm-grid urm-grid-4">
                {this.field("Received (actual) weight, kg", "receivedWeight", { type: "number", placeholder: "Actual weight" })}
                <label className="urm-field">
                  <span className="urm-label">Shipment method</span>
                  <select name="shipmentMethod" className="urm-input" onChange={this.handleChange} value={this.state.shipmentMethod || "Air"}>
                    <option value="Air">By Air</option>
                    <option value="Sea">By Sea</option>
                  </select>
                </label>
                {this.field("Customs & shipping rate / kg", "customerRate", { type: "number" })}
                {this.field("Packaging & other cost", "otherCost", { type: "number" })}
                {this.field("Discount", "discount", { type: "number" })}
                {this.field("Refund amount", "refund", { type: "number" })}
                <label className="urm-field">
                  <span className="urm-label">Total shipping charge (customer)</span>
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
                  <b>{this.state.receivedWeight || 0} kg × ৳{this.state.customerRate || 0}</b>
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
                  <span>Shipping charge</span>
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
                {this.field("Delivered through (include reference)", "deliveredBy")}
                {this.textarea("Refund note", "refundNote", "Enter refund note")}
              </div>
            </section>
          </div>

          {/* Footer */}
          <div className="urm-foot">
            <span className="urm-foot-total">
              Shipping charge <b>{tk(total)}</b>
            </span>
            <div className="urm-foot-actions">
              <button type="button" className="urm-btn urm-btn-ghost" onClick={this.closeModal}>
                Cancel
              </button>
              <button type="submit" className="urm-btn urm-btn-primary">
                Update request →
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
    ordersApi: state.orders.ordersApi,
  };
};
export default connect(mapStateToProps, { updateProductRequestRedux })(
  UpdateRequestModal
);
