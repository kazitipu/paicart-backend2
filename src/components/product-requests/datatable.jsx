import DeliveryRequestCell from "../common/deliveryRequestCell.jsx";
import { getOfferDiscount } from "../../constants/offerMath";
import {
  getDisplayPaymentState,
  getOrderPayable,
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
  requiresBatch,
} from "../../constants/productRequestPayment";
import {
  BulkActionBar,
  BulkPaymentModal,
  BulkStatusModal,
  selectionColumn,
  toggleId,
} from "../common/bulkActions.jsx";
import { buildStatusPatch, PAYMENT_METHODS } from "../../constants/bulkActions";
import PaymentModal, {
  PmBadge,
  orderStatusTone,
  paymentStateTone,
} from "../common/paymentModal.jsx";
import { getOrderDue } from "../../constants/paymentMath";
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
      bulkSelected: [], // bookingIds ticked for bulk status / payment
      bulkAction: null, // "status" | "payment"
    };
  }

  /* Bulk actions ---------------------------------------------------------- */

  /* Same choices as the single-request status dropdown. */
  static BULK_STATUSES = [
    { value: "Rates Provided", icon: "fa-tag" },
    { value: "Purchased", icon: "fa-shopping-cart" },
    { value: "Received in Warehouse", icon: "fa-cubes" },
    { value: "Ready for fly", icon: "fa-plane" },
    { value: "Bangladesh customs", icon: "fa-shield" },
    { value: "Bangladesh warehouse", icon: "fa-check-square-o" },
    { value: "Paicart warehouse", icon: "fa-home" },
    { value: "Delivered", icon: "fa-handshake-o" },
    { value: "Reject", danger: true },
  ];

  bulkItems = () =>
    (this.props.myData || [])
      .filter((request) => this.state.bulkSelected.includes(request.bookingId))
      .map((request) => ({
        id: request.bookingId,
        label: request.bookingId,
        sub: request.displayName || request.userId || "",
        status: request.orderStatus,
        due: getOrderDue(request),
        raw: request,
      }));

  /* Same rules the single-request modal enforces before saving. */
  validateBulkStatus = (item, status) => {
    const request = item.raw;
    if (status === "Reject") return null;
    if (!request.orderTotal) return "No order total given";
    if (requiresBatch(status) && !isInBatch(request))
      return "Not in a payment batch yet";
    return null;
  };

  applyBulkStatus = async (item, status) => {
    const request = item.raw;
    /* only the changed fields — a full copy of `request` would write back
       whatever else was stale in it (e.g. an older status) */
    await this.props.updateProductRequestRedux({
      bookingId: request.bookingId,
      ...buildStatusPatch(request, status, "orderStatus"),
    });
  };

  /* Mirrors handleSubmit: one payment row per request. */
  applyBulkPayment = async (item, { amount, method, paymentStatus }) => {
    const request = item.raw;
    await this.props.updateProductRequestRedux({
      bookingId: request.bookingId,
      paymentStatus,
      payments: [
        ...(request.payments || []),
        {
          amount,
          method,
          receivedBy: this.props.currentAdmin.name,
          date: new Date().toLocaleDateString("en-GB"),
        },
      ],
    });
  };

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

    /* The payment window keeps the copy it was opened with; writing that whole
       copy back put a booking the admin had moved on straight back to its old
       status. Write only the payment fields, built on the latest copy. */
    const fresh =
      (this.props.myData || []).find(
        (r) => String(r.bookingId) === String(this.state.productObj.bookingId),
      ) || this.state.productObj;
    await this.props.updateProductRequestRedux({
      bookingId: fresh.bookingId,
      paymentStatus:
        this.state.paymentStatus !== ""
          ? this.state.paymentStatus
          : fresh.paymentStatus
          ? fresh.paymentStatus
          : "",
      payments:
        fresh.payments &&
        fresh.payments.length > 0
          ? [
              ...fresh.payments,
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
      paymentStatus: "",
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
          /* the full bill: product + China courier + other cost + the
             customer's shipping charge, less discounts (same math as the
             payment modal and the details page) */
          Total: order ? (
            getOrderPayable(order) > 0 ? (
              <div style={{ lineHeight: 1.35 }}>
                <b>{`${Math.round(getOrderPayable(order)).toLocaleString("en-IN")}Tk`}</b>
                {parseFloat(order.shippingChargeCustomer) > 0 ? (
                  <div style={{ fontSize: 10.5, color: "#64748b", fontWeight: 500 }}>
                    incl. shipping {Math.round(parseFloat(order.shippingChargeCustomer)).toLocaleString("en-IN")}Tk
                  </div>
                ) : (
                  <div style={{ fontSize: 10.5, color: "#94a3b8", fontWeight: 500 }}>shipping not billed yet</div>
                )}
              </div>
            ) : (
              ""
            )
          ) : (
            ""
          ),
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
              /* Opens the details page, which also syncs every tracking
                 number's cartons from ALG (one lookup per number). */
              onClick={() =>
                this.props.history.push({
                  pathname: `${process.env.PUBLIC_URL}/product-request/details/${requestObj.bookingId}`,
                  state: { from: window.location.pathname + window.location.search },
                })
              }
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
      /* Paicart warehouse: how it will reach the customer — the customer's
         request from To Receive, or set here by staff */
      ...(["custom-released", "Paicart-warehouse"].includes(this.props.orderStatus)
        ? [
            {
              Header: <b>Delivery request</b>,
              id: "deliveryRequest",
              accessor: () => "deliveryRequest",
              minWidth: 170,
              Cell: (row) => {
                const record = myData.find((r) => r.bookingId == row.original["Booking Id"]);
                return record ? (
                  <DeliveryRequestCell kind="request" record={record} admin={this.props.currentAdmin} />
                ) : null;
              },
              style: { textAlign: "left" },
              sortable: false,
            },
          ]
        : []),
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

    const bulkEnabled = !(currentAdmin && currentAdmin.status == "Partner");
    const bulkIds = (myData || []).map((r) => r.bookingId);

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
            columns={
              bulkEnabled
                ? [
                    selectionColumn({
                      allIds: bulkIds,
                      selected: this.state.bulkSelected,
                      getId: (row) => row["Booking Id"],
                      onToggle: (id) =>
                        this.setState((st) => ({
                          bulkSelected: toggleId(st.bulkSelected, id),
                        })),
                      onToggleAll: (on) =>
                        this.setState({ bulkSelected: on ? bulkIds : [] }),
                    }),
                    ...columns,
                  ]
                : columns
            }
            defaultPageSize={pageSize}
            className={myClass}
            showPagination={pagination}
          />
        )}
        {bulkEnabled && !this.state.bulkAction && (
          <BulkActionBar
            count={this.bulkItems().length}
            totalDue={this.bulkItems().reduce((sum, i) => sum + i.due, 0)}
            onStatus={() => this.setState({ bulkAction: "status" })}
            onPayment={() => this.setState({ bulkAction: "payment" })}
            onClear={() => this.setState({ bulkSelected: [] })}
          />
        )}
        {this.state.bulkAction === "status" && (
          <BulkStatusModal
            items={this.bulkItems()}
            statusOptions={Datatable.BULK_STATUSES}
            validate={this.validateBulkStatus}
            apply={this.applyBulkStatus}
            onClose={() => this.setState({ bulkAction: null })}
            onFinished={() => this.setState({ bulkSelected: [] })}
          />
        )}
        {this.state.bulkAction === "payment" && (
          <BulkPaymentModal
            items={this.bulkItems()}
            apply={this.applyBulkPayment}
            onClose={() => this.setState({ bulkAction: null })}
            onFinished={() => this.setState({ bulkSelected: [] })}
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
                style={{ background: "#ff6a00", color: "#fff" }}
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
                  backgroundColor: "#ff6a00",
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
        <PaymentModal
          idLabel="Booking Id"
          idValue={productObj && productObj.bookingId}
          badges={
            productObj && (
              <>
                <PmBadge tone={productObj.shipmentMethod === "Sea" ? "teal" : "blue"}>
                  {productObj.shipmentMethod === "Sea" ? "By Sea" : "By Air"}
                </PmBadge>
                <PmBadge tone={paymentStateTone(getDisplayPaymentState(productObj))}>
                  {getDisplayPaymentState(productObj)}
                </PmBadge>
                <PmBadge tone={orderStatusTone(productObj.orderStatus)}>
                  {statusDisplay(productObj.orderStatus)}
                </PmBadge>
              </>
            )
          }
          summary={{
            total: totalPayableAmountIncludingShipping || 0,
            paid: totalPaid,
            totalHint: "including shipping",
          }}
          breakdown={
            productObj
              ? [
                  { section: "Product" },
                  { label: "Order actual total", value: productObj.actualTotal },
                  {
                    label: `Coupon${
                      productObj.couponUsed ? ` (${productObj.couponUsed.name})` : ""
                    }`,
                    value: productObj.couponAmount,
                    sign: "-",
                  },
                  {
                    label: `Pay-now discount (${productObj.offer || 0}%)`,
                    value: getOfferDiscount(productObj),
                    sign: "-",
                  },
                  {
                    label: "Order total cost",
                    value: productObj.orderTotal,
                    strong: true,
                  },
                  { section: "Charges" },
                  {
                    label: "Local shipping (China)",
                    value: productObj.localShipping,
                    sign: "+",
                  },
                  {
                    label: "Packaging & other cost",
                    value: productObj.otherCost,
                    sign: "+",
                  },
                  {
                    label: "Discount",
                    value: productObj.discount,
                    sign: "-",
                  },
                  {
                    label: "Payable without shipping",
                    value: totalPayableAmount,
                    strong: true,
                  },
                  { section: "International shipping" },
                  {
                    label: "Total shipping charge",
                    value: productObj.shippingChargeCustomer,
                    sign: "+",
                  },
                ]
              : []
          }
          facts={
            productObj
              ? [
                  {
                    label: "Received weight",
                    value: `${productObj.receivedWeight || 0} kg`,
                  },
                  {
                    label: "Customs & shipping rate",
                    value: `৳${productObj.customerRate || 0}/kg`,
                  },
                  {
                    label: "Refund amount",
                    value: `৳${productObj.refund || 0}`,
                  },
                ]
              : []
          }
          methods={PAYMENT_METHODS}
          form={{
            method: this.state.method,
            amount: this.state.amount,
            paymentStatus: this.state.paymentStatus,
          }}
          onChange={this.handleChange}
          onSubmit={(e) =>
            this.handleSubmit(e, totalPayableAmountIncludingShipping - totalPaid)
          }
          payments={productObj && productObj.payments}
        />
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
                  backgroundColor: "#ff6a00",
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
