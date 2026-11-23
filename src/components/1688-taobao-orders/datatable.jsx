import DeliveryRequestCell from "../common/deliveryRequestCell.jsx";
import { getOfferDiscount } from "../../constants/offerMath";
import {
  getDisplayPaymentState,
  getOrderPayable,
} from "../../constants/paymentMath";
import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ShoppingCart } from "react-feather";
import EmptyState from "../common/empty-state.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { connect } from "react-redux";
import { getSingleUser } from "../../firebase/firebase.utils";
import {
  getOrderTrackingResultRedux,
  updateOrderApiRedux,
  deleteOrderApiRedux,
  updateOrdersWithPaymentLinkRedux,
  uploadCashInRedux,
  updateOrdersFrom1688Redux,
  setOrderApiRedux,
} from "../../actions/index";
import { reorder1688 } from "../../actions/reorder1688";
import { Link } from "react-router-dom";
import man from "../products/physical/plus image.jpeg";
import { build1688OrderUpdate } from "../../constants/orderStatus1688";
import {
  Badge,
  ModeBadge,
  Button,
  IconButton,
  StatTile,
  StatRow,
} from "../common/listUi.jsx";
import { getShipmentMode } from "../../constants/shipment";
import "../common/list-modern.css";
import {
  create1688Order,
  get1688OrderDetails,
  get1688TrackingStatus,
  generate1688PaymentLink,
  lastCreateOrderError,
  is1688Repickable,
} from "../../actions/get1688Data";
import { statusDisplay } from "../../constants/statusDisplay";
import OrderPrintSlip from "../common/orderPrintSlip.jsx";
import { shopKeyOf } from "../../constants/shopGroups";
import { joinList, withUnit } from "../../constants/displayList";
import FraudCheckPanel from "./fraudCheckPanel.jsx";
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
import { notifyCustomer } from "../common/notifyCustomer";
const PAYMENT_STATE_TONES = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "orange",
};

/* Pipeline stage -> badge tone. Colour climbs from neutral to green as the
   order advances, so a column of them reads as progress. */
const ORDER_STATUS_TONES = {
  pending: "gray",
  Purchased: "blue",
  "Received in Warehouse": "teal",
  "Ready for fly": "violet",
  "Bangladesh customs": "orange",
  "Bangladesh warehouse": "green",
  "Paicart warehouse": "green",
  Delivered: "green",
  Reject: "red",
};

/* One button look for everything in the Actions column, so the box reads as
   a tidy list instead of a stack of differently coloured chips. */
const ACT_BASE = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  width: "100%",
  height: 30,
  padding: "0 10px",
  borderRadius: 7,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#334155",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
  whiteSpace: "nowrap",
  textDecoration: "none",
  boxSizing: "border-box",
};
const ACT = {
  neutral: ACT_BASE,
  primary: {
    ...ACT_BASE,
    background: "#FF6A00",
    borderColor: "#FF6A00",
    color: "#fff",
  },
  danger: { ...ACT_BASE, borderColor: "#fecaca", color: "#b91c1c" },
  disabled: { ...ACT_BASE, color: "#94a3b8", cursor: "not-allowed" },
};
const ACT_STATUS = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#0f7b35",
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
      chineseOrderObj: null,
      chineseTrackingObj: null,
      selectedAddress: {},
      pickOrderError: null,
      // Set only by the Pick button on the New Orders tab - that click is
      // what triggers the Pathao fraud check.
      fraudCheckOrder: null,
      bulkSelected: [], // orderIds ticked for bulk status / payment
      bulkAction: null, // "status" | "payment"
    };
  }

  /* Bulk actions ---------------------------------------------------------- */

  /* Same choices as the single-order status dropdown, plus Received in
     Warehouse, which has its own tab. */
  static BULK_STATUSES = [
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
      .filter((order) => this.state.bulkSelected.includes(order.orderId))
      .map((order) => ({
        id: order.orderId,
        label: order.orderId,
        sub: `${order.uid ? `${order.uid}-` : ""}${order.displayName || "Guest"}`,
        status: order.orderStatus,
        due: getOrderDue(order),
        raw: order,
      }));

  /* The single-order modal refuses to save an order with no purchasing RMB;
     the bulk move keeps that rule except for rejecting. */
  validateBulkStatus = (item, status) =>
    status !== "Reject" && !item.raw.purchasingRmb
      ? "No purchasing RMB entered"
      : null;

  applyBulkStatus = async (item, status, { notify }) => {
    const order = item.raw;
    /* only the changed fields — a full copy of `order` would write back
       whatever else was stale in it */
    await this.props.updateOrderApiRedux({
      orderId: order.orderId,
      ...buildStatusPatch(order, status, "orderStatus"),
    });
    if (notify) {
      notifyCustomer(order.userId, {
        title: "Order Status",
        body: `Your orderId:-${order.orderId} is ${statusDisplay(status)}.`,
      });
    }
  };

  /* Mirrors handleSubmit: a payment row on the order plus a pending cash-in
     entry for accounts. */
  applyBulkPayment = async (item, { amount, method, paymentStatus }) => {
    const order = item.raw;
    const { currentAdmin } = this.props;
    const date = new Date();
    await this.props.updateOrderApiRedux({
      orderId: order.orderId,
      paymentStatus,
      payments: [
        ...(order.payments || []),
        {
          amount,
          method,
          receivedBy: currentAdmin.name,
          date: date.toLocaleDateString("en-GB"),
        },
      ],
    });
    await this.props.uploadCashInRedux({
      id: `${date.getTime()}${Math.floor(Math.random() * 1000)}`,
      category: "1688 Order",
      subCategory: method,
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Order Id: ${order.orderId}   User: ${order.displayName || "Guest"}   (bulk payment)`,
      amount,
      receiveBy: currentAdmin.name,
      status: "pending",
      unEditable: true,
    });
  };

  selectRow = (e, i) => {
    if (!e.target.checked) {
      this.setState({
        checkedValues: this.state.checkedValues.filter((item, j) => i !== item),
      });
    } else {
      this.state.checkedValues.push(i);
      this.setState({
        checkedValues: this.state.checkedValues,
      });
    }
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

  getTracing = (data) => {
    const formatted = Object.values(
      data.reduce((acc, curr) => {
        const [date, time] = curr.acceptTime.split(" ");
        if (!acc[date]) {
          acc[date] = { date, times: [] };
        }
        acc[date].times.push({ time, remark: curr.remark });
        return acc;
      }, {}),
    );
    return (
      <>
        {formatted.map((step, index) => {
          console.log(step);
          return (
            <div className="row" style={{ marginTop: index == 0 ? 0 : 20 }}>
              <div className="col-2" style={{ fontWeight: "bold" }}>
                {step.date}
              </div>
              <div className="col">
                {step.times.map((time, index) => (
                  <div
                    className="row"
                    style={{ marginTop: index == 0 ? 0 : 10 }}
                  >
                    <div className="col-2" style={{ color: "#666" }}>
                      {time.time}
                    </div>
                    <div
                      className="col-8"
                      style={{ color: "#888", fontWeight: "lighter" }}
                    >
                      {" "}
                      {time.remark}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </>
    );
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
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
  handleSubmit = async (event, totalDue) => {
    event.preventDefault();
    const { productObj } = this.state;
    const { currentAdmin } = this.props;
    // if (this.state.amount == 0) {
    //   alert("Paid amount must be more than 0");
    //   return;
    // }
    // if (this.state.amount > totalDue) {
    //   alert("Paid amount can't be more than due amount.");
    //   return;
    // }
    console.log(this.state);

    /* The payment window keeps the copy of the order it was opened with. Writing
       that whole copy back put an order the admin had moved on (e.g. to Paicart
       warehouse) straight back to its old status — so write only the payment
       fields, built on the latest copy of the order in the list. */
    const fresh =
      (this.props.myData || []).find(
        (o) => String(o.orderId) === String(this.state.productObj.orderId),
      ) || this.state.productObj;
    await this.props.updateOrderApiRedux({
      orderId: fresh.orderId,
      paymentStatus:
        this.state.paymentStatus !== ""
          ? this.state.paymentStatus
          : fresh.paymentStatus
            ? fresh.paymentStatus
            : "purchaseLater",
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

    let date = new Date();

    let cashInObj = {
      id: date.getTime().toString(),
      category: "1688 Order",
      subCategory: this.state.method,
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Order Id: ${this.state.productObj.orderId}   User: ${
        this.state.productObj.displayName || "Guest"
      }`,
      amount: this.state.amount,
      receiveBy: currentAdmin.name,
      status: "pending",
      unEditable: true,
    };

    await this.props.uploadCashInRedux(cashInObj);

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
        : this.getSingleShopTotal(order) +
          parseInt(order.shippingChargeCustomer) +
          parseInt(order.localShipping);
    } else {
      totalBill = order.orderTotal
        ? order.orderTotal
        : this.getSingleShopTotal(order);
    }
    totalDue = parseInt(totalBill) - parseInt(totalPaid);
    return totalDue;
  };

  dateFormatter = (raw) => {
    // Extract parts from the string
    const year = raw.slice(0, 4);
    const month = raw.slice(4, 6);
    const day = raw.slice(6, 8);
    const hour = raw.slice(8, 10);
    const minute = raw.slice(10, 12);
    const second = raw.slice(12, 14);
    // milliseconds and timezone are ignored for display

    const formatted = `${year}-${month}-${day} ${hour}:${minute}:${second}`;

    return formatted;
  };

  // Repick is offered until the 1688 order is actually paid: whenever its
  // status is anything other than waitbuyerpay or a paid status, or 1688 no
  // longer knows the order at all.
  canRepick = () => {
    const { productObj, chineseOrderObj, chineseOrderLoading } = this.state;
    if (!productObj || !productObj.orderNumber || chineseOrderLoading)
      return false;
    if (!chineseOrderObj) return true;
    const status = chineseOrderObj.baseInfo && chineseOrderObj.baseInfo.status;
    return is1688Repickable(status);
  };

  renderRepickNotice = () => {
    const { productObj, chineseOrderObj, repickResult } = this.state;
    const box = (tone, children) => (
      <div
        style={{
          margin: "0 16px 4px",
          padding: "10px 14px",
          borderRadius: 8,
          fontSize: 13,
          ...(tone === "error"
            ? { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" }
            : tone === "success"
            ? { background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }
            : { background: "#fff7ed", border: "1px solid #fed7aa", color: "#7c2d12" }),
        }}
      >
        {children}
      </div>
    );
    if (repickResult && repickResult.ok) {
      return box(
        "success",
        <>
          Re-picked: {repickResult.oldOrderNumber} →{" "}
          <b>{repickResult.newOrderNumber}</b>
          {repickResult.payment
            ? ` · saved to payment ${repickResult.order.paymentLinkId} (now ¥${repickResult.payment.totalRmb}). Regenerate its link on the 1688 Payment Link page — it still points at the old order.`
            : "."}
        </>,
      );
    }
    if (repickResult && !repickResult.ok) {
      return box("error", <>Repick failed: {repickResult.error}</>);
    }
    if (!this.canRepick()) return null;
    const status =
      chineseOrderObj && chineseOrderObj.baseInfo
        ? chineseOrderObj.baseInfo.status
        : null;
    return box(
      "warning",
      <>
        {status ? (
          <>
            1688 order <b>{productObj.orderNumber}</b> is <b>{status}</b>, so
            it can't be paid.
          </>
        ) : (
          <>
            1688 order <b>{productObj.orderNumber}</b> wasn't found on 1688.
          </>
        )}{" "}
        Repick places a new 1688 order with the same items and China address
        and updates the 1688 order number here
        {productObj.paymentLinkId ? " and in its payment link" : ""}.
      </>,
    );
  };

  repickOrder = async () => {
    const { productObj } = this.state;
    if (!productObj) return;
    this.setState({ repicking: true, repickResult: null });
    const result = await reorder1688(productObj.orderId);
    if (!result.ok) {
      this.setState({ repicking: false, repickResult: result });
      toast.error(result.error);
      return;
    }
    this.props.setOrderApiRedux(result.order);
    let chineseOrderObj = null;
    try {
      chineseOrderObj = await get1688OrderDetails(result.newOrderNumber);
    } catch (error) {
      console.log(error);
    }
    this.setState({
      repicking: false,
      repickResult: result,
      productObj: result.order,
      chineseOrderObj,
    });
    toast.success(
      `Re-picked: ${result.oldOrderNumber} → ${result.newOrderNumber}`,
    );
  };

  render() {
    const {
      pageSize,
      myClass,
      multiSelectOption,
      pagination,
      currency,
      orderTracking,
      currentAdmin,
      shippingAddress,
    } = this.props;
    console.log(this.props);
    const { myData } = this.props;
    const { productObj, chineseOrderObj, chineseTrackingObj } = this.state;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((order) => {
        newData.push({
          Date: order ? order.orderedDate : "",
          "Order Id": order ? order.orderId : "",
        });
      });
    }
    console.log(shippingAddress);
    console.log(productObj);
    let totalPayableAmount = 0;
    if (productObj) {
      totalPayableAmount =
        parseInt(productObj.orderTotal) +
        (productObj.otherCost ? parseInt(productObj.otherCost) : 0) +
        (productObj.localShipping ? parseInt(productObj.localShipping) : 0) -
        (productObj.discount ? parseInt(productObj.discount) : 0) -
        /* the "pay now %" discount is granted at payment time, so unlike the
           coupon and site discount it is NOT already inside orderTotal */
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
    let totalRmbAmount = 0;

    if (productObj) {
      productObj.items.map((item) => {
        item.skus.map((sku) => {
          totalRmbAmount += parseFloat(
            (sku.price * sku.totalQuantity) /
              (productObj.currency ? productObj.currency : currency.taka),
          );

          console.log(
            parseFloat(
              (sku.price * sku.totalQuantity) /
                (productObj.currency ? productObj.currency : currency.taka),
            ),
          );
        });
      });
    }
    /* Headers must not depend on there being data: newData[0] is undefined
       whenever a filter empties the table, which collapsed the header row. */
    const BASE_COLUMN_KEYS = ["Date", "Order Id"];
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

    /* Supplier (1688 shop) — with a badge when the shop has more than one
       order in this tab. Blue: all from one customer; purple: from several
       customers. Clicking the badge shows just that shop's orders. */
    columns.push({
      Header: <b>Shop</b>,
      id: "shop",
      accessor: (row) => row["Order Id"],
      sortable: false,
      Cell: (row) => {
        const order = myData.find((o) => o.orderId == row.original["Order Id"]);
        if (!order) return null;
        const key = shopKeyOf(order);
        const group =
          key && this.props.shopGroups ? this.props.shopGroups[key] : null;
        const multiCustomer = group && group.customers > 1;
        return (
          <div style={{ textAlign: "left", minWidth: 140 }}>
            <div
              title={order.shopName || ""}
              style={{
                fontSize: 12,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 180,
              }}
            >
              {order.shopName || "—"}
            </div>
            {group && group.count > 1 && (
              <button
                type="button"
                onClick={() =>
                  this.props.onFilterShop &&
                  this.props.onFilterShop(key, group.name)
                }
                title="Show only this shop's orders"
                style={{
                  marginTop: 4,
                  border: "none",
                  borderRadius: 999,
                  padding: "2px 8px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: multiCustomer ? "#f3e8ff" : "#e0f2fe",
                  color: multiCustomer ? "#7c3aed" : "#0369a1",
                }}
              >
                ×{group.count} orders · {group.customers} customer
                {group.customers === 1 ? "" : "s"}
              </button>
            )}
          </div>
        );
      },
      style: { textAlign: "left" },
    });

    columns.push(
      {
        Header: <b>User</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (request) => request.orderId == row.original["Order Id"],
          );

          return (
            <>
              {myData.length > 0 ? (
                <div>
                  <div
                    style={{
                      cursor: "pointer",
                      color: "#ff8084",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      if (currentAdmin && currentAdmin.status == "Partner") {
                        return;
                      } else {
                        this.props.history.push(
                          `${process.env.PUBLIC_URL}/users/list-user/${requestObj.userId}`,
                        );
                      }
                    }}
                  >
                    {requestObj.uid}-{requestObj.displayName}
                  </div>
                  <div style={{ textAlign: "left", fontSize: 12 }}>
                    👨🏻‍💼 {requestObj.deliveryAddress?.name}
                  </div>
                  <div style={{ textAlign: "left", fontSize: 12 }}>
                    📞 {requestObj.deliveryAddress?.mobileNo}
                  </div>
                  <div
                    style={{
                      textAlign: "left",
                      fontSize: 12,
                    }}
                  >
                    🏠︎ {requestObj.deliveryAddress?.address}
                  </div>
                  <div
                    style={{
                      textAlign: "left",
                      fontSize: 12,
                    }}
                  >
                    ⚲⚲ {requestObj.deliveryAddress?.district}
                  </div>
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
        Header: <b>Total (customer)</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          let total1688 = null;
          let shipping1688 = null;

          if (
            requestObj &&
            requestObj.creationTime1688 &&
            requestObj.creationTime1688.totalSuccessAmount
          ) {
            total1688 = requestObj.creationTime1688.totalSuccessAmount;
            shipping1688 = requestObj.creationTime1688.postFee;
          }
          let totalProfit =
            (requestObj.orderTotal ? parseFloat(requestObj.orderTotal) : 0) +
            (requestObj.localShipping
              ? parseFloat(requestObj.localShipping)
              : 0) -
            (total1688 && total1688 * requestObj.exchangeRate
              ? parseFloat(total1688 * requestObj.exchangeRate)
              : 0);

          return (
            <div>
              <div style={{ paddingBottom: 0 }}>
                {parseInt(
                  (requestObj.orderTotal
                    ? parseFloat(requestObj.orderTotal)
                    : 0) +
                    (requestObj.localShipping
                      ? parseFloat(requestObj.localShipping)
                      : 0),
                )}
                Tk
              </div>
              <div style={{ color: "#777", fontSize: 11, paddingBottom: 0 }}>
                Post fee:{" "}
                {requestObj.localShipping ? requestObj.localShipping : 0}Tk
              </div>
              <div style={{ color: "#777", fontSize: 11, paddingBottom: 0 }}>
                Weight: {requestObj.items[0].weight}kg
              </div>
              <div style={{ color: "#404040ff", fontSize: 10, marginTop: 20 }}>
                Profit: {parseFloat(totalProfit).toFixed(2)}Tk
              </div>
            </div>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Total (1688)</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          let total1688 = null;
          let shipping1688 = null;

          if (
            requestObj &&
            requestObj.creationTime1688 &&
            requestObj.creationTime1688.totalSuccessAmount
          ) {
            total1688 = requestObj.creationTime1688.totalSuccessAmount;
            shipping1688 = requestObj.creationTime1688.postFee;
          }
          return (
            <>
              {total1688 && (
                <div>
                  <div style={{ paddingBottom: 0 }}>
                    ¥{total1688 ? total1688 : 0}
                  </div>

                  <div
                    style={{ color: "#777", fontSize: 11, paddingBottom: 0 }}
                  >
                    Post fee: ¥{shipping1688 ? shipping1688 : 0}
                  </div>
                  <div
                    style={{ color: "#777", fontSize: 11, paddingBottom: 0 }}
                  >
                    {total1688 && total1688 * requestObj.exchangeRate
                      ? parseFloat(total1688 * requestObj.exchangeRate).toFixed(
                          2,
                        )
                      : 0}
                    Tk
                  </div>
                  <div
                    style={{ color: "#404040ff", fontSize: 10, marginTop: 20 }}
                  >
                    Rmb Rate:{" "}
                    {requestObj.exchangeRate ? requestObj.exchangeRate : 0}Tk
                  </div>
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
        Header: <b>Total (1688) actual</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          // Written by the order-number click and by the bulk updater; a dash
          // until one of those has run for this order.
          const actualTotal =
            requestObj && parseFloat(requestObj.actual1688OrderTotal);
          if (!Number.isFinite(actualTotal)) {
            return <span style={{ color: "#999" }}>-</span>;
          }
          const actualShipping =
            parseFloat(requestObj.actual1688OrderShippingFee) || 0;
          // Both figures are reported in RMB exactly as 1688 charged them - no
          // Tk conversion, so they stay comparable to the 1688 order page. They
          // are badged rather than plain text to mark them out from the
          // estimated columns beside them: this is what the order truly cost.
          return (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 4,
              }}
            >
              <div
                style={{
                  background: "#6f42c1",
                  color: "white",
                  borderRadius: 5,
                  fontSize: 13,
                  fontWeight: "bold",
                  padding: "2px 8px",
                  /* the ¥ glyph runs into the first digit at bold weight */
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                ¥ {actualTotal}
              </div>
              <div
                style={{
                  background: "#0f766e",
                  color: "white",
                  borderRadius: 5,
                  fontSize: 12,
                  fontWeight: "bold",
                  padding: "2px 8px",
                  letterSpacing: 0.3,
                  whiteSpace: "nowrap",
                }}
              >
                Shipping ¥ {actualShipping}
              </div>
            </div>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Order Number</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <Badge tone={requestObj.orderNumber ? "orange" : "gray"}>
                  {requestObj.orderNumber || "Not Ordered"}
                </Badge>
              ) : (
                <div
                  style={{ cursor: "pointer", display: "inline-block" }}
                  data-toggle={
                    requestObj.orderNumber
                      ? "modal"
                      : this.props.orderStatus == "picked-orders"
                        ? "modal"
                        : ""
                  }
                  data-target={
                    requestObj.orderNumber
                      ? "#chineseOrderModal"
                      : this.props.orderStatus == "picked-orders"
                        ? "#pickModal"
                        : ""
                  }
                  onClick={async () => {
                    let chineseOrderObj2 = null;
                    this.setState({
                      productObj: requestObj,
                      chineseOrderObj: null,
                      chineseOrderLoading: !!requestObj.orderNumber,
                      repickResult: null,
                    });
                    if (requestObj.orderNumber) {
                      try {
                        chineseOrderObj2 = await get1688OrderDetails(
                          requestObj.orderNumber,
                        );
                      } catch (error) {
                        console.log(error);
                      }
                      // Opening the modal is also how a single order gets
                      // resynced: the seller can adjust the cost after the
                      // order is placed, and the 1688 status is what moves the
                      // order between our tabs.
                      const update = build1688OrderUpdate(
                        requestObj,
                        chineseOrderObj2,
                      );
                      if (update) {
                        this.props.updateOrdersFrom1688Redux([update]);
                      }
                    }

                    this.setState({
                      productObj: requestObj,
                      chineseOrderObj: chineseOrderObj2,
                      chineseOrderLoading: false,
                      pickOrderError: null,
                    });
                  }}
                >
                  <Badge tone={requestObj.orderNumber ? "orange" : "gray"}>
                    {requestObj.orderNumber || "Not Ordered"}
                  </Badge>
                </div>
              )}
              {requestObj.removedFromPaymentLink && (
                <div
                  style={{
                    marginTop: 5,
                    background: "crimson",
                    color: "white",
                    display: "inline-block",
                    borderRadius: 5,
                    fontSize: 10,
                    fontWeight: "bold",
                    padding: "2px 5px",
                  }}
                >
                  Removed from generated link
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
        Header: <b>Tracking No</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <Badge tone={requestObj.trackingNo ? "teal" : "gray"}>
                  {requestObj.trackingNo || "wait"}
                </Badge>
              ) : (
                <div
                  style={{ cursor: "pointer", display: "inline-block" }}
                  data-toggle={requestObj.trackingNo ? "modal" : ""}
                  data-target={requestObj.trackingNo ? "#trackingModal" : ""}
                  onClick={async () => {
                    if (requestObj.trackingNo) {
                      let trackingArray = await get1688TrackingStatus(
                        requestObj.orderNumber,
                      );
                      let trackingObj = trackingArray[0];
                      console.log(requestObj.orderNumber);
                      console.log(trackingObj);
                      this.setState({
                        productObj: requestObj,
                        chineseTrackingObj: trackingObj,
                      });
                    }
                  }}
                >
                  <Badge tone={requestObj.trackingNo ? "teal" : "gray"}>
                    {requestObj.trackingNo || "wait"}
                  </Badge>
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
        Header: <b>Method</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
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
            (order) => order.orderId == row.original["Order Id"],
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
                      PAYMENT_STATE_TONES[getDisplayPaymentState(requestObj)] ||
                      "gray"
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
        Header: <b>Order status</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <Badge
              tone={
                (requestObj && ORDER_STATUS_TONES[requestObj.orderStatus]) ||
                "gray"
              }
            >
              {requestObj && statusDisplay(requestObj.orderStatus)}
            </Badge>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Order Details</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => {
          const requestObj = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <Button
              variant="subtle"
              style={ACT.neutral}
              /* Opens the details page, which also syncs every tracking
                 number's cartons from ALG (one lookup per number). */
              onClick={() =>
                this.props.history.push({
                  pathname: `${process.env.PUBLIC_URL}/1688-taobao-orders/details/${requestObj.orderId}`,
                  state: { from: window.location.pathname + window.location.search },
                })
              }
            >
              <i className="fa fa-file-text-o" /> Details
            </Button>
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
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <></>
              ) : (
                <Link
                  to={`${process.env.PUBLIC_URL}/pages/dashboard/buy-and-ship-for/invoice/${order.orderId}`}
                  target="_blank"
                  style={ACT.neutral}
                >
                  <i className="fa fa-print" /> Invoice
                </Link>
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
        Header: <b>Process</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => {
          const order = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <>
              {order.agentId ? (
                <div
                  onClick={() => {
                    this.setState({
                      productObj: order,
                    });
                  }}
                  style={ACT_STATUS}
                >
                  <i className="fa fa-check-circle" /> Picked
                </div>
              ) : null}
              {order.agentId && order.removedFromPaymentLink && (
                <div
                  onClick={async () => {
                    await this.props.updateOrderApiRedux({
                      orderId: order.orderId,
                      agentStatus: "",
                      agentId: "",
                      removedFromPaymentLink: false,
                    });
                    toast.success(
                      `Order ${order.orderNumber || order.orderId} unpicked. It can be picked again.`,
                    );
                  }}
                  style={{ ...ACT.danger, marginTop: 6 }}
                >
                  <i className="fa fa-undo" /> Unpick
                </div>
              )}
              {/* Pathao booking is done on the Delivery page only; this just
                  shows an existing booking */}
              {this.props.orderStatus == "Paicart-warehouse" &&
                order.pathaoBooking?.consignmentId &&
                !(currentAdmin && currentAdmin.status == "Partner") && (
                  <div style={{ marginTop: order.agentId ? 8 : 0 }}>
                    {order.pathaoBooking?.consignmentId ? (
                      <div
                        title={`Booked ${order.pathaoBooking.bookedDate || ""} ${order.pathaoBooking.bookedTime || ""}`}
                        style={{
                          border: "1px solid #e2e8f0",
                          borderRadius: 7,
                          padding: "5px 10px",
                          background: "#f8fafc",
                          fontSize: 11,
                          color: "#64748b",
                          lineHeight: 1.4,
                        }}
                      >
                        <div style={{ fontWeight: 700, color: "#c8102e" }}>
                          <i className="fa fa-truck" /> Pathao booked
                        </div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            color: "#334155",
                            fontSize: 12,
                          }}
                        >
                          {order.pathaoBooking.consignmentId}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              {!order.agentId && (
                <>
                  {currentAdmin && currentAdmin.status == "Partner" ? (
                    <div style={ACT.primary}>
                      <i className="fa fa-hand-paper-o" /> Pick
                    </div>
                  ) : (
                    <div
                      onClick={async () => {
                        this.setState({
                          productObj: order,
                          pickOrderError: null,
                          fraudCheckOrder:
                            this.props.orderStatus == "new" ? order : null,
                        });
                      }}
                      style={ACT.primary}
                      data-toggle="modal"
                      data-target="#pickModal"
                    >
                      <i className="fa fa-hand-paper-o" /> Pick
                    </div>
                  )}
                </>
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
          const order = myData.find(
            (order) => order.orderId == row.original["Order Id"],
          );
          return (
            <>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <></>
              ) : (
                <div style={{ display: "flex", gap: 0 }}>
                  {order?.agentStatus == "Picked" && (
                    <IconButton
                      tone="green"
                      title="Edit order"
                      onClick={() => {
                        const order = myData.find(
                          (order) => order.orderId == row.original["Order Id"],
                        );
                        this.props.startToggleModal(order);
                      }}
                    >
                      <i className="fa fa-pencil" style={{ fontSize: 14 }}></i>
                    </IconButton>
                  )}
                  {(this.props.orderStatus == "new" ||
                    this.props.orderStatus == "picked-orders" ||
                    this.props.orderStatus == "rejected") && (
                    <IconButton
                      tone="red"
                      title="Delete order"
                      data-toggle="modal"
                      data-target="#deleteModal"
                      onClick={() => {
                        const order = myData.find(
                          (order) => order.orderId == row.original["Order Id"],
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
        Header:
          this.state.checkedValues.length > 0 ? (
            <Button
              variant="dark"
              role="button"
              data-toggle="modal"
              data-target="#request_payment"
              onClick={() => {
                console.log(this.state.checkedValues);
                let ordersToPay = myData.filter((order) =>
                  this.state.checkedValues.includes(order.orderId),
                );
                console.log(myData);

                console.log(ordersToPay);
                let totalRmbToPay = 0;
                ordersToPay.map((order) => {
                  totalRmbToPay += parseFloat(
                    order.creationTime1688.totalSuccessAmount,
                  );
                });
                this.setState({
                  checkedValues: [],
                  orders: ordersToPay,
                  totalRmbToPay: parseFloat(totalRmbToPay).toFixed(2),
                  link: null,
                });
              }}
            >
              Pay
            </Button>
          ) : (
            <button
              style={{
                backgroundColor: "gray",
                color: "white",
                padding: "10px",
                border: "none",
                borderRadius: "5px",
              }}
              onClick={() => window.alert("Please choose an order first")}
            >
              multiple pay
            </button>
          ),
        id: "delete",
        accessor: (str) => "delete",
        sortable: false,
        style: {
          textAlign: "center",
        },
        Cell: (row) => {
          const parcelObj = myData.find(
            (parcel) => parcel.orderId == row.original["Order Id"],
          );
          return (
            <div>
              <span>
                {parcelObj.orderNumber &&
                this.props.orderStatus == "picked-orders" &&
                !parcelObj.paymentLink1688 ? (
                  <input
                    type="checkbox"
                    style={{ height: 25, width: 25 }}
                    name={row.original["Order Id"]}
                    checked={this.state.checkedValues.includes(
                      row.original["Order Id"],
                    )}
                    onChange={(e) =>
                      this.selectRow(e, row.original["Order Id"])
                    }
                  />
                ) : null}
              </span>
            </div>
          );
        },
        accessor: key,
        style: {
          textAlign: "center",
        },
      },
    );

    console.log(chineseTrackingObj);

    /* 17 narrow columns did not fit even a wide monitor, and react-table
       clipped whatever overflowed its default 100px. Fold related columns
       into 7 wider ones that stack their pieces vertically. Every cell above
       reads only row.original, so it can be reused as-is inside a group. */
    const labelOf = (col) => {
      const h = col.Header;
      if (typeof h === "string") return h;
      return h && h.props && typeof h.props.children === "string"
        ? h.props.children
        : null;
    };
    const byLabel = {};
    columns.forEach((col) => {
      const label = labelOf(col);
      if (label) byLabel[label] = col;
    });
    const renderPart = (col, row) =>
      col.Cell ? col.Cell(row) : row.original[col.accessor];
    const PART_LABEL = {
      fontSize: 10,
      fontWeight: 700,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
      lineHeight: 1.2,
      marginBottom: 4,
    };
    /* Inline padding on purpose: the admin theme's .rt-td rules kept
       overriding stylesheet padding, which left content against the edge. */
    const CELL = {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      width: "100%",
      minWidth: 0,
      padding: "6px 10px",
      boxSizing: "border-box",
      textAlign: "left",
      lineHeight: 1.5,
      fontSize: 12,
      color: "#334155",
    };
    const orderOf = (row) =>
      myData.find((o) => o.orderId == row.original["Order Id"]);
    const num = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };
    const money = (v, symbol, digits = 0) =>
      `${symbol}${num(v).toLocaleString("en-US", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}`;
    const tk = (v, d = 0) => money(v, "৳", d);
    const rmb = (v) => money(v, "¥", 2);

    const Section = ({ title, children, fullWidth }) => (
      <div style={{ minWidth: 0, width: fullWidth ? "100%" : undefined }}>
        {title && <div style={PART_LABEL}>{title}</div>}
        {children}
      </div>
    );
    /* label ........ value */
    const KV = ({ label, value, color, strong }) => (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 10,
          fontSize: 12,
          lineHeight: 1.7,
        }}
      >
        <span style={{ color: "#94a3b8" }}>{label}</span>
        <span
          style={{
            color: color || "#334155",
            fontWeight: strong ? 700 : 500,
            whiteSpace: "nowrap",
          }}
        >
          {value}
        </span>
      </div>
    );
    const Headline = ({ children, color }) => (
      <div
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: color || "#0f172a",
          lineHeight: 1.3,
          marginBottom: 4,
        }}
      >
        {children}
      </div>
    );
    const Divider = () => (
      <div style={{ borderTop: "1px dashed #e2e8f0", margin: "6px 0" }} />
    );
    const Muted = ({ children }) => (
      <span style={{ color: "#cbd5e1" }}>{children}</span>
    );

    /* every data column sits in its own soft box (Actions stays plain) so a
       row reads as tidy, equal-height cards */
    const BOX = {
      background: "#f8fafc",
      border: "1px solid #e9eef5",
      borderRadius: 10,
      padding: "10px 12px",
      gap: 8,
      height: "100%",
    };
    const custom = (id, header, minWidth, render, gap) => {
      const boxed = id !== "g-actions";
      const base = boxed ? { ...CELL, ...BOX } : CELL;
      return {
        id,
        Header: <b>{header}</b>,
        accessor: (r) => r["Order Id"],
        sortable: false,
        minWidth,
        style: boxed
          ? { textAlign: "left", alignItems: "stretch", padding: "6px 4px" }
          : { textAlign: "left", alignItems: "flex-start" },
        Cell: (row) => {
          const order = orderOf(row);
          return order ? (
            <div style={gap ? { ...base, gap } : base}>{render(order, row)}</div>
          ) : null;
        },
      };
    };
    /* Reuses an existing column's cell (badges, buttons and their modals)
       under a small section title. */
    const group = (id, header, minWidth, parts, opts = {}) =>
      custom(
        id,
        header,
        minWidth,
        (order, row) =>
          parts
            .filter(([, label]) => byLabel[label])
            .map(([title, label]) => (
              <Section key={label} title={title} fullWidth={opts.fullWidth}>
                {renderPart(byLabel[label], row)}
              </Section>
            )),
        opts.gap,
      );

    const quoted1688 = (order) =>
      order.creationTime1688 && order.creationTime1688.totalSuccessAmount
        ? {
            total: num(order.creationTime1688.totalSuccessAmount),
            postFee: num(order.creationTime1688.postFee),
          }
        : null;

    const bulkEnabled = !(currentAdmin && currentAdmin.status == "Partner");
    const bulkIds = (this.props.myData || []).map((o) => o.orderId);
    const groupedColumns = [
      ...(bulkEnabled
        ? [
            selectionColumn({
              allIds: bulkIds,
              selected: this.state.bulkSelected,
              getId: (row) => row["Order Id"],
              onToggle: (id) =>
                this.setState((st) => ({
                  bulkSelected: toggleId(st.bulkSelected, id),
                })),
              onToggleAll: (on) =>
                this.setState({ bulkSelected: on ? bulkIds : [] }),
            }),
          ]
        : []),
      custom("g-order", "Order", 180, (order, row) => (
        <>
          <Section title="Order Id">
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13 }}>
              {order.orderId}
            </div>
            <div style={{ color: "#94a3b8" }}>{row.original["Date"]}</div>
          </Section>
          {byLabel["Shop"] && (
            <Section title="Shop">{renderPart(byLabel["Shop"], row)}</Section>
          )}
        </>
      )),

      custom("g-customer", "Customer", 220, (order) => {
        const a = order.deliveryAddress || {};
        const canOpen = !(currentAdmin && currentAdmin.status == "Partner");
        const line = (icon, text) =>
          text ? (
            <div style={{ display: "flex", gap: 8, alignItems: "baseline" }}>
              <i
                className={`fa ${icon}`}
                style={{ width: 12, color: "#94a3b8", textAlign: "center" }}
              />
              <span style={{ minWidth: 0, wordBreak: "break-word" }}>
                {text}
              </span>
            </div>
          ) : null;
        return (
          <div>
            <div
              onClick={() =>
                canOpen &&
                this.props.history.push(
                  `${process.env.PUBLIC_URL}/users/list-user/${order.userId}`,
                )
              }
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: "#ff6a6f",
                cursor: canOpen ? "pointer" : "default",
                marginBottom: 6,
              }}
            >
              {order.uid ? `${order.uid} · ` : ""}
              {order.displayName || "Guest"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {line("fa-user", a.name)}
              {line("fa-phone", a.mobileNo)}
              {line("fa-home", a.address)}
              {line(
                "fa-map-marker",
                [a.thana, a.district].filter(Boolean).join(", "),
              )}
            </div>
          </div>
        );
      }),

      custom("g-bill", "Customer bill", 170, (order) => {
        const bill = Math.trunc(
          num(order.orderTotal) + num(order.localShipping),
        );
        const q = quoted1688(order);
        const rate = num(order.exchangeRate);
        /* Without a 1688 cost or an RMB rate the old formula reported the
           whole bill as profit. Show it only when it can be worked out. */
        const profit = q && rate > 0 ? bill - q.total * rate : null;
        const weight = order.items && order.items[0] && order.items[0].weight;
        return (
          <div>
            <Headline>{tk(bill)}</Headline>
            <KV label="Post fee" value={tk(order.localShipping)} />
            <KV
              label="Weight"
              value={weight ? `${weight} kg` : <Muted>—</Muted>}
            />
            <Divider />
            <KV
              label="Profit"
              strong
              value={
                profit === null ? (
                  <span style={{ color: "#94a3b8", fontWeight: 500 }}>
                    {q ? "Rate not set" : "No 1688 cost"}
                  </span>
                ) : (
                  tk(profit, 2)
                )
              }
              color={profit < 0 ? "#dc2626" : "#16a34a"}
            />
          </div>
        );
      }),

      /* One 1688 cost column: the actual figure once synced from 1688's
         order detail (the seller may re-price after the order is placed),
         else the quote 1688 returned when the order was created — with the
         difference shown when both exist. */
      custom("g-1688", "1688 cost", 180, (order) => {
        const q = quoted1688(order);
        const actualRaw = parseFloat(order.actual1688OrderTotal);
        const synced = Number.isFinite(actualRaw);
        if (!q && !synced) return <Muted>Not ordered yet</Muted>;
        const total = synced ? actualRaw : q.total;
        const shipping = synced ? num(order.actual1688OrderShippingFee) : q.postFee;
        const diff = synced && q ? actualRaw - q.total : null;
        const rate = num(order.exchangeRate);
        return (
          <div>
            <Headline color={synced ? "#6d28d9" : undefined}>{rmb(total)}</Headline>
            <div style={{ fontSize: 10.5, fontWeight: 600, color: synced ? "#6d28d9" : "#94a3b8", marginTop: -2, marginBottom: 4 }}>
              {synced ? "Actual · synced from 1688" : "Quoted · not synced yet"}
            </div>
            <KV label="Post fee" value={rmb(shipping)} />
            <KV label="In taka" value={rate > 0 ? tk(total * rate, 2) : <Muted>—</Muted>} />
            <Divider />
            <KV
              label="Rmb rate"
              value={rate > 0 ? `৳${rate}` : <span style={{ color: "#94a3b8" }}>Not set</span>}
            />
            {diff !== null && (
              <KV
                label="vs quoted"
                strong
                value={
                  Math.abs(diff) < 0.005
                    ? "Same"
                    : `${diff > 0 ? "+" : "−"}${rmb(Math.abs(diff))} (quoted ${rmb(q.total)})`
                }
                color={Math.abs(diff) < 0.005 ? "#64748b" : diff > 0 ? "#dc2626" : "#16a34a"}
              />
            )}
          </div>
        );
      }),

      group("g-tracking", "1688 order & tracking", 200, [
        ["1688 order no", "Order Number"],
        ["Tracking no", "Tracking No"],
        ["Method", "Method"],
      ]),
      group("g-status", "Status", 150, [
        ["Payment", "Payment status"],
        ["Order", "Order status"],
      ]),
      /* Paicart warehouse: how it will reach the customer — the
         customer's request from To Receive, or set here by staff */
      ...(this.props.orderStatus == "Paicart-warehouse"
        ? [
            custom("g-delivery", "Delivery request", 170, (order) => (
              <DeliveryRequestCell kind="order" record={order} admin={currentAdmin} />
            )),
          ]
        : []),
      group(
        "g-actions",
        "Actions",
        170,
        [
          [null, "Process"],
          [null, "Order Details"],
          [null, "Invoice"],
          [null, "Update"],
        ],
        { fullWidth: true, gap: 6 },
      ),
    ];
    /* The multi-pay checkbox column only ever has checkboxes on Picked
       Orders; elsewhere it was an empty column. */
    const payColumn = columns[columns.length - 1];
    if (this.props.orderStatus == "picked-orders" && payColumn) {
      groupedColumns.push({ ...payColumn, id: "g-pay", minWidth: 110 });
    }

    return (
      <Fragment>
        {newData.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            accent="#ef4444"
            title={
              this.props.isFiltered
                ? "No orders match these filters"
                : `No orders in \u201c${this.props.statusLabel || "this list"}\u201d`
            }
            message={
              this.props.isFiltered
                ? "Nothing here matches your search, payment filter or Air/Sea tab. Try widening the date range or clearing the filters."
                : "Nothing has reached this stage in the selected date range yet — new website orders show up here automatically."
            }
            actionLabel={this.props.isFiltered ? "Clear filters" : undefined}
            onAction={
              this.props.isFiltered ? this.props.onClearFilters : undefined
            }
          />
        ) : (
          <ReactTable
            data={newData}
            columns={groupedColumns}
            defaultPageSize={pageSize}
            className={`${myClass || ""} orders-1688-table`}
            showPagination={pagination}
          />
        )}
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
                  Order Id: {productObj && productObj.orderId}{" "}
                  <OrderPrintSlip record={productObj} kind="order" />
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
                          ORDER_STATUS_TONES[productObj.orderStatus] || "gray"
                        }
                      >
                        {statusDisplay(productObj.orderStatus) || "pending"}
                      </Badge>
                      <Badge tone={productObj.orderNumber ? "orange" : "gray"}>
                        {productObj.orderNumber
                          ? `1688 #${productObj.orderNumber}`
                          : "Not ordered on 1688"}
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
                    // The figures an admin opens this dialog to check.
                    const bill = getOrderPayable(productObj);
                    const paid = this.getTotalPaid(productObj);
                    const due = Math.max(bill - paid, 0);
                    const rmb = parseFloat(productObj.actual1688OrderTotal);
                    return (
                      <StatRow>
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
                        <StatTile
                          tone="violet"
                          label="1688 Actual"
                          value={
                            Number.isFinite(rmb) ? `¥ ${rmb}` : "Not synced"
                          }
                          hint={
                            Number.isFinite(rmb)
                              ? `shipping ¥ ${
                                  parseFloat(
                                    productObj.actual1688OrderShippingFee,
                                  ) || 0
                                }`
                              : ""
                          }
                        />
                      </StatRow>
                    );
                  })()}
                <div style={{ padding: "0px 15px" }}></div>

                {productObj && (
                  <div style={{ fontSize: 11, fontWeight: "bold" }}>
                    Shipment Method:{" "}
                    <span style={{ color: "#ff8084" }}>
                      {productObj.shipmentMethod === "Sea"
                        ? "Sea Shipment"
                        : "Air Shipment"}
                    </span>
                  </div>
                )}

                {productObj && productObj.warehouse && (
                  <div style={{ fontSize: 11 }}>
                    Warehouse Address:{" "}
                    <span style={{ color: "gray", fontSize: 11 }}>
                      {productObj && productObj.warehouse}
                    </span>
                  </div>
                )}

                {productObj &&
                  productObj.items.length > 0 &&
                  productObj.items.map((item) => (
                    <div>
                      {" "}
                      <div style={{ fontWeight: "bold" }}>{item.name}</div>
                      <div>
                        Product Link:{" "}
                        <a href={item.detail_url} target="_blank">
                          <span style={{ color: "#ff8084" }}>
                            {item.detail_url}
                          </span>
                        </a>
                      </div>
                      {item.id && (
                        <div>
                          Paicart Link:{" "}
                          <a
                            href={`https://paicart.com/product/${item.id}`}
                            target="_blank"
                          >
                            <span style={{ color: "#ff8084" }}>
                              {`https://paicart.com/product/${item.id}`}
                            </span>
                          </a>
                        </div>
                      )}
                      <div>
                        Payment Link:{" "}
                        <a href={productObj.paymentLink1688} target="_blank">
                          <span style={{ color: "#ff8084" }}>
                            {productObj.paymentLink1688}
                          </span>
                        </a>
                      </div>
                      <div style={{ marginBottom: 5, fontWeight: "bold" }}>
                        Payment Id: <span>{productObj.paymentLinkId}</span>
                      </div>
                      {productObj && productObj.additionalNotes && (
                        <div style={{ fontWeight: "bold" }}>
                          Additioinal notes:{" "}
                          <span style={{ color: "red", fontWeight: "lighter" }}>
                            {productObj.additionalNotes}
                          </span>
                        </div>
                      )}
                      <table className="table table-bordered table-striped table-hover">
                        <tbody>
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
                                      {item.propertyNames[0]}: {sku.color},{" "}
                                      <br />
                                      {sku.size &&
                                        `${item.propertyNames[1]}: ${sku.size}`}
                                    </div>
                                  )}
                                Shipping Rate: {item.shippingRate} tk/kg
                              </td>
                              <td>{item.productType}</td>
                              <td>
                                {parseFloat(
                                  sku.price /
                                    (productObj.currency
                                      ? productObj.currency
                                      : currency.taka),
                                ).toFixed(2)}
                                rmb
                              </td>
                              <td>{sku.totalQuantity}pcs </td>

                              <td>
                                {parseFloat(
                                  (sku.price * sku.totalQuantity) /
                                    (productObj.currency
                                      ? productObj.currency
                                      : currency.taka),
                                ).toFixed(2)}
                                rmb
                              </td>
                            </tr>
                          ))}{" "}
                        </tbody>
                      </table>
                    </div>
                  ))}

                <div className="row">
                  <div className="col">
                    <div
                      className="row"
                      style={{
                        fontWeight: "bold",

                        paddingLeft: 20,
                        justifyContent: "flex-start",
                      }}
                    >
                      Total Rmb: {parseFloat(totalRmbAmount).toFixed(2)} Rmb
                    </div>
                    <div
                      className="row"
                      style={{
                        fontWeight: "bold",
                        paddingLeft: 20,
                        justifyContent: "flex-start",
                      }}
                    >
                      Agent Name:{" "}
                      {productObj &&
                        this.props.employees.find(
                          (employee) => employee.adminId == productObj.agentId,
                        )?.name}
                    </div>
                    <div
                      className="row"
                      style={{
                        fontWeight: "bold",
                        paddingLeft: 20,
                        justifyContent: "flex-start",
                      }}
                    >
                      Picked Date:{" "}
                      {productObj &&
                        `${
                          productObj.pickedDate
                            ? `${productObj.pickedDate} at`
                            : ""
                        }`}
                      {productObj && productObj.pickedTime}
                    </div>
                    <div
                      className="row"
                      style={{
                        marginBottom: 20,
                        justifyContent: "flex-start",
                        paddingLeft: 20,
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "bold" }}>
                          BD warehouse image:{" "}
                        </div>
                        <div>
                          <a
                            href={
                              productObj && productObj.imageUrlBd
                                ? productObj.imageUrlBd
                                : ""
                            }
                            target="_blank"
                            onClick={(e) => {
                              if (!productObj?.imageUrlBd) {
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
                                productObj && productObj.imageUrlBd
                                  ? productObj.imageUrlBd
                                  : man
                              }
                            />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col" style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: "bold" }}>
                      CN warehouse image:{" "}
                    </div>
                    <div>
                      <a
                        href={
                          productObj && productObj.imageUrl
                            ? productObj.imageUrl
                            : ""
                        }
                        target="_blank"
                        onClick={(e) => {
                          if (!productObj?.imageUrl) {
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
                            productObj && productObj.imageUrl
                              ? productObj.imageUrl
                              : man
                          }
                        />
                      </a>
                    </div>
                    {productObj && productObj.chineseIssue && (
                      <div style={{ color: "red", fontSize: 13 }}>
                        {productObj.chineseIssue}
                      </div>
                    )}
                    {productObj && productObj.returnInfo && (
                      <div
                        style={{ color: "gray", fontSize: 13, marginTop: 10 }}
                      >
                        <span style={{ color: "black", fontWeight: "bold" }}>
                          Return Info:
                        </span>{" "}
                        <br />
                        {productObj.returnInfo}
                      </div>
                    )}
                  </div>
                </div>
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
                              productObj.exchangeRate *
                                productObj.purchasingRmb,
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
                      Product Price:{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && parseInt(productObj.actualTotal)}
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
                        {productObj && productObj.orderedDate}
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
                      Carton:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.agentCarton}
                      </span>
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
                          `${productObj.receivedWeight}kg`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Cargo rate:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.cargoRate &&
                          withUnit(productObj.cargoRate, "Tk/Kg")}
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
                          withUnit(productObj.shippingChargeCargo, "Tk")}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total shipping charge (customer):{" "}
                      <span style={{ fontWeight: "bold" }}>
                        {productObj &&
                          productObj.shippingChargeCustomer &&
                          `${productObj.shippingChargeCustomer}Tk`}
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
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.parcelId,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Received Date:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.dateofWarehouseReceive,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Shipping Mark:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.shippingMark,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Product Name:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.productName,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Product Contains:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.productType,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Total CBM:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.totalCbm,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Total weight:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map(
                                (parcel) => parcel.grossWeight,
                              ),
                              " kg",
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Rate/kg:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.ratePerKg) {
                                  return `${parcel.ratePerKg} tk/kg`;
                                } else {
                                  return "Not given yet";
                                }
                              }),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Other charge:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.otherCharges) {
                                  return `${parcel.otherCharges} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Packaging cost:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.packagingCost) {
                                  return `${parcel.packagingCost} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }),
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Final Total:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {joinList(
                              orderTracking.parcelsArray.map((parcel) => {
                                if (parcel.finalTotal) {
                                  return `${parcel.finalTotal} Tk`;
                                } else {
                                  return "Not given yet";
                                }
                              }),
                            )}
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
          id="chineseOrderModal"
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
                  Order Id: {productObj && productObj.orderId}
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

              {chineseOrderObj && (
                <div className="modal-body">
                  <div style={{ padding: "0px 15px" }}></div>

                  {productObj &&
                    productObj.items.length > 0 &&
                    productObj.items.map((item) => (
                      <div>
                        {" "}
                        <div style={{ fontWeight: "bold" }}>
                          {chineseOrderObj.productItems[0].name}
                        </div>
                        <div>
                          Product Link:{" "}
                          <a href={item.detail_url} target="_blank">
                            <span style={{ color: "#ff8084" }}>
                              {item.detail_url}
                            </span>
                          </a>
                        </div>
                        <div>
                          Payment Link:{" "}
                          <a href={productObj.paymentLink1688} target="_blank">
                            <span style={{ color: "#ff8084" }}>
                              {productObj.paymentLink1688}
                            </span>
                          </a>
                        </div>
                        <div style={{ marginBottom: 5, fontWeight: "bold" }}>
                          Payment Id: <span>{productObj.paymentLinkId}</span>
                        </div>
                      </div>
                    ))}
                  {chineseOrderObj && (
                    <div style={{ marginTop: 20 }}>
                      <table className="table table-bordered table-striped table-hover">
                        <tbody>
                          <tr>
                            <th>Product</th>
                            <th>Variation</th>
                            <th>Unit Price</th>
                            <th>Quantity</th>
                            <th>Total</th>
                            <th>Status</th>
                          </tr>
                          {chineseOrderObj.productItems.map((sku) => (
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
                                    sku.productImgUrl
                                      ? sku.productImgUrl[0]
                                      : man
                                  }
                                />
                              </td>
                              <td>
                                {sku.skuInfos && sku.skuInfos.length > 0 && (
                                  <div>
                                    {sku.skuInfos.map((sku1) => (
                                      <div
                                        style={{
                                          fontSize: 15,
                                          color: "#555",
                                        }}
                                      >
                                        {sku1.name}:{sku1.value}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td>
                                ¥{" "}
                                {parseFloat(
                                  sku.itemAmount / sku.quantity,
                                ).toFixed(2)}
                              </td>
                              <td>{sku.quantity}pcs</td>
                              <td>¥ {parseFloat(sku.itemAmount).toFixed(2)}</td>
                              <td>
                                <span
                                  style={{
                                    color: "cadetblue",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {sku.status}
                                </span>
                              </td>
                            </tr>
                          ))}{" "}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="row">
                    <div className="col">
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",

                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Order Creation Time:
                        </span>{" "}
                        {this.dateFormatter(
                          chineseOrderObj.baseInfo.createTime,
                        )}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Order Account:
                        </span>{" "}
                        {chineseOrderObj.baseInfo.buyerLoginId}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Order Number (1688):
                        </span>{" "}
                        {chineseOrderObj.baseInfo.idOfStr}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Order Total Amount:
                        </span>{" "}
                        ¥ {chineseOrderObj.baseInfo.totalAmount}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Shipping Fee:
                        </span>{" "}
                        ¥ {chineseOrderObj.baseInfo.shippingFee}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>
                          Refund Amount:
                        </span>{" "}
                        ¥ {chineseOrderObj.baseInfo.refund}
                      </div>
                      <div
                        className="row"
                        style={{
                          fontWeight: "bold",
                          marginTop: 5,
                          paddingLeft: 20,
                          justifyContent: "flex-start",
                        }}
                      >
                        <span style={{ fontWeight: "lighter" }}>Status:</span>{" "}
                        <span
                          style={{
                            padding: 2,
                            borderRadius: 3,
                            background: "cadetblue",
                            color: "white",
                            fontWeight: "bold",
                          }}
                        >
                          {chineseOrderObj.baseInfo.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div
                    className="row"
                    style={{
                      marginBottom: 10,
                      borderTop: "1px solid gainsboro",
                      marginTop: 20,
                      paddingTop: 20,
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
                        Seller Information
                      </div>

                      <div className="category-list-shipping">
                        Company Name:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.companyName}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Email:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.email}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Mobile:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.mobile}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Name:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.name}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Phone:
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.phone}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Shop Name:{" "}
                        <span
                          style={{
                            fontWeight: "lighter",
                            textTransform: "capitalize",
                          }}
                        >
                          {chineseOrderObj.baseInfo.sellerContact.shopName}
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
                        Receiver Information
                      </div>
                      <div className="category-list-shipping">
                        Name:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.contactPerson}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Mobile:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.mobile}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Postcode:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.zip}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Province:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.province}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        City:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.city}
                        </span>
                      </div>
                      <div className="category-list-shipping">
                        Address:{" "}
                        <span style={{ fontWeight: "lighter" }}>
                          {chineseOrderObj.nativeLogistics.address}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {this.renderRepickNotice()}
              <div className="modal-footer">
                {this.canRepick() && (
                  <button
                    type="button"
                    className="btn"
                    disabled={this.state.repicking}
                    style={{
                      background: "#ff5b00",
                      color: "white",
                      opacity: this.state.repicking ? 0.7 : 1,
                    }}
                    onClick={this.repickOrder}
                  >
                    {this.state.repicking ? "Re-picking…" : "Repick (Reorder)"}
                  </button>
                )}
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
          id="pickModal"
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
                  Order Id: {productObj && productObj.orderId}
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
                <div style={{ padding: "0px 15px" }}></div>

                {this.props.orderStatus == "new" &&
                  this.state.fraudCheckOrder && (
                    <FraudCheckPanel
                      phone={
                        this.state.fraudCheckOrder.deliveryAddress?.mobileNo
                      }
                      name={this.state.fraudCheckOrder.deliveryAddress?.name}
                    />
                  )}

                {productObj && productObj.warehouse && (
                  <div style={{ fontSize: 11 }}>
                    Warehouse Address:{" "}
                    <span style={{ color: "gray", fontSize: 11 }}>
                      {productObj && productObj.warehouse}
                    </span>
                  </div>
                )}

                {productObj &&
                  productObj.items.length > 0 &&
                  productObj.items.map((item) => (
                    <div>
                      {" "}
                      <div style={{ fontWeight: "bold" }}>{item.name}</div>
                      <div>
                        Product Link:{" "}
                        <a href={item.detail_url} target="_blank">
                          <span style={{ color: "#ff8084" }}>
                            {item.detail_url}
                          </span>
                        </a>
                      </div>
                      {productObj && productObj.additionalNotes && (
                        <div style={{ fontWeight: "bold" }}>
                          Additioinal notes:{" "}
                          <span style={{ color: "red", fontWeight: "lighter" }}>
                            {productObj.additionalNotes}
                          </span>
                        </div>
                      )}
                      <table className="table table-bordered table-striped table-hover">
                        <tbody>
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
                                      {item.propertyNames[0]}: {sku.color},{" "}
                                      <br />
                                      {sku.size &&
                                        `${item.propertyNames[1]}: ${sku.size}`}
                                    </div>
                                  )}
                                Shipping Rate: {item.shippingRate} tk/kg
                              </td>
                              <td>{item.productType}</td>
                              <td>
                                {parseFloat(
                                  sku.price /
                                    (productObj.currency
                                      ? productObj.currency
                                      : currency.taka),
                                ).toFixed(2)}
                                rmb
                              </td>
                              <td>{sku.totalQuantity}pcs </td>

                              <td>
                                {parseFloat(
                                  (sku.price * sku.totalQuantity) /
                                    (productObj.currency
                                      ? productObj.currency
                                      : currency.taka),
                                ).toFixed(2)}
                                rmb
                              </td>
                            </tr>
                          ))}{" "}
                        </tbody>
                      </table>
                    </div>
                  ))}

                <div
                  className="row"
                  style={{
                    marginBottom: 10,
                    fontWeight: "bold",
                    padding: 20,
                    paddingTop: 0,
                    justifyContent: "space-between",
                  }}
                >
                  <div style={{ minWidth: 250 }}>
                    <select
                      title=""
                      name="agentCarton"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      style={{ fontSize: ".8rem" }}
                      value={this.state.agentCarton}
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
                  <div>
                    Total rmb: {parseFloat(totalRmbAmount).toFixed(2)} Rmb
                  </div>
                </div>
                <div
                  className="row"
                  style={{
                    marginBottom: 10,
                    fontWeight: "bold",
                    padding: 20,
                    paddingTop: 0,
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{
                      textAlign: "left",
                      fontWeight: "bold",
                      color: "black",
                      padding: 20,
                      paddingBottom: 10,
                    }}
                  >
                    Choose China Shipping Address
                  </div>
                  <div>
                    {shippingAddress && shippingAddress.length > 0 && (
                      <div>
                        {shippingAddress.map((address) => {
                          const isSelected =
                            this.state.selectedAddress &&
                            this.state.selectedAddress.id === address.id;

                          return (
                            <div className="container my-2" key={address.id}>
                              <div
                                className="card border-0 shadow-lg rounded-lg overflow-hidden position-relative"
                                style={{
                                  borderRadius: "18px",
                                }}
                              >
                                {/* Selected Badge */}
                                {isSelected && (
                                  <div
                                    style={{
                                      position: "absolute",
                                      top: 12,
                                      right: 12,
                                      background: "#ec345b",
                                      color: "white",
                                      padding: "6px 12px",
                                      borderRadius: "30px",
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      display: "flex",
                                      alignItems: "center",
                                      zIndex: 10,
                                      boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                                    }}
                                  >
                                    <i
                                      className="icofont-check-circled"
                                      style={{
                                        marginRight: "6px",
                                        fontSize: "14px",
                                        color: "white",
                                      }}
                                    />
                                    Selected
                                  </div>
                                )}

                                <div
                                  className="card-body p-4 bg-white"
                                  style={{
                                    cursor: "pointer",
                                    border: isSelected
                                      ? "2px solid #ec345b"
                                      : "2px solid transparent",
                                    borderRadius: 10,
                                    transition: "all 0.25s ease",
                                  }}
                                  onClick={() => {
                                    this.setState({ selectedAddress: address });
                                  }}
                                >
                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Address Id:</strong> {address.id}
                                  </p>
                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Name:</strong> {address.fullName}
                                  </p>

                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Contact No:</strong>{" "}
                                    {address.mobilePhone}
                                  </p>

                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Address:</strong> {address.address}
                                  </p>

                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Address Code:</strong>{" "}
                                    {address.addressCode}
                                  </p>

                                  <p
                                    className="mb-1"
                                    style={{
                                      color: isSelected ? "black" : "gray",
                                    }}
                                  >
                                    <strong>Post:</strong> {address.post}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    Total rmb: {parseFloat(totalRmbAmount).toFixed(2)} Rmb
                  </div>
                </div>
              </div>
              {this.state.pickOrderError && (
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
                      1688 order creation failed:
                    </div>
                    <div style={{ fontSize: 13 }}>
                      {this.state.pickOrderError.message ||
                        this.state.pickOrderError.code ||
                        "Unknown error"}
                    </div>
                  </div>
                </div>
              )}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn"
                  style={{ background: "green", color: "white" }}
                  onClick={async () => {
                    if (!this.state.agentCarton) {
                      alert(
                        "Please choose a carton. You can't pick a order without choosing a carton",
                      );
                      return;
                    }
                    if (!this.state.selectedAddress.id) {
                      alert(
                        "Please choose a shipping address. You can't pick a order without choosing a shipping address",
                      );
                      return;
                    }

                    this.setState({ pickOrderError: null });

                    let date = new Date();

                    if (
                      this.props.currentAdmin &&
                      this.props.currentAdmin.adminId
                    ) {
                      console.log(productObj);

                      let orderObj1688;
                      try {
                        orderObj1688 = await create1688Order(
                          productObj,
                          this.state.selectedAddress.id,
                        );
                      } catch (err) {
                        console.error("create1688Order threw", err);
                        this.setState({
                          pickOrderError: {
                            code: "CLIENT_ERROR",
                            message:
                              err?.message ||
                              "Unexpected error while creating the 1688 order.",
                          },
                        });
                        toast.error(
                          "Unexpected error while creating the 1688 order.",
                        );
                        return;
                      }

                      if (!orderObj1688) {
                        this.setState({
                          pickOrderError: lastCreateOrderError,
                        });
                        toast.error(
                          lastCreateOrderError?.message ||
                            lastCreateOrderError?.code ||
                            "Failed to create the 1688 order.",
                        );
                        return;
                      }

                      this.props.updateOrderApiRedux({
                        orderId: productObj.orderId,
                        agentStatus: "Picked",
                        agentId: this.props.currentAdmin.adminId,
                        pickedDate: date.toLocaleDateString("en-GB"),
                        pickedTime: date.toLocaleTimeString("en-GB"),
                        totalRmbAmount: parseFloat(totalRmbAmount).toFixed(2),
                        agentCarton: this.state.agentCarton,
                        orderNumber: orderObj1688.orderId
                          ? orderObj1688.orderId
                          : "",
                        creationTime1688: {
                          postFee: orderObj1688.postFee
                            ? parseFloat(orderObj1688.postFee / 100).toFixed(2)
                            : "",
                          totalSuccessAmount: orderObj1688.totalSuccessAmount
                            ? parseFloat(
                                orderObj1688.totalSuccessAmount / 100,
                              ).toFixed(2)
                            : "",
                        },
                        chinaAddress: this.state.selectedAddress,
                      });

                      // CLOSE MODAL ONLY AFTER SUCCESS
                      window.$("#pickModal").modal("hide");
                    }
                  }}
                >
                  Pick Order
                </button>
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
          idLabel="Order Id"
          idValue={productObj && productObj.orderId}
          badges={
            productObj && (
              <>
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
                  { label: "Product price", value: productObj.actualTotal },
                  {
                    label: `Coupon${
                      productObj.couponUsed ? ` (${productObj.couponUsed.name})` : ""
                    }`,
                    value: productObj.couponAmount,
                    sign: "-",
                  },
                  {
                    label: `Pay-now discount (${productObj.offer || 0}%)`,
                    value:
                      productObj.offer && productObj.offer !== 0
                        ? getOfferDiscount(productObj)
                        : 0,
                    sign: "-",
                  },
                  {
                    label: "Price after discount",
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
                    label: "Discount (on shipment)",
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
                    label: "Refunded",
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
          id="trackingModal"
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
                  Tracking No: {productObj && productObj.trackingNo}
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
              {chineseTrackingObj && (
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
                      Order Id (1688): {productObj && productObj.orderNumber}
                    </div>
                  </div>
                  <div
                    style={{
                      marginTop: 10,
                      padding: 40,
                      paddingBottom: 0,
                      paddingTop: 20,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        margin: "30px 0",
                      }}
                    >
                      {/* Step 1 */}
                      <div
                        style={{
                          textAlign: "center",
                          color: "#fff",
                        }}
                      >
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: "26px",
                            backgroundColor:
                              productObj.chineseShipmentStatusScore == 1
                                ? "white"
                                : productObj.chineseShipmentStatusScore > 1
                                  ? "#f9c9a9"
                                  : "#eee",
                            border:
                              productObj.chineseShipmentStatusScore == 1
                                ? "3px solid #f60"
                                : "none",
                          }}
                        >
                          🏭
                        </div>
                        <div
                          style={{
                            color:
                              productObj.chineseShipmentStatusScore >= 1
                                ? "#f60"
                                : "#bbb",
                            marginTop: "8px",
                          }}
                        >
                          Consigned
                        </div>
                      </div>

                      {/* Dotted line */}
                      <div
                        style={{
                          flex: 1,
                          borderTop:
                            productObj.chineseShipmentStatusScore > 1
                              ? "2px dashed #f6c8a5"
                              : "2px dashed #ddd",
                          margin: "0 10px",
                        }}
                      ></div>

                      {/* Step 2 */}
                      <div
                        style={{
                          textAlign: "center",
                          color: "#fff",
                        }}
                      >
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: "26px",
                            backgroundColor:
                              productObj.chineseShipmentStatusScore == 2
                                ? "white"
                                : productObj.chineseShipmentStatusScore > 2
                                  ? "#f9c9a9"
                                  : "#eee",
                            border:
                              productObj.chineseShipmentStatusScore == 2
                                ? "3px solid #f60"
                                : "none",
                          }}
                        >
                          📦
                        </div>
                        <div
                          style={{
                            color:
                              productObj.chineseShipmentStatusScore >= 2
                                ? "#f60"
                                : "#bbb",
                            marginTop: "8px",
                          }}
                        >
                          Shipped
                        </div>
                      </div>

                      {/* Dotted line */}
                      <div
                        style={{
                          flex: 1,
                          borderTop:
                            productObj.chineseShipmentStatusScore > 2
                              ? "2px dashed #f6c8a5"
                              : "2px dashed #ddd",
                          margin: "0 10px",
                        }}
                      ></div>

                      {/* Step 3 (active) */}
                      <div
                        style={{
                          textAlign: "center",
                        }}
                      >
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: "26px",
                            color: "#f60",
                            backgroundColor:
                              productObj.chineseShipmentStatusScore == 3
                                ? "white"
                                : productObj.chineseShipmentStatusScore > 3
                                  ? "#f9c9a9"
                                  : "#eee",
                            border:
                              productObj.chineseShipmentStatusScore == 3
                                ? "3px solid #f60"
                                : "none",
                          }}
                        >
                          🚚
                        </div>
                        <div
                          style={{
                            color:
                              productObj.chineseShipmentStatusScore >= 3
                                ? "#f60"
                                : "#bbb",
                            marginTop: "8px",
                          }}
                        >
                          In Transit
                        </div>
                      </div>

                      {/* Dotted line */}
                      <div
                        style={{
                          flex: 1,
                          borderTop:
                            productObj.chineseShipmentStatusScore > 3
                              ? "2px dashed #f6c8a5"
                              : "2px dashed #ddd",
                          margin: "0 10px",
                        }}
                      ></div>

                      {/* Step 4 */}
                      <div
                        style={{
                          textAlign: "center",
                          color: "#bbb",
                        }}
                      >
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: "26px",
                            backgroundColor:
                              productObj.chineseShipmentStatusScore == 4
                                ? "white"
                                : productObj.chineseShipmentStatusScore > 4
                                  ? "#f9c9a9"
                                  : "#eee",
                            border:
                              productObj.chineseShipmentStatusScore == 4
                                ? "3px solid #f60"
                                : "none",
                          }}
                        >
                          🕵
                        </div>
                        <div
                          style={{
                            color:
                              productObj.chineseShipmentStatusScore >= 4
                                ? "#f60"
                                : "#bbb",
                            marginTop: "8px",
                          }}
                        >
                          Delivering
                        </div>
                      </div>

                      {/* Dotted line */}
                      <div
                        style={{
                          flex: 1,
                          borderTop:
                            productObj.chineseShipmentStatusScore > 4
                              ? "2px dashed #f6c8a5"
                              : "2px dashed #ddd",
                          margin: "0 10px",
                        }}
                      ></div>

                      {/* Step 5 */}
                      <div
                        style={{
                          textAlign: "center",
                          color: "#bbb",
                        }}
                      >
                        <div
                          style={{
                            width: "70px",
                            height: "70px",
                            borderRadius: "50%",

                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "auto",
                            fontSize: "26px",
                            backgroundColor:
                              productObj.chineseShipmentStatusScore == 5
                                ? "#f9c9a9"
                                : productObj.chineseShipmentStatusScore > 5
                                  ? "#f9c9a9"
                                  : "#eee",
                            border:
                              productObj.chineseShipmentStatusScore == 5
                                ? "3px solid #f60"
                                : "none",
                          }}
                        >
                          ✅
                        </div>
                        <div
                          style={{
                            color:
                              productObj.chineseShipmentStatusScore >= 5
                                ? "#f60"
                                : "#bbb",
                            marginTop: "8px",
                          }}
                        >
                          Delivered
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ margin: 20 }}>
                    <div
                      style={{
                        background: "#f6f6f6ff",
                        borderRadius: 5,
                        padding: 15,
                      }}
                    >
                      {this.getTracing(chineseTrackingObj.logisticsSteps)}
                    </div>
                  </div>
                </div>
              )}
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
                  Booking Id: {productObj && productObj.orderId}
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
                    Are you sure you want to delete this order?
                    {(() => {
                      /* Rejected records can still carry payments; deleting
                         erases that history, so say so before it happens. */
                      const paid = (
                        (productObj && productObj.payments) ||
                        []
                      ).reduce(
                        (total, p) => total + (parseFloat(p && p.amount) || 0),
                        0,
                      );
                      return paid > 0 ? (
                        <div
                          style={{
                            marginTop: 8,
                            color: "#b91c1c",
                            fontWeight: "normal",
                            fontSize: 13,
                          }}
                        >
                          Warning: ৳{Math.round(paid).toLocaleString()} in
                          payments is recorded on it — its payment history will
                          be deleted too.
                        </div>
                      ) : null;
                    })()}
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
                <button
                  type="button"
                  className="btn "
                  style={{ backgroundColor: "red", color: "white" }}
                  data-dismiss="modal"
                  onClick={() => {
                    this.props.deleteOrderApiRedux(productObj);
                  }}
                >
                  Yes
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
              {this.state.orders && this.state.orders.length > 0 && (
                <div className="modal-body">
                  <div className="row" style={{ padding: 20 }}>
                    <table className="table table-bordered table-striped table-hover">
                      <thead style={{ background: "#18768f", color: "white" }}>
                        <tr>
                          <td style={{ fontWeight: "bold" }}>Product</td>
                          <td style={{ fontWeight: "bold" }}>Name</td>
                          <td style={{ fontWeight: "bold" }}>Order Number</td>

                          <td style={{ fontWeight: "bold" }}>Total</td>
                        </tr>
                      </thead>
                      <tbody>
                        {this.state.orders.map((order) => (
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
                          <td>¥{this.state.totalRmbToPay || 0}</td>
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
                      const orderIdList = this.state.orders.map((order) => {
                        return order.orderNumber;
                      });
                      console.log(orderIdList);
                      let link = await generate1688PaymentLink(orderIdList);
                      if (!link) {
                        alert("Link generation failed!");
                        return;
                      }
                      // here create a document inside paymentLinks1688 and update all the orders with paymentLink1688 field
                      if (
                        this.state.totalRmbToPay &&
                        this.state.orders &&
                        link
                      ) {
                        console.log(
                          "update order with payment is getting called!",
                        );
                        await this.props.updateOrdersWithPaymentLinkRedux(
                          this.state.totalRmbToPay,
                          this.state.orders,
                          link,
                        );
                      } else {
                        alert("One of the Data is missing");
                      }

                      this.setState({
                        link: link,
                      });
                    }}
                  >
                    Generate Link
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
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
            notifyAvailable
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
  };
};
export default connect(mapStateToProps, {
  getOrderTrackingResultRedux,
  updateOrderApiRedux,
  deleteOrderApiRedux,
  updateOrdersWithPaymentLinkRedux,
  uploadCashInRedux,
  updateOrdersFrom1688Redux,
  setOrderApiRedux,
})(Datatable);
