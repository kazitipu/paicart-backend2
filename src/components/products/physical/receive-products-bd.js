import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import {
  uploadProduct,
  uploadAliProduct,
  getSingleUser,
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
  updateEmployeeRedux,
  getAllEmployeeRedux,
} from "../../../actions";
import {
  getAllOrdersByTrackingNo,
  uploadImageRechargeRequest,
  handlePurchasingCashOut,
} from "../../../firebase/firebase.utils";
import ReactToPrint from "react-to-print";
import { toast, ToastContainer } from "react-toastify";
import StickerContent from "./sticker";
import logo from "../../../assets/images/dashboard/14.png";
import "./receive-products-bd.css";
// sandbox_environment
// const base_url = "https://sandbox.redx.com.bd/v1.0.0-beta";
// const access_token =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiaWF0IjoxNzM1NTMxNjU2LCJpc3MiOiJ0OTlnbEVnZTBUTm5MYTNvalh6MG9VaGxtNEVoamNFMyIsInNob3BfaWQiOjEsInVzZXJfaWQiOjZ9.zpKfyHK6zPBVaTrYevnCqnUA-e2jFKQJ7lK-z4aOx2g";

// live environment
const base_url = "https://openapi.redx.com.bd/v1.0.0-beta";
const access_token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3Njg5NDEiLCJpYXQiOjE3NTM4ODAxNTksImlzcyI6IkZVT2VESWVSZzlwdDRmeGUzSmRYb2tmNnZPYVFBYk1TIiwic2hvcF9pZCI6NzY4OTQxLCJ1c2VyX2lkIjoxMTY3ODQ1fQ.hDlvRuwKit8rpfz2ETnsfPW2lXT-JZS_2ZBZsMdvTfk";
export class Receive_Product_BD extends Component {
  constructor(props) {
    super(props);
    this.stream = null;
    this.printRef = React.createRef();
    this.reactToPrintRef = React.createRef();

    this.state = {
      store: "1688",
      id: "",
      availability: "in-stock",
      loader: false,
      product: null,
      orders: [],
      imageUrl: man,
      order: null,
      bdCarton: "",
      webcam: false,
      webcam2: false,
      loading: false,
      weight: "",
      user: null,
      printReady: false,
    };
  }

  componentDidMount = () => {
    const { getAllCartonsRedux, getAllEmployeeRedux } = this.props;
    getAllCartonsRedux(true);
    getAllEmployeeRedux();
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handlePrint = () => {
    setTimeout(() => {
      if (this.reactToPrintRef.current) {
        console.log("i am getting called!");
        console.log(this.state.order);
        this.reactToPrintRef.current.handlePrint();
      }
    }, 1000);
  };

  handleFormSubmit = async (event) => {
    this.setState({ loader: true });
    event.preventDefault();

    let orders = await getAllOrdersByTrackingNo(this.state.id);

    this.setState({
      id: "",
      availability: "in-stock",
      loader: false,
      orders:
        orders && orders.length > 0
          ? orders.sort((a, b) => {
              const aPriority = a.shipmentStatusScore < 6 ? 0 : 1;
              const bPriority = b.shipmentStatusScore < 6 ? 0 : 1;
              if (aPriority !== bPriority) {
                return aPriority - bPriority; // Put low scores first
              }

              return a.shipmentStatusScore - b.shipmentStatusScore;
            })
          : [],
    });
  };

  handleDiscard = () => {
    this.setState({
      id: "",
      availability: "in-stock",
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

  handleSubmit = async () => {
    const { order, orders } = this.state;
    const { cartons, employees, currentAdmin } = this.props;
    let date = new Date();
    console.log(this.state.imageUrl);

    let user = await getSingleUser(order.userId);
    this.setState({
      user: user,
    });

    if (this.state.loading) {
      alert("Pleae let the image be uploaded first.");
      return;
    }
    if (
      !this.state.imageUrl ||
      this.state.imageUrl == "/static/media/plus image.3dff302b.jpeg"
    ) {
      alert("You must upload an image before receiving the product");
      return;
    }
    if (!this.state.bdCarton) {
      alert("You must choose a carton number.");
      return;
    }
    if (!this.state.weight) {
      alert("You must enter parcel weight");
      return;
    }

    // ekhane check korbo konta pathao, konta redex, konta steadefast. then oder api hit korbo and booking diye dibo . booking er data shoho final update dibo order object
    if (this.state.bdCarton.includes("Redex")) {
      if (!order.deliveryAddress) {
        alert("This parcel has no delivery information");
        return;
      }
      if (order.deliveryAddress && !order.deliveryAddress.areaObj) {
        alert("This parcel has no proper delivery area information");
        return;
      }

      let courierObj = {
        customer_name: order.deliveryAddress.name,
        customer_phone: order.deliveryAddress.mobileNo,
        delivery_area: order.deliveryAddress.areaObj.name,
        delivery_area_id: parseInt(order.deliveryAddress.areaObj.id),
        customer_address: order.deliveryAddress.address,
        merchant_invoice_id: `${order.orderId}`,
        cash_collection_amount: `${
          this.getTotalDue(order) +
          (this.state.deliveryCharge ? parseInt(this.state.deliveryCharge) : 0)
        }`,
        parcel_weight: `${this.state.weight}` || "1",
        instruction: this.state.instruction || "",
        value: `${this.getTotalBill(order)}`,
      };

      console.log(courierObj);

      axios
        .post(`${base_url}/parcel`, courierObj, {
          headers: {
            "API-ACCESS-TOKEN": `Bearer ${access_token}`,
            "Content-Type": "application/json",
          },
        })
        .then(async (response) => {
          console.log("Success:", response.data);
          console.log(cartons);
          console.log(this.state.bdCarton);
          console.log(
            cartons.find((carton) => carton.name == this.state.bdCarton)
              ?.cartonId
          );
          await this.props.updateOrderApiRedux({
            ...order,
            orderStatus: "Paicart warehouse",
            [`Paicart warehouseDate`]: order[`Paicart warehouseDate`]
              ? order[`Paicart warehouseDate`]
              : date.toLocaleDateString("en-GB"),
            [`${this.state.orderStatus}Time`]: order[
              `${this.state.orderStatus}Time`
            ]
              ? order[`${this.state.orderStatus}Time`]
              : date.toLocaleTimeString("en-GB"),
            shipmentStatusScore: 6,
            courierName: "Redex",
            courierTrackingId: response.data.tracking_id,
            bdCarton: this.state.bdCarton,
            bdCartonId: cartons.find(
              (carton) => carton.name == this.state.bdCarton
            )?.cartonId,
            imageUrlBd: this.state.imageUrl,
            bdWeight: this.state.weight,
            deliveryCharge: this.state.deliveryCharge,
          });
          this.props.updateCartonRedux(
            cartons.find((carton) => carton.name == this.state.bdCarton)
          );
          this.setState({
            store: "1688",
            id: "",
            availability: "in-stock",
            loader: false,
            product: null,
            orders: [],
            imageUrl: man,
            bdCarton: "",
            webcam: false,
            webcam2: false,
            loading: false,
            deliveryCharge: 0,
          });
        })
        .catch((error) => {
          console.error("Error:", error.response?.data || error.message);
        });
    } else {
      await this.props.updateOrderApiRedux({
        ...order,
        orderStatus: "Paicart warehouse",
        [`Paicart warehouseDate`]: order[`Paicart warehouseDate`]
          ? order[`Paicart warehouseDate`]
          : date.toLocaleDateString("en-GB"),
        [`${this.state.orderStatus}Time`]: order[
          `${this.state.orderStatus}Time`
        ]
          ? order[`${this.state.orderStatus}Time`]
          : date.toLocaleTimeString("en-GB"),
        shipmentStatusScore: 6,
        bdCarton: this.state.bdCarton,
        bdCartonId: cartons.find((carton) => carton.name == this.state.bdCarton)
          ?.cartonId,
        imageUrlBd: this.state.imageUrl,
        bdWeight: this.state.weight,
        deliveryCharge: this.state.deliveryCharge,
      });
      this.props.updateCartonRedux(
        cartons.find((carton) => carton.name == this.state.bdCarton)
      );
      this.setState({
        store: "1688",
        id: "",
        availability: "in-stock",
        loader: false,
        product: null,
        orders: [],
        imageUrl: man,
        bdCarton: "",
        webcam: false,
        webcam2: false,
        loading: false,
        deliveryCharge: 0,
      });
    }

    // ekta sticker o banano lagbe

    // this.handlePrint();

    toast.success("Order received successfully!");
  };
  handleSubmit2 = async () => {
    const { order, orders } = this.state;
    const { cartons, employees, currentAdmin } = this.props;
    let date = new Date();
    console.log(this.state.imageUrl);

    let user = await getSingleUser(order.userId);
    this.setState({
      user: user,
    });

    if (this.state.loading) {
      alert("Pleae let the image be uploaded first.");
      return;
    }
    if (
      !this.state.imageUrl ||
      this.state.imageUrl == "/static/media/plus image.3dff302b.jpeg"
    ) {
      alert("You must upload an image before receiving the product");
      return;
    }

    if (!this.state.weight) {
      alert("You must enter parcel weight");
      return;
    }
    if (!this.state.bdCarton) {
      alert("You must choose a carton number.");
      return;
    }

    await this.props.updateOrderApiRedux({
      ...order,
      orderStatus: "Paicart warehouse",
      [`Paicart warehouseDate`]: order[`Paicart warehouseDate`]
        ? order[`Paicart warehouseDate`]
        : date.toLocaleDateString("en-GB"),
      [`${this.state.orderStatus}Time`]: order[`${this.state.orderStatus}Time`]
        ? order[`${this.state.orderStatus}Time`]
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore: 6,
      bdCarton: this.state.bdCarton,
      bdCartonId: cartons.find((carton) => carton.name == this.state.bdCarton)
        ?.cartonId,
      imageUrlBd: this.state.imageUrl,
      bdWeight: this.state.weight,
      bdIssue: this.state.bdIssue,
    });
    this.props.updateCartonRedux(
      cartons.find((carton) => carton.name == this.state.bdCarton)
    );

    // ekhane ekta transaction korte hobe agent er taka kete dite hobe shomoporiman

    // ekta sticker o banano lagbe

    this.handlePrint();

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
      webcam: false,
      webcam2: false,
      loading: false,
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
  startWebcam2 = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.stream = stream; // ✅ assign it correctly
      this.setState({
        webcam2: true,
      });
      const video = document.getElementById("webcam2");
      if (video) {
        video.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam2:", err);
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
      `webcam-photo-bd-${order.orderId}.png`
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
  capturePhoto2 = async () => {
    const { order } = this.state;
    const video = document.getElementById("webcam2");
    const canvas = document.getElementById("canvas2");

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/png");

    // Convert to file
    const file = await this.dataURLtoFile(
      dataUrl,
      `webcam2-photo-bd-${order.orderId}.png`
    );

    this.setState({ loading: true });

    const imgUrl = await uploadImageRechargeRequest(file);

    this.setState({
      imageUrl: imgUrl,
      file,
      loading: false,
      webcam2: false,
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

  _handleImgChange = async (e, i) => {
    e.preventDefault();
    const { currentAdmin } = this.props;

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl } = this.state;

    reader.onloadend = () => {
      // imageUrl = reader.result;
      this.setState({
        file: file,
        imageUrl,
      });
    };
    if (file) {
      this.setState({ loading: true });
      reader.readAsDataURL(file);
      const imgUrl = await uploadImageRechargeRequest(file);
      console.log(imgUrl);

      this.setState({
        imageUrl: imgUrl,
      });
      console.log(imageUrl);
      this.setState({ loading: false });
    }
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

  render() {
    const { loader, order } = this.state;
    const {
      currency,
      uploadCartonRedux,
      deleteCartonRedux,
      cartons,
      currentAdmin,
    } = this.props;

    let pathaoCartons = [];
    let steadFastCartons = [];
    let redexCartons = [];
    let warehouseDeliveryCartons = [];
    let repackingCartons = [];
    let issueCartons = [];

    if (cartons.length > 0) {
      pathaoCartons = cartons
        .filter((carton) => carton.cartonType == "Pathao Box")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      steadFastCartons = cartons
        .filter((carton) => carton.cartonType == "SteadFast Box")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      redexCartons = cartons
        .filter((carton) => carton.cartonType == "Redex Box")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      warehouseDeliveryCartons = cartons
        .filter((carton) => carton.cartonType == "Warehouse Delivery")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      repackingCartons = cartons
        .filter((carton) => carton.cartonType == "Repacking Box")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      issueCartons = cartons
        .filter((carton) => carton.cartonType == "Issue Box BD")
        ?.sort((a, b) => a.cartonId - b.cartonId);
    }
    console.log(this.componentRef?.innerHTML);

    return (
      <Fragment>
        <Breadcrumb title="Receive Products BD" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ background: "#f8f8f9" }}>
                <div className="card-header">
                  <h5 style={{ fontSize: 25 }}>Available Cartons</h5>
                  <h6
                    style={{
                      textDecoration: "underline",
                      color: "#7171ff",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "inline-block",
                    }}
                    data-toggle="modal"
                    data-target="#cartonModal"
                  >
                    Create Carton
                  </h6>
                </div>
                <div
                  className="card-body"
                  style={{ marginBottom: 20, background: "white" }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      1. Pathao Box:{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {pathaoCartons.length > 0 ? (
                        pathaoCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      2. SteadFast Box :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {steadFastCartons.length > 0 ? (
                        steadFastCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      3. Redex Box :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {redexCartons.length > 0 ? (
                        redexCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      4. Warehouse Delivery :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {warehouseDeliveryCartons.length > 0 ? (
                        warehouseDeliveryCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      5. Repacking Box :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {repackingCartons.length > 0 ? (
                        repackingCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "flex-start",
                      marginBottom: 15,
                    }}
                  >
                    <div
                      style={{ fontSize: 20, padding: 10, fontWeight: "bold" }}
                    >
                      6. Issue Box :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {issueCartons.length > 0 ? (
                        issueCartons.map((carton) => {
                          return (
                            <div style={{ position: "relative" }}>
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
                                }}
                                onClick={() => {
                                  this.props.history.push(
                                    `/products-physical/receive-products-bd/${carton.cartonId}`
                                  );
                                }}
                              >
                                {carton.name}
                              </div>
                              {!carton.hasProducts && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: -10,
                                    right: 0,
                                    background: "red",
                                    border: "1px solid gray",
                                    padding: 3,
                                    borderRadius: "50%",
                                    color: "white",
                                    fontWeight: "bold",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#deleteCartonModal"
                                  onClick={() => {
                                    this.setState({
                                      carton: carton,
                                    });
                                  }}
                                >
                                  ✖
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div
                          style={{
                            color: "gray",
                            fontSize: 15,
                            margin: "auto",
                          }}
                        >
                          No carton available
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="card-header">
                  <h5>Receive Products</h5>
                  <h6>Scan the QR code on the parcel</h6>
                </div>
                <div className="card-body" style={{ background: "white" }}>
                  <div className="row product-adding">
                    <div className="col-xl-12">
                      <form
                        className="needs-validation add-product-form"
                        onSubmit={this.handleFormSubmit}
                      >
                        <div className="form form-label-center">
                          <div className="form-group mb-3 row">
                            <div
                              className="col-xl-3 col-sm-4 mb-0"
                              style={{ marginTop: 0 }}
                            >
                              Order Id/Tracking No :
                            </div>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="id"
                                value={this.state.id}
                                type="text"
                                onChange={this.handleChange}
                                style={{ marginBottom: "-13px" }}
                                required
                                placeholder="Scan the (QR) code/ Enter tracking No/Order Id"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="offset-xl-3 offset-sm-4">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            style={{
                              marginLeft: 5,
                              marginTop: 10,
                              marginBottom: 20,
                            }}
                          >
                            Submit
                          </button>
                        </div>
                      </form>
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
                                    {order.shipmentStatusScore >= 6 ? (
                                      <div>
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
                                    ) : (
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
                                              deliveryCharge:
                                                order.deliveryCharge
                                                  ? order.deliveryCharge
                                                  : 0,
                                            });
                                          }}
                                        >
                                          {" "}
                                          ✔ Receive
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
                                          ✖ Issue
                                        </div>
                                      </div>
                                    )}
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
                  Receive Product
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
                  <div className="form-group" style={{ marginBottom: 30 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Enter Weight
                    </label>

                    <input
                      className="form-control"
                      name="weight"
                      value={this.state.weight}
                      type="number"
                      onChange={this.handleChange}
                      style={{ marginBottom: "-13px" }}
                      required
                      placeholder="Enter parcel weight (in kg)"
                    />
                  </div>
                  <div className="form-group" style={{ marginBottom: 30 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Delivery Charge
                    </label>

                    <input
                      className="form-control"
                      name="deliveryCharge"
                      value={this.state.deliveryCharge}
                      type="number"
                      onChange={this.handleChange}
                      style={{ marginBottom: "-13px" }}
                      required
                      placeholder="Enter local delivery charge (BD)"
                    />
                  </div>
                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Upload carton Image
                    </label>
                    <div
                      className="box-input-file"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          alignContent: "center",
                          minHeight: 200,
                          maxHeight: 200,
                          minWidth: 300,
                          maxWidth: 300,
                          border: "1px solid gainsboro",
                          borderRadius: 5,
                        }}
                      >
                        {this.state.loading ? (
                          <div
                            className="spinner-border mt-3"
                            role="status"
                            style={{ color: "red", marginLeft: 120 }}
                          >
                            <span className="sr-only">Loading...</span>
                          </div>
                        ) : !this.state.webcam ? (
                          <img
                            className="img-50 lazyloaded blur-up"
                            src={this.state.imageUrl}
                            alt="#"
                            style={{
                              zIndex: 10,
                              cursor: "pointer",
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                              minHeight: 200,
                              maxHeight: 200,
                              minWidth: 300,
                              maxWidth: 300,
                            }}
                            onClick={this.startWebcam}
                          />
                        ) : (
                          this.state.webcam && (
                            <>
                              <video
                                id="webcam"
                                autoPlay
                                playsInline
                                style={{
                                  width: 300,
                                  height: 200,
                                  borderRadius: 5,
                                  border: "1px solid gainsboro",
                                }}
                              />
                              <div>
                                <button
                                  onClick={this.capturePhoto}
                                  style={{
                                    padding: "10px 4px",
                                    borderRadius: 5,
                                    color: "white",
                                    background: "green",
                                    border: 0,
                                  }}
                                >
                                  Capture
                                </button>
                              </div>
                            </>
                          )
                        )}

                        <canvas id="canvas" style={{ display: "none" }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 3, color: "gray" }}>
                      You must upload carton image to receive the product.
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 30 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Delivery Instruction
                    </label>

                    <textarea
                      className="form-control"
                      name="instruction"
                      value={this.state.instruction}
                      type="text"
                      onChange={this.handleChange}
                      style={{
                        marginBottom: "-13px",
                        height: 100,
                        textAlign: "left",
                        verticalAlign: "top",
                      }}
                      required
                      placeholder="Enter Delivery instruction for courier company"
                    />
                  </div>
                  {this.state.bdCarton &&
                    this.state.bdCarton.includes("Redex") &&
                    order &&
                    order.deliveryAddress && (
                      <div className="form-group" style={{ marginTop: 20 }}>
                        <div style={{ fontWeight: "bold" }}>
                          Courier Information
                        </div>
                        <div>Customer name: {order.deliveryAddress.name}</div>
                        <div>
                          Customer Phone: {order.deliveryAddress.mobileNo}
                        </div>
                        <div>
                          Delivery Area: {order.deliveryAddress.areaObj?.name}
                        </div>
                        <div>Area Id: {order.deliveryAddress.areaObj?.id}</div>
                        <div>
                          Customer Address: {order.deliveryAddress.address}
                        </div>
                        <div>Invoice Id: {order.orderId}</div>
                        <div>
                          Cash On Delivery:{" "}
                          {this.getTotalDue(order) +
                            (this.state.deliveryCharge
                              ? parseInt(this.state.deliveryCharge)
                              : 0)}{" "}
                          Tk
                        </div>
                        <div>Parcel Weight: {this.state.weight || 0}Kg</div>
                        <div>
                          Instruction:
                          {this.state.instruction || "No Delivery Instruction"}
                        </div>
                      </div>
                    )}
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
                  Receive in BD warehouse
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
                      <option value="Pathao Box">Pathao Box</option>
                      <option value="SteadFast Box">SteadFast Box</option>
                      <option value="Redex Box">Redex Box</option>
                      <option value="Warehouse Delivery">
                        Warehouse Delivery
                      </option>
                      <option value="Repacking Box">Repacking Box</option>

                      <option value="Issue Box BD">Issue Box BD</option>
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
                    if (!this.state.bdCarton) {
                      alert("You must a choose a carton type.");
                      return;
                    }
                    let chosedCartonsPreviousLength = cartons.filter(
                      (carton) => carton.cartonType == this.state.bdCarton
                    )?.length;
                    console.log(chosedCartonsPreviousLength);
                    await uploadCartonRedux({
                      cartonType: this.state.bdCarton,
                      name: `${this.state.bdCarton}-${
                        chosedCartonsPreviousLength + 1
                      }`,
                      cartonId: date.getTime().toString(),
                      bd: true,
                    });
                    this.setState({
                      bdCarton: "",
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
                  Receive Products with issues
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
                          .filter(
                            (carton) => carton.cartonType == "Issue Box BD"
                          )
                          .map((carton) => {
                            return (
                              <option value={carton.name}>{carton.name}</option>
                            );
                          })}
                    </select>
                  </div>
                  <div className="form-group" style={{ marginBottom: 30 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Enter Weight
                    </label>

                    <input
                      className="form-control"
                      name="weight"
                      value={this.state.weight}
                      type="number"
                      onChange={this.handleChange}
                      style={{ marginBottom: "-13px" }}
                      required
                      placeholder="Enter parcel weight (in kg)"
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Note (issue)
                    </label>
                    <textarea
                      type="text"
                      className="form-control"
                      name="bdIssue"
                      value={this.state.bdIssue}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter a brief note about the carton issue"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                        textAlign: "start",
                        height: 100,
                      }}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: 10 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Upload carton Image
                    </label>
                    <div
                      className="box-input-file"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          alignContent: "center",
                          minHeight: 200,
                          maxHeight: 200,
                          minWidth: 300,
                          maxWidth: 300,
                          border: "1px solid gainsboro",
                          borderRadius: 5,
                        }}
                      >
                        {this.state.loading ? (
                          <div
                            className="spinner-border mt-3"
                            role="status"
                            style={{ color: "red", marginLeft: 120 }}
                          >
                            <span className="sr-only">Loading...</span>
                          </div>
                        ) : !this.state.webcam2 ? (
                          <img
                            className="img-50 lazyloaded blur-up"
                            src={this.state.imageUrl}
                            alt="#"
                            style={{
                              zIndex: 10,
                              cursor: "pointer",
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                              minHeight: 200,
                              maxHeight: 200,
                              minWidth: 300,
                              maxWidth: 300,
                            }}
                            onClick={this.startWebcam2}
                          />
                        ) : (
                          this.state.webcam2 && (
                            <>
                              <video
                                id="webcam2"
                                autoPlay
                                playsInline
                                style={{
                                  width: 300,
                                  height: 200,
                                  borderRadius: 5,
                                  border: "1px solid gainsboro",
                                }}
                              />
                              <div>
                                <button
                                  onClick={this.capturePhoto2}
                                  style={{
                                    padding: "10px 4px",
                                    borderRadius: 5,
                                    color: "white",
                                    background: "green",
                                    border: 0,
                                  }}
                                >
                                  Capture
                                </button>
                              </div>
                            </>
                          )
                        )}

                        <canvas id="canvas2" style={{ display: "none" }} />
                      </div>
                    </div>
                    <div style={{ marginTop: 3, color: "gray" }}>
                      You must upload carton image to receive the product.
                    </div>
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
                    this.handleSubmit2();
                  }}
                >
                  Add to issues
                </button>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        {/* <ReactToPrint
          content={() => this.componentRef}
          ref={this.reactToPrintRef}
          trigger={() => <></>}
          // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
          // to the root node of the returned component as it will be overwritten.
        />
        <StickerContent
          ref={(el) => (this.componentRef = el)}
          order={this.state.order}
          user={this.state.user}
          weight={this.state.weight}
        /> */}
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
  updateEmployeeRedux,
  getAllEmployeeRedux,
})(Receive_Product_BD);
