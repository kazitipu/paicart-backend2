import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import {
  uploadProduct,
  uploadAliProduct,
} from "../../../firebase/firebase.utils";
import Spinner from "react-bootstrap/Spinner";
import "./add-aliexpress-product.css";
import axios from "axios";
import { connect } from "react-redux";
import man from "./plus image.jpeg";
import {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCartonsRedux,
} from "../../../actions";
import {
  getAllOrdersByTrackingNo,
  uploadImageRechargeRequest,
  getSingleCarton,
  getAllOrdersByCartonNo2,
} from "../../../firebase/firebase.utils";
import { toast, ToastContainer } from "react-toastify";
// live environment
const base_url = "https://openapi.redx.com.bd/v1.0.0-beta";
const access_token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3Njg5NDEiLCJpYXQiOjE3NTM4ODAxNTksImlzcyI6IkZVT2VESWVSZzlwdDRmeGUzSmRYb2tmNnZPYVFBYk1TIiwic2hvcF9pZCI6NzY4OTQxLCJ1c2VyX2lkIjoxMTY3ODQ1fQ.hDlvRuwKit8rpfz2ETnsfPW2lXT-JZS_2ZBZsMdvTfk";
export class PackingList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      carton: null,
      orders: [],
      loader: true,
    };
  }

  componentDidMount = async () => {
    // this.props.getAllCartonsRedux(true);
    let carton = await getSingleCarton(this.props.match.params.cartonId);
    let orders = await getAllOrdersByCartonNo2(
      this.props.match.params.cartonId
    );
    this.setState({
      carton,
      orders,
      loader: false,
    });
  };

  handleSubmit = async () => {
    const { order, orders } = this.state;
    const { cartons } = this.props;
    let date = new Date();
    console.log(this.state.imageUrl);

    await this.props.updateOrderApiRedux({
      ...order,
      orderStatus: "Delivered",
      [`DeliveredDate`]: order[`DeliveredDate`]
        ? order[`DeliveredDate`]
        : date.toLocaleDateString("en-GB"),
      [`DeliveredTime`]: order[`DeliveredTime`]
        ? order[`DeliveredTime`]
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore: 7,
      // kon carton theke delete hoise oita janar jonno
      deliveredFrom: order.bdCarton,
      // jehetu delivery diye dicchi. kon carton te chilo eta jana joruri na
      bdCarton: "",
      bdCartonId: "",
    });

    toast.success("Order Delivered successfully!");
    this.setState({
      store: "1688",
      id: "",
      availability: "in-stock",
      loader: false,
      product: null,
      imageUrl: man,
      chineseCarton: "",
    });
  };

  formatDate = (dateString) => {
    const date = new Date(dateString);

    // Month abbreviation
    const month = date.toLocaleString("en-US", { month: "short" });

    // Day with ordinal suffix
    const day = date.getDate();
    const daySuffix =
      day % 10 === 1 && day !== 11
        ? "st"
        : day % 10 === 2 && day !== 12
        ? "nd"
        : day % 10 === 3 && day !== 13
        ? "rd"
        : "th";

    // Year
    const year = date.getFullYear();

    // Time in 12-hour format
    const time = date
      .toLocaleString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();

    return `${month}, ${day}${daySuffix} ${year} ${time}`;
  };
  getTotalBill = (order) => {
    let totalPayableAmount = 0;
    if (order) {
      totalPayableAmount =
        parseInt(order.orderTotal) +
        (order.otherCost ? parseInt(order.otherCost) : 0) +
        (order.localShipping ? parseInt(order.localShipping) : 0) -
        (order.discount ? parseInt(order.discount) : 0);
    }

    if (!totalPayableAmount) {
      totalPayableAmount = 0;
    }
    let totalPayableAmountIncludingShipping = 0;
    if (order) {
      totalPayableAmountIncludingShipping =
        parseInt(totalPayableAmount) +
        (order.shippingChargeCustomer
          ? parseInt(order.shippingChargeCustomer)
          : 0);
    }
    return totalPayableAmountIncludingShipping;
  };

  getTotalPaid = (order) => {
    let totalPaid = 0;
    if (order && order.payments && order.payments.length > 0) {
      order.payments.map((payment) => {
        totalPaid += parseInt(payment.amount);
      });
    }
    return totalPaid;
  };
  getTotalDue = (order) => {
    let totalPayableAmount = 0;
    if (order) {
      totalPayableAmount =
        parseInt(order.orderTotal) +
        (order.otherCost ? parseInt(order.otherCost) : 0) +
        (order.localShipping ? parseInt(order.localShipping) : 0) -
        (order.discount ? parseInt(order.discount) : 0);
    }
    let totalPaid = 0;
    if (order && order.payments && order.payments.length > 0) {
      order.payments.map((payment) => {
        totalPaid += parseInt(payment.amount);
      });
    }
    if (!totalPayableAmount) {
      totalPayableAmount = 0;
    }
    let totalPayableAmountIncludingShipping = 0;
    if (order) {
      totalPayableAmountIncludingShipping =
        parseInt(totalPayableAmount) +
        (order.shippingChargeCustomer
          ? parseInt(order.shippingChargeCustomer)
          : 0);
    }
    return totalPayableAmountIncludingShipping - totalPaid;
  };

  render() {
    const { loader, order, carton } = this.state;
    const { currency, uploadCartonRedux, deleteCartonRedux, cartons } =
      this.props;

    let totalWeight = 0;
    if (this.state.orders && this.state.orders.length > 0) {
      this.state.orders.map((order) => {
        totalWeight += parseFloat(order.bdWeight);
      });
    }

    return (
      <Fragment>
        <Breadcrumb title="Carton Details" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ background: "#f8f8f9" }}>
                <div className="card-header">
                  <h5>{carton && carton.name}</h5>
                  <h6>Carton Details</h6>
                  <div style={{ marginTop: 5, fontWeight: "bold" }}>
                    Total Carton Weight: {parseFloat(totalWeight).toFixed(2)}kg{" "}
                  </div>
                </div>
                <div className="card-body" style={{ background: "white" }}>
                  <div className="row product-adding">
                    <div className="col-xl-12">
                      {loader ? (
                        <>
                          <div className="loader">Loading...</div>
                          <h5 style={{ color: "gray" }}></h5>
                        </>
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                  <div>
                    {this.state.orders.map((order) => {
                      return (
                        <div
                          style={{
                            border: "2px solid #ccc",
                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
                            padding: "20px",
                            backgroundColor: "white",
                            margin: 20,
                            borderRadius: 5,
                          }}
                        >
                          {order &&
                            order.items.length > 0 &&
                            order.items.map((item) => (
                              <div>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    justifyContent: "space-between",
                                  }}
                                >
                                  <div>
                                    <div style={{ fontWeight: "bold" }}>
                                      Order Id: {order.orderId}
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>
                                      Tracking No: {order.trackingNo}
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>
                                      Order Id (chinese website):{" "}
                                      {order.orderNumber}
                                    </div>

                                    <div style={{ fontWeight: "bold" }}>
                                      Order Status:{" "}
                                      <span style={{ color: "green" }}>
                                        {order.orderStatus}
                                      </span>
                                    </div>

                                    <div style={{ fontWeight: "bold" }}>
                                      Total Weight (china warehouse):{" "}
                                      {order.chineseWeight} kg
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>
                                      CN warehouse image:{" "}
                                      <div>
                                        <a
                                          href={
                                            order && order.imageUrl
                                              ? order.imageUrl
                                              : ""
                                          }
                                          target="_blank"
                                          onClick={(e) => {
                                            if (!order?.imageUrl) {
                                              e.preventDefault(); // 🚫 Stop navigation
                                            }
                                          }}
                                        >
                                          <img
                                            style={{
                                              height: 100,
                                              width: 100,
                                              border: "1px solid gainsboro",
                                              borderRadius: 5,
                                              marginTop: 5,
                                            }}
                                            src={
                                              order && order.imageUrl
                                                ? order.imageUrl
                                                : man
                                            }
                                          />
                                        </a>
                                      </div>
                                    </div>
                                    {order.chineseIssue && (
                                      <div
                                        style={{
                                          marginBottom: 10,
                                          fontSize: 12,
                                          color: "red",
                                        }}
                                      >
                                        {order.chineseIssue}
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        fontWeight: "bold",
                                        marginTop: 10,
                                      }}
                                    >
                                      {item.name}
                                    </div>
                                    <div
                                      style={{
                                        marginBottom: 10,
                                      }}
                                    >
                                      Product Link:{" "}
                                      <a href={item.detail_url} target="_blank">
                                        <span style={{ color: "#ff8084" }}>
                                          {item.detail_url}
                                        </span>
                                      </a>
                                    </div>
                                    {order.courierTrackingId && (
                                      <div style={{}}>
                                        Courier Parcel Id:{" "}
                                        <span
                                          style={{
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {order.courierTrackingId}
                                        </span>
                                      </div>
                                    )}
                                    {order.courierName && (
                                      <div
                                        style={{
                                          marginBottom: 10,
                                          marginTop: 5,
                                        }}
                                      >
                                        Courier Name:{" "}
                                        <span
                                          style={{
                                            color: "white",
                                            fontWeight: "bold",
                                            background: "#18768f",
                                            padding: "1px 10px",
                                            borderRadius: 5,
                                            border: "1px solid gainsboro",
                                            cursor: "pointer",
                                          }}
                                          data-toggle="modal"
                                          data-target="#trackingModal"
                                          onClick={async () => {
                                            let response = await axios.get(
                                              `${base_url}/parcel/track/${order.courierTrackingId}`,
                                              {
                                                headers: {
                                                  "API-ACCESS-TOKEN": `Bearer ${access_token}`,
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                              }
                                            );
                                            console.log(response.data);
                                            this.setState({
                                              order: order,
                                              trackingArray:
                                                response.data &&
                                                response.data.tracking
                                                  ? response.data.tracking
                                                  : [],
                                            });
                                          }}
                                        >
                                          {order.courierName}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <div>
                                      <div
                                        style={{
                                          color: "white",
                                          fontWeight: "bold",
                                          padding: "5px 12px",
                                          background: "green",
                                          borderRadius: 5,
                                          cursor: "pointer",
                                          border: "2px solid gainsboro",
                                          textAlign: "center",
                                          display: "inline",
                                        }}
                                        data-toggle="modal"
                                        data-target="#personalInfoModal"
                                        onClick={() => {
                                          this.setState({
                                            order: order,
                                          });
                                        }}
                                      >
                                        {" "}
                                        ✔ Deliver
                                      </div>
                                      {/* <div
                                        style={{
                                          color: "white",
                                          fontWeight: "bold",
                                          padding: "5px 12px",
                                          background: "red",
                                          borderRadius: 5,
                                          cursor: "pointer",
                                          border: "2px solid gainsboro",
                                          textAlign: "center",
                                          marginTop: 5,
                                          display: "inline",
                                          marginLeft: 10,
                                        }}
                                        data-toggle="modal"
                                        data-target="#personalInfoModal2"
                                        onClick={() => {
                                          this.setState({
                                            order: order,
                                          });
                                        }}
                                      >
                                        {" "}
                                        ✔ Move
                                      </div> */}
                                    </div>
                                    {order.shipmentStatusScore >= 6 ? (
                                      <div style={{ marginTop: 20 }}>
                                        {" "}
                                        <div style={{ fontWeight: "bold" }}>
                                          Carton No (bd warehouse):{" "}
                                          {order.bdCarton}
                                        </div>
                                        <div style={{ fontWeight: "bold" }}>
                                          Total Weight (bd warehouse):{" "}
                                          {order.bdWeight} kg
                                        </div>
                                        <div style={{ fontWeight: "bold" }}>
                                          BD warehouse image:{" "}
                                          <div>
                                            <a
                                              href={
                                                order && order.imageUrlBd
                                                  ? order.imageUrlBd
                                                  : ""
                                              }
                                              target="_blank"
                                              onClick={(e) => {
                                                if (!order?.imageUrlBd) {
                                                  e.preventDefault(); // 🚫 Stop navigation
                                                }
                                              }}
                                            >
                                              <img
                                                style={{
                                                  height: 100,
                                                  width: 100,
                                                  border: "1px solid gainsboro",
                                                  borderRadius: 5,
                                                  marginTop: 5,
                                                }}
                                                src={
                                                  order && order.imageUrlBd
                                                    ? order.imageUrlBd
                                                    : man
                                                }
                                              />
                                            </a>
                                          </div>
                                        </div>
                                        {order.bdIssue && (
                                          <div
                                            style={{
                                              marginBottom: 10,
                                              fontSize: 12,
                                              color: "red",
                                            }}
                                          >
                                            {order.bdIssue}
                                          </div>
                                        )}
                                      </div>
                                    ) : null}
                                    <div style={{ marginTop: 20 }}>
                                      {order.lotNo &&
                                        order.lotNo.length > 0 && (
                                          <div>
                                            Lot No (shipment):{" "}
                                            <span
                                              style={{ fontWeight: "bold" }}
                                            >
                                              {order.lotNo[0]}
                                            </span>
                                          </div>
                                        )}
                                      {order.ctnNo &&
                                        order.ctnNo.length > 0 && (
                                          <div>
                                            Carton No (shipment):{" "}
                                            <span
                                              style={{ fontWeight: "bold" }}
                                            >
                                              {order.ctnNo.map(
                                                (ctn) => `${ctn},`
                                              )}
                                            </span>
                                          </div>
                                        )}
                                      <div>
                                        Payment Status:{" "}
                                        <span
                                          style={{
                                            padding: "1px 6px",
                                            fontWeight: "bold",
                                            color: "white",
                                            borderRadius: 5,
                                            background: order
                                              ? order.paymentStatus ==
                                                "Partially Paid"
                                                ? "darkorange"
                                                : order.paymentStatus ==
                                                  "Not Paid"
                                                ? "red"
                                                : order.paymentStatus == "Paid"
                                                ? "green"
                                                : order.paymentStatus ==
                                                  "purchaseLater"
                                                ? "gray"
                                                : order.paymentStatus ==
                                                  "pending"
                                                ? "darkorange"
                                                : "red"
                                              : "red",
                                            textAlign: "center",
                                            fontSize: 11,
                                          }}
                                          onClick={() => {
                                            this.setState({
                                              order,
                                            });
                                          }}
                                        >
                                          {(order && order.paymentStatus) ||
                                            "Not Paid"}
                                        </span>
                                      </div>
                                      <div>
                                        Total Paid:{" "}
                                        <span
                                          style={{
                                            fontWeight: "bold",
                                            textTransform: "capitalize",
                                          }}
                                        >
                                          {this.getTotalPaid(order)} Tk
                                        </span>
                                      </div>
                                      <div>
                                        Total Due:{" "}
                                        <span
                                          style={{
                                            fontWeight: "bold",
                                            textTransform: "capitalize",
                                            color: "red",
                                          }}
                                        >
                                          {this.getTotalDue(order)}Tk
                                        </span>
                                      </div>
                                      <div
                                        style={{
                                          fontWeight: "bold",
                                          marginTop: 20,
                                        }}
                                      >
                                        Delivery Address
                                      </div>
                                      <div>
                                        Name:{" "}
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.name}
                                      </div>
                                      <div>
                                        Mobile No:{" "}
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.mobileNo}
                                      </div>
                                      <div style={{ marginBottom: 20 }}>
                                        Delivery Address:
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.address}
                                        ,<br />
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.thana}
                                        ,
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.district}
                                        ,<br />
                                        {order.deliveryAddress &&
                                          order.deliveryAddress.division}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                {order && order.additionalNotes && (
                                  <div
                                    style={{
                                      fontWeight: "bold",
                                      marginBottom: 20,
                                    }}
                                  >
                                    Additioinal notes:{" "}
                                    <span
                                      style={{
                                        color: "red",
                                        fontWeight: "lighter",
                                      }}
                                    >
                                      {order.additionalNotes}
                                    </span>
                                  </div>
                                )}
                                <table className="table table-bordered table-striped table-hover">
                                  <tbody>
                                    <tr>
                                      <td style={{ fontWeight: "bold" }}>
                                        Image
                                      </td>
                                      <td style={{ fontWeight: "bold" }}>
                                        Variant
                                      </td>
                                      <td style={{ fontWeight: "bold" }}>
                                        Product Type
                                      </td>
                                      <td style={{ fontWeight: "bold" }}>
                                        Carton Type
                                      </td>
                                      <td style={{ fontWeight: "bold" }}>
                                        Quantity
                                      </td>
                                    </tr>
                                    {item.skus.map((sku) => (
                                      <tr>
                                        <td>
                                          <img
                                            style={{
                                              height: 70,
                                              width: 70,
                                              border: "1px solid gainsboro",
                                              borderRadius: 5,
                                            }}
                                            src={
                                              sku.image
                                                ? sku.image
                                                : item.picture
                                                ? item.picture
                                                : man
                                            }
                                          />
                                        </td>
                                        <td>
                                          {item.propertyNames &&
                                            item.propertyNames.length > 0 && (
                                              <div>
                                                {item.propertyNames[0]}:{" "}
                                                {sku.color}
                                                , <br />
                                                {sku.size &&
                                                  `${item.propertyNames[1]}: ${sku.size}`}
                                              </div>
                                            )}
                                        </td>
                                        <td>{item.productType}</td>
                                        <td style={{ fontWeight: "bold" }}>
                                          {order.chineseCarton}
                                        </td>

                                        <td>{sku.totalQuantity}pcs </td>
                                      </tr>
                                    ))}{" "}
                                  </tbody>
                                </table>
                              </div>
                            ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="personalInfoModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  Deliver Order
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div style={{ fontWeight: "bold" }}>
                    Order Id: {order && order.orderId}
                  </div>
                  <div>Are you sure you want to deliver this Product?</div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "green",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={() => {
                    this.handleSubmit();
                  }}
                >
                  Deliver
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="cartonModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  Create Carton
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div style={{ minWidth: 250 }}>
                    <select
                      title=""
                      name="chineseCarton"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      style={{ fontSize: ".8rem" }}
                      value={this.state.chineseCarton}
                      required
                    >
                      <option value="">Select Carton</option>
                      <option value="Shoes">Shoes</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Bag">Bag</option>
                      <option value="Cosmetics">Cosmetics</option>
                      <option value="Jewelry">Jewelry</option>
                      <option value="Machinary + Parts">
                        Machinary + Parts
                      </option>
                      <option value="Battery Item">Battery Item</option>
                      <option value="China Mix">China Mix</option>
                      <option value="Hongkong Mix">Hongkong Mix</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "darkorange",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={async () => {
                    let date = new Date();
                    if (!this.state.chineseCarton) {
                      alert("You must a choose a carton type.");
                      return;
                    }
                    let chosedCartonsPreviousLength = cartons.filter(
                      (carton) => carton.cartonType == this.state.chineseCarton
                    )?.length;
                    console.log(chosedCartonsPreviousLength);
                    await uploadCartonRedux({
                      cartonType: this.state.chineseCarton,
                      name: `${this.state.chineseCarton}-${
                        chosedCartonsPreviousLength + 1
                      }`,
                      cartonId: date.getTime().toString(),
                    });
                    this.setState({
                      chineseCarton: "",
                    });
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="personalInfoModal2"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  Move Product
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div style={{ fontWeight: "bold" }}>
                    Order Id: {order && order.orderId}
                  </div>
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Select carton
                    </label>

                    <select
                      title=""
                      name="bdCarton"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      style={{ fontSize: ".8rem" }}
                      value={this.state.bdCarton}
                      required
                    >
                      <option value="">Select Carton</option>
                      {cartons.length > 0 &&
                        order &&
                        cartons
                          .filter((carton) => carton.bd)
                          .map((carton) => {
                            return (
                              <option value={carton.name}>{carton.name}</option>
                            );
                          })}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "darkorange",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={() => {
                    this.handleSubmit();
                  }}
                >
                  Move
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="trackingModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  ট্র্যাক পার্সেল <br />
                  <span style={{ fontWeight: "lighter" }}>
                    {order && order.courierTrackingId}
                  </span>
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div className="tracking-container">
                  <div className="timeline">
                    {this.state.trackingArray &&
                    this.state.trackingArray.length > 0
                      ? this.state.trackingArray.map((item, index) => (
                          <div className="timeline-item" key={index}>
                            <div className="timeline-dot"></div>
                            <div className="timeline-content">
                              <div className="timeline-date">
                                {this.formatDate(item.time)}
                              </div>
                              <div className="timeline-text">
                                {item.message_bn}
                              </div>
                            </div>
                          </div>
                        ))
                      : "No Tracking Data available"}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                >
                  close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteCartonModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  Delete Carton
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div style={{ minWidth: 250 }}>
                    Are you sure you want to delete this carton?
                  </div>
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 5,
                      background: "aliceblue",
                      border: "2px solid gray",
                      fontWeight: "bold",
                      fontSize: 18,
                      marginRight: 10,
                      cursor: "pointer",
                      display: "inline-block",
                      marginTop: 15,
                    }}
                  >
                    {this.state.carton && this.state.carton.name}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={async () => {
                    let date = new Date();
                    if (!this.state.carton) {
                      alert("You must choose a carton first.");
                      return;
                    }

                    await deleteCartonRedux(this.state.carton.cartonId);

                    this.setState({
                      carton: "",
                    });
                    toast.success("Successfully deleted carton!");
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToastContainer />
      </Fragment>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    allUsers: state.users.users,
    currency: state.users.currency,
    orderTracking: state.orders.orderTracking,
    currentAdmin: state.admins.currentAdmin,
    employees: state.employees.employees,
    cartons: state.cartons.cartons,
  };
};
export default connect(mapStateToProps, {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCartonsRedux,
})(PackingList);
