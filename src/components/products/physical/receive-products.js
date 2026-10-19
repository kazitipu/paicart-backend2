import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import {
  uploadProduct,
  uploadAliProduct,
  getSingleUser,
  getSingleCarton,
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
  getAllCnCartonsRedux,
  updateEmployeeRedux,
  getAllEmployeeRedux,
} from "../../../actions";
import {
  getAllOrdersByTrackingNo,
  uploadImageRechargeRequest,
  handlePurchasingCashOut,
  uploadCartonBooking,
} from "../../../firebase/firebase.utils";
import ReactToPrint from "react-to-print";
import { toast, ToastContainer } from "react-toastify";
import StickerContent from "./sticker";
import logo from "../../../assets/images/dashboard/14.png";
import FullPageLoader from "./fullPageLoader";
export class Receive_Product extends Component {
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
      chineseCarton: "",
      webcam: false,
      webcam2: false,
      loading: false,
      weight: "",
      user: null,
      printReady: false,
      selectedCartonsArray: [],
      lotNo: "",
      bookingLoader: false,
    };
  }

  componentDidMount = () => {
    const { getAllCnCartonsRedux, getAllEmployeeRedux } = this.props;
    getAllCnCartonsRedux();
    getAllEmployeeRedux();
    this.handlePrint();
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
    let cartons = [];
    for (let i = 0; i < orders.length; i++) {
      const element = orders[i];
      let carton = await getSingleCarton(element.chinseseCartonId);
      if (carton) {
        cartons.push(carton);
      }
    }
    this.setState({
      id: "",
      availability: "in-stock",
      loader: false,
      cartons: cartons,
      orders:
        orders && orders.length > 0
          ? orders.sort((a, b) => {
              const aPriority = a.shipmentStatusScore < 3 ? 0 : 1;
              const bPriority = b.shipmentStatusScore < 3 ? 0 : 1;
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
    if (!this.state.chineseCarton) {
      alert("You must choose a carton number.");
      return;
    }
    if (!this.state.weight) {
      alert("You must enter parcel weight");
      return;
    }
    if (!order.purchasingRmb || order.purchasingRmb == 0) {
      alert("Call Bangladesh Agent to enter purchasing rmb");
      return;
    }
    await this.props.updateOrderApiRedux({
      ...order,
      orderStatus: "Received in Warehouse",
      [`Received in WarehouseDate`]: order[`Received in WarehouseDate`]
        ? order[`Received in WarehouseDate`]
        : date.toLocaleDateString("en-GB"),
      [`${this.state.orderStatus}Time`]: order[`${this.state.orderStatus}Time`]
        ? order[`${this.state.orderStatus}Time`]
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore: 3,
      chineseCarton: this.state.chineseCarton,
      chinseseCartonId: cartons.find(
        (carton) => carton.name == this.state.chineseCarton
      )?.cartonId,
      imageUrl: this.state.imageUrl,
      chineseWeight: this.state.weight,
    });
    this.props.updateCartonRedux(
      cartons.find((carton) => carton.name == this.state.chineseCarton)
    );

    // ekhane ekta transaction korte hobe agent er taka kete dite hobe shomoporiman
    if (this.state.chineseCarton.includes("Issue Box")) {
    } else {
      let rmbBalance =
        parseFloat(selectedEmployee.rmbBalance) -
        parseFloat(order.purchasingRmb);

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
    }

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
  handleSubmit2 = async () => {
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
      orderStatus: "Received in Warehouse",
      [`Received in WarehouseDate`]: order[`Received in WarehouseDate`]
        ? order[`Received in WarehouseDate`]
        : date.toLocaleDateString("en-GB"),
      [`${this.state.orderStatus}Time`]: order[`${this.state.orderStatus}Time`]
        ? order[`${this.state.orderStatus}Time`]
        : date.toLocaleTimeString("en-GB"),
      shipmentStatusScore: 3,
      chineseCarton: this.state.chineseCarton,
      chinseseCartonId: cartons.find(
        (carton) => carton.name == this.state.chineseCarton
      )?.cartonId,
      imageUrl: this.state.imageUrl,
      chineseWeight: this.state.weight,
      chineseIssue: this.state.chineseIssue,
    });
    this.props.updateCartonRedux(
      cartons.find((carton) => carton.name == this.state.chineseCarton)
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
      `webcam-photo-cn-${order.orderId}.png`
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
      `webcam2-photo-cn-${order.orderId}.png`
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

  render() {
    const { loader, order } = this.state;
    const {
      currency,
      uploadCartonRedux,
      deleteCartonRedux,
      cartons,
      currentAdmin,
    } = this.props;

    let shoesCartons = [];
    let clothingCartons = [];
    let bagCartons = [];
    let cosmeticsCartons = [];
    let jewelryCartons = [];
    let machinaryCartons = [];
    let batteryCartons = [];
    let chinaMixCartons = [];
    let hongkongMixCartons = [];
    let issueCartons = [];
    if (cartons.length > 0) {
      shoesCartons = cartons
        .filter((carton) => carton.cartonType == "Shoes")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      clothingCartons = cartons
        .filter((carton) => carton.cartonType == "Clothing")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      bagCartons = cartons
        .filter((carton) => carton.cartonType == "Bag")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      cosmeticsCartons = cartons
        .filter((carton) => carton.cartonType == "Cosmetics")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      jewelryCartons = cartons
        .filter((carton) => carton.cartonType == "Jewelry")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      machinaryCartons = cartons
        .filter((carton) => carton.cartonType == "Machinary + Parts")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      batteryCartons = cartons
        .filter((carton) => carton.cartonType == "Battery Item")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      chinaMixCartons = cartons
        .filter((carton) => carton.cartonType == "China Mix")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      hongkongMixCartons = cartons
        .filter((carton) => carton.cartonType == "Hongkong Mix")
        ?.sort((a, b) => a.cartonId - b.cartonId);
      issueCartons = cartons
        .filter((carton) => carton.cartonType == "Issue Box")
        ?.sort((a, b) => a.cartonId - b.cartonId);
    }

    return (
      <Fragment>
        <Breadcrumb title="Receive Products" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ background: "#f8f8f9" }}>
                <div>
                  <div
                    className="card-header"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
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
                    <div>
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 10,
                          border: "1px solid gray",
                          color: "white",
                          background: "black",
                          cursor: "pointer",
                          fontWeight: "bold",
                        }}
                        data-toggle="modal"
                        data-target="#bookingModal"
                      >
                        Book Now
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="card-body"
                  style={{ marginBottom: 20, background: "white" }}
                >
                  <h6
                    style={{
                      textDecoration: "underline",
                      color: "#7171ff",
                      fontWeight: "bold",
                      cursor: "pointer",
                      marginBottom: 20,
                    }}
                    onClick={() => {
                      this.props.history.push(
                        `/products-physical/recently-booked-cartons`
                      );
                    }}
                  >
                    Recently Booked Cartons
                  </h6>
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
                      1. Shoes :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {shoesCartons.length > 0 ? (
                        shoesCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      2. Clothing :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {clothingCartons.length > 0 ? (
                        clothingCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      3. Bag :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {bagCartons.length > 0 ? (
                        bagCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      4. Cosmetics :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {cosmeticsCartons.length > 0 ? (
                        cosmeticsCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      5. Jewelry :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {jewelryCartons.length > 0 ? (
                        jewelryCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      6. Machinary + Parts :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {machinaryCartons.length > 0 ? (
                        machinaryCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      7. Battery Item :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {batteryCartons.length > 0 ? (
                        batteryCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      8. China Mix :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {chinaMixCartons.length > 0 ? (
                        chinaMixCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      9. Hongkong Mix :{" "}
                    </div>{" "}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "flex-start",
                      }}
                    >
                      {hongkongMixCartons.length > 0 ? (
                        hongkongMixCartons.map((carton) => {
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                      10. Issue Box:{" "}
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
                                    `/products-physical/receive-products/${carton.cartonId}`
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
                                  {order.shipmentStatusScore >= 3 ? (
                                    <div>
                                      {" "}
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
                                        {this.state.cartons &&
                                          this.state.cartons.length > 0 &&
                                          this.state.cartons.find(
                                            (carton) =>
                                              carton.cartonId ==
                                              order.chinseseCartonId
                                          )?.lotNo}
                                      </div>
                                      {order.lotNo &&
                                        order.lotNo.length > 0 && (
                                          <div style={{ fontWeight: "bold" }}>
                                            Lot No (shipment): {order.lotNo[0]}
                                          </div>
                                        )}
                                      {order.ctnNo &&
                                        order.ctnNo.length > 0 && (
                                          <div style={{ fontWeight: "bold" }}>
                                            Carton No (shipment):{" "}
                                            {order.ctnNo.map(
                                              (ctn) => `${ctn},`
                                            )}
                                          </div>
                                        )}
                                      <div style={{ fontWeight: "bold" }}>
                                        Total Weight (china warehouse):{" "}
                                        {order.chineseWeight} kg
                                      </div>
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
                      <option value="Issue Box">Issue Box</option>
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
                      bd: false,
                      lotNo: "",
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
          id="bookingModal"
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
                  Book Carton for Shipment
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
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Enter Lot No
                    </label>

                    <input
                      className="form-control"
                      name="lotNo"
                      value={this.state.lotNo}
                      type="text"
                      onChange={this.handleChange}
                      style={{ marginBottom: "-13px" }}
                      required
                      placeholder="Enter the same lot no as ALG limited"
                    />
                  </div>
                  <div style={{ minWidth: 250, marginTop: 20 }}>
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Choose Cartons
                    </label>
                    <select
                      title=""
                      name="chineseCarton"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={(e) => {
                        const { name, value } = e.target;
                        this.setState({
                          selectedCartonsArray: [
                            ...this.state.selectedCartonsArray,
                            value,
                          ],
                        });
                      }}
                      style={{ fontSize: ".8rem" }}
                      value={this.state.chineseCarton}
                      required
                    >
                      <option value="">Select Carton</option>
                      {cartons.length > 0 &&
                        cartons
                          .filter(
                            (carton) =>
                              carton.hasProducts &&
                              !carton.lotNo &&
                              carton.cartonType !== "Issue Box" &&
                              !this.state.selectedCartonsArray.includes(
                                carton.name
                              )
                          )
                          .map((carton) => {
                            return (
                              <option value={carton.name}>{carton.name}</option>
                            );
                          })}
                    </select>
                  </div>
                  <div style={{ marginTop: 10 }}>
                    <div
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                      }}
                    >
                      {" "}
                      Selected Cartons
                    </div>
                    <div
                      style={{
                        marginTop: 5,
                        display: "flex",
                        flexDirection: "row",
                        flexWrap: "wrap",
                        rowGap: 5,
                      }}
                    >
                      {this.state.selectedCartonsArray.map((carton) => {
                        return (
                          <div
                            style={{
                              padding: "4px 7px",
                              background: "green",
                              borderRadius: 3,
                              color: "white",
                              display: "inline",
                              marginRight: 7,
                            }}
                          >
                            {carton}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div style={{ marginTop: 5, fontWeight: "bold" }}>
                    {this.state.selectedCartonsArray.length} cartons is selected
                    for shipment
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
                    if (this.state.selectedCartonsArray.length == 0) {
                      alert("You must choose atlease one carton for booking.");
                      return;
                    }
                    if (!this.state.lotNo) {
                      alert("You must enter lot no.");
                      return;
                    }
                    this.setState({
                      bookingLoader: true,
                    });
                    let hasFinished = false;

                    for (
                      let i = 0;
                      i < this.state.selectedCartonsArray.length;
                      i++
                    ) {
                      const element = this.state.selectedCartonsArray[i];
                      await this.props.updateCartonRedux({
                        ...cartons.find((carton) => carton.name == element),
                        lotNo: this.state.lotNo,
                      });
                      if (i + 1 == this.state.selectedCartonsArray.length) {
                        hasFinished = true;
                      }
                    }
                    let selectedCartons = cartons.filter((carton) =>
                      this.state.selectedCartonsArray.includes(carton.name)
                    );
                    await uploadCartonBooking({
                      lotNo: this.state.lotNo,
                      cartons: selectedCartons,
                    });
                    if (hasFinished) {
                      this.setState({
                        chineseCarton: "",
                        selectedCartonsArray: [],
                        bookingLoader: false,
                      });
                    }
                  }}
                >
                  Book now
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
                          .filter((carton) => carton.cartonType == "Issue Box")
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
                      name="chineseIssue"
                      value={this.state.chineseIssue}
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
        <ReactToPrint
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
        />
        {this.state.bookingLoader && <FullPageLoader />}
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
    cartons: state.cartons.cartons.filter((carton) => !carton.lotNo),
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCnCartonsRedux,
  updateEmployeeRedux,
  getAllEmployeeRedux,
})(Receive_Product);
