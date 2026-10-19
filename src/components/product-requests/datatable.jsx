import { getOfferDiscount } from "../../constants/offerMath";
import {
  getDisplayPaymentState,
  getOrderPayable,
  PAYMENT_STATE_COLORS,
} from "../../constants/paymentMath";
import {
  Badge,
  ModeBadge,
  Button,
  IconButton,
  StatTile,
  StatRow,
} from "../common/listUi.jsx";
import { getShipmentMode } from "../../constants/shipment";
import {
  parseRmb,
  isInBatch,
  isBatchable,
  sumRmb,
} from "../../constants/productRequestPayment";
import { createProductRequestPaymentRedux } from "../../actions/index";
import "../common/list-modern.css";
import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ShoppingBag } from "react-feather";
import EmptyState from "../common/empty-state.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { connect } from "react-redux";
import { getSingleUser } from "../../firebase/firebase.utils";
import {
  getOrderTrackingResultRedux,
  updateProductRequestRedux,
  deleteProductRequestRedux,
} from "../../actions/index";
import { Link } from "react-router-dom";
import man from "../products/physical/plus image.jpeg";
import { statusDisplay } from "../../constants/statusDisplay";
import OrderPrintSlip from "../common/orderPrintSlip.jsx";
import { joinList, withUnit } from "../../constants/displayList";
const PAYMENT_STATE_TONES = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "orange",
};

/* Pipeline stage -> badge tone: neutral at the start, green once settled. */
const ORDER_STATUS_TONES = {
  Pending: "gray",
  pending: "gray",
  "Rates Provided": "blue",
  Purchased: "blue",
  "Received in Warehouse": "teal",
  "Ready for fly": "violet",
  "Bangladesh customs": "orange",
  "Bangladesh warehouse": "green",
  "Paicart warehouse": "green",
  Delivered: "green",
  Reject: "red",
};

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
      userObj: null,
      productObj: null,
      amount: 0,
      method: "",
      paymentStatus: "",
      requestsToPay: [],
      totalRmbToPay: 0,
      createdBatch: null,
      batchError: null,
      skippedRequests: [],
      creatingBatch: false,
    };
  }

  selectRow = (e, id) => {
    const checked = e.target.checked;
    this.setState((state) => ({
      checkedValues: checked
        ? [...state.checkedValues, id]
        : state.checkedValues.filter((value) => value !== id),
    }));
  };

  getTotal = (payments) => {
    let total = 0;
    if (payments && payments.length > 0) {
      payments.map((payment) => {
        total += parseInt(payment.amount);
      });
    }
    return total;
  };

  handleRemoveRow = () => {
    const selectedValues = this.state.checkedValues;
    const updatedData = this.state.myData.filter(function (el) {
      return selectedValues.indexOf(el.id) < 0;
    });
    this.setState({
      myData: updatedData,
    });
    toast.success("Successfully Deleted !");
  };

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getStatus = (productQuantity) => {
    if (productQuantity < 10) {
      return <i className="fa fa-circle font-danger f-12" />;
    } else if (productQuantity > 50) {
      return <i className="fa fa-circle font-success f-12" />;
    } else {
      return <i className="fa fa-circle font-warning f-12" />;
    }
  };
  getTotalPaid = (order) => {
    let totalPaid = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    return totalPaid;
  };

  getUserName = async (requestObj) => {
    const userObj = await getSingleUser(requestObj.userId);
    if (userObj) {
      this.setState({ userObj });
    } else {
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };
  handleSubmit = async (event, totalDue) => {
    event.preventDefault();
    const { productObj } = this.state;
    if (this.state.amount == 0) {
      alert("Paid amount must be more than 0");
      return;
    }
    if (this.state.amount > totalDue) {
      alert("Paid amount can't be more than due amount.");
      return;
    }
    console.log(this.state);

    await this.props.updateProductRequestRedux({
      ...this.state.productObj,
      paymentStatus:
        this.state.paymentStatus !== ""
          ? this.state.paymentStatus
          : this.state.productObj.paymentStatus
          ? this.state.productObj.paymentStatus
          : "",
      payments:
        this.state.productObj.payments &&
        this.state.productObj.payments.length > 0
          ? [
              ...this.state.productObj.payments,
              {
                amount: this.state.amount,
                method: this.state.method,

                receivedBy: this.props.currentAdmin.name,
                date: new Date().toLocaleDateString("en-GB"),
              },
            ]
          : [
              {
                amount: this.state.amount,
                method: this.state.method,
                receivedBy: this.props.currentAdmin.name,
                date: new Date().toLocaleDateString("en-GB"),
              },
            ],
    });
    toast.success("successfully updated the payment");

    this.setState({
      checkedValues: [],
      myData: this.props.myData,
      productObj: null,
      method: "",
      amount: "",
    });
    document.getElementById("close-button-for-payment-modal").click();
  };

  getTotalDue = (order) => {
    let totalPaid = 0;
    let totalDue = 0;
    let totalBill = 0;
    if (order.payments && order.payments.length > 0) {
      order.payments.map((paymnet) => {
        totalPaid += parseInt(paymnet.amount);
      });
    }
    if (order.shippingChargeCustomer && order.shippingChargeCustomer != 0) {
      totalBill = order.orderTotal
        ? parseInt(order.orderTotal) +
          parseInt(order.shippingChargeCustomer) +
          parseInt(order.localShipping)
        : 0 +
          parseInt(order.shippingChargeCustomer) +
          parseInt(order.localShipping);
    } else {
      totalBill = order.orderTotal ? order.orderTotal : 0;
    }
    totalDue = parseInt(totalBill) - parseInt(totalPaid);
    return totalDue;
  };

  render() {
    const {
      pageSize,
      myClass,
      multiSelectOption,
      paymentSelection,
      pagination,
      currency,
      orderTracking,
      currentAdmin,
    } = this.props;
    console.log(this.props);
    const { myData } = this.props;
    const { productObj } = this.state;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((order) => {
        newData.push({
          Date: order ? order.date : "",
          "Booking Id": order ? order.bookingId : "",
          Store: order ? order.store : "",
          Total:
            order && order.orderTotal
              ? `${Math.round(order.orderTotal)}Tk`
              : "",
          "Order Number": order ? order.orderNumber : "",
          "Tracking No": order ? order.trackingNo : "",
        });
      });
    }
    let totalPayableAmount = 0;
    if (productObj) {
      totalPayableAmount =
        parseInt(productObj.orderTotal) +
        parseInt(productObj.otherCost) +
        parseInt(productObj.localShipping) -
        (productObj.discount ? parseInt(productObj.discount) : 0) -
        /* granted at payment time — not already inside orderTotal */
        getOfferDiscount(productObj);
    }
    let totalPaid = 0;
    if (productObj && productObj.payments && productObj.payments.length > 0) {
      productObj.payments.map((payment) => {
        totalPaid += parseInt(payment.amount);
      });
    }
    if (!totalPayableAmount) {
      totalPayableAmount = 0;
    }
    let totalPayableAmountIncludingShipping = 0;
    if (productObj) {
      totalPayableAmountIncludingShipping =
        parseInt(totalPayableAmount) +
        (productObj.shippingChargeCustomer
          ? parseInt(productObj.shippingChargeCustomer)
          : 0);
    }
    /* Column headers must not depend on there being data: newData[0] is
       undefined whenever a filter empties the table, and deriving the columns
       from it made the header row collapse to just the action columns. */
    const BASE_COLUMN_KEYS = [
      "Date",
      "Booking Id",
      "Store",
      "Total",
      "Order Number",
      "Tracking No",
    ];
    const columns = [];
    for (var key of BASE_COLUMN_KEYS) {
      columns.push({
        Header: <b>{this.Capitalize(key.toString())}</b>,
        accessor: key,
        Cell: null,
        style: {
          textAlign: "center",
        },
      });
    }

    /* Purchasing RMB - what we actually pay the Chinese supplier. Shown on
       every tab, not just the selectable ones. */
    columns.push({
      Header: <b>Purchasing RMB</b>,
      id: "purchasingRmb",
      accessor: () => "purchasingRmb",
      sortable: false,
      style: { textAlign: "center" },
      Cell: (row) => {
        const requestObj = myData.find(
          (order) => order.bookingId == row.original["Booking Id"]
        );
        const rmb = parseRmb(requestObj && requestObj.purchasingRmb);
        const batched = isInBatch(requestObj);
        return (
          <span
            title={
              batched
                ? `In payment batch #${requestObj.productRequestPaymentId}`
                : undefined
            }
          >
            <Badge tone={rmb > 0 ? "teal" : "gray"}>
              {rmb > 0 ? `¥ ${rmb}` : "—"}
            </Badge>
          </span>
        );
      },
    });

    columns.push(
      {
        Header: <b>Method</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.bookingId == row.original["Booking Id"]
          );
          return <ModeBadge mode={getShipmentMode(requestObj)} />;
        },
        style: { textAlign: "center" },
        sortable: false,
      },
      {
        Header: <b>Payment status</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.bookingId == row.original["Booking Id"]
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <Badge
                  tone={
                    PAYMENT_STATE_TONES[getDisplayPaymentState(requestObj)] ||
                    "gray"
                  }
                >
                  {getDisplayPaymentState(requestObj)}
                </Badge>
              ) : (
                <span
                  style={{ cursor: "pointer" }}
                  data-toggle="modal"
                  data-target="#paymentModal"
                  onClick={() => {
                    this.setState({
                      productObj: requestObj,
                    });
                  }}
                >
                  <Badge
                    tone={
                      PAYMENT_STATE_TONES[
                        getDisplayPaymentState(requestObj)
                      ] || "gray"
                    }
                  >
                    {getDisplayPaymentState(requestObj)}
                  </Badge>
                </span>
              )}
            </>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Booking Details</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.bookingId == row.original["Booking Id"]
          );
          return (
            <Button
              variant="subtle"
              data-toggle="modal"
              data-target="#detailInfoModal"
              onClick={async () => {
                this.setState({
                  productObj: requestObj,
                });
                let orderTracking2 =
                  await this.props.getOrderTrackingResultRedux(
                    requestObj.trackingNo
                  );
                console.log(orderTracking2);
                if (orderTracking2) {
                  this.props.updateProductRequestRedux({
                    ...requestObj,
                    shippingMark: orderTracking2.parcelsArray.map(
                      (parcel) => `${parcel.shippingMark}`
                    ),
                    cargoCompany: "ALG Limited",
                    lotNo: orderTracking2.lotArray.map((lot) => `${lot}`),
                    ctnNo: orderTracking2.parcelsArray.map(
                      (parcel) => `${parcel.parcelId}`
                    ),
                    cargoRate: orderTracking2.parcelsArray.map((parcel) => {
                      if (parcel.ratePerKg) {
                        return `${parcel.ratePerKg} tk/kg`;
                      } else {
                        return "Not given yet";
                      }
                    }),
                    shippingChargeCargo: orderTracking2.parcelsArray.map(
                      (parcel) => {
                        if (parcel.finalTotal) {
                          return `${parcel.finalTotal} Tk`;
                        } else {
                          return "Not given yet";
                        }
                      }
                    ),
                  });
                }
              }}
            >
              Details
            </Button>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>User</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (request) => request.bookingId == row.original["Booking Id"]
          );

          return (
            <>
              {myData.length > 0 ? (
                <div
                  style={{ cursor: "pointer", color: "#ff8084" }}
                  onClick={() => {
                    if (currentAdmin && currentAdmin.status == "Partner") {
                      return;
                    } else {
                      this.props.history.push(
                        `${process.env.PUBLIC_URL}/users/list-user/${requestObj.userId}`
                      );
                    }
                  }}
                >
                  {requestObj.displayName}
                </div>
              ) : (
                ""
              )}
            </>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Update</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => {
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <></>
              ) : (
                <div>
                  <IconButton
                    tone="green"
                    title="Edit request"
                    onClick={() => {
                      const order = myData.find(
                        (order) =>
                          order.bookingId == row.original["Booking Id"]
                      );
                      this.props.startToggleModal(order);
                    }}
                  >
                    <i className="fa fa-pencil" style={{ fontSize: 14 }}></i>
                  </IconButton>
                  {(this.props.orderStatus == "new" ||
                    this.props.orderStatus == "rejected") && (
                    <IconButton
                      tone="red"
                      title="Delete request"
                      data-toggle="modal"
                      data-target="#deleteModal"
                      onClick={() => {
                        const order = myData.find(
                          (order) =>
                            order.bookingId == row.original["Booking Id"]
                        );
                        this.setState({
                          productObj: order,
                        });
                      }}
                    >
                      <i className="fa fa-trash" style={{ fontSize: 14 }}></i>
                    </IconButton>
                  )}
                </div>
              )}
            </>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Invoice</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => {
          const order = myData.find(
            (order) => order.bookingId == row.original["Booking Id"]
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <></>
              ) : (
                <Link
                  to={`${process.env.PUBLIC_URL}/pages/dashboard/buy-and-ship-for/invoice/${order.bookingId}?productRequest=true`}
                  target="_blank"
                >
                  <Badge tone="orange">Invoice</Badge>
                </Link>
              )}
            </>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      }
    );

    /* Payment selection: only on the pre-purchase tabs, only for requests that
       have a purchasing RMB and are not already in a batch. */
    if (paymentSelection && !(currentAdmin && currentAdmin.status == "Partner")) {
      columns.push({
        Header:
          this.state.checkedValues.length > 0 ? (
            <Button
              variant="dark"
              data-toggle="modal"
              data-target="#request_payment"
              onClick={() => {
                const requestsToPay = myData.filter((request) =>
                  this.state.checkedValues.includes(request.bookingId)
                );
                this.setState({
                  requestsToPay,
                  totalRmbToPay: sumRmb(requestsToPay),
                  createdBatch: null,
                  batchError: null,
                  skippedRequests: [],
                });
              }}
            >
              Pay ({this.state.checkedValues.length})
            </Button>
          ) : (
            <b>Pay</b>
          ),
        id: "paymentSelect",
        accessor: () => "paymentSelect",
        sortable: false,
        style: { textAlign: "center" },
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.bookingId == row.original["Booking Id"]
          );
          if (!isBatchable(requestObj)) return null;
          return (
            <input
              type="checkbox"
              style={{ height: 20, width: 20, cursor: "pointer" }}
              name={row.original["Booking Id"]}
              checked={this.state.checkedValues.includes(
                row.original["Booking Id"]
              )}
              onChange={(e) => this.selectRow(e, row.original["Booking Id"])}
            />
          );
        },
      });
    }

    return (
      <Fragment>
        {newData.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            accent="#f59e0b"
            title={
              this.props.isFiltered
                ? "No product requests match these filters"
                : `No product requests in \u201c${this.props.statusLabel || "this list"}\u201d`
            }
            message={
              this.props.isFiltered
                ? "Nothing here matches your search, payment filter or date range. Try widening the range or clearing the filters."
                : "Customer product requests appear here as soon as they reach this stage."
            }
            actionLabel={this.props.isFiltered ? "Clear filters" : undefined}
            onAction={
              this.props.isFiltered ? this.props.onClearFilters : undefined
            }
          />
        ) : (
          <ReactTable
            data={newData}
            columns={columns}
            defaultPageSize={pageSize}
            className={myClass}
            showPagination={pagination}
          />
        )}
        {/* Create a purchase batch from the ticked requests. */}
        <div
          className="modal fade"
          id="request_payment"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto", minWidth: "60%" }}
          >
            <div className="modal-content">
              <div
                className="modal-header"
                style={{ background: "rgb(0, 37, 76)", color: "#fff" }}
              >
                <div>
                  <h5
                    style={{
                      margin: 0,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    Create Payment Batch
                  </h5>
                  <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.75 }}>
                    {this.state.requestsToPay.length} product request
                    {this.state.requestsToPay.length === 1 ? "" : "s"}
                  </p>
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  style={{ color: "#fff", opacity: 0.8, textShadow: "none" }}
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>

              <div className="modal-body">
                {this.state.batchError && (
                  <div
                    style={{
                      background: "#fdeaea",
                      color: "#b91c1c",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      marginBottom: 14,
                    }}
                  >
                    {this.state.batchError}
                  </div>
                )}

                {this.state.skippedRequests.length > 0 && (
                  <div
                    style={{
                      background: "#fff1e6",
                      color: "#c2410c",
                      borderRadius: 10,
                      padding: "10px 14px",
                      fontSize: 13,
                      marginBottom: 14,
                    }}
                  >
                    {this.state.skippedRequests.length} request
                    {this.state.skippedRequests.length === 1 ? "" : "s"} skipped:{" "}
                    {this.state.skippedRequests
                      .map(
                        (skipped) =>
                          `${skipped.bookingId} (${
                            skipped.reason === "already-in-batch"
                              ? `already in batch #${skipped.existingPaymentId}`
                              : skipped.reason === "no-rmb"
                              ? "no purchasing RMB"
                              : "not found"
                          })`
                      )
                      .join(", ")}
                  </div>
                )}

                {this.state.createdBatch ? (
                  <div
                    style={{
                      background: "#e7f8ec",
                      color: "#0f7b35",
                      borderRadius: 10,
                      padding: "14px 16px",
                      fontSize: 14,
                    }}
                  >
                    <b>Batch #{this.state.createdBatch.paymentId} created</b> — ¥{" "}
                    {parseFloat(this.state.createdBatch.totalRmb).toFixed(2)}
                    <div style={{ marginTop: 8 }}>
                      <Link to={`${process.env.PUBLIC_URL}/product-request-payment`}>
                        View payment batches
                      </Link>
                    </div>
                  </div>
                ) : (
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Booking Id</th>
                        <th>Customer</th>
                        <th>Purchasing RMB</th>
                      </tr>
                    </thead>
                    <tbody>
                      {this.state.requestsToPay.map((request) => (
                        <tr key={request.bookingId}>
                          <td>
                            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                              <img
                                src={request.imageUrl || man}
                                alt=""
                                style={{
                                  height: 44,
                                  width: 44,
                                  objectFit: "cover",
                                  borderRadius: 8,
                                  border: "1px solid #eef2f7",
                                }}
                              />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 700 }}>
                                  {request.productType || "—"}
                                </div>
                                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                                  {request.store || ""}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td>{request.bookingId}</td>
                          <td>{request.displayName || request.userId}</td>
                          <td style={{ fontWeight: 700 }}>
                            ¥ {parseRmb(request.purchasingRmb)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan="3" style={{ textAlign: "right", fontWeight: 700 }}>
                          Total
                        </td>
                        <td style={{ fontWeight: 800, color: "#0f172a" }}>
                          ¥ {parseFloat(this.state.totalRmbToPay || 0).toFixed(2)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-dismiss="modal">
                  Close
                </button>
                {!this.state.createdBatch && (
                  <Button
                    variant="primary"
                    disabled={this.state.creatingBatch}
                    onClick={async () => {
                      /* The transaction cannot stop a double click - both reads
                         would legitimately see no marker - so the disable is
                         load-bearing, not cosmetic. */
                      this.setState({ creatingBatch: true, batchError: null });
                      const result = await this.props.createProductRequestPaymentRedux(
                        this.state.requestsToPay,
                        currentAdmin ? currentAdmin.name : "admin"
                      );
                      if (!result || !result.ok) {
                        this.setState({
                          creatingBatch: false,
                          skippedRequests: (result && result.skipped) || [],
                          batchError:
                            result && result.reason === "all-skipped"
                              ? "No batch was created — every selected request is already in a batch or has no purchasing RMB."
                              : "Could not create the payment batch. Please try again.",
                        });
                        return;
                      }
                      this.setState({
                        creatingBatch: false,
                        createdBatch: result.paymentObj,
                        skippedRequests: result.skipped || [],
                        checkedValues: [],
                      });
                      toast.success("Payment batch created");
                    }}
                  >
                    {this.state.creatingBatch ? "Creating…" : "Create Payment Batch"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <ToastContainer />
        <div
          className="modal fade"
          id="detailInfoModal"
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
                  Booking Id: {productObj && productObj.bookingId}{" "}
                  <OrderPrintSlip record={productObj} kind="productRequest" />
                  {productObj && (
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      <Badge
                        tone={
                          PAYMENT_STATE_TONES[
                            getDisplayPaymentState(productObj)
                          ] || "gray"
                        }
                      >
                        {getDisplayPaymentState(productObj)}
                      </Badge>
                      <Badge
                        tone={
                          ORDER_STATUS_TONES[
                            productObj.orderStatus || productObj.status
                          ] || "gray"
                        }
                      >
                        {statusDisplay(productObj.orderStatus || productObj.status) || "Pending"}
                      </Badge>
                      <Badge tone={productObj.trackingNo ? "teal" : "gray"}>
                        {productObj.trackingNo
                          ? `Tracking ${productObj.trackingNo}`
                          : "No tracking yet"}
                      </Badge>
                    </div>
                  )}
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
                {productObj &&
                  (() => {
                    const bill = getOrderPayable(productObj);
                    const paid = this.getTotal(productObj.payments);
                    const due = Math.max(bill - paid, 0);
                    return (
                      <StatRow>
                        <StatTile
                          tone="blue"
                          label="Quantity"
                          value={productObj.productQuantity || "—"}
                        />
                        <StatTile
                          tone="violet"
                          label="Weight"
                          value={`${productObj.receivedWeight || 0} Kg`}
                          hint={
                            productObj.customerRate
                              ? `৳${productObj.customerRate}/kg`
                              : ""
                          }
                        />
                        <StatTile
                          tone="gray"
                          label="Total Bill"
                          value={`৳${Math.round(bill).toLocaleString()}`}
                        />
                        <StatTile
                          tone="green"
                          label="Paid"
                          value={`৳${paid.toLocaleString()}`}
                          hint={`${
                            (productObj.payments || []).length
                          } payment(s)`}
                        />
                        <StatTile
                          tone={due > 0 ? "orange" : "green"}
                          label={due > 0 ? "Due" : "Settled"}
                          value={`৳${Math.round(due).toLocaleString()}`}
                        />
                      </StatRow>
                    );
                  })()}
                <div style={{ padding: "0px 15px" }}></div>

                {productObj && productObj.warehouse && (
                  <div style={{ fontSize: 11 }}>
                    Warehouse Address:{" "}
                    <span style={{ color: "gray", fontSize: 11 }}>
                      {productObj && productObj.warehouse}
                    </span>
                  </div>
                )}

                {productObj && (
                  <div>
                    {" "}
                    <div style={{ fontWeight: "bold" }}>
                      Store: {productObj.store}
                    </div>
                    <div>
                      Product Link:{" "}
                      <a href={productObj.productUrl} target="_blank">
                        <span style={{ color: "#ff8084" }}>
                          {productObj.productUrl}
                        </span>
                      </a>
                    </div>
                    <table className="table table-bordered table-striped table-hover">
                      <tbody>
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
                                productObj.imageUrl ? productObj.imageUrl : man
                              }
                            />
                          </td>
                          <td>{productObj.productVariant}</td>
                          <td>{productObj.productType}</td>
                          <td>
                            Shipping Rate: {productObj.shippingRate} tk/kg
                          </td>
                          <td>
                            {parseFloat(productObj.unitPrice).toFixed(2)} Tk
                          </td>
                          <td>{productObj.productQuantity}pcs </td>

                          <td>
                            {parseFloat(
                              productObj.unitPrice * productObj.productQuantity
                            ).toFixed(2)}
                            Tk
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div
                  className="row"
                  style={{
                    marginBottom: 10,
                    borderBottom: "1px solid gainsboro",
                  }}
                >
                  <div className="col">
                    <div
                      style={{
                        color: "#18768f",
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      Purchasing Information
                    </div>

                    <div className="category-list-shipping">
                      Purchase Link:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.purchaseLink}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Purchasing supplier:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.purchasingSupplier}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Purchasing supplier (Payment method):{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.purchasingSupplierPayment}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Purchasing supplier (QR code):{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.purchasingSupplierQr}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Purchasing RMB:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.purchasingRmb
                          ? productObj.purchasingRmb
                          : 0}{" "}
                        rmb
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Exchange Rate:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.exchangeRate
                          ? productObj.exchangeRate
                          : 0}
                        Tk
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total Buying Cost:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj &&
                        productObj.exchangeRate &&
                        productObj.purchasingRmb
                          ? parseInt(
                              productObj.exchangeRate * productObj.purchasingRmb
                            )
                          : 0}
                        Tk
                      </span>
                    </div>

                    <div
                      className="category-list-shipping"
                      style={{ marginTop: 20 }}
                    >
                      Coupon Used:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.couponUsed
                          ? productObj.couponUsed.name
                          : "none"}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Actual Order Total:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && parseInt(productObj.actualTotal)}
                        Tk
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Coupon Amount:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.couponAmount
                          ? productObj.couponAmount
                          : "0"}
                        Tk
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Discount on (pay now %):{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj &&
                        productObj.offer &&
                        productObj.offer !== 0
                          ? `${getOfferDiscount(productObj)}
                                  Tk`
                          : "0Tk"}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total Paid:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && this.getTotalPaid(productObj)}
                        Tk
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total Due:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && this.getTotalDue(productObj)}
                        Tk
                      </span>
                    </div>
                  </div>
                  <div className="col">
                    <div
                      style={{
                        color: "#18768f",
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      Shipping Timeline
                    </div>
                    <div className="category-list-shipping">
                      Ordered:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.date}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Purchased:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["PurchasedDate"]}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Abroad Warehouse:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["Received in WarehouseDate"]}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Ready for fly:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["Ready for flyDate"]}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Bangladesh customs:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj
                          ? productObj["Bangladesh customsDate"]
                            ? productObj["Bangladesh customsDate"]
                            : productObj["Bangladesh warehouseDate"]
                            ? productObj["Bangladesh warehouseDate"]
                            : ""
                          : ""}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Custom released:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["Bangladesh warehouseDate"]}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Paicart Warehouse:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["Paicart warehouseDate"]}
                      </span>
                    </div>
                    <div
                      className="category-list-shipping"
                      style={{ marginBottom: 20 }}
                    >
                      Delivered:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["DeliveredDate"]}
                      </span>
                    </div>

                    <div
                      className="category-list-shipping"
                      style={{ fontSize: 11 }}
                    >
                      Abroad Warehouse Address:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.abroadWarehouseAddress}
                      </span>
                    </div>
                    <div
                      className="category-list-shipping"
                      style={{ fontSize: 11 }}
                    >
                      Bangladesh Warehouse Address:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.bangladeshWarehouseAddress}
                      </span>
                    </div>
                    <div
                      className="category-list-shipping"
                      style={{ fontSize: 11 }}
                    >
                      Delivered through:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.deliveredBy}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <div
                      style={{
                        color: "#18768f",
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      Shipping Information
                    </div>
                    <div className="category-list-shipping">
                      Customer Name:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.displayName}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Shipping mark:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.shippingMark &&
                          `${productObj.shippingMark}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Tracking No:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.trackingNo}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Cargo company:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.cargoCompany}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Lot Number:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.lotNo &&
                          `${productObj.lotNo}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Carton number:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.ctnNo &&
                          `${productObj.ctnNo}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Received weight:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.receivedWeight &&
                          `${productObj.receivedWeight}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Cargo rate:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.cargoRate &&
                          `${productObj.cargoRate}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Shipment method:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          (productObj.shipmentMethod === "Sea"
                            ? "By Sea"
                            : "By Air")}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Customs & Shipping rate:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && parseFloat(productObj.customerRate) > 0
                          ? `${productObj.customerRate} Tk/Kg`
                          : "—"}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Total shipping charge (cargo company):{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.shippingChargeCargo &&
                          `${productObj.shippingChargeCargo}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total shipping charge (customer):{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.shippingChargeCustomer &&
                          `${productObj.shippingChargeCustomer}Tk`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total Paid (customer):{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && this.getTotal(productObj.payments)}Tk
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Refund note:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.refundNote}
                      </span>
                    </div>
                  </div>
                  <div className="col">
                    <div
                      style={{
                        color: "#18768f",
                        fontWeight: "bold",
                        marginBottom: 5,
                      }}
                    >
                      Parcel Info (caro company)
                    </div>
                    {orderTracking ? (
                      <>
                        <div className="category-list-shipping">
                          Cargo company:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            ALG LIMITED
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Customer:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.userObj.userId}-
                            {orderTracking.userObj.displayName}
                          </span>
                        </div>

                        <div className="category-list-shipping">
                          Lot No:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.lotArray)}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Lot status:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.lotObj.shipmentStatus}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Parcel status:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.parcelsArray[0].parcelStatus ||
                              orderTracking.lotObj.shipmentStatus}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Carton No:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.parcelId))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Received Date:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.dateofWarehouseReceive))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Shipping Mark:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.shippingMark))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Product Name:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.productName))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Product Contains:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.productType))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Total CBM:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.totalCbm))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Total weight:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => parcel.grossWeight), " kg")}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Rate/kg:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => {
                              if (parcel.ratePerKg) {
                                return `${parcel.ratePerKg} tk/kg`;
                              } else {
                                return "Not given yet";
                              }
                            }))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Other charge:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => {
                              if (parcel.otherCharges) {
                                return `${parcel.otherCharges} Tk`;
                              } else {
                                return "Not given yet";
                              }
                            }))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Packaging cost:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => {
                              if (parcel.packagingCost) {
                                return `${parcel.packagingCost} Tk`;
                              } else {
                                return "Not given yet";
                              }
                            }))}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Final Total:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(orderTracking.parcelsArray.map((parcel) => {
                              if (parcel.finalTotal) {
                                return `${parcel.finalTotal} Tk`;
                              } else {
                                return "Not given yet";
                              }
                            }))}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ marginLeft: 8, color: "gray" }}>
                        No shipping data available.{" "}
                      </div>
                    )}
                  </div>
                </div>
              </div>
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
          id="paymentModal"
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
                  Booking Id: {productObj && productObj.bookingId}
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
                <div className="row">
                  <div
                    className="col"
                    style={{
                      fontWeight: "bold",
                      borderBottom: "1px solid gainsboro",
                      paddingBottom: 5,
                    }}
                  >
                    Make New Payment
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div
                    className="row"
                    style={{
                      marginBottom: 10,
                      borderBottom: "1px solid gainsboro",
                    }}
                  >
                    <div className="col">
                      <div
                        style={{
                          color: "#18768f",
                          fontWeight: "bold",
                          marginBottom: 5,
                        }}
                      >
                        Order Information
                      </div>

                      <div className="category-list-shipping">
                        Order Actual Total:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.actualTotal} Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Coupon used:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.couponUsed
                            ? productObj.couponUsed.name
                            : "None"}{" "}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Coupon Amount:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          -
                          {productObj && productObj.couponAmount
                            ? productObj.couponAmount
                            : 0}{" "}
                          Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Offer (%):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.offer
                            ? productObj.offer
                            : "0%"}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Order Total Cost:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.orderTotal} Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Local Shipping cost (china):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.localShipping} Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Packaging & other Cost:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.otherCost}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Refund Amount:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.refund}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Discount:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.discount}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Total Payable amount(without Shipping):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {totalPayableAmount}Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Received Weight:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.receivedWeight}kg
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Shipment Method:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj &&
                            (productObj.shipmentMethod === "Sea"
                              ? "By Sea"
                              : "By Air")}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Customs & Shipping Rate:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.customerRate} Tk/Kg
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total Shipping Charge:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {productObj && productObj.shippingChargeCustomer} Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total Payable amount(including Shipping):{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {totalPayableAmountIncludingShipping
                            ? totalPayableAmountIncludingShipping
                            : 0}
                          Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total Paid:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {totalPaid}Tk
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Total Due:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {totalPayableAmountIncludingShipping
                            ? totalPayableAmountIncludingShipping - totalPaid
                            : 0}
                          Tk
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Payment Status:{" "}
                        <span
                          style={{
                            padding: "1px 6px",
                            fontWeight: "bold",
                            color: "white",
                            borderRadius: 5,
                            background:
                                PAYMENT_STATE_COLORS[getDisplayPaymentState(productObj)] ||
                                "red",
                            textAlign: "center",
                          }}
                          onClick={() => {
                            this.setState({
                              productObj,
                            });
                          }}
                        >
                          {getDisplayPaymentState(productObj)}
                        </span>
                      </div>

                      <div className="category-list-shipping">
                        Order Status:{" "}
                        <span
                          style={{
                            padding: 10,
                            fontWeight: "bold",
                            paddingTop: 0,
                            color: "white",
                            padding: "3px 7px",
                            borderRadius: 5,
                            backgroundColor: productObj
                              ? productObj.orderStatus == "pending"
                                ? "gainsboro"
                                : productObj.orderStatus == "Purchased"
                                ? "gray"
                                : productObj.orderStatus ==
                                  "Received in Warehouse"
                                ? "orange"
                                : productObj.orderStatus == "Ready for fly"
                                ? "darkorange"
                                : productObj.orderStatus == "Bangladesh customs"
                                ? "chocolate"
                                : productObj.orderStatus == "Paicart warehouse"
                                ? "green"
                                : productObj.orderStatus ==
                                  "Bangladesh warehouse"
                                ? "#00a3a3"
                                : productObj.orderStatus == "Delivered"
                                ? "darkgreen"
                                : "red"
                              : "white",
                            textAlign: "center",
                          }}
                        >
                          {productObj && statusDisplay(productObj.orderStatus)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col">
                    <form
                      onSubmit={(e) =>
                        this.handleSubmit(
                          e,
                          totalPayableAmountIncludingShipping - totalPaid
                        )
                      }
                      className="rounded-field mt-2"
                    >
                      <div className="form-row mb-2">
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Payment Method
                          </label>

                          <select
                            title=""
                            name="method"
                            className="custom-select"
                            aria-required="true"
                            aria-invalid="false"
                            onChange={this.handleChange}
                            style={{ fontSize: ".8rem" }}
                            value={this.state.method}
                            required
                          >
                            <option value="">Select Method</option>
                            <option value="Cash">Cash</option>
                            <option value="Bkash">Bkash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Rocket">Rocket</option>
                            <option value="City">City Bank</option>
                          </select>
                        </div>
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Paid amount
                          </label>

                          <input
                            type="number"
                            name="amount"
                            className="form-control"
                            placeholder="Enter amount"
                            style={{ fontSize: "1rem" }}
                            onChange={this.handleChange}
                            value={this.state.amount}
                            required
                          />
                        </div>
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Payment Status
                          </label>

                          <select
                            title=""
                            name="paymentStatus"
                            className="custom-select"
                            aria-required="true"
                            aria-invalid="false"
                            onChange={this.handleChange}
                            style={{ fontSize: ".8rem" }}
                            value={this.state.paymentStatus}
                            required
                          >
                            <option value="">Select Payment Status</option>
                            <option value="Partially Paid">
                              Partially Paid
                            </option>
                            <option value="Paid">Full Paid</option>
                          </select>
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
                            className="btn"
                            style={{
                              background: "rgb(0, 37, 76)",
                              color: "white",
                            }}
                          >
                            Update
                            <i className="icofont-rounded-right"></i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="row">
                  {this.state.productObj &&
                    this.state.productObj.payments &&
                    this.state.productObj.payments.length > 0 && (
                      <div className="col">
                        <div
                          className="row"
                          style={{
                            height: 1,
                            width: "100%",
                            background: "gainsboro",
                            marginTop: 20,
                            marginBottom: 20,
                            marginRight: 0,
                            marginLeft: 0,
                          }}
                        ></div>
                        <div
                          style={{
                            paddingLeft: 0,
                            color: "#18768f",
                            fontWeight: "bold",
                          }}
                        >
                          Previous Payments
                        </div>
                        <table className="table table-bordered table-striped table-hover">
                          <thead
                            style={{ background: "#18768f", color: "white" }}
                          >
                            <tr>
                              <td style={{ fontWeight: "bold" }}>Date</td>
                              <td style={{ fontWeight: "bold" }}>Method</td>
                              <td style={{ fontWeight: "bold" }}>Amount</td>

                              <td style={{ fontWeight: "bold" }}>
                                Approved by
                              </td>
                            </tr>
                          </thead>
                          <tbody>
                            {this.state.productObj.payments.map((payment) => (
                              <tr>
                                <td>{payment.date}</td>
                                <td>{payment.method}</td>
                                <td>{payment.amount}Tk</td>
                                <td>{payment.receivedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                  id="close-button-for-payment-modal"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteModal"
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
                  Booking Id: {productObj && productObj.bookingId}
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
                <div className="row">
                  <div
                    className="col"
                    style={{
                      fontWeight: "bold",

                      paddingBottom: 5,
                    }}
                  >
                    {/* Deleting a batched request would leave a stale copy
                        inside the payment batch and desync its total. */}
                    {isInBatch(productObj) ? (
                      <span>
                        This request belongs to payment batch #
                        {productObj.productRequestPaymentId} and cannot be
                        deleted. Remove it from the batch first.
                      </span>
                    ) : (
                      <>
                        Are you sure you want to delete this request?
                        {(() => {
                      /* Rejected records can still carry payments; deleting
                         erases that history, so say so before it happens. */
                      const paid = ((productObj && productObj.payments) || []).reduce(
                        (total, p) => total + (parseFloat(p && p.amount) || 0),
                        0
                      );
                      return paid > 0 ? (
                        <div style={{ marginTop: 8, color: "#b91c1c", fontWeight: "normal", fontSize: 13 }}>
                          Warning: ৳{Math.round(paid).toLocaleString()} in payments is recorded on it — its payment history will be deleted too.
                        </div>
                      ) : null;
                    })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button>
                {!isInBatch(productObj) && (
                  <button
                    type="button"
                    className="btn "
                    style={{ backgroundColor: "red", color: "white" }}
                    data-dismiss="modal"
                    onClick={() => {
                      this.props.deleteProductRequestRedux(productObj);
                    }}
                  >
                    Yes
                  </button>
                )}
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
    currency: state.users.currency,
    orderTracking: state.orders.orderTracking,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  getOrderTrackingResultRedux,
  updateProductRequestRedux,
  deleteProductRequestRedux,
  createProductRequestPaymentRedux,
})(Datatable);
