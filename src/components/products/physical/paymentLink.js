import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllPartialsRedux,
  uploadPartialRedux,
  updatePartialRedux,
  deletePartialRedux,
} from "../../../actions";
import {
  uploadImageRechargeRequest,
  getFreeShipping,
  uploadfreeShipping,
  get1688PaymentsByDateRange,
  getSinglePayment1688,
  updatepaymentLink1688,
  updatepaymentLink,
  removeOrderFromPaymentLink,
} from "../../../firebase/firebase.utils";
import man from "./plus image.jpeg";
import { Search } from "react-feather";
import {
  generate1688PaymentLink,
  lastPaymentLinkError,
} from "../../../actions/get1688Data";
import { getDefaultDateRange } from "../../../constants/dateRange";
import { Badge, Button, StatTile, StatRow } from "../../common/listUi.jsx";
import "../../common/list-modern.css";

// The 1688 alipay.url.get API reports the offending order number(s) inside
// square brackets in erroMsg, e.g. "订单不存在或者订单不是待支付状态。[3315753804913147867]"
const extractFailingOrderNumbers = (errorData) => {
  if (!errorData || !errorData.erroMsg) return [];
  const bracketMatches = errorData.erroMsg.match(/\[([^\]]+)\]/g) || [];
  return bracketMatches
    .flatMap((match) => match.replace(/[\[\]]/g, "").split(","))
    .map((orderNumber) => orderNumber.trim())
    .filter(Boolean);
};
export class PartialPayment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      expirationDate: "",
      payNow100: "",
      payNow80: "",
      payNow60: "",
      searchFor: "",
      day: "",
      week: "",
      month: "",
      year: "",
      customStart: "",
      customEnd: "",
      linkStatus: "",
      rmbStatus: "",
      data: [],
      imageUrl: man,
      loading: false,
    };
  }

  componentDidMount() {
    // Local calendar days - toISOString() reports the UTC date, which before
    // 6am in Dhaka is yesterday.
    const { startDate, endDate } = getDefaultDateRange(30);
    this.setState({
      customStart: startDate,
      customEnd: endDate,
    });
    this.loadLast30Days(startDate, endDate);
  }

  loadLast30Days = async (startDate, endDate) => {
    const data = await get1688PaymentsByDateRange(startDate, endDate);
    console.log("Last 30 days data:", data);

    this.setState({ data: data });
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  handleTypeChange = (e) => {
    this.setState({ type: e.target.value });
  };

  applyRange = async () => {
    const { type, customStart, customEnd, linkStatus, rmbStatus } = this.state;
    console.log(customStart);
    console.log(customEnd);
    if (customStart && customEnd) {
      let data = await get1688PaymentsByDateRange(
        customStart,
        customEnd,
        linkStatus,
        rmbStatus
      );
      this.setState({
        data: data,
      });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
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
  _handleImgChange2 = async (e, i) => {
    e.preventDefault();
    const { currentAdmin } = this.props;

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl2 } = this.state;

    reader.onloadend = () => {
      // imageUrl = reader.result;
      this.setState({
        file: file,
        imageUrl2,
      });
    };
    if (file) {
      this.setState({ loading2: true });
      reader.readAsDataURL(file);
      const imgUrl = await uploadImageRechargeRequest(file);
      console.log(imgUrl);

      this.setState({
        imageUrl2: imgUrl,
      });
      this.setState({ loading2: false });
    }
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
    if (this.state.partial && this.state.rmbRate && this.state.totalRmb) {
      let updatedPaymenObj = await updatepaymentLink1688(
        this.state.partial,
        this.state.rmbRate,
        this.state.totalRmb,
        this.state.imageUrl
      );
      this.setState({
        data: updatedPaymenObj
          ? this.state.data.map((paymentObj) => {
              if (paymentObj.paymentId == updatedPaymenObj.paymentId) {
                return {
                  ...updatedPaymenObj,
                  rmbRate: this.state.rmbRate,
                  rmbStatus: "Paid",
                };
              } else {
                return paymentObj;
              }
            })
          : this.state.data,
      });
    } else {
      alert("Please fill the missing data.");
    }

    this.setState({
      searchFor: "",
    });
  };
  handleSubmit2 = async (e) => {
    e.preventDefault();
    if (!this.state.searchFor) {
      alert("Payment Id cant be empty.");
      return;
    }
    let paymentObj1688 = await getSinglePayment1688(this.state.searchFor);
    if (paymentObj1688) {
      this.setState({
        paymentObj1688,
      });
    } else {
      alert("Sorry no payment is found with this payment Id");
    }
    console.log("handle submit 2 is getting called!");
  };

  render() {
    const { open, productObj } = this.state;
    const { partials, currentAdmin } = this.props;
    const { customStart, customEnd, data, paymentObj1688 } = this.state;
    let renderablePartials = data;

    if (paymentObj1688) {
      renderablePartials = [paymentObj1688];
    }

    renderablePartials = renderablePartials.sort(
      (a, b) => parseInt(b.paymentId) - parseInt(a.paymentId)
    );
    let totalRmb = 0;
    let totalRmbPaid = 0;
    renderablePartials.map((payment) => {
      totalRmb += parseFloat(payment.totalRmb);
      if (payment.totalRmbPaid) {
        totalRmbPaid += parseFloat(payment.totalRmbPaid);
      }
    });
    console.log(renderablePartials);
    return (
      <Fragment>
        <Breadcrumb title={"1688 Payment Link"} parent="1688-orders" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <div className="col-sm-12">
              <div
                className="card"
                style={{
                  border: "1px solid #e9eef5",
                  borderRadius: 14,
                  boxShadow: "0 1px 2px rgba(15,23,42,.04)",
                  overflow: "hidden",
                }}
              >
                <div
                  className="card-header"
                  style={{ padding: "20px 24px 0", border: "none" }}
                >
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 20,
                      }}
                    >
                      1688 Payment Links
                    </h5>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "#94a3b8",
                      }}
                    >
                      {renderablePartials.length}{" "}
                      {renderablePartials.length === 1 ? "link" : "links"} in this range
                    </p>
                  </div>

                  {/* Filters. This range queries Firestore, so it needs Apply. */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      margin: "16px 0 20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: "1 1 280px",
                        maxWidth: 420,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      <Search size={16} color="#94a3b8" />
                      <input
                        name="searchFor"
                        value={this.state.searchFor}
                        type="search"
                        placeholder="Search by Payment ID"
                        onChange={this.handleSearchBarChange}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") this.handleSubmit2(e);
                        }}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          padding: "10px 0",
                          fontSize: 13,
                          width: "100%",
                          color: "#0f172a",
                        }}
                      />
                    </div>

                    <select
                      name="linkStatus"
                      onChange={this.handleChange}
                      value={this.state.linkStatus}
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#0f172a",
                        outline: "none",
                      }}
                    >
                      <option value="">All Link Status</option>
                      <option value="Paid">Link Paid</option>
                      <option value="Not Paid">Link Not Paid</option>
                    </select>

                    <select
                      name="rmbStatus"
                      onChange={this.handleChange}
                      value={this.state.rmbStatus}
                      style={{
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "#0f172a",
                        outline: "none",
                      }}
                    >
                      <option value="">All RMB Status</option>
                      <option value="Paid">RMB Paid</option>
                      <option value="Not Paid">RMB Not Paid</option>
                    </select>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "4px 6px 4px 10px",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Created
                      </span>
                      <input
                        type="date"
                        name="customStart"
                        value={customStart}
                        onChange={this.handleChange}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: 12.5,
                          color: "#0f172a",
                          padding: "6px 0",
                        }}
                      />
                      <span style={{ color: "#cbd5e1" }}>–</span>
                      <input
                        type="date"
                        name="customEnd"
                        value={customEnd}
                        min={customStart}
                        onChange={this.handleChange}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: 12.5,
                          color: "#0f172a",
                          padding: "6px 0",
                        }}
                      />
                      <Button
                        variant="dark"
                        onClick={this.applyRange}
                        style={{ padding: "6px 14px" }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>

                  <StatRow>
                    <StatTile
                      tone="teal"
                      label="Total RMB"
                      value={`¥ ${parseFloat(totalRmb).toFixed(2)}`}
                      hint="linked orders"
                    />
                    <StatTile
                      tone="green"
                      label="RMB Paid"
                      value={`¥ ${parseFloat(totalRmbPaid).toFixed(2)}`}
                    />
                    <StatTile
                      tone={
                        totalRmb - totalRmbPaid > 0 ? "orange" : "green"
                      }
                      label="RMB Outstanding"
                      value={`¥ ${parseFloat(
                        Math.max(totalRmb - totalRmbPaid, 0)
                      ).toFixed(2)}`}
                    />
                    <StatTile
                      tone="gray"
                      label="Payment Links"
                      value={renderablePartials.length}
                    />
                  </StatRow>
                </div>

                <div
                  className="card-body"
                  style={{ paddingTop: 0, borderTop: "1px solid #eef2f7" }}
                >
                  <div className="clearfix"></div>
                  <div
                    id="basicScenario"
                    className="product-physical list-modern paylink-modern"
                  >
                    <table className="table table-bordered table-striped table-hover">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                          >
                            Payment ID
                          </th>
                          <th
                            scope="col"
                          >
                            Payment Link
                          </th>
                          <th
                            scope="col"
                          >
                            Total Amount
                          </th>
                          <th
                            scope="col"
                          >
                            Link Paid
                          </th>

                          <th
                            scope="col"
                          >
                            RMB Paid
                          </th>

                          <th
                            scope="col"
                          >
                            Orders
                          </th>
                          <th
                            scope="col"
                          >
                            Payment Receipt
                          </th>
                          <th
                            scope="col"
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderablePartials.map((partial, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: "bold" }}>
                              {partial.date}
                            </td>
                            <td>{partial.paymentId}</td>
                            <td>
                              <div>{partial.paymentLink}</div> <br />
                              {partial.rmbStatus !== "Paid" && (
                                <div
                                  style={{
                                    padding: "2px 5px",
                                    borderRadius: 5,
                                    color: "white",
                                    fontSize: 11,
                                    fontWeight: "bold",
                                    background: "darkorange",
                                    display: "inline-block",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#request_payment"
                                  onClick={() => {
                                    this.setState({
                                      partial: partial,
                                    });
                                  }}
                                >
                                  Regenerate
                                </div>
                              )}{" "}
                            </td>
                            <td
                              style={{
                                verticalAlign: "top",
                                textAlign: "left",
                              }}
                            >
                              <div>
                                <div
                                  style={{
                                    color: "black",
                                    fontWeight: "bold",
                                  }}
                                >
                                  BDT:
                                  {partial.totalRmbPaid * partial.rmbRate
                                    ? `Tk ${parseInt(
                                        partial.totalRmbPaid * partial.rmbRate
                                      )}`
                                    : ""}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#555",
                                    marginTop: 5,
                                  }}
                                >
                                  Rmb: ¥{partial.totalRmb}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#555",
                                    marginTop: 5,
                                  }}
                                >
                                  Rmb(paid): ¥{partial.totalRmbPaid}
                                </div>
                                <div
                                  style={{
                                    fontSize: 13,
                                    color: "#555",
                                    marginTop: 5,
                                  }}
                                >
                                  Rmb Rate:{" "}
                                  {partial.rmbRate ? `¥${partial.rmbRate}` : ""}
                                </div>
                              </div>
                            </td>
                            <td>
                              <Badge
                                tone={
                                  partial.linkStatus == "Not Paid" ? "red" : "green"
                                }
                              >
                                {partial.linkStatus}
                              </Badge>
                            </td>
                            <td>
                              {" "}
                              <Badge
                                tone={
                                  partial.rmbStatus == "Not Paid" ? "red" : "green"
                                }
                              >
                                {partial.rmbStatus}
                              </Badge>
                            </td>
                            <td>
                              {" "}
                              <Button
                                variant="subtle"
                                data-toggle="modal"
                                data-target="#orderData"
                                onClick={() => {
                                  this.setState({
                                    paymentObj: partial,
                                  });
                                }}
                              >
                                Orders
                              </Button>
                            </td>
                            <td>
                              <a href={partial.receipt} target="_blank">
                                <img
                                  style={{ height: 100, width: 150 }}
                                  src={partial.receipt || this.state.imageUrl}
                                />
                              </a>
                            </td>

                            <td>
                              <div
                                className="row"
                                style={{ justifyContent: "center" }}
                              >
                                {partial.rmbStatus !== "Paid" && (
                                  <i
                                    className="icofont-edit"
                                    data-toggle="modal"
                                    data-target="#personalInfoModal"
                                    onClick={() => {
                                      this.setState({
                                        rmbRate: partial.rmbRate
                                          ? partial.rmbRate
                                          : "",
                                        totalRmb: partial.totalRmbPaid
                                          ? partial.totalRmbPaid
                                          : "",
                                        imageUrl: partial.receipt
                                          ? partial.receipt
                                          : man,
                                        partial: partial,
                                        searchFor: "",
                                      });
                                    }}
                                    style={{
                                      color: "green",
                                      marginRight: 8,
                                      cursor: "pointer",
                                    }}
                                  />
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
        <div
          className="modal fade"
          id="orderData"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto", minWidth: "60%" }}
          >
            <div className="modal-content" style={{ top: 10, margin: "auto" }}>
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
                  Order Summary
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
              {this.state.paymentObj &&
                this.state.paymentObj.orders.length > 0 && (
                  <div className="modal-body">
                    <div className="row" style={{ padding: 20 }}>
                      <table className="table table-bordered table-striped table-hover">
                        <thead
                          style={{ background: "#18768f", color: "white" }}
                        >
                          <tr>
                            <td style={{ fontWeight: "bold" }}>Product</td>
                            <td style={{ fontWeight: "bold" }}>Name</td>
                            <td style={{ fontWeight: "bold" }}>Order Number</td>

                            <td style={{ fontWeight: "bold" }}>Total</td>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.paymentObj.orders.map((order) => (
                            <tr>
                              <td>
                                <img
                                  src={order.items[0].picture}
                                  style={{
                                    height: 70,
                                    width: 70,
                                    borderRadius: 5,
                                  }}
                                />
                              </td>
                              <td>{order.items[0].name.slice(0, 100)}</td>
                              <td>{order.orderNumber}</td>
                              <td>
                                <div>
                                  ¥
                                  {order.creationTime1688
                                    ? order.creationTime1688.totalSuccessAmount
                                    : 0}
                                </div>
                                <div style={{ fontSize: 12, color: "#777" }}>
                                  Post fee: ¥
                                  {order.creationTime1688 &&
                                  order.creationTime1688.postFee
                                    ? order.creationTime1688.postFee
                                    : 0}
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td></td>
                            <td></td>
                            <td>Total</td>
                            <td>
                              ¥
                              {(this.state.paymentObj &&
                                this.state.paymentObj.totalRmb) ||
                                0}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
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
                  Make new payment <br />
                  Payment Id: {this.state.partial?.paymentId}
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
              <div className="modal-body" style={{ paddingTop: 5 }}>
                <div style={{ padding: "10px 15px", paddingTop: 0 }}>
                  <div
                    style={{ color: "gray", fontSize: 13, marginBottom: 10 }}
                  >
                    বিশেষ দ্রষ্টব্য:পেমেন্ট Amount আপনার দৈনিক ক্যাশ ব্যালেন্স
                    থেকে বিয়োগ হবে।
                  </div>

                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Total RMB (in receipt)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalRmb"
                      value={this.state.totalRmb}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter Rmb Rate"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
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
                      Rmb Rate
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="rmbRate"
                      value={this.state.rmbRate}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter Rmb Rate"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <div className="form-group mb-4">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Payment Receipt
                    </label>
                    <div
                      className="box-input-file"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      {this.state.loading ? (
                        <div
                          className="spinner-border text-light mt-3 ml-2"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <img
                            className="img-100 lazyloaded blur-up"
                            src={this.state.imageUrl}
                            alt="#"
                            style={{
                              zIndex: 10,
                              cursor: "pointer",
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                              minHeight: 100,
                              maxHeight: 100,
                              minWidth: 150,
                              maxWidth: 150,
                            }}
                            onClick={() => {
                              document
                                .getElementById("upload-image-input")
                                .click();
                            }}
                          />

                          <input
                            id="upload-image-input"
                            className="upload"
                            type="file"
                            style={{
                              position: "absolute",
                              zIndex: 5,
                              maxWidth: "50px",
                              marginTop: "20px",
                            }}
                            onChange={(e) => this._handleImgChange(e, 0)}
                          />
                        </>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ fontSize: 14 }}>
                      Total Rmb:
                      {this.state.totalRmb ? `¥ ${this.state.totalRmb}` : ""}
                    </div>
                    <div style={{ marginTop: 5, fontSize: 14 }}>
                      Rmb Rate:{" "}
                      {this.state.rmbRate ? `Tk ${this.state.rmbRate}` : ""}
                    </div>
                    <div
                      style={{ marginTop: 5, fontSize: 22, fontWeight: "bold" }}
                    >
                      Total BDT: Tk
                      {this.state.rmbRate * this.state.totalRmb
                        ? parseInt(this.state.rmbRate * this.state.totalRmb)
                        : 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss={"modal"}
                  style={{
                    backgroundColor: "darkorange",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={() => {
                    if (this.state.loading) {
                      alert("Wait your image is being uploaded");
                      return;
                    }
                    if (
                      this.state.imageUrl ==
                      "/static/media/plus image.3dff302b.jpeg"
                    ) {
                      alert("Please upload payment receipt");
                      return;
                    }
                    if (this.state.rmbRate && this.state.totalRmb) {
                      this.handleSubmit();
                    } else {
                      alert("Please enter all missing information");
                    }
                  }}
                >
                  Cash Out
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="request_payment"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto", minWidth: "60%" }}
          >
            <div className="modal-content" style={{ top: 10, margin: "auto" }}>
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
                  Request for Payment
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
              {this.state.partial?.orders &&
                this.state.partial?.orders.length > 0 && (
                  <div className="modal-body">
                    <div className="row" style={{ padding: 20 }}>
                      <table className="table table-bordered table-striped table-hover">
                        <thead
                          style={{ background: "#18768f", color: "white" }}
                        >
                          <tr>
                            <td style={{ fontWeight: "bold" }}>Product</td>
                            <td style={{ fontWeight: "bold" }}>Name</td>
                            <td style={{ fontWeight: "bold" }}>Order Number</td>

                            <td style={{ fontWeight: "bold" }}>Total</td>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.partial?.orders.map((order) => (
                            <tr>
                              <td>
                                <img
                                  src={order.items[0].picture}
                                  style={{
                                    height: 70,
                                    width: 70,
                                    borderRadius: 5,
                                  }}
                                />
                              </td>
                              <td>{order.items[0].name.slice(0, 100)}</td>
                              <td>{order.orderNumber}</td>
                              <td>
                                <div>
                                  ¥
                                  {order.creationTime1688
                                    ? order.creationTime1688.totalSuccessAmount
                                    : 0}
                                </div>
                                <div style={{ fontSize: 12, color: "#777" }}>
                                  Post fee: ¥
                                  {order.creationTime1688 &&
                                  order.creationTime1688.postFee
                                    ? order.creationTime1688.postFee
                                    : 0}
                                </div>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td></td>
                            <td></td>
                            <td>Total</td>
                            <td>¥{this.state.partial?.totalRmb || 0}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {this.state.link && (
                      <div>
                        Payment Link:{" "}
                        <a href={this.state.link} target="_blank">
                          {this.state.link}
                        </a>
                      </div>
                    )}
                  </div>
                )}

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
                {this.state.link ? (
                  <button
                    type="button"
                    className="btn "
                    data-dismiss="modal"
                    style={{ background: "green", color: "white" }}
                  >
                    Link Generated!
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn "
                    style={{
                      backgroundColor: "red",
                      color: "white",
                      cursor: "pointer",
                    }}
                    // data-dismiss="modal"
                    onClick={async () => {
                      const orderIdList = this.state.partial.orders.map(
                        (order) => {
                          return order.orderNumber;
                        }
                      );
                      console.log(orderIdList);
                      let link = await generate1688PaymentLink(orderIdList);
                      if (!link) {
                        console.error(
                          "Link generation failed!",
                          lastPaymentLinkError
                        );
                        const failingOrderNumbers =
                          extractFailingOrderNumbers(lastPaymentLinkError);
                        this.setState({
                          linkGenerationError: lastPaymentLinkError,
                          failingOrderNumbers,
                        });
                        window.$("#request_payment").modal("hide");
                        window.$("#linkFailureModal").modal("show");
                        return;
                      }
                      // here create a document inside paymentLinks1688 and update all the orders with paymentLink1688 field
                      await updatepaymentLink({
                        ...this.state.partial,
                        paymentLink: link,
                      });

                      this.setState({
                        link: link,
                        data: link
                          ? this.state.data.map((paymentObj) => {
                              if (
                                paymentObj.paymentId ==
                                this.state.partial.paymentId
                              ) {
                                return {
                                  ...this.state.partial,
                                  paymentLink: link,
                                };
                              } else {
                                return paymentObj;
                              }
                            })
                          : this.state.data,
                      });
                    }}
                  >
                    Regenerate Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="linkFailureModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="linkFailureModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto", minWidth: "60%" }}
          >
            <div className="modal-content" style={{ top: 10, margin: "auto" }}>
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
                  id="linkFailureModalLabel"
                >
                  Link Generation Failed
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "0px 20px" }}>
                  <div
                    style={{
                      background: "#fdecea",
                      border: "1px solid #f5c2c0",
                      borderRadius: 5,
                      padding: "10px 15px",
                      marginBottom: 15,
                      color: "#611a15",
                    }}
                  >
                    <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                      1688 rejected the request:
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {this.state.linkGenerationError?.erroMsg ||
                        this.state.linkGenerationError?.errorCode ||
                        "Unknown error"}
                    </div>
                    {this.state.failingOrderNumbers &&
                      this.state.failingOrderNumbers.length > 0 && (
                        <div style={{ fontSize: 13, marginTop: 4 }}>
                          Order(s) not payable:{" "}
                          <strong>
                            {this.state.failingOrderNumbers.join(", ")}
                          </strong>{" "}
                          — remove it below, then retry Regenerate Link.
                        </div>
                      )}
                  </div>
                </div>
                {this.state.partial?.orders &&
                  this.state.partial?.orders.length > 0 && (
                    <div className="row" style={{ padding: "0px 20px" }}>
                      <table className="table table-bordered table-striped table-hover">
                        <thead
                          style={{ background: "#18768f", color: "white" }}
                        >
                          <tr>
                            <td style={{ fontWeight: "bold" }}>Product</td>
                            <td style={{ fontWeight: "bold" }}>Name</td>
                            <td style={{ fontWeight: "bold" }}>Order Number</td>
                            <td style={{ fontWeight: "bold" }}>Total</td>
                            <td style={{ fontWeight: "bold" }}>Action</td>
                          </tr>
                        </thead>
                        <tbody>
                          {this.state.partial?.orders.map((order) => {
                            const isFailing =
                              this.state.failingOrderNumbers &&
                              this.state.failingOrderNumbers.includes(
                                order.orderNumber
                              );
                            return (
                              <tr
                                key={order.orderNumber}
                                style={
                                  isFailing
                                    ? { background: "#fdecea" }
                                    : undefined
                                }
                              >
                                <td>
                                  <img
                                    src={order.items[0].picture}
                                    style={{
                                      height: 70,
                                      width: 70,
                                      borderRadius: 5,
                                    }}
                                  />
                                </td>
                                <td>{order.items[0].name.slice(0, 100)}</td>
                                <td>
                                  {order.orderNumber}
                                  {isFailing && (
                                    <div
                                      style={{
                                        marginTop: 5,
                                        display: "inline-block",
                                        padding: "2px 5px",
                                        borderRadius: 5,
                                        color: "white",
                                        fontSize: 11,
                                        fontWeight: "bold",
                                        background: "red",
                                      }}
                                    >
                                      Not payable
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <div>
                                    ¥
                                    {order.creationTime1688
                                      ? order.creationTime1688
                                          .totalSuccessAmount
                                      : 0}
                                  </div>
                                  <div style={{ fontSize: 12, color: "#777" }}>
                                    Post fee: ¥
                                    {order.creationTime1688 &&
                                    order.creationTime1688.postFee
                                      ? order.creationTime1688.postFee
                                      : 0}
                                  </div>
                                </td>
                                <td>
                                  {isFailing && (
                                    <button
                                      type="button"
                                      className="btn btn-sm"
                                      disabled={this.state.removingOrder}
                                      style={{
                                        background: "red",
                                        color: "white",
                                      }}
                                      onClick={async () => {
                                        this.setState({
                                          removingOrder: true,
                                        });
                                        const updatedOrders =
                                          await removeOrderFromPaymentLink(
                                            this.state.partial,
                                            order
                                          );
                                        if (updatedOrders) {
                                          const updatedPartial = {
                                            ...this.state.partial,
                                            orders: updatedOrders,
                                          };
                                          this.setState({
                                            partial: updatedPartial,
                                            removingOrder: false,
                                            failingOrderNumbers:
                                              this.state.failingOrderNumbers.filter(
                                                (orderNumber) =>
                                                  orderNumber !==
                                                  order.orderNumber
                                              ),
                                            data: this.state.data.map(
                                              (paymentObj) =>
                                                paymentObj.paymentId ==
                                                updatedPartial.paymentId
                                                  ? updatedPartial
                                                  : paymentObj
                                            ),
                                          });
                                          toast.success(
                                            `Order ${order.orderNumber} removed from this payment link. Unpick it on the Picked Orders page so it can be picked again.`
                                          );
                                        } else {
                                          this.setState({
                                            removingOrder: false,
                                          });
                                          toast.error(
                                            "Failed to remove order from payment link."
                                          );
                                        }
                                      }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn"
                  style={{ backgroundColor: "darkorange", color: "white" }}
                  onClick={() => {
                    window.$("#linkFailureModal").modal("hide");
                    window.$("#request_payment").modal("show");
                  }}
                >
                  Retry Regenerate Link
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteExpenseModal"
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
              style={{ top: 10, margin: "auto", minWidth: "140%" }}
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
                  Delete Configuration
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
                  <div>
                    Are you sure you want to delete this partial payments
                    configuration?
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{productObj && productObj.name}</td>
                      <td>{productObj && productObj.discountType}</td>

                      <td>{productObj && productObj.expirationDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                  onClick={() => {
                    this.setState({
                      productObj: null,
                    });
                  }}
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                  }}
                  onClick={() => {
                    this.props.deletePartialRedux(productObj.id);
                    this.setState({
                      selectAll: false,
                    });
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allUsers: state.users.users,
    currentAdmin: state.admins.currentAdmin,
    partials: state.partials.partials,
  };
};

export default connect(mapStateToProps, {
  getAllPartialsRedux,
  uploadPartialRedux,
  updatePartialRedux,
  deletePartialRedux,
})(PartialPayment);
