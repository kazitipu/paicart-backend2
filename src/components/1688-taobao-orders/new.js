import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./datatable.jsx";
import { getAllOrdersApiRedux, getAllEmployeeRedux } from "../../actions/index";
import { Link } from "react-router-dom";
import UpdateRequestModal from "./updateRequestModal";
import {
  getSingleOrderApi,
  updateAllOrdersApi,
} from "../../firebase/firebase.utils.js";
import { GetAllShippingAddress } from "../../actions/get1688Data";
import {
  get1688TrackingStatus,
  get1688OrderDetails,
} from "../../actions/get1688Data.js";
import { build1688OrderUpdate } from "../../constants/orderStatus1688";
import SyncResultModal from "./syncResultModal.jsx";
import { getDefaultDateRange } from "../../constants/dateRange";
import { connect } from "react-redux";
import { Search } from "react-feather";
import { Button, ModeTabs } from "../common/listUi.jsx";
import { getShipmentMode } from "../../constants/shipment";
import "../common/list-modern.css";
import { ClipLoader } from "react-spinners";
import {
  updateOrdersWithTrackingNoRedux,
  updateOrdersFrom1688Redux,
} from "../../actions/index";
import PaymentSummaryBar from "../common/paymentSummaryBar.jsx";
import { getPaymentState, PAYMENT_STATES } from "../../constants/paymentMath";
import { buildShopGroups, shopKeyOf, sortByShop } from "../../constants/shopGroups";
import { getAllRequestsForSearch, getCustomersForSearch } from "../../firebase/firebase.utils";
import { buildCustomerIndex, customerSearchFields } from "../../constants/customerSearch";
/* Tab slug -> the label the team uses. Routes keep their slugs so existing
   links keep working. */
const STATUS_LABELS = {
  "all-orders": "All Orders",
  new: "New",
  "picked-orders": "Picked Orders",
  purchased: "Purchased",
  "received-in-warehouse": "Received in Warehouse",
  "ready-for-fly": "Ready for Fly",
  "bangladesh-customs": "Bangladesh Customs",
  "custom-released": "Custom Released",
  "Paicart-warehouse": "Paicart Warehouse",
  delivered: "Delivered",
  rejected: "Rejected",
};

export class New extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      searchFor: "",
      toggleModal: true,
      toggleDeleteModal: true,
      order: null,
      loader1: false,
      loader2: false,
      syncResult: null,
      shipmentTab: "All",
      shippingAddress: [],
      paymentFilter: "",
      shopFilter: null,
      groupByShop: false,
    };
  }

  componentDidMount = async () => {
    // Local calendar days - toISOString() would report the UTC date, which
    // before 6am in Dhaka is yesterday and hides the night's orders.
    const { startDate, endDate } = getDefaultDateRange(30);
    this.setState({
      customStart: startDate,
      customEnd: endDate,
      rangeEdited: false,
      shopFilter: null,
      groupByShop: false,
    });
    /* A tab left open overnight kept yesterday as "today", hiding the new
       day's orders until the end date was moved forward by hand. */
    window.addEventListener("focus", this.refreshStaleRange);
    document.addEventListener("visibilitychange", this.refreshStaleRange);
    this.props.getAllEmployeeRedux();

    // Shipping addresses are needed by the Pick modal from any order-status
    // tab (e.g. retrying a pick from Picked Orders), not just "new".
    let shippingAddress = await GetAllShippingAddress();
    console.log(shippingAddress);
    this.setState({
      shippingAddress: shippingAddress || [],
    });

    if (this.props.match.params.orderStatus == "all-orders") {
      this.props.getAllOrdersApiRedux("", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "new") {
      this.props.getAllOrdersApiRedux("pending", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "purchased") {
      this.props.getAllOrdersApiRedux("Purchased", startDate, endDate);
    } else if (
      this.props.match.params.orderStatus === "received-in-warehouse"
    ) {
      this.props.getAllOrdersApiRedux(
        "Received in Warehouse",
        startDate,
        endDate,
      );
    } else if (this.props.match.params.orderStatus === "ready-for-fly") {
      this.props.getAllOrdersApiRedux("Ready for fly", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "bangladesh-customs") {
      this.props.getAllOrdersApiRedux("Bangladesh customs", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "custom-released") {
      this.props.getAllOrdersApiRedux(
        "Bangladesh warehouse",
        startDate,
        endDate,
      );
    } else if (this.props.match.params.orderStatus === "Paicart-warehouse") {
      this.props.getAllOrdersApiRedux("Paicart warehouse", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "delivered") {
      this.props.getAllOrdersApiRedux("Delivered", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "rejected") {
      this.props.getAllOrdersApiRedux("Reject", startDate, endDate);
    } else if (this.props.match.params.orderStatus === "picked-orders") {
      this.props.getAllOrdersApiRedux("Picked", startDate, endDate);
    }
  };

  componentWillUnmount() {
    window.removeEventListener("focus", this.refreshStaleRange);
    document.removeEventListener("visibilitychange", this.refreshStaleRange);
  }

  /* Untouched default range + the Dhaka date has moved on → roll the range
     forward to "last 30 days up to today" and reload, keeping the search. */
  refreshStaleRange = () => {
    if (document.visibilityState === "hidden" || this.state.rangeEdited) return;
    const { startDate, endDate } = getDefaultDateRange(30);
    if (!this.state.customEnd || this.state.customEnd === endDate) return;
    this.setState({ customStart: startDate, customEnd: endDate }, () =>
      this.applyRange({ keepSearch: true }),
    );
  };

  componentWillReceiveProps = async (nextProps) => {
    // Local calendar days - toISOString() would report the UTC date, which
    // before 6am in Dhaka is yesterday and hides the night's orders.
    const { startDate, endDate } = getDefaultDateRange(30);

    if (
      this.props.match.params.orderStatus !== nextProps.match.params.orderStatus
    ) {
      this.setState({
        customStart: startDate,
        customEnd: endDate,
        rangeEdited: false,
        searchFor: "",
        order1688: null,
        paymentFilter: "",
        shopFilter: null,
      });

      // Retry-fetch shipping addresses on any tab switch if the initial
      // fetch (componentDidMount) came back empty, regardless of which tab
      // is being switched to - the Pick modal needs this list from every tab.
      if (this.state.shippingAddress.length == 0) {
        let shippingAddress = await GetAllShippingAddress();
        console.log(shippingAddress);
        this.setState({
          shippingAddress: shippingAddress || [],
        });
      }

      if (nextProps.match.params.orderStatus === "all-orders") {
        this.props.getAllOrdersApiRedux("", startDate, endDate);
      } else if (nextProps.match.params.orderStatus === "new") {
        this.props.getAllOrdersApiRedux("pending", startDate, endDate);
      } else if (nextProps.match.params.orderStatus === "purchased") {
        this.props.getAllOrdersApiRedux("Purchased", startDate, endDate);
      } else if (
        nextProps.match.params.orderStatus === "received-in-warehouse"
      ) {
        this.props.getAllOrdersApiRedux(
          "Received in Warehouse",
          startDate,
          endDate,
        );
      } else if (nextProps.match.params.orderStatus === "ready-for-fly") {
        this.props.getAllOrdersApiRedux("Ready for fly", startDate, endDate);
      } else if (nextProps.match.params.orderStatus === "bangladesh-customs") {
        this.props.getAllOrdersApiRedux(
          "Bangladesh customs",
          startDate,
          endDate,
        );
      } else if (nextProps.match.params.orderStatus === "bangladesh-customs") {
        this.props.getAllOrdersApiRedux(
          "Bangladesh customs",
          startDate,
          endDate,
        );
      } else if (nextProps.match.params.orderStatus === "custom-released") {
        this.props.getAllOrdersApiRedux(
          "Bangladesh warehouse",
          startDate,
          endDate,
        );
      } else if (nextProps.match.params.orderStatus === "Paicart-warehouse") {
        this.props.getAllOrdersApiRedux(
          "Paicart warehouse",
          startDate,
          endDate,
        );
      } else if (nextProps.match.params.orderStatus === "delivered") {
        this.props.getAllOrdersApiRedux("Delivered", startDate, endDate);
      } else if (nextProps.match.params.orderStatus === "rejected") {
        this.props.getAllOrdersApiRedux("Reject", startDate, endDate);
      } else if (nextProps.match.params.orderStatus === "picked-orders") {
        this.props.getAllOrdersApiRedux("Picked", startDate, endDate);
      }
    }
  };

  startToggleModal = async (order) => {
    if (order == null) {
      this.setState({
        toggleModal: !this.state.toggleModal,
        order: null,
      });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
        order,
      });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    // Drop the previous by-id lookup result so the new query filters the
    // loaded list instead of staying pinned to the old single order.
    this.setState({ [name]: value, order1688: null });
    /* A search looks past this tab and date range, across every order —
       loaded fresh each time a new search starts. */
    if (name === "searchFor" && value.trim() && !String(this.state.searchFor || "").trim()) {
      this.loadSearchPool();
    }
  };

  loadSearchPool = async () => {
    this.setState({ searchPoolLoading: true });
    const [searchPool, users] = await Promise.all([
      getAllRequestsForSearch("ordersApi"),
      getCustomersForSearch(),
    ]);
    this.setState({
      searchPool,
      customerIndex: buildCustomerIndex(users),
      searchPoolLoading: false,
    });
  };

  // The orders actually shown for the current tab / date range.
  getVisibleOrders = () => {
    const { ordersApi } = this.props;
    if (!ordersApi || ordersApi.length === 0) {
      return [];
    }
    let orders = ordersApi;
    if (this.props.match.params.orderStatus == "new") {
      orders = orders.filter((order) => order.agentStatus !== "Picked");
    }
    return orders.slice().sort((a, b) => b.time - a.time);
  };

  // A single query box matching user name, user id, order id, order number
  // and tracking no.
  matchesSearch = (order, query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) {
      return true;
    }
    return [
      order.displayName,
      order.userId,
      order.uid,
      order.orderId,
      order.orderNumber,
      order.trackingNo,
      order.shippingMark,
      order.shopName,
      // customer number / name / phone / email from their profile
      ...customerSearchFields(this.state.customerIndex, order.userId),
    ].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(q),
    );
  };

  applyRange = async (options = {}) => {
    const { customStart, customEnd } = this.state;
    if (!options.keepSearch) {
      this.setState({
        order1688: null,
        searchFor: "",
        paymentFilter: "",
      });
    }
    let startDate = customStart;
    let endDate = customEnd;
    console.log(customStart);
    console.log(customEnd);
    if (customStart && customEnd) {
      if (this.props.match.params.orderStatus == "all-orders") {
        this.props.getAllOrdersApiRedux("", startDate, endDate);
      } else if (this.props.match.params.orderStatus === "new") {
        this.props.getAllOrdersApiRedux("pending", startDate, endDate);
      } else if (this.props.match.params.orderStatus === "purchased") {
        this.props.getAllOrdersApiRedux("Purchased", startDate, endDate);
      } else if (
        this.props.match.params.orderStatus === "received-in-warehouse"
      ) {
        this.props.getAllOrdersApiRedux(
          "Received in Warehouse",
          startDate,
          endDate,
        );
      } else if (this.props.match.params.orderStatus === "ready-for-fly") {
        this.props.getAllOrdersApiRedux("Ready for fly", startDate, endDate);
      } else if (this.props.match.params.orderStatus === "bangladesh-customs") {
        this.props.getAllOrdersApiRedux(
          "Bangladesh customs",
          startDate,
          endDate,
        );
      } else if (this.props.match.params.orderStatus === "custom-released") {
        this.props.getAllOrdersApiRedux(
          "Bangladesh warehouse",
          startDate,
          endDate,
        );
      } else if (this.props.match.params.orderStatus === "Paicart-warehouse") {
        this.props.getAllOrdersApiRedux(
          "Paicart warehouse",
          startDate,
          endDate,
        );
      } else if (this.props.match.params.orderStatus === "delivered") {
        this.props.getAllOrdersApiRedux("Delivered", startDate, endDate);
      } else if (this.props.match.params.orderStatus === "rejected") {
        this.props.getAllOrdersApiRedux("Reject", startDate, endDate);
      } else if (this.props.match.params.orderStatus === "picked-orders") {
        this.props.getAllOrdersApiRedux("Picked", startDate, endDate);
      }
    }
  };

  handleSubmit2 = async (e) => {
    e.preventDefault();
    const query = String(this.state.searchFor || "").trim();
    if (!query) {
      alert("Search field cant be empty.");
      return;
    }
    // Anything already loaded for this tab / date range is matched locally on
    // user name, user id, order id, order number and tracking no.
    const localMatches = (this.state.searchPool || this.getVisibleOrders()).filter(
      (order) => this.matchesSearch(order, query),
    );
    if (localMatches.length > 0) {
      this.setState({ order1688: null });
      return;
    }
    // Nothing loaded matches: the query may be an order id outside the
    // selected date range, so fall back to fetching that order directly.
    let order = await getSingleOrderApi(query);
    if (order) {
      this.setState({
        order1688: order,
      });
    } else {
      alert(
        "Sorry, no order is found with this user name, user Id, order Id, order number or tracking no",
      );
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
      // A hand-picked range is never rolled forward automatically
      ...(name === "customStart" || name === "customEnd" ? { rangeEdited: true } : {}),
    });
  };

  getAllTrackingNo = async (orders) => {
    if (orders && orders.length > 0) {
      if (this.state.loader1) {
        return;
      }
      this.setState({
        loader1: true,
      });
      let newOrders = [];
      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        let trackingArray = await get1688TrackingStatus(order.orderNumber);
        let trackingObj = trackingArray ? trackingArray[0] : null;

        console.log(trackingObj);
        if (trackingObj && trackingObj.logisticsBillNo) {
          newOrders.push({ ...order, trackingNo: trackingObj.logisticsBillNo });
        }
      }
      this.props.updateOrdersWithTrackingNoRedux(newOrders);

      this.setState({
        loader1: false,
      });
      console.log(newOrders);
    } else {
      alert("At least select one order to get 1688 Tracking No");
    }
  };

  // Bulk counterpart of the per-row order-number click: pulls the total and
  // shipping fee 1688 actually charged, and moves the order into the tab its
  // 1688 status says it belongs in.
  getAll1688Actuals = async (orders) => {
    if (!orders || orders.length === 0) {
      this.setState({
        syncResult: {
          message: "None of the listed orders has a 1688 order number yet.",
        },
      });
      return;
    }
    if (this.state.loader2) {
      return;
    }
    this.setState({ loader2: true });
    let updates = [];
    let moved = 0;
    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const details = await get1688OrderDetails(order.orderNumber);
      const update = build1688OrderUpdate(order, details);
      if (update) {
        if (update.orderStatus) moved += 1;
        updates.push(update);
      }
    }
    if (updates.length > 0) {
      await this.props.updateOrdersFrom1688Redux(updates);
    }
    this.setState({
      loader2: false,
      syncResult: {
        total: orders.length,
        synced: updates.length,
        moved,
        failed: orders.length - updates.length,
      },
    });
  };

  // Resets everything the empty state can undo without a refetch: the
  // search box, the payment dropdown and the Air/Sea tab.
  clearFilters = () => {
    this.setState({
      searchFor: "",
      paymentFilter: "",
      shipmentTab: "All",
      order1688: null,
      shopFilter: null,
    });
  };

  render() {
    const { open, customStart, customEnd } = this.state;
    let orders = this.getVisibleOrders();
    let totalWeight = 0;
    let totalRmb = 0;
    let totalBdt = 0;
    let totalExpense = 0;
    let totalProfit = 0;

    // The exact rows the table renders - a search narrows this, and the
    // stats below are totalled over it so they always describe what is
    // on screen rather than the whole date range.
    const searching = Boolean(String(this.state.searchFor || "").trim());
    let displayedOrders = this.state.order1688
      ? [this.state.order1688]
      : searching
      ? (this.state.searchPool || orders).filter((order) =>
          this.matchesSearch(order, this.state.searchFor),
        )
      : orders;
    // Per-shop counts over the whole tab, so a badge says how many orders
    // that supplier has here regardless of the filters below.
    const shopGroups = buildShopGroups(orders);
    if (this.state.shopFilter) {
      displayedOrders = displayedOrders.filter(
        (order) => shopKeyOf(order) === this.state.shopFilter.key,
      );
    }
    if (this.state.paymentFilter) {
      displayedOrders = displayedOrders.filter(
        (order) => getPaymentState(order) === this.state.paymentFilter,
      );
    }
    // Counts come from the search/payment-filtered set, before the Air/Sea
    // split, so each tab shows how many rows it would actually reveal.
    const modeCounts = {
      All: displayedOrders.length,
      Air: displayedOrders.filter((o) => getShipmentMode(o) === "Air").length,
      Sea: displayedOrders.filter((o) => getShipmentMode(o) === "Sea").length,
    };
    if (this.state.shipmentTab !== "All") {
      displayedOrders = displayedOrders.filter(
        (order) => getShipmentMode(order) === this.state.shipmentTab,
      );
    }
    if (this.state.groupByShop) {
      displayedOrders = sortByShop(displayedOrders, shopGroups);
    }
    const isFiltered = Boolean(
      this.state.searchFor ||
        this.state.paymentFilter ||
        this.state.order1688 ||
        this.state.shopFilter ||
        this.state.shipmentTab !== "All",
    );
    const multiOrderShops = Object.values(shopGroups).filter((g) => g.count > 1).length;
    const statusLabel =
      STATUS_LABELS[this.props.match.params.orderStatus] ||
      this.props.match.params.orderStatus;

    displayedOrders.forEach((order) => {
      const firstItem = order.items && order.items[0];
      totalWeight +=
        firstItem && firstItem.weight ? parseFloat(firstItem.weight) : 0;
      if (order.creationTime1688 && order.creationTime1688.totalSuccessAmount) {
        totalRmb += parseFloat(order.creationTime1688.totalSuccessAmount);
        totalExpense += parseFloat(
          order.creationTime1688.totalSuccessAmount * order.exchangeRate,
        )
          ? parseFloat(order.creationTime1688.totalSuccessAmount) *
            order.exchangeRate
          : 0;
      }
      totalBdt +=
        (order.orderTotal ? parseFloat(order.orderTotal) : 0) +
        (order.localShipping ? parseFloat(order.localShipping) : 0);
    });
    totalProfit = totalBdt - totalExpense;
    console.log(this.props);
    // The shared 1688 account's address book contains addresses belonging to
    // other companies; only these two are actually ours.
    const allowedAddressIds = [7458530628, 7471923022];
    const filteredAddresses = this.state.shippingAddress.filter((item) =>
      allowedAddressIds.includes(item.id),
    );
    return (
      <Fragment>
        <UpdateRequestModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          order={this.state.order}
        />

        <Breadcrumb title={statusLabel} parent="1688/tabao Orders" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row">
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
                  {/* Title + primary actions */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h5
                        style={{
                          margin: 0,
                          fontWeight: 700,
                          color: "#0f172a",
                          fontSize: 20,
                          textTransform: "capitalize",
                        }}
                      >
                        {statusLabel}
                      </h5>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          color: "#94a3b8",
                        }}
                      >
                        {displayedOrders.length}{" "}
                        {displayedOrders.length === 1 ? "order" : "orders"}
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          let ordersWithOrderNumber = displayedOrders.filter(
                            (order) => order.orderNumber && !order.trackingNo,
                          );
                          this.getAllTrackingNo(ordersWithOrderNumber);
                        }}
                        style={{ minWidth: 168 }}
                      >
                        {this.state.loader1 ? (
                          <ClipLoader color={"#334155"} loading size={14} />
                        ) : (
                          "Get 1688 Tracking No"
                        )}
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          // Every order with a 1688 order number, not just the
                          // ones missing a total: the status can move after the
                          // cost figures were first pulled.
                          let ordersToUpdate = displayedOrders.filter(
                            (order) => order.orderNumber,
                          );
                          this.getAll1688Actuals(ordersToUpdate);
                        }}
                        style={{ minWidth: 188 }}
                      >
                        {this.state.loader2 ? (
                          <ClipLoader color={"#fff"} loading size={14} />
                        ) : (
                          "Sync 1688 Total & Status"
                        )}
                      </Button>
                    </div>
                  </div>

                  <ModeTabs
                    value={this.state.shipmentTab}
                    counts={modeCounts}
                    onChange={(tab) => this.setState({ shipmentTab: tab })}
                  />

                  {/* Filters */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      margin: "16px 0 20px",
                      flexWrap: "wrap",
                    }}
                  >
                    <form
                      onSubmit={this.handleSubmit2}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        flex: "1 1 300px",
                        maxWidth: 440,
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
                        placeholder="Search order Id, customer name / number / phone, tracking no or shipping mark"
                        onChange={this.handleSearchBarChange}
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
                    </form>

                    <select
                      name="paymentFilter"
                      value={this.state.paymentFilter}
                      onChange={this.handleChange}
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
                      <option value="">All Payments</option>
                      {PAYMENT_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>

                    {/* This range re-queries Firestore, so it needs Apply. */}
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
                        Ordered
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
                </div>
                <PaymentSummaryBar
                  orders={displayedOrders}
                  filtered={isFiltered}
                  countLabel="Total Orders"
                  extraTiles={[
                    {
                      label: "Total Weight",
                      value: `${parseFloat(totalWeight).toFixed(2)} Kg`,
                      accent: "#0ea5e9",
                    },
                    {
                      label: "Total RMB",
                      value: `¥ ${parseFloat(totalRmb).toFixed(2)}`,
                      accent: "#0d9488",
                    },
                    {
                      label: "Total Expense",
                      value: `৳${Math.round(totalExpense).toLocaleString()}`,
                      accent: "#e11d48",
                    },
                    {
                      label: "Total Profit",
                      value: `৳${Math.round(totalProfit).toLocaleString()}`,
                      accent: totalProfit >= 0 ? "#16a34a" : "#e11d48",
                      hint: totalProfit >= 0 ? "" : "loss",
                    },
                  ]}
                />
                <div
                  className="card-body"
                  style={{ paddingTop: 0, borderTop: "1px solid #eef2f7" }}
                >
                  <div className="clearfix"></div>
                  {/* Same-supplier orders: group them, or filter to one shop */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      flexWrap: "wrap",
                      margin: "12px 0",
                      fontSize: 13,
                    }}
                  >
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: 0, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={this.state.groupByShop}
                        onChange={(e) => this.setState({ groupByShop: e.target.checked })}
                      />
                      Group orders by 1688 shop
                    </label>
                    <span style={{ color: "#64748b", fontSize: 12 }}>
                      {multiOrderShops
                        ? `${multiOrderShops} shop${multiOrderShops === 1 ? " has" : "s have"} more than one order in this tab — click a shop badge to see them together.`
                        : "No shop has more than one order in this tab."}
                    </span>
                    {this.state.searchFor.trim() && (
                      <span style={{ color: "#9a3412", background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 8, padding: "4px 10px", fontSize: 12 }}>
                        {this.state.searchPoolLoading
                          ? "Searching all orders…"
                          : "Search covers every order — all statuses and dates."}
                      </span>
                    )}
                    {this.state.shopFilter && (
                      <span
                        style={{
                          background: "#eef2ff",
                          border: "1px solid #c7d2fe",
                          color: "#3730a3",
                          borderRadius: 8,
                          padding: "4px 10px",
                          fontSize: 12,
                        }}
                      >
                        Showing only shop: <b>{this.state.shopFilter.name}</b>{" "}
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            this.setState({ shopFilter: null });
                          }}
                          style={{ marginLeft: 6, fontWeight: 700 }}
                        >
                          Clear
                        </a>
                      </span>
                    )}
                  </div>
                  <div id="basicScenario" className="product-physical list-modern">
                    <Datatable
                      shopGroups={shopGroups}
                      onFilterShop={(key, name) => this.setState({ shopFilter: { key, name } })}
                      startToggleModal={this.startToggleModal}
                      startDeleteToggleModal={this.startDeleteToggleModal}
                      history={this.props.history}
                      orderStatus={this.props.match.params.orderStatus}
                      multiSelectOption={false}
                      myData={displayedOrders}
                      shippingAddress={filteredAddresses}
                      pageSize={50}
                      pagination={true}
                      class="-striped -highlight"
                      statusLabel={statusLabel}
                      isFiltered={isFiltered}
                      onClearFilters={this.clearFilters}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <SyncResultModal
          result={this.state.syncResult}
          onClose={() => this.setState({ syncResult: null })}
        />
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    ordersApi: state.orders.ordersApi,
  };
};

export default connect(mapStateToProps, {
  getAllOrdersApiRedux,
  getAllEmployeeRedux,
  updateOrdersWithTrackingNoRedux,
  updateOrdersFrom1688Redux,
})(New);
