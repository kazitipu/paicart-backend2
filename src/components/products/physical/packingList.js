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
  getAllCnCartonsRedux,
  getAllEmployeeRedux,
  updateEmployeeRedux,
} from "../../../actions";
import {
  getAllOrdersByTrackingNo,
  uploadImageRechargeRequest,
  getSingleCarton,
  getAllOrdersByCartonNo,
  getSingleUser,
  handlePurchasingCashOut,
} from "../../../firebase/firebase.utils";
import { toast, ToastContainer } from "react-toastify";
export class PackingList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      carton: null,
      orders: [],
      loader: true,
      loading: false,
      webcam: false,
      imageUrl: man,
      order: null,
      chineseCarton: "",
      returnInfo: "",
    };
  }

  componentDidMount = async () => {
    this.props.getAllCnCartonsRedux();
    this.props.getAllEmployeeRedux();
    let carton = await getSingleCarton(this.props.match.params.cartonId);
    let orders = await getAllOrdersByCartonNo(this.props.match.params.cartonId);
    this.setState({
      carton,
      orders,
      loader: false,
    });
  };

  startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.stream = stream; // ✅ assign it correctly
      this.setState({
        webcam: true,
      });
      const video = document.getElementById("webcam");
      if (video) {
        video.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
    }
  };

  capturePhoto = async () => {
    const { order } = this.state;
    const video = document.getElementById("webcam");
    const canvas = document.getElementById("canvas");

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");

    // Convert to file
    const file = await this.dataURLtoFile(
      dataUrl,
      `webcam-photo-cn-issue-${order.orderId}.png`
    );

    this.setState({ loading: true });

    const imgUrl = await uploadImageRechargeRequest(file);

    this.setState({
      imageUrl: imgUrl,
      file,
      loading: false,
      webcam: false,
    });

    console.log("Uploaded Image URL:", imgUrl);

    // ✅ Stop the stream safely
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  };

  dataURLtoFile = async (dataUrl, filename) => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = async () => {
    const { order, orders } = this.state;
    const { cartons, employees, currentAdmin } = this.props;
    let date = new Date();
    console.log(this.state.imageUrl);

    let selectedEmployee = employees.find(
      (employee) => employee.adminId == order.agentId
    );
    let user = await getSingleUser(order.userId);
    this.setState({
      user: user,
    });
    if (!selectedEmployee) {
      alert("Nobody picked this order yet.Please contact BD");
      return;
    }

    if (!this.state.chineseCarton) {
      alert("You must choose a carton number.");
      return;
    }
    if (!order.purchasingRmb || order.purchasingRmb == 0) {
      alert("Call Bangladesh Agent to enter purchasing rmb");
      return;
    }
    await this.props.updateOrderApiRedux({
      ...order,
      chineseCarton: this.state.chineseCarton,
      chinseseCartonId: cartons.find(
        (carton) => carton.name == this.state.chineseCarton
      )?.cartonId,
    });
    this.props.updateCartonRedux(
      cartons.find((carton) => carton.name == this.state.chineseCarton)
    );

    // ekhane ekta transaction korte hobe agent er taka kete dite hobe shomoporiman

    let rmbBalance =
      parseFloat(selectedEmployee.rmbBalance) - parseFloat(order.purchasingRmb);

    this.props.updateEmployeeRedux({
      ...selectedEmployee,
      rmbBalance,
    });

    await handlePurchasingCashOut({
      paymentId: date.getTime().toString(),
      buyingcost2: parseFloat(order.purchasingRmb).toFixed(2),
      employeeId: selectedEmployee.employeeId,
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      fundType: "RMB",
      rmbBalance,
      rupeeBalance: 0,
      expenseBy: currentAdmin.name,
      id: order.orderId,
      totalRmb: order.purchasingRmb,
      orderedDate: order.orderedDate,
      trackingNo: order.trackingNo,
      productImage: order.items[0].picture,
      productType: order.agentCarton,
    });
    toast.success("Order received successfully!");
    this.setState({
      store: "1688",
      id: "",
      availability: "in-stock",
      loader: false,
      product: null,
      orders: [],
      imageUrl: man,
      chineseCarton: "",
    });
  };

  handleSubmit2 = async () => {
    const { order, orders } = this.state;
    const { cartons, employees, currentAdmin } = this.props;
    let date = new Date();

    if (!this.state.returnInfo) {
      alert("Please enter some return information.");
      return;
    }

    await this.props.updateOrderApiRedux({
      ...order,
      returnInfo: this.state.returnInfo,
      orderStatus: "Reject",
      RejectDate: order.RejectDate
        ? order.RejectDate
        : date.toLocaleDateString("en-GB"),
      RejectTime: order.RejectTime
        ? order.RejectTime
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore: 1,
    });

    toast.success("Order returned successfully!");
    this.setState({
      store: "1688",
      id: "",
      availability: "in-stock",
      loader: false,
      product: null,
      orders: [],
      imageUrl: man,
      chineseCarton: "",
    });
  };

  getMonthName = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const d = new Date();
    return `${monthNames[d.getMonth()]},${d.getFullYear()}`;
  };

  render() {
    const { loader, order, carton } = this.state;
    const { currency, uploadCartonRedux, deleteCartonRedux, cartons } =
      this.props;

    let totalWeight = 0;
    if (this.state.orders && this.state.orders.length > 0) {
      this.state.orders.map((order) => {
        totalWeight += parseFloat(order.chineseWeight);
      });
    }

    return (
      <Fragment>
        <Breadcrumb title="Packing List" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ background: "#f8f8f9" }}>
                <div className="card-header">
                  <h5>{carton && carton.name}</h5>
                  <h6>Packing List</h6>
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
                                  </div>

                                  <div>
                                    {carton &&
                                      carton.name.includes("Issue Box") && (
                                        <div
                                          style={{
                                            marginBottom: 10,
                                            display: "flex",
                                            flexDirection: "row",
                                            justifyContent: "flex-end",
                                          }}
                                        >
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
                                                display: "inline-block",
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
                                              ✔ Move
                                            </div>
                                            <div
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
                                                display: "inline-block",
                                                marginLeft: 5,
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
                                              ✖ Return
                                            </div>
                                          </div>
                                        </div>
                                      )}
                                    <div style={{ fontWeight: "bold" }}>
                                      Order Status:{" "}
                                      <span style={{ color: "green" }}>
                                        {order.orderStatus}
                                      </span>
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>
                                      Carton No (china warehouse):{" "}
                                      {order.chineseCarton}
                                    </div>
                                    <div style={{ fontWeight: "bold" }}>
                                      Lot No (china warehouse):{" "}
                                      {carton && carton.lotNo}
                                    </div>
                                    {order.lotNo && order.lotNo.length > 0 && (
                                      <div style={{ fontWeight: "bold" }}>
                                        Lot No (shipment): {order.lotNo[0]}
                                      </div>
                                    )}
                                    {order.ctnNo && order.ctnNo.length > 0 && (
                                      <div style={{ fontWeight: "bold" }}>
                                        Carton No (shipment):{" "}
                                        {order.ctnNo.map((ctn) => `${ctn},`)}
                                      </div>
                                    )}
                                    <div style={{ fontWeight: "bold" }}>
                                      Total Weight (china warehouse):{" "}
                                      {order.chineseWeight}Kg
                                    </div>
                                  </div>
                                </div>
                                {order && order.additionalNotes && (
                                  <div style={{ fontWeight: "bold" }}>
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
                                          {order.agentCarton}
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
                  Receive Product for shipment
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
                      {cartons.length > 0 &&
                        order &&
                        cartons
                          .filter(
                            (carton) => carton.cartonType == order.agentCarton
                          )
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
                  Receive in warehouse
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
                  Return Product to the supplier
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
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Return Information Note
                    </label>
                    <textarea
                      type="text"
                      className="form-control"
                      name="returnInfo"
                      value={this.state.returnInfo}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter a brief note about return details"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                        textAlign: "start",
                        height: 100,
                      }}
                    />
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
                  onClick={() => {
                    this.handleSubmit2();
                  }}
                >
                  Return Product
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
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCartonsRedux,
  getAllCnCartonsRedux,
  getAllEmployeeRedux,
  updateEmployeeRedux,
})(PackingList);
