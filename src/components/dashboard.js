import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import Axios from "axios";
import ClipLoader from "react-spinners/ClipLoader";
import {
  ShoppingCart,
  Package,
  Truck,
  FileText,
  CreditCard,
  RotateCcw,
  CheckSquare,
  Tag,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Inbox,
} from "react-feather";

import Breadcrumb from "./common/breadcrumb";
import { Badge, Button, SegmentTabs, TONES } from "./common/listUi";
import EmptyState from "./common/empty-state";
import { AreaSpark, ComboBars, Donut, Meter, ChartFrame } from "./common/charts";

import {
  getAllShipmentRequestsToChangeStatus,
  getAllOrdersToChangeStatus,
  getAllProductRequestToChangeStatus,
  getAllOrdersApi,
  getAllPaymentRequest,
  getAllPaymentRequestOrder,
  getAllQuickRefundRequest,
  getAllAfterSale,
  updateOrderApi,
  updateShipmentRequest,
  updateProductRequest,
} from "../firebase/firebase.utils";

import {
  getOrderPayable,
  getOrderPaid,
  getOrderDue,
  summarisePayments,
  PAYMENT_STATES,
} from "../constants/paymentMath";
import { getShipmentMode } from "../constants/shipment";
import { getRecordTime } from "../constants/dateRange";
import {
  RANGES,
  getRange,
  getRangeBounds,
  getTwelveMonthBounds,
  bucketRecords,
  delta,
  LADDER,
  oldestWaitingDays,
  money,
  compactMoney,
  rmb,
} from "../constants/dashboardMath";
import "./dashboard.css";

const num = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/* What 1688 actually charged for an order, in RMB. The order carries the
   figure under creationTime1688 once someone has synced it; actual1688OrderTotal
   is the newer field written by the same sync. */
const getOrderRmb = (order) => {
  if (!order) return 0;
  const fromSync = num(order.actual1688OrderTotal);
  if (fromSync > 0) return fromSync;
  return num(
    order.creationTime1688 && order.creationTime1688.totalSuccessAmount,
  );
};

/* Purchase cost in taka, at the rate stored on the order itself - not
   today's rate, which would restate the cost of every historical order every
   time the rate moves. */
const getOrderCost = (order) => {
  const yuan = getOrderRmb(order);
  if (yuan <= 0) return 0;
  const rate = num(order.exchangeRate) || num(order.currency);
  return yuan * rate;
};

const PAYMENT_STATE_TONES = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
};

export class Dashboard extends Component {
  constructor(props) {
    super(props);
    this.state = {
      /* the three bulk-sync buttons */
      loader1: false,
      loader2: false,
      loader3: false,

      range: "today",
      loading: true,
      error: null,
      updatedAt: null,

      ordersInRange: [],
      ordersPrevRange: [],
      orderBacklog: [],
      productBacklog: [],
      shipmentBacklog: [],
      paymentRequests: [],
      paymentRequestOrders: [],
      quickRefunds: [],
      afterSale: [],

      monthlyOrders: [],
      monthlyLoading: true,
    };
  }

  componentDidMount = async () => {
    this.mounted = true;
    await this.loadAll();
    /* Deferred: a twelve-month pull is the largest query on the page and
       nothing above the fold depends on it. */
    this.loadMonthly();
  };

  componentWillUnmount() {
    this.mounted = false;
  }

  setStateIfMounted = (next) => {
    if (this.mounted) this.setState(next);
  };

  loadAll = async () => {
    this.setStateIfMounted({ loading: true, error: null });
    const { startDate, endDate, prevStartDate, prevEndDate } = getRangeBounds(
      this.state.range,
    );

    try {
      const [
        ordersInRange,
        ordersPrevRange,
        orderBacklog,
        productBacklog,
        shipmentBacklog,
        paymentRequests,
        paymentRequestOrders,
        quickRefunds,
        afterSale,
      ] = await Promise.all([
        getAllOrdersApi("", startDate, endDate),
        getAllOrdersApi("", prevStartDate, prevEndDate),
        /* One query per entity returns the whole in-flight backlog; every
           per-status count below is a filter over it. Fetching each status
           separately would be nineteen round trips. */
        getAllOrdersToChangeStatus(),
        getAllProductRequestToChangeStatus(),
        getAllShipmentRequestsToChangeStatus(),
        getAllPaymentRequest(),
        getAllPaymentRequestOrder(),
        getAllQuickRefundRequest(),
        getAllAfterSale(),
      ]);

      this.setStateIfMounted({
        ordersInRange: ordersInRange || [],
        ordersPrevRange: ordersPrevRange || [],
        orderBacklog: orderBacklog || [],
        productBacklog: productBacklog || [],
        shipmentBacklog: shipmentBacklog || [],
        paymentRequests: paymentRequests || [],
        paymentRequestOrders: paymentRequestOrders || [],
        quickRefunds: quickRefunds || [],
        afterSale: afterSale || [],
        loading: false,
        updatedAt: new Date(),
      });
    } catch (error) {
      console.error("Dashboard load failed", error);
      /* The rest of this codebase alert()s on a failed read. A dashboard
         that fires nine of them on a dropped connection is unusable. */
      this.setStateIfMounted({
        loading: false,
        error:
          (error && error.message) ||
          "Could not reach the database. Check your connection and refresh.",
      });
    }
  };

  loadMonthly = async () => {
    const { startDate, endDate } = getTwelveMonthBounds();
    try {
      const monthlyOrders = await getAllOrdersApi("", startDate, endDate);
      this.setStateIfMounted({
        monthlyOrders: monthlyOrders || [],
        monthlyLoading: false,
      });
    } catch (error) {
      console.error("Dashboard 12-month load failed", error);
      this.setStateIfMounted({ monthlyLoading: false });
    }
  };

  changeRange = (range) => {
    if (range === this.state.range) return;
    this.setState({ range }, this.loadAll);
  };
  /* Runs one of the three ALG status syncs, then refetches the board so the
     figures reflect whatever the sync just moved. */
  runSync = async (loaderKey, sync) => {
    if (this.state[loaderKey]) return;
    this.setState({ [loaderKey]: true });
    try {
      await sync();
    } catch (error) {
      console.error('Status sync failed', error);
      this.setStateIfMounted({
        error: 'The tracking sync did not finish. Some records may not have been updated.',
      });
    } finally {
      this.setStateIfMounted({ [loaderKey]: false });
    }
    await this.loadAll();
  };

  getUpdatedShipmentRequestStatus = async () => {
    const allRequests = await getAllShipmentRequestsToChangeStatus();
    const checkStatusArray = allRequests
      .filter((request) => request.status !== "Pending")
      .filter((request) => request.trackingNo);
    console.log(checkStatusArray);
    await Promise.all(
      checkStatusArray.map(async (request) => {
      const resultObj = await Axios.get(
        `https://alglimited.com/api/v1/orderTracking-alg/${request.trackingNo}`
      );
      if (resultObj && resultObj.data) {
        console.log(resultObj.data);
        let updatedStatus = {};
        let date = new Date().toLocaleDateString("en-GB");
        let date2 = new Date().toLocaleTimeString("en-GB");

        if (resultObj.data.parcelsArray[0].parcelStatus == "Delivered") {
          updatedStatus = {
            status: "Paicart warehouse",
            shipmentStatusScore: 6,
            "Paicart warehouseDate": request["Paicart warehouseDate"]
              ? request["Paicart warehouseDate"]
              : date,
            "Paicart warehouseTime": request["Paicart warehouseTime"]
              ? request["Paicart warehouseTime"]
              : date2,
          };
        } else if (resultObj.data.lotObj.shipmentStatus == "Local Warehouse") {
          updatedStatus = {
            status: "Bangladesh warehouse",
            shipmentStatusScore: 5,
            "Bangladesh warehouseDate": request["Bangladesh warehouseDate"]
              ? request["Bangladesh warehouseDate"]
              : date,
            "Bangladesh warehouseTime": request["Bangladesh warehouseTime"]
              ? request["Bangladesh warehouseTime"]
              : date2,
          };
        } else if (
          resultObj.data.lotObj.shipmentStatus == "Bangladesh Customs"
        ) {
          updatedStatus = {
            status: "Bangladesh customs",
            shipmentStatusScore: 5,
            "Bangladesh customsDate": request["Bangladesh customsDate"]
              ? request["Bangladesh customsDate"]
              : date,
            "Bangladesh customsTime": request["Bangladesh customsTime"]
              ? request["Bangladesh customsTime"]
              : date2,
          };
        } else if (resultObj.data.lotObj.shipmentStatus == "Ready to Fly") {
          updatedStatus = {
            status: "Ready for fly",
            shipmentStatusScore: 4,
            "Ready for flyDate": request["Ready for flyDate"]
              ? request["Ready for flyDate"]
              : date,
            "Ready for flyTime": request["Ready for flyTime"]
              ? request["Ready for flyTime"]
              : date2,
          };
        } else if (
          resultObj.data.lotObj.shipmentStatus == "Abroad Customs" ||
          resultObj.data.lotObj.shipmentStatus == "Abroad Warehouse"
        ) {
          updatedStatus = {
            status: "Received in Warehouse",
            shipmentStatusScore: 3,
            "Received in WarehouseDate": request["Received in WarehouseDate"]
              ? request["Received in WarehouseDate"]
              : date,
            "Received in WarehouseTime": request["Received in WarehouseTime"]
              ? request["Received in WarehouseTime"]
              : date2,
          };
        }
        console.log(updatedStatus);
        await updateShipmentRequest({ ...request, ...updatedStatus });
      }
      }),
    );
  };
  getUpdatedOrderStatus = async () => {
    const allOrders = await getAllOrdersToChangeStatus();
    const checkStatusArray = allOrders
      .filter((order) => order.orderStatus !== "pending")
      .filter((order) => order.trackingNo);
    console.log(checkStatusArray);
    await Promise.all(
      checkStatusArray.map(async (request) => {
      const resultObj = await Axios.get(
        `https://alglimited.com/api/v1/orderTracking-alg/${request.trackingNo}`
      );
      if (resultObj && resultObj.data) {
        console.log(resultObj.data);
        let updatedStatus = {};
        let date = new Date().toLocaleDateString("en-GB");
        let date2 = new Date().toLocaleTimeString("en-GB");

        if (resultObj.data.lotObj.shipmentStatus == "Local Warehouse") {
          updatedStatus = {
            orderStatus: "Bangladesh warehouse",
            shipmentStatusScore: 5,
            "Bangladesh warehouseDate": request["Bangladesh warehouseDate"]
              ? request["Bangladesh warehouseDate"]
              : date,
            "Bangladesh warehouseTime": request["Bangladesh warehouseTime"]
              ? request["Bangladesh warehouseTime"]
              : date2,
          };
        } else if (
          resultObj.data.lotObj.shipmentStatus == "Bangladesh Customs"
        ) {
          updatedStatus = {
            orderStatus: "Bangladesh customs",
            shipmentStatusScore: 5,
            "Bangladesh customsDate": request["Bangladesh customsDate"]
              ? request["Bangladesh customsDate"]
              : date,
            "Bangladesh customsTime": request["Bangladesh customsTime"]
              ? request["Bangladesh customsTime"]
              : date2,
          };
        } else if (resultObj.data.lotObj.shipmentStatus == "Ready to Fly") {
          updatedStatus = {
            orderStatus: "Ready for fly",
            shipmentStatusScore: 4,
            "Ready for flyDate": request["Ready for flyDate"]
              ? request["Ready for flyDate"]
              : date,
            "Ready for flyTime": request["Ready for flyTime"]
              ? request["Ready for flyTime"]
              : date2,
          };
        }
        console.log(updatedStatus);
        await updateOrderApi({ ...request, ...updatedStatus });
      }
      }),
    );
  };
  getUpdatedProductRequestStatus = async () => {
    const allOrders = await getAllProductRequestToChangeStatus();
    const checkStatusArray = allOrders
      .filter((order) => order.orderStatus !== "pending")
      .filter((order) => order.trackingNo);
    console.log(checkStatusArray);
    await Promise.all(
      checkStatusArray.map(async (request) => {
      const resultObj = await Axios.get(
        `https://alglimited.com/api/v1/orderTracking-alg/${request.trackingNo}`
      );
      if (resultObj && resultObj.data) {
        console.log(resultObj.data);
        let updatedStatus = {};
        let date = new Date().toLocaleDateString("en-GB");
        let date2 = new Date().toLocaleTimeString("en-GB");

        if (resultObj.data.parcelsArray[0].parcelStatus == "Delivered") {
          updatedStatus = {
            orderStatus: "Paicart warehouse",
            shipmentStatusScore: 6,
            "Paicart warehouseDate": request["Paicart warehouseDate"]
              ? request["Paicart warehouseDate"]
              : date,
            "Paicart warehouseTime": request["Paicart warehouseTime"]
              ? request["Paicart warehouseTime"]
              : date2,
          };
        } else if (resultObj.data.lotObj.shipmentStatus == "Local Warehouse") {
          updatedStatus = {
            orderStatus: "Bangladesh warehouse",
            shipmentStatusScore: 5,
            "Bangladesh warehouseDate": request["Bangladesh warehouseDate"]
              ? request["Bangladesh warehouseDate"]
              : date,
            "Bangladesh warehouseTime": request["Bangladesh warehouseTime"]
              ? request["Bangladesh warehouseTime"]
              : date2,
          };
        } else if (
          resultObj.data.lotObj.shipmentStatus == "Bangladesh Customs"
        ) {
          updatedStatus = {
            orderStatus: "Bangladesh customs",
            shipmentStatusScore: 5,
            "Bangladesh customsDate": request["Bangladesh customsDate"]
              ? request["Bangladesh customsDate"]
              : date,
            "Bangladesh customsTime": request["Bangladesh customsTime"]
              ? request["Bangladesh customsTime"]
              : date2,
          };
        } else if (resultObj.data.lotObj.shipmentStatus == "Ready to Fly") {
          updatedStatus = {
            orderStatus: "Ready for fly",
            shipmentStatusScore: 4,
            "Ready for flyDate": request["Ready for flyDate"]
              ? request["Ready for flyDate"]
              : date,
            "Ready for flyTime": request["Ready for flyTime"]
              ? request["Ready for flyTime"]
              : date2,
          };
        } else if (
          resultObj.data.lotObj.shipmentStatus == "Abroad Customs" ||
          resultObj.data.lotObj.shipmentStatus == "Abroad Warehouse"
        ) {
          updatedStatus = {
            orderStatus: "Received in Warehouse",
            shipmentStatusScore: 3,
            "Received in WarehouseDate": request["Received in WarehouseDate"]
              ? request["Received in WarehouseDate"]
              : date,
            "Received in WarehouseTime": request["Received in WarehouseTime"]
              ? request["Received in WarehouseTime"]
              : date2,
          };
        }
        console.log(updatedStatus);
        await updateProductRequest({ ...request, ...updatedStatus });
      }
      }),
    );
  };

  /* ------------------------------------------------------- derived state */

  /* Every queue on the page that is waiting for somebody to do something.
     Each one carries the records, not just a count, so the card can also
     say how long the oldest item has been sitting there. */
  getQueues = () => {
    const {
      orderBacklog,
      productBacklog,
      shipmentBacklog,
      paymentRequests,
      paymentRequestOrders,
      quickRefunds,
      afterSale,
    } = this.state;
    const { allPayments } = this.props;

    /* An order sits on the New tab until an agent picks it; once picked it
       keeps orderStatus "pending" and moves to Picked Orders. Same split the
       list page makes. */
    const newOrders = orderBacklog.filter(
      (o) => o.orderStatus === "pending" && o.agentStatus !== "Picked",
    );
    const pickedOrders = orderBacklog.filter(
      (o) => o.agentStatus === "Picked" && o.orderStatus === "pending",
    );

    const unverifiedPayments = [];
    (allPayments || []).forEach((doc) => {
      ((doc && doc.payments) || []).forEach((payment) => {
        if (payment && payment.paymentStatus === "unVerified") {
          unverifiedPayments.push(payment);
        }
      });
    });

    return [
      {
        key: "new-orders",
        label: "New orders",
        hint: "1688 / Taobao, not yet picked",
        icon: ShoppingCart,
        tone: "orange",
        records: newOrders,
        href: "/1688-taobao-orders/new",
      },
      {
        key: "picked",
        label: "Picked, not purchased",
        hint: "agent picked, awaiting payment",
        icon: Tag,
        tone: "violet",
        records: pickedOrders,
        href: "/1688-taobao-orders/picked-orders",
      },
      {
        key: "new-product",
        label: "New product requests",
        hint: "waiting for a rate",
        icon: Package,
        tone: "blue",
        records: productBacklog.filter((r) => r.orderStatus === "Pending"),
        href: "/product-request/new",
      },
      {
        key: "quote-product",
        label: "Product rates given",
        hint: "awaiting customer payment",
        icon: FileText,
        tone: "teal",
        records: productBacklog.filter(
          (r) => r.orderStatus === "Rates Provided",
        ),
        href: "/product-request/rates-given",
      },
      {
        key: "new-shipment",
        label: "New shipment requests",
        hint: "waiting for a rate",
        icon: Truck,
        tone: "orange",
        records: shipmentBacklog.filter((r) => r.status === "Pending"),
        href: "/shipment-request/new",
      },
      {
        key: "quote-shipment",
        label: "Shipment rates given",
        hint: "awaiting customer approval",
        icon: Truck,
        tone: "blue",
        records: shipmentBacklog.filter((r) => r.status === "Rates Provided"),
        href: "/shipment-request/rates-given",
      },
      {
        key: "payment-requests",
        label: "Payment requests",
        hint: "orders + product requests",
        icon: CreditCard,
        tone: "green",
        records: [...(paymentRequests || []), ...(paymentRequestOrders || [])],
        href: "/payment-request-order/pending",
      },
      {
        key: "refunds",
        label: "Refunds & after-sale",
        hint: "quick refunds + claims",
        icon: RotateCcw,
        tone: "red",
        records: [...(quickRefunds || []), ...(afterSale || [])],
        href: "/refund-request-order/pending",
      },
      {
        key: "unverified",
        label: "Unverified payments",
        hint: "receipts to check",
        icon: CheckSquare,
        tone: "violet",
        records: unverifiedPayments,
        href: "/payments/unVerified",
      },
    ];
  };

  /* The figures for the selected window, alongside the same figures for the
     window immediately before it. */
  getTotals = () => {
    const { ordersInRange, ordersPrevRange } = this.state;
    const { allUsers } = this.props;
    const { startDate, endDate, prevStartDate, prevEndDate } = getRangeBounds(
      this.state.range,
    );

    const summarise = (orders) => {
      const payable = orders.reduce((sum, o) => sum + getOrderPayable(o), 0);
      const paid = orders.reduce((sum, o) => sum + getOrderPaid(o), 0);
      const due = orders.reduce((sum, o) => sum + getOrderDue(o), 0);
      const yuan = orders.reduce((sum, o) => sum + getOrderRmb(o), 0);
      const cost = orders.reduce((sum, o) => sum + getOrderCost(o), 0);
      return {
        count: orders.length,
        payable,
        paid,
        due,
        yuan,
        cost,
        /* Only orders whose 1688 cost has actually been synced can carry a
           margin; the rest would read as 100% profit. */
        margin: payable - cost,
        avg: orders.length ? payable / orders.length : 0,
      };
    };

    /* users carry createdAt as a firebase Timestamp, unlike orders. */
    const countNewUsers = (fromValue, toValue) => {
      const from = new Date(
        parseInt(fromValue.slice(0, 4), 10),
        parseInt(fromValue.slice(5, 7), 10) - 1,
        parseInt(fromValue.slice(8, 10), 10),
      ).getTime();
      const to = new Date(
        parseInt(toValue.slice(0, 4), 10),
        parseInt(toValue.slice(5, 7), 10) - 1,
        parseInt(toValue.slice(8, 10), 10),
        23, 59, 59, 999,
      ).getTime();
      return (allUsers || []).filter((user) => {
        const stamp = user && user.createdAt && user.createdAt.seconds;
        if (!stamp) return false;
        const ms = stamp * 1000;
        return ms >= from && ms <= to;
      }).length;
    };

    return {
      current: {
        ...summarise(ordersInRange),
        newUsers: countNewUsers(startDate, endDate),
      },
      previous: {
        ...summarise(ordersPrevRange),
        newUsers: countNewUsers(prevStartDate, prevEndDate),
      },
    };
  };

  /* ------------------------------------------------------- render pieces */

  renderDelta = (current, previous, invert) => {
    const { pct, direction } = delta(current, previous);
    if (direction === "flat") {
      return (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 11, color: "#94a3b8" }}>
          <Minus size={11} /> no change
        </span>
      );
    }
    /* On "outstanding due", up is bad. */
    const good = invert ? direction === "down" : direction === "up";
    const Icon = direction === "up" ? TrendingUp : TrendingDown;
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 3,
          fontSize: 11,
          fontWeight: 700,
          color: good ? "#0f7b35" : "#b91c1c",
        }}
      >
        <Icon size={11} />
        {pct >= 999 ? "999+" : pct.toFixed(0)}%
      </span>
    );
  };

  renderTile = ({ label, value, accent, hint, spark, current, previous, invert }) => (
    <div key={label} className="pc-dash-tile">
      <span className="pc-dash-tile-stripe" style={{ background: accent }} />
      <p className="pc-dash-tile-label">{label}</p>
      <p className="pc-dash-tile-value">{value}</p>
      <div className="pc-dash-tile-foot">
        {previous === undefined
          ? hint && <span style={{ fontSize: 11, color: "#94a3b8" }}>{hint}</span>
          : this.renderDelta(current, previous, invert)}
        {spark && <div style={{ width: 62 }}>{spark}</div>}
      </div>
    </div>
  );

  renderSkeletonRow = (count) => (
    <div className="pc-dash-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="pc-dash-skeleton" />
      ))}
    </div>
  );

  render() {
    const { currentAdmin } = this.props;
    const { range, loading, error, updatedAt, ordersInRange } = this.state;

    /* Partners run the queues but do not see company revenue, cost or
       margin - the same split the old dashboard made. */
    const isAdmin = currentAdmin && currentAdmin.status === "Admin";
    const isPartner = currentAdmin && currentAdmin.status === "Partner";

    const rangeMeta = getRange(range);
    const bounds = getRangeBounds(range);
    const queues = this.getQueues();
    const { current, previous } = this.getTotals();
    const totalActions = queues.reduce((sum, q) => sum + q.records.length, 0);

    /* --------------------------------------------------------- series */

    const flowBuckets = bucketRecords(
      ordersInRange,
      rangeMeta.granularity,
      bounds.startDate,
      bounds.endDate,
      getOrderPayable,
    );

    const monthBounds = getTwelveMonthBounds();
    const monthBuckets = bucketRecords(
      this.state.monthlyOrders,
      "month",
      monthBounds.startDate,
      monthBounds.endDate,
      getOrderPayable,
    );

    /* ------------------------------------------------------- pipeline */

    const ladderRows = LADDER.map((rung) => {
      const orders = rung.orderStatus
        ? this.state.orderBacklog.filter((o) =>
            rung.key === "pending"
              ? o.orderStatus === "pending"
              : o.orderStatus === rung.orderStatus,
          )
        : [];
      const products = this.state.productBacklog.filter(
        (r) => r.orderStatus === rung.requestStatus,
      );
      const shipments = rung.shipmentHref
        ? this.state.shipmentBacklog.filter(
            (r) => r.status === rung.requestStatus,
          )
        : [];
      return {
        ...rung,
        orders: orders.length,
        products: products.length,
        shipments: shipments.length,
        total: orders.length + products.length + shipments.length,
      };
    });
    const ladderMax = Math.max(1, ...ladderRows.map((r) => r.total));
    const inFlight = ladderRows.reduce((sum, r) => sum + r.total, 0);

    const donutSlices = ladderRows
      .filter((r) => r.total > 0)
      .map((r) => ({ label: r.label, value: r.total, color: r.color }));

    /* -------------------------------------------------- payment health */

    const paymentSummary = summarisePayments(ordersInRange);
    const modeSplit = {
      Air: ordersInRange.filter((o) => getShipmentMode(o) === "Air").length,
      Sea: ordersInRange.filter((o) => getShipmentMode(o) === "Sea").length,
    };

    /* --------------------------------------------- product request store */

    /* Orders carry no platform field - get1688Data hardcodes webSite "1688" -
       so this split only exists on product requests, which do have `store`. */
    const storeCounts = {};
    this.state.productBacklog.forEach((request) => {
      const store = (request && request.store) || "Not specified";
      storeCounts[store] = (storeCounts[store] || 0) + 1;
    });
    const storeRows = Object.keys(storeCounts)
      .map((store) => ({ store, count: storeCounts[store] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
    const storeMax = Math.max(1, ...storeRows.map((r) => r.count));

    /* ------------------------------------------------- oldest waiting */

    const oldestOrders = [...queues[0].records, ...queues[1].records]
      .sort((a, b) => (getRecordTime(a) || 0) - (getRecordTime(b) || 0))
      .slice(0, 6);

    /* ------------------------------------------------- top customers */

    const byCustomer = {};
    ordersInRange.forEach((order) => {
      const key = order.userId || order.uid || "unknown";
      if (!byCustomer[key]) {
        byCustomer[key] = {
          key,
          name: order.displayName || order.userId || "Unknown customer",
          count: 0,
          payable: 0,
        };
      }
      byCustomer[key].count += 1;
      byCustomer[key].payable += getOrderPayable(order);
    });
    const topCustomers = Object.values(byCustomer)
      .sort((a, b) => b.payable - a.payable)
      .slice(0, 6);
    const topCustomerMax = Math.max(1, ...topCustomers.map((c) => c.payable));

    const cardStyle = {
      border: "1px solid #e9eef5",
      borderRadius: 14,
      boxShadow: "0 1px 2px rgba(15,23,42,.04)",
      overflow: "hidden",
    };

    return (
      <Fragment>
        <Breadcrumb title="Dashboard" parent="Overview" />

        <div className="container-fluid pc-dash">
          {/* ---------------------------------------------- command bar */}
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ ...cardStyle, marginBottom: 22 }}>
                <div className="pc-dash-commandbar">
                  <div>
                    <SegmentTabs
                      items={RANGES.map((r) => ({
                        key: r.key,
                        label: r.label,
                      }))}
                      value={range}
                      onChange={this.changeRange}
                    />
                    <p className="pc-dash-updated">
                      {loading
                        ? "Loading live data…"
                        : updatedAt
                          ? `Updated ${updatedAt.toLocaleTimeString("en-GB")} · ${totalActions} items need action`
                          : ""}
                    </p>
                  </div>

                  <div className="pc-dash-actions">
                    <Button
                      variant="ghost"
                      onClick={this.loadAll}
                      disabled={loading}
                      title="Refetch every figure on this page"
                    >
                      {loading ? (
                        <ClipLoader color={"#334155"} loading size={13} />
                      ) : (
                        <RefreshCw size={13} />
                      )}
                      Refresh
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPartner}
                      onClick={() => {
                        if (isPartner) return;
                        this.runSync("loader1", this.getUpdatedShipmentRequestStatus);
                      }}
                      style={{ minWidth: 150 }}
                    >
                      {this.state.loader1 ? (
                        <ClipLoader color={"#334155"} loading size={13} />
                      ) : (
                        "Sync shipment requests"
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      disabled={isPartner}
                      onClick={() => {
                        if (isPartner) return;
                        this.runSync("loader3", this.getUpdatedProductRequestStatus);
                      }}
                      style={{ minWidth: 150 }}
                    >
                      {this.state.loader3 ? (
                        <ClipLoader color={"#334155"} loading size={13} />
                      ) : (
                        "Sync product requests"
                      )}
                    </Button>
                    <Button
                      variant="primary"
                      disabled={isPartner}
                      onClick={() => {
                        if (isPartner) return;
                        this.runSync("loader2", this.getUpdatedOrderStatus);
                      }}
                      style={{ minWidth: 120 }}
                    >
                      {this.state.loader2 ? (
                        <ClipLoader color={"#fff"} loading size={13} />
                      ) : (
                        "Sync orders"
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="row">
              <div className="col-sm-12">
                <div className="pc-dash-error">
                  <AlertTriangle size={16} />
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    onClick={this.loadAll}
                    style={{ marginLeft: "auto" }}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* -------------------------------------------- needs action */}
          <div className="row">
            <div className="col-sm-12">
              <p className="pc-dash-caption">
                Needs action now
                <span className="pc-dash-caption-note">
                  full backlog, not the 30-day window the list pages open on
                </span>
              </p>
              {loading ? (
                this.renderSkeletonRow(9)
              ) : (
                <div className="pc-dash-grid pc-dash-grid-queues">
                  {queues.map((queue) => {
                    const count = queue.records.length;
                    const tone = count > 0 ? TONES[queue.tone] : TONES.gray;
                    const waiting = oldestWaitingDays(queue.records);
                    const Icon = queue.icon;
                    return (
                      <Link
                        key={queue.key}
                        to={`${process.env.PUBLIC_URL}${queue.href}`}
                        className={`pc-dash-queue${count === 0 ? " is-empty" : ""}`}
                      >
                        <span
                          className="pc-dash-queue-stripe"
                          style={{ background: tone.solid }}
                        />
                        <span
                          className="pc-dash-queue-icon"
                          style={{ background: tone.bg, color: tone.fg }}
                        >
                          <Icon size={16} />
                        </span>
                        {/* Printed, not counted up: react-countup remounts
                            silently at 0 when the range switch re-renders these
                            cards, and a queue of 423 reading as 0 is worse than
                            no animation at all. */}
                        <p className="pc-dash-queue-count">{count}</p>
                        <p className="pc-dash-queue-label">{queue.label}</p>
                        <p className="pc-dash-queue-hint">
                          {count === 0
                            ? "all clear"
                            : waiting === null
                              ? queue.hint
                              : waiting === 0
                                ? "oldest opened today"
                                : `oldest waiting ${waiting}d`}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* --------------------------------------------------- KPIs */}
          <div className="row">
            <div className="col-sm-12">
              <p className="pc-dash-caption">
                {rangeMeta.label}
                {range === "today" ? "" : " to date"} · orders placed
              </p>
              {loading ? (
                this.renderSkeletonRow(isAdmin ? 8 : 4)
              ) : (
                <div className="pc-dash-grid">
                  {this.renderTile({
                    label: "Orders placed",
                    value: current.count,
                    accent: "#64748b",
                    current: current.count,
                    previous: previous.count,
                    spark: (
                      <AreaSpark
                        values={flowBuckets.map((b) => b.count)}
                        color="#64748b"
                        height={30}
                      />
                    ),
                  })}
                  {isAdmin &&
                    this.renderTile({
                      label: "Order value",
                      value: compactMoney(current.payable),
                      accent: "#7c3aed",
                      current: current.payable,
                      previous: previous.payable,
                      spark: (
                        <AreaSpark
                          values={flowBuckets.map((b) => b.value)}
                          color="#7c3aed"
                          height={30}
                        />
                      ),
                    })}
                  {isAdmin &&
                    this.renderTile({
                      label: "Collected",
                      value: compactMoney(current.paid),
                      accent: "#16a34a",
                      current: current.paid,
                      previous: previous.paid,
                    })}
                  {isAdmin &&
                    this.renderTile({
                      label: "Outstanding due",
                      value: compactMoney(current.due),
                      accent: current.due > 0 ? "#FF6A00" : "#16a34a",
                      current: current.due,
                      previous: previous.due,
                      invert: true,
                    })}
                  {isAdmin &&
                    this.renderTile({
                      label: "Purchase cost",
                      value: rmb(current.yuan),
                      accent: "#dc2626",
                      hint: "synced from 1688",
                      current: current.yuan,
                      previous: previous.yuan,
                      invert: true,
                    })}
                  {isAdmin &&
                    this.renderTile({
                      label: "Gross margin",
                      value: compactMoney(current.margin),
                      accent: current.margin >= 0 ? "#0d9488" : "#dc2626",
                      current: current.margin,
                      previous: previous.margin,
                    })}
                  {this.renderTile({
                    label: "Avg order value",
                    value: isAdmin ? compactMoney(current.avg) : "—",
                    accent: "#2563eb",
                    current: current.avg,
                    previous: previous.avg,
                  })}
                  {this.renderTile({
                    label: "New customers",
                    value: current.newUsers,
                    accent: "#0ea5e9",
                    current: current.newUsers,
                    previous: previous.newUsers,
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ------------------------------------- flow + pipeline donut */}
          <div className="row" style={{ marginTop: 22 }}>
            <div className="col-lg-8">
              <ChartFrame
                title="Order flow"
                subtitle={
                  range === "today"
                    ? "Orders placed by hour today · bars are count, line is value"
                    : `Orders placed per day over the last ${rangeMeta.days} days · bars are count, line is value`
                }
                right={
                  <Badge tone="orange">
                    {current.count} {current.count === 1 ? "order" : "orders"}
                  </Badge>
                }
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 240 }} />
                ) : (
                  <ComboBars
                    buckets={flowBuckets}
                    height={240}
                    showLine={isAdmin}
                    formatValue={money}
                    emptyLabel={
                      range === "today"
                        ? "No orders placed yet today"
                        : "No orders placed in this window"
                    }
                  />
                )}
              </ChartFrame>
            </div>

            <div className="col-lg-4">
              <ChartFrame
                title="In flight"
                subtitle="Everything not yet delivered, by stage"
                bodyStyle={{ display: "flex", flexDirection: "column", alignItems: "center" }}
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 240, width: "100%" }} />
                ) : inFlight === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    accent="#0d9488"
                    title="Nothing in transit"
                    message="Every order, product request and shipment request has been delivered."
                  />
                ) : (
                  <Fragment>
                    <Donut
                      slices={donutSlices}
                      size={186}
                      centerValue={inFlight}
                      centerLabel="in flight"
                    />
                    <div className="pc-dash-legend">
                      {donutSlices.map((slice) => (
                        <div key={slice.label} className="pc-dash-legend-row">
                          <span
                            className="pc-dash-legend-dot"
                            style={{ background: slice.color }}
                          />
                          <span className="pc-dash-legend-label">
                            {slice.label}
                          </span>
                          <span className="pc-dash-legend-value">
                            {slice.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Fragment>
                )}
              </ChartFrame>
            </div>
          </div>

          {/* -------------------------------- ladder + payment health */}
          <div className="row">
            <div className="col-lg-7">
              <ChartFrame
                title="Where everything is sitting"
                subtitle="Orders · product requests · shipment requests, by stage"
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 280 }} />
                ) : (
                  <div>
                    <div className="pc-dash-ladder-key">
                      <span><i style={{ background: "#FF6A00" }} />Orders</span>
                      <span><i style={{ background: "#7c3aed" }} />Product requests</span>
                      <span><i style={{ background: "#0d9488" }} />Shipment requests</span>
                    </div>
                    {ladderRows.map((rung) => (
                      <div key={rung.key} className="pc-dash-ladder-row">
                        <div className="pc-dash-ladder-head">
                          <span className="pc-dash-ladder-label">
                            {rung.label}
                            {/* Printable sheet for collecting these cartons
                                from the cargo company */}
                            {rung.key === "released" && (
                              <Link
                                to={`${process.env.PUBLIC_URL}/cargo-collection`}
                                style={{
                                  marginLeft: 8,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: "#FF6A00",
                                }}
                              >
                                🖨 Cargo collection sheet
                              </Link>
                            )}
                          </span>
                          <span className="pc-dash-ladder-total">
                            {rung.total}
                          </span>
                        </div>
                        <div className="pc-dash-ladder-bars">
                          {[
                            { n: rung.orders, c: "#FF6A00", href: rung.orderHref },
                            { n: rung.products, c: "#7c3aed", href: rung.productHref },
                            { n: rung.shipments, c: "#0d9488", href: rung.shipmentHref },
                          ].map((bar, i) =>
                            bar.href ? (
                              <Link
                                key={i}
                                to={`${process.env.PUBLIC_URL}${bar.href}`}
                                className="pc-dash-ladder-bar"
                                title={`${bar.n} at ${rung.label}`}
                              >
                                <Meter value={bar.n} max={ladderMax} color={bar.c} />
                                <span style={{ color: bar.n ? "#334155" : "#cbd5e1" }}>
                                  {bar.n}
                                </span>
                              </Link>
                            ) : (
                              <span key={i} className="pc-dash-ladder-bar is-na">
                                <Meter value={0} max={ladderMax} color="#e2e8f0" />
                                <span style={{ color: "#cbd5e1" }}>—</span>
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ChartFrame>
            </div>

            <div className="col-lg-5">
              <ChartFrame
                title="Payment health"
                subtitle={`Orders placed in the last ${rangeMeta.days === 1 ? "day" : `${rangeMeta.days} days`}`}
                right={
                  <div style={{ display: "flex", gap: 6 }}>
                    <Badge tone="blue">Air {modeSplit.Air}</Badge>
                    <Badge tone="teal">Sea {modeSplit.Sea}</Badge>
                  </div>
                }
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 200 }} />
                ) : ordersInRange.length === 0 ? (
                  <EmptyState
                    icon={CreditCard}
                    accent="#7c3aed"
                    title="No orders in this window"
                    message="Widen the range above to see how payments are tracking."
                  />
                ) : (
                  <div>
                    {PAYMENT_STATES.map((state) => {
                      const bucket = paymentSummary.byState[state];
                      const tone = TONES[PAYMENT_STATE_TONES[state]];
                      const amount =
                        state === "Paid" ? bucket.paid : bucket.due;
                      return (
                        <div
                          key={state}
                          className="pc-dash-paystate"
                          style={{ background: tone.bg }}
                        >
                          <span style={{ fontSize: 17, fontWeight: 800, color: tone.fg }}>
                            {bucket.count}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: tone.fg }}>
                            {state}
                          </span>
                          {isAdmin && (
                            <span
                              style={{
                                marginLeft: "auto",
                                fontSize: 11,
                                color: tone.fg,
                                opacity: 0.8,
                              }}
                            >
                              {money(amount)} {state === "Paid" ? "paid" : "due"}
                            </span>
                          )}
                        </div>
                      );
                    })}

                  </div>
                )}

                {storeRows.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <p className="pc-dash-caption" style={{ marginBottom: 10 }}>
                      Open product requests by source
                    </p>
                    {storeRows.map((row) => (
                      <div key={row.store} className="pc-dash-storerow">
                        <span className="pc-dash-storerow-name">
                          {row.store}
                        </span>
                        <Meter value={row.count} max={storeMax} color="#2563eb" />
                        <span className="pc-dash-storerow-count">
                          {row.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </ChartFrame>
            </div>
          </div>

          {/* ------------------------------ oldest waiting + customers */}
          <div className="row">
            <div className="col-lg-6">
              <ChartFrame
                title="Waiting longest"
                subtitle="Orders that have sat unpurchased the longest"
                right={
                  <Link
                    to={`${process.env.PUBLIC_URL}/1688-taobao-orders/new`}
                    style={{ fontSize: 12, fontWeight: 700, color: "#FF6A00" }}
                  >
                    View all →
                  </Link>
                }
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 220 }} />
                ) : oldestOrders.length === 0 ? (
                  <EmptyState
                    icon={CheckSquare}
                    accent="#16a34a"
                    title="Nothing is waiting"
                    message="Every new and picked order has been purchased."
                  />
                ) : (
                  <table className="pc-dash-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        {isAdmin && <th className="ta-r">Payable</th>}
                        <th className="ta-r">Waiting</th>
                      </tr>
                    </thead>
                    <tbody>
                      {oldestOrders.map((order) => {
                        const days = oldestWaitingDays([order]);
                        return (
                          <tr key={order.orderId}>
                            <td>
                              <Link
                                to={`${process.env.PUBLIC_URL}/searched-order/${order.orderId}`}
                                className="pc-dash-mono"
                              >
                                {order.orderId}
                              </Link>
                            </td>
                            <td className="pc-dash-ellipsis">
                              {order.displayName || order.userId || "—"}
                            </td>
                            {isAdmin && (
                              <td className="ta-r">
                                {money(getOrderPayable(order))}
                              </td>
                            )}
                            <td className="ta-r">
                              <Badge
                                tone={
                                  days === null || days < 2
                                    ? "gray"
                                    : days < 5
                                      ? "orange"
                                      : "red"
                                }
                              >
                                {days === null
                                  ? "—"
                                  : days === 0
                                    ? "today"
                                    : `${days}d`}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </ChartFrame>
            </div>

            <div className="col-lg-6">
              <ChartFrame
                title="Top customers"
                subtitle={`By order value in the last ${rangeMeta.days === 1 ? "day" : `${rangeMeta.days} days`}`}
              >
                {loading ? (
                  <div className="pc-dash-skeleton" style={{ height: 220 }} />
                ) : topCustomers.length === 0 ? (
                  <EmptyState
                    icon={Inbox}
                    accent="#4466f2"
                    title="No orders in this window"
                    message="Nobody has ordered in the selected period."
                  />
                ) : (
                  <div>
                    {topCustomers.map((customer) => (
                      <div key={customer.key} className="pc-dash-customer">
                        <div className="pc-dash-customer-head">
                          <span className="pc-dash-ellipsis">
                            {customer.name}
                          </span>
                          <span className="pc-dash-customer-value">
                            {isAdmin
                              ? compactMoney(customer.payable)
                              : `${customer.count} ${customer.count === 1 ? "order" : "orders"}`}
                          </span>
                        </div>
                        <Meter
                          value={customer.payable}
                          max={topCustomerMax}
                          color="#FF6A00"
                        />
                        {isAdmin && (
                          <p className="pc-dash-customer-hint">
                            {customer.count}{" "}
                            {customer.count === 1 ? "order" : "orders"}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </ChartFrame>
            </div>
          </div>

          {/* ------------------------------------------- twelve months */}
          <div className="row">
            <div className="col-sm-12">
              <ChartFrame
                title="Last 12 months"
                subtitle="Orders placed per calendar month · independent of the range above"
              >
                {this.state.monthlyLoading ? (
                  <div className="pc-dash-skeleton" style={{ height: 220 }} />
                ) : (
                  <ComboBars
                    buckets={monthBuckets}
                    height={220}
                    barColor="#2563eb"
                    lineColor="#FF6A00"
                    showLine={isAdmin}
                    formatValue={money}
                    emptyLabel="No orders recorded in the last 12 months"
                  />
                )}
              </ChartFrame>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  allPayments: state.payments.payments,
  allUsers: state.users.users,
  currentAdmin: state.admins.currentAdmin,
});

export default connect(mapStateToProps, null)(Dashboard);
