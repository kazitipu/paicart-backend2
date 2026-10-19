import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./datatable.jsx";
import {
  getAllProductRequestsRedux,
  getAllUsersRedux,
  getAllD2DRatesRedux,
  setProductRequestRedux,
} from "../../actions/index";
import { Link } from "react-router-dom";
import UpdateRequestModal from "./updateRequestModal.jsx";
import man from "../../components/products/physical/plus image.jpeg";
import { connect } from "react-redux";
import { Search } from "react-feather";
import { Button, ModeTabs } from "../common/listUi.jsx";
import { getShipmentMode } from "../../constants/shipment";
import { PAYMENT_SELECTION_TABS } from "../../constants/productRequestPayment";
import "../common/list-modern.css";
import {
  isWithinDateRange,
  getDefaultDateRange,
} from "../../constants/dateRange";
import { HashLoader, CircleLoader } from "react-spinners";
import {
  uploadImage,
  getAllRequestsForSearch,
  getCustomersForSearch,
} from "../../firebase/firebase.utils.js";
import PaymentSummaryBar from "../common/paymentSummaryBar.jsx";
import { getPaymentState, PAYMENT_STATES } from "../../constants/paymentMath";
import { buildCustomerIndex, customerSearchFields } from "../../constants/customerSearch";
/* Tab slug -> display label; routes keep their slugs. */
const STATUS_LABELS = {
  new: "New Requests",
  "rates-given": "Rates Provided",
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
      imageUrl: man,
      date: new Date().toLocaleDateString("en-GB"),
      productQuantity: "",
      productUrl: "",
      productVariant: "",
      productType: "",
      country: "",
      store: "",
      /* Air vs Sea — picks which D2D rate table feeds the product types
         below, and travels with the request from here on. */
      shipmentMethod: "Air",
      image_loader: false,
      submit_loader: false,
      cursor: -1,
      customer: "",
      customerUid: "",
      showSuggestion: false,
      paymentFilter: "",
      shipmentTab: "All",
      // Opens on the last 30 days; clear the range (x) to see everything.
      dateFrom: getDefaultDateRange(30).startDate,
      dateTo: getDefaultDateRange(30).endDate,
    };
  }

  componentDidMount = async () => {
    this.props.getAllUsersRedux();
    console.log(this.props.match.params.orderStatus);
    if (this.props.match.params.orderStatus === "new") {
      this.props.getAllProductRequestsRedux("Pending");
    } else if (this.props.match.params.orderStatus === "rates-given") {
      this.props.getAllProductRequestsRedux("Rates Provided");
    } else if (this.props.match.params.orderStatus === "purchased") {
      this.props.getAllProductRequestsRedux("Purchased");
    } else if (
      this.props.match.params.orderStatus === "received-in-warehouse"
    ) {
      this.props.getAllProductRequestsRedux("Received in Warehouse");
    } else if (this.props.match.params.orderStatus === "ready-for-fly") {
      this.props.getAllProductRequestsRedux("Ready for fly");
    } else if (this.props.match.params.orderStatus === "bangladesh-customs") {
      this.props.getAllProductRequestsRedux("Bangladesh customs");
    } else if (this.props.match.params.orderStatus === "bangladesh-customs") {
      this.props.getAllProductRequestsRedux("Bangladesh customs");
    } else if (this.props.match.params.orderStatus === "custom-released") {
      this.props.getAllProductRequestsRedux("Bangladesh warehouse");
    } else if (this.props.match.params.orderStatus === "Paicart-warehouse") {
      this.props.getAllProductRequestsRedux("Paicart warehouse");
    } else if (this.props.match.params.orderStatus === "delivered") {
      this.props.getAllProductRequestsRedux("Delivered");
    } else if (this.props.match.params.orderStatus === "rejected") {
      this.props.getAllProductRequestsRedux("Reject");
    }
  };

  componentWillReceiveProps = (nextProps) => {
    console.log(nextProps.match.params.orderStatus);
    if (
      this.props.match.params.orderStatus !== nextProps.match.params.orderStatus
    ) {
      if (nextProps.match.params.orderStatus === "new") {
        this.props.getAllProductRequestsRedux("Pending");
      } else if (nextProps.match.params.orderStatus === "rates-given") {
        this.props.getAllProductRequestsRedux("Rates Provided");
      } else if (nextProps.match.params.orderStatus === "purchased") {
        this.props.getAllProductRequestsRedux("Purchased");
      } else if (
        nextProps.match.params.orderStatus === "received-in-warehouse"
      ) {
        this.props.getAllProductRequestsRedux("Received in Warehouse");
      } else if (nextProps.match.params.orderStatus === "ready-for-fly") {
        this.props.getAllProductRequestsRedux("Ready for fly");
      } else if (nextProps.match.params.orderStatus === "bangladesh-customs") {
        this.props.getAllProductRequestsRedux("Bangladesh customs");
      } else if (nextProps.match.params.orderStatus === "bangladesh-customs") {
        this.props.getAllProductRequestsRedux("Bangladesh customs");
      } else if (nextProps.match.params.orderStatus === "custom-released") {
        this.props.getAllProductRequestsRedux("Bangladesh warehouse");
      } else if (nextProps.match.params.orderStatus === "Paicart-warehouse") {
        this.props.getAllProductRequestsRedux("Paicart warehouse");
      } else if (nextProps.match.params.orderStatus === "delivered") {
        this.props.getAllProductRequestsRedux("Delivered");
      } else if (nextProps.match.params.orderStatus === "rejected") {
        this.props.getAllProductRequestsRedux("Reject");
      }
    }
  };

  handleChange = (event) => {
    let { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      console.log(name);
      if (name == "country" || name == "shipmentMethod") {
        if (name == "shipmentMethod") this.setState({ productType: "" });
        if (this.state.country) {
          this.props.getAllD2DRatesRedux(
            this.state.shipmentMethod === "Sea" ? "sea" : "air",
            this.state.country
          );
        }
      }
    });
  };

  handleBookNowSubmit = async () => {
    if (this.state.customerUid == "") {
      alert("Please select a customer first.");
      return;
    }
    if (this.state.image_loader) {
      alert("Wait for the image to be uploaded!");
      return;
    }
    if (!this.state.productType || !this.state.country) {
      alert("Please select a product type.");
      return;
    }
    this.setState({ submit_loader: true });
    let date = new Date();
    const [productType, shippingRate] = this.state.productType.split("-");
    console.log(this.state.productType);
    console.log(productType);
    console.log(shippingRate);
    await this.props.setProductRequestRedux({
      ...this.state,
      date: date.toLocaleDateString("en-GB"),
      time: date.getTime(),
      userId: this.state.customerUid,
      displayName: `${this.state.customer}-${this.state.displayName}`,
      shippingRate,
      productType,
      shipmentStatusScore: 1,
      status: "Pending",
      orderStatus: "Pending",
    });
    this.setState({
      submit_loader: false,
    });

    this.setState({
      imageUrl: man,
      date: new Date().toLocaleDateString("en-GB"),
      productQuantity: "",
      productUrl: "",
      productVariant: "",
      image_loader: false,
      submit_loader: false,
      cursor: -1,
      customer: "",
      customerUid: "",
      showSuggestion: false,
      shipmentMethod: "Air",
    });
  };

  handleChangeCustomer = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, showSuggestion: true, cursor: -1 });
  };

  handleKeyDown = (e) => {
    const { cursor } = this.state;
    let result = [];
    if (this.state.customer) {
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      result = [...suggestionById, ...suggestionByName].slice(0, 10);

      // arrow up/down button should select next/previous list element
      if (e.keyCode === 38 && cursor > -1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor - 1,
        }));
      } else if (e.keyCode === 40 && cursor < result.length - 1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor + 1,
        }));
      } else if (e.keyCode === 13 && cursor > -1) {
        this.setState({
          customer: result[cursor].userId,
          customerUid: result[cursor].uid,
          displayName: result[cursor].displayName,
          showSuggestion: false,
        });
      }
    } else {
      result = [];
    }
  };

  renderShowSuggestion = () => {
    let suggestionArray = [];
    console.log(this.state.customer);
    console.log(this.props.allUsers);
    if (this.state.customer) {
      console.log(this.state.customer);
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      suggestionArray = [...suggestionById, ...suggestionByName];
      const uniqueUser = [...new Set(suggestionArray)];
      console.log(suggestionArray);
      return uniqueUser.slice(0, 10).map((user, index) => (
        <li
          key={user.userId}
          style={{
            minWidth: "195px",
            backgroundColor: this.state.cursor == index ? "gainsboro" : "white",
          }}
          onClick={() =>
            this.setState({
              customer: user.userId,
              customerUid: user.uid,
              displayName: user.displayName,
              showSuggestion: false,
              subCategory: `${user.userId}-${user.displayName}`,
            })
          }
        >
          {user.userId}-{user.displayName ? user.displayName.slice(0, 13) : ""}
        </li>
      ));
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

  _handleImgChange = async (e, i) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl } = this.state;

    reader.onloadend = () => {
      this.setState({
        file: file,
        imageUrl,
      });
    };
    if (file) {
      this.setState({ image_loader: true });
      reader.readAsDataURL(file);
      const imgUrl = await uploadImage(file);
      console.log(imgUrl);

      this.setState({
        imageUrl: imgUrl,
      });
      console.log(imageUrl);
      this.setState({ image_loader: false });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
    /* Searching looks past the open tab and the date range, across every
       booking — loaded fresh each time a new search starts. */
    if (name === "searchFor" && value.trim() && !this.state.searchFor.trim()) {
      this.loadSearchPool();
    }
  };

  loadSearchPool = async () => {
    this.setState({ searchPoolLoading: true });
    const [searchPool, users] = await Promise.all([
      getAllRequestsForSearch("bookingRequest"),
      getCustomersForSearch(),
    ]);
    this.setState({
      searchPool,
      customerIndex: buildCustomerIndex(users),
      searchPoolLoading: false,
    });
  };

  // Filtering is live on every keystroke; this only stops Enter from
  // triggering a native form submit (which reloaded the page).
  handleSubmit = (e) => {
    e.preventDefault();
  };

  // The requests actually shown for the current tab.
  getVisibleOrders = () => {
    const { productRequests } = this.props;
    if (!productRequests || productRequests.length === 0) {
      return [];
    }
    return productRequests.slice().sort((a, b) => b.time - a.time);
  };

  // A single query box matching user name, user id, booking id, order number
  // and tracking no.
  matchesSearch = (order, query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) {
      return true;
    }
    return [
      // customer number / name / phone / email from their profile
      ...customerSearchFields(this.state.customerIndex, order.userId),
      order.displayName,
      order.userId,
      order.uid,
      order.bookingId,
      order.orderNumber,
      order.trackingNo,
      order.productVariant,
      order.productType,
      order.store,
    ].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(q),
    );
  };

  // Clears every filter the empty state offers to undo: search box,
  // payment dropdown, Air/Sea tab and the date range.
  clearFilters = () => {
    this.setState({
      searchFor: "",
      paymentFilter: "",
      shipmentTab: "All",
      dateFrom: "",
      dateTo: "",
    });
  };

  render() {
    const { open } = this.state;
    const { productRequests, currentAdmin } = this.props;
    let orders = this.getVisibleOrders();

    // The exact rows the table renders - the bottom bar totals over this, so
    // searching a user id gives that one customer's figures.
    const searching = Boolean(this.state.searchFor.trim());
    let displayedOrders = searching
      ? (this.state.searchPool || orders).filter((order) =>
          this.matchesSearch(order, this.state.searchFor),
        )
      : orders;
    if (this.state.paymentFilter) {
      displayedOrders = displayedOrders.filter(
        (order) => getPaymentState(order) === this.state.paymentFilter,
      );
    }
    if (!searching && (this.state.dateFrom || this.state.dateTo)) {
      displayedOrders = displayedOrders.filter((order) =>
        isWithinDateRange(order, this.state.dateFrom, this.state.dateTo),
      );
    }
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
    const hasDateRange = Boolean(this.state.dateFrom || this.state.dateTo);
    const isFiltered = Boolean(
      this.state.searchFor ||
        this.state.paymentFilter ||
        hasDateRange ||
        this.state.shipmentTab !== "All",
    );
    const statusLabel =
      STATUS_LABELS[this.props.match.params.orderStatus] ||
      this.props.match.params.orderStatus;
    console.log(this.props);
    return (
      <Fragment>
        <UpdateRequestModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          order={this.state.order}
        />

        <Breadcrumb title={statusLabel} parent="Product Requests" />
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
                        {displayedOrders.length === 1 ? "request" : "requests"}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      data-toggle="modal"
                      data-target="#personalInfoModal"
                      disabled={
                        currentAdmin && currentAdmin.status == "Partner"
                          ? true
                          : false
                      }
                      onClick={() => {
                          this.setState({
                            open: false,
                            searchFor: "",
                            toggleModal: true,
                            toggleDeleteModal: true,
                            order: null,
                            imageUrl: man,
                            date: new Date().toLocaleDateString("en-GB"),
                            productQuantity: "",
                            productUrl: "",
                            productVariant: "",
                            productType: "",
                            country: "",
                            store: "",
                            image_loader: false,
                            submit_loader: false,
                            cursor: -1,
                            customer: "",
                            customerUid: "",
                            showSuggestion: false,
                            paymentFilter: "",
                          });
                      }}
                    >
                      + Create Product Request
                    </Button>
                  </div>

                  <ModeTabs
                    value={this.state.shipmentTab}
                    counts={modeCounts}
                    onChange={(tab) => this.setState({ shipmentTab: tab })}
                  />

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
                      onSubmit={this.handleSubmit}
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
                        placeholder="Search by user name, user Id, booking Id, order no or tracking no"
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

                    {/* Offline payments are recorded as payment rows, so the
                        state here is derived from the amounts rather than the
                        stored paymentStatus field. */}
                    <select
                      name="paymentFilter"
                      value={this.state.paymentFilter}
                      onChange={this.handleSearchBarChange}
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

                    {/* Filters the loaded requests client-side; all requests
                        for a status arrive in one query. */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        border: "1px solid #e2e8f0",
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "4px 10px",
                      }}
                    >
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>
                        Requested
                      </span>
                      <input
                        type="date"
                        name="dateFrom"
                        value={this.state.dateFrom}
                        max={this.state.dateTo || undefined}
                        onChange={this.handleSearchBarChange}
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
                        name="dateTo"
                        value={this.state.dateTo}
                        min={this.state.dateFrom || undefined}
                        onChange={this.handleSearchBarChange}
                        style={{
                          border: "none",
                          background: "transparent",
                          outline: "none",
                          fontSize: 12.5,
                          color: "#0f172a",
                          padding: "6px 0",
                        }}
                      />
                      {hasDateRange && (
                        <button
                          onClick={() =>
                            this.setState({ dateFrom: "", dateTo: "" })
                          }
                          title="Clear date range"
                          style={{
                            border: "none",
                            background: "transparent",
                            color: "#94a3b8",
                            cursor: "pointer",
                            fontSize: 16,
                            lineHeight: 1,
                            padding: "0 2px",
                          }}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <PaymentSummaryBar
                  orders={displayedOrders}
                  filtered={isFiltered}
                  countLabel="Total Requests"
                />
                <div
                  className="card-body"
                  style={{ paddingTop: 0, borderTop: "1px solid #eef2f7" }}
                >
                  <div className="clearfix"></div>
                  {this.state.searchFor.trim() && (
                    <div
                      style={{
                        margin: "12px 0",
                        padding: "8px 12px",
                        borderRadius: 8,
                        background: "#fff7ed",
                        border: "1px solid #fed7aa",
                        color: "#9a3412",
                        fontSize: 12,
                      }}
                    >
                      {this.state.searchPoolLoading
                        ? "Searching all bookings…"
                        : "Showing matches from every status and date — not just this tab."}
                    </div>
                  )}
                  <div id="basicScenario" className="product-physical list-modern">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      startDeleteToggleModal={this.startDeleteToggleModal}
                      history={this.props.history}
                      orderStatus={this.props.match.params.orderStatus}
                      multiSelectOption={false}
                      paymentSelection={PAYMENT_SELECTION_TABS.includes(
                        this.props.match.params.orderStatus,
                      )}
                      myData={displayedOrders}
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
                  Create New Product Request
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
                  <form
                    onSubmit={this.handleSubmit}
                    className="rounded-field mt-2"
                  >
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          SELECT CUSTOMER
                        </label>
                        <input
                          title="Please choose a package"
                          style={{ padding: 18 }}
                          type="text"
                          name="customer"
                          className="form-control"
                          placeholder="Enter customer Id"
                          aria-required="true"
                          aria-invalid="false"
                          onChange={this.handleChangeCustomer}
                          value={this.state.customer}
                          required
                          autoComplete="off"
                          onKeyDown={this.handleKeyDown}
                        />
                        {this.state.customer && (
                          <ul
                            className="below-searchbar-recommendation"
                            style={{
                              display: this.state.showSuggestion
                                ? "flex"
                                : "none",
                            }}
                          >
                            {this.renderShowSuggestion()}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          SELECT STORE
                        </label>

                        <select
                          className="custom-select"
                          name="store"
                          value={this.state.store}
                          onChange={this.handleChange}
                          required
                          style={{ height: 50, color: "gray" }}
                        >
                          <option value="">Select Store</option>
                          <option value="AliExpress">AliExpress</option>
                          <option value="Gearbest">Gearbest</option>
                          <option value="Taobao">Taobao</option>
                          <option value="Flipkart">Flipkart</option>
                          <option value="Amazon (India)">Amazon (India)</option>
                          <option value="Amazon (USA)">Amazon (USA)</option>
                          <option value="Amazon (UAE)">Amazon (UAE)</option>
                          <option value="Best Buy">Best Buy</option>
                          <option value="Alibaba">Alibaba</option>
                          <option value="Pingduoduo">Pingduoduo</option>
                          <option value="Taobao (Direct)">
                            Taobao (Direct)
                          </option>
                          <option value="Walmart">Walmart</option>
                          <option value="eBay">eBay</option>
                          <option value="JLCPCB">JLCPCB</option>
                          <option value="Noon">Noon</option>
                          <option value="Myntra">Myntra</option>
                          <option value="Others">Others</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          ORIGIN COUNTRY
                        </label>
                        <select
                          className="custom-select"
                          name="country"
                          value={this.state.country}
                          onChange={this.handleChange}
                          required
                          style={{ height: 50, color: "gray" }}
                        >
                          <option value="">Select Country</option>
                          <option value="china">China</option>
                          <option value="uk">UK</option>
                          <option value="usa">Usa</option>
                          <option value="hongkong">Hongkong</option>
                          <option value="thailand">Thailand</option>
                          <option value="india">India</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          SHIPMENT METHOD
                        </label>
                        <select
                          className="custom-select"
                          name="shipmentMethod"
                          value={this.state.shipmentMethod}
                          onChange={this.handleChange}
                          required
                          style={{ height: 50, color: "gray" }}
                        >
                          <option value="Air">By Air</option>
                          <option value="Sea">By Sea</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          PRODUCT TYPE
                        </label>

                        <select
                          className="custom-select"
                          name="productType"
                          value={this.state.productType}
                          onChange={this.handleChange}
                        >
                          <option value="">
                            Select Product Type ({this.state.shipmentMethod},
                            shipping rate for 5kg+)
                          </option>

                          {this.props.d2dRates.map((rate) => (
                            <option
                              value={`${rate.id}-${rate.eleven}`}
                              key={rate.id}
                            >
                              {rate.id}-{rate.eleven}Tk/Kg
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          PRODUCT LINK
                        </label>
                        <textarea
                          type="text"
                          name="productUrl"
                          value={this.state.productUrl}
                          onChange={this.handleChange}
                          className="form-control"
                          placeholder="Enter product Url here"
                        />
                      </div>
                    </div>

                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          PRODUCT QUANTITY
                        </label>

                        <input
                          type="text"
                          name="productQuantity"
                          value={this.state.productQuantity}
                          onChange={this.handleChange}
                          className="form-control"
                          placeholder="Product Quantity"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          PRODUCT DESCRIPTION
                        </label>

                        <textarea
                          style={{
                            borderRadius: 5,
                            height: 100,
                          }}
                          type="text"
                          name="productVariant"
                          value={this.state.productVariant}
                          onChange={this.handleChange}
                          className="form-control"
                          placeholder="Product description (color,size,variant,quanity etc)"
                          required
                        />
                      </div>
                    </div>
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          UPLOAD IMAGE
                        </label>

                        <div
                          className="box-input-file"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          {this.state.image_loader ? (
                            <div
                              className="spinner-border"
                              role="status"
                              style={{
                                color: "purple",
                                paddingTop: "25px",
                                backgroundColor: "white",
                                width: 150,
                                height: 150,
                                display: "flex",
                                flexDirection: "row",
                                justifyContent: "center",
                                border: "1px solid gainsboro",
                                borderRadius: 8,
                              }}
                            >
                              <div
                                style={{
                                  marginTop: 30,
                                  padding: 0,
                                  marginRight: 20,
                                }}
                              >
                                <CircleLoader
                                  loading={this.state.image_loader}
                                  color="blue"
                                  size={35}
                                />
                              </div>
                            </div>
                          ) : (
                            <>
                              <img
                                className="img-100 lazyloaded blur-up"
                                src={this.state.imageUrl}
                                alt="#"
                                style={{
                                  zIndex: 6,
                                  cursor: "pointer",
                                  maxWidth: 150,
                                  minWidth: 150,
                                  minHeight: 150,
                                  maxHeight: 150,
                                  border: "1px solid gainsboro",
                                  borderRadius: 8,
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
                    </div>
                  </form>
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
                    this.handleBookNowSubmit();
                  }}
                  disabled={
                    currentAdmin && currentAdmin.status == "Partner"
                      ? true
                      : false
                  }
                >
                  Create Product Request
                </button>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    productRequests: state.productRequests.productRequests,
    d2dRates: state.d2dRates.d2dRates,
    allUsers: state.users.users,
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  getAllProductRequestsRedux,
  getAllUsersRedux,
  getAllD2DRatesRedux,
  setProductRequestRedux,
})(New);
