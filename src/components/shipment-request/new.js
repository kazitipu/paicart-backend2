import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./datatable.jsx";
import {
  getAllShipmentRequestsRedux,
  getAllWarehousesRedux,
  getAllD2DRatesRedux,
  getAllUsersRedux,
  setShipForMeRedux,
} from "../../actions/index";
import {
  uploadImage,
  getAllRequestsForSearch,
  getCustomersForSearch,
} from "../../firebase/firebase.utils.js";
import { Link } from "react-router-dom";
import UpdateRequestModal from "./updateRequestModal";
import man from "../../components/products/physical/plus image.jpeg";
import { connect } from "react-redux";
import { Search } from "react-feather";
import { HashLoader, CircleLoader } from "react-spinners";
import "./updateRequestModal.css";
import "../common/list-modern.css";
import PaymentSummaryBar from "../common/paymentSummaryBar.jsx";
import {
  toDateInputValue,
  isWithinDateRange,
  getDefaultDateRange,
} from "../../constants/dateRange";
import { getShipmentMode } from "../../constants/shipment";
import { ModeTabs, SHIPMENT_TABS } from "../common/listUi.jsx";
import {
  getPaymentState,
  getShipmentPayable,
  PAYMENT_STATES,
} from "../../constants/paymentMath";
import { buildCustomerIndex, customerSearchFields } from "../../constants/customerSearch";
/* Tab slug -> the label the team actually uses for that stage. The routes keep
   their original slugs so existing links and bookmarks still work. */
const STATUS_LABELS = {
  new: "Pending",
  "rates-given": "Approved",
  "received-in-warehouse": "Abroad Warehouse",
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
      paymentFilter: "",
      shipmentTab: "All",
      // Opens on the last 30 days; clear the range (x) to see everything.
      dateFrom: getDefaultDateRange(30).startDate,
      dateTo: getDefaultDateRange(30).endDate,
      toggleModal: true,
      toggleDeleteModal: true,
      singleRequest: null,

      cursor: -1,
      customer: "",
      customerUid: "",
      showSuggestion: false,

      imageUrl: man,
      visual: "INPUT",
      shipFrom: "",
      method: "",
      productType: "",
      methodError: false,
      shipFromError: false,
      productTypeError: false,
      weightError: false,
      submit_loader: false,
      submit_loader2: false,
      result: null,
      weight: "",
      date: new Date().toLocaleDateString("en-GB"),
      ctnQuantity: "",
      totalCbm: "",
      productContains: "liquid",
      productBrand: "Brand",
      productsTotalCost: "",
      shipTo: "",
      shipTo2: "",
      validTo: "",
      shipmentMethod: "D2D",
      productQuantity: "",
      othersProductName: "",
      productUrl: "",
      productVariant: "",
      image_loader: false,
      trackingNumbers: [""],
      waybillImage: "",
      waybillImage_loader: false,
      packingListUrl: "",
      packingList_loader: false,
    };
  }

  componentDidMount = async () => {
    this.props.getAllWarehousesRedux();
    this.props.getAllUsersRedux();
    if (this.props.match.params.bookingStatus === "new") {
      this.props.getAllShipmentRequestsRedux("Pending");
    } else if (this.props.match.params.bookingStatus === "rates-given") {
      this.props.getAllShipmentRequestsRedux("Rates Provided");
    } else if (
      this.props.match.params.bookingStatus === "received-in-warehouse"
    ) {
      this.props.getAllShipmentRequestsRedux("Received in Warehouse");
    } else if (this.props.match.params.bookingStatus === "ready-for-fly") {
      this.props.getAllShipmentRequestsRedux("Ready for fly");
    } else if (this.props.match.params.bookingStatus === "bangladesh-customs") {
      this.props.getAllShipmentRequestsRedux("Bangladesh customs");
    } else if (this.props.match.params.bookingStatus === "custom-released") {
      this.props.getAllShipmentRequestsRedux("Bangladesh warehouse");
    } else if (this.props.match.params.bookingStatus === "Paicart-warehouse") {
      this.props.getAllShipmentRequestsRedux("Paicart warehouse");
    } else if (this.props.match.params.bookingStatus === "delivered") {
      this.props.getAllShipmentRequestsRedux("Delivered");
    } else if (this.props.match.params.bookingStatus === "rejected") {
      this.props.getAllShipmentRequestsRedux("Reject");
    }
  };

  componentWillReceiveProps = (nextProps) => {
    if (
      this.props.match.params.bookingStatus !==
      nextProps.match.params.bookingStatus
    ) {
      if (nextProps.match.params.bookingStatus === "new") {
        this.props.getAllShipmentRequestsRedux("Pending");
      } else if (nextProps.match.params.bookingStatus === "rates-given") {
        this.props.getAllShipmentRequestsRedux("Rates Provided");
      } else if (
        nextProps.match.params.bookingStatus === "received-in-warehouse"
      ) {
        this.props.getAllShipmentRequestsRedux("Received in Warehouse");
      } else if (nextProps.match.params.bookingStatus === "ready-for-fly") {
        this.props.getAllShipmentRequestsRedux("Ready for fly");
      } else if (
        nextProps.match.params.bookingStatus === "bangladesh-customs"
      ) {
        this.props.getAllShipmentRequestsRedux("Bangladesh customs");
      } else if (nextProps.match.params.bookingStatus === "custom-released") {
        this.props.getAllShipmentRequestsRedux("Bangladesh warehouse");
      } else if (nextProps.match.params.bookingStatus === "Paicart-warehouse") {
        this.props.getAllShipmentRequestsRedux("Paicart warehouse");
      } else if (nextProps.match.params.bookingStatus === "delivered") {
        this.props.getAllShipmentRequestsRedux("Delivered");
      } else if (nextProps.match.params.bookingStatus === "rejected") {
        this.props.getAllShipmentRequestsRedux("Reject");
      }
    }
  };

  startToggleModal = async (requestObj) => {
    if (requestObj == null) {
      this.setState({
        toggleModal: !this.state.toggleModal,
        singleRequest: null,
      });
    } else {
      console.log(requestObj);
      this.setState({
        toggleModal: !this.state.toggleModal,
        singleRequest: requestObj,
      });
    }
  };
  handleChange = (event) => {
    let { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      this.props.getAllD2DRatesRedux(this.state.method, this.state.shipFrom);
    });
  };
  handleChange2 = (event) => {
    let { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleChangeBooking = (event) => {
    let { name, value } = event.target;
    this.setState({ [name]: value });
  };
  handleChangeBooking2 = (event) => {
    let { name, value } = event.target;
    this.setState({ [name]: value }, () => {
      const day = parseInt(this.state.shipTo.split("-")[2]);
      let newDay = parseInt(this.state.shipTo.split("-")[2]) + 7;
      let month = this.state.shipTo.split("-")[1];
      let year = this.state.shipTo.split("-")[0];
      const shipTo = `${day}-${month}-${year}`;
      this.setState({
        shipTo2: shipTo,
      });
      if (newDay > 30) {
        newDay = parseInt(newDay) - 30;
        month = parseInt(month) + 1;
        if (month > 12) {
          month = 1;
          year = parseInt(year) + 1;
        }
      }
      const newDate = `${newDay}-${month}-${year}`;

      this.setState({
        validTo: newDate,
      });
    });
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

  _handleWaybillChange = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      this.setState({ waybillImage_loader: true });
      const imgUrl = await uploadImage(file);
      this.setState({ waybillImage: imgUrl, waybillImage_loader: false });
    }
  };

  _handlePackingListChange = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (file) {
      this.setState({ packingList_loader: true });
      const fileUrl = await uploadImage(file);
      this.setState({ packingListUrl: fileUrl, packingList_loader: false });
    }
  };

  handleTrackingChange = (i, value) => {
    const trackingNumbers = [...this.state.trackingNumbers];
    trackingNumbers[i] = value;
    this.setState({ trackingNumbers });
  };

  addTrackingField = () => {
    this.setState({ trackingNumbers: [...this.state.trackingNumbers, ""] });
  };

  removeTrackingField = (i) => {
    const trackingNumbers = this.state.trackingNumbers.filter(
      (_, idx) => idx !== i
    );
    this.setState({
      trackingNumbers: trackingNumbers.length ? trackingNumbers : [""],
    });
  };

  handleChangeCustomer = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, showSuggestion: true, cursor: -1 });
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
      getAllRequestsForSearch("shipForMe"),
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

  // A single query box matching user name, user id, booking id and
  // tracking no.
  matchesSearch = (request, query) => {
    const q = String(query || "").trim().toLowerCase();
    if (!q) {
      return true;
    }
    return [
      // customer number / name / phone / email from their profile
      ...customerSearchFields(this.state.customerIndex, request.userId),
      request.displayName,
      request.userId,
      request.uid,
      request.bookingId,
      request.trackingNo,
      request.othersProductName,
      request.shippingMark,
    ].some((field) =>
      String(field || "")
        .toLowerCase()
        .includes(q),
    );
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

  handleDoorToDoorSubmit = (weight, productType, allD2dRates, method) => {
    console.log(productType);
    console.log(allD2dRates);
    const selectedproductType = allD2dRates.find(
      (pdctType) => pdctType.id == productType.split("-")[0]
    );
    console.log(selectedproductType);
    if (method === "sea") {
      if (weight <= 100) {
        const result = Math.round(weight * selectedproductType["100kg"]);
        return { result, perKg: selectedproductType["100kg"] };
      }
      if (100 < weight && weight <= 1000) {
        const result = Math.round(weight * selectedproductType["below_1000kg"]);
        return { result, perKg: selectedproductType["below_1000kg"] };
      }
      if (weight > 1000) {
        const result = Math.round(weight * selectedproductType["above_1000kg"]);
        return { result, perKg: selectedproductType["above_1000kg"] };
      }
    } else {
      if (weight <= 0.3) {
        const result = selectedproductType.parcel;
        return {
          result,
          perKg: Math.round(selectedproductType.parcel * 3.333333),
        };
      }
      if (0.3 < weight && weight <= 10) {
        const result = Math.round(weight * selectedproductType.ten);
        return { result, perKg: selectedproductType.ten };
      }
      if (weight > 10) {
        const result = Math.round(weight * selectedproductType.eleven);
        return { result, perKg: selectedproductType.eleven };
      }
    }
  };

  handleBookNowSubmit = async () => {
    this.setState({ submit_loader2: true });
    if (this.state.customerUid == "") {
      alert("Please select a customer first.");
      return;
    }
    if (this.state.image_loader) {
      alert("Please let the image to uploaded.");
      return;
    }
    if (this.state.weight && this.state.productType && this.state.method) {
      let date = new Date();
      const bookingId = `${Math.round(Math.random() * 1000000 - 1)}`;
      this.handleDoorToDoorSubmit(
        this.state.weight,
        this.state.productType,
        this.props.d2dRates,
        this.state.method
      );
      await this.props.setShipForMeRedux({
        ...this.state,
        productType: this.state.productType.split("-")[0],
        date: date.toLocaleDateString("en-GB"),
        time: date.getTime(),
        userId: this.state.customerUid,
        displayName: `${this.state.customer}-${this.state.displayName}`,
        shipBy: this.state.method,
        status: "Pending",
        shipTo: this.state.shipTo2,
        shipmentStatusScore: 1,
        trackingNo: this.state.trackingNumbers.filter((t) => t.trim()).join(","),
        result: this.handleDoorToDoorSubmit(
          this.state.weight,
          this.state.productType,
          this.props.d2dRates,
          this.state.method
        ),
        bookingId,
      });
    } else {
      alert("Please fullfill all the information.");
      return;
    }

    this.setState({
      open: false,
      imageUrl: man,
      visual: "INPUT",
      shipFrom: "",
      method: "",
      productType: "",
      methodError: false,
      shipFromError: false,
      productTypeError: false,
      weightError: false,
      submit_loader: false,
      submit_loader2: false,
      result: null,
      weight: "",
      date: new Date().toLocaleDateString("en-GB"),
      ctnQuantity: "",
      totalCbm: 1,
      productContains: "liquid",
      productBrand: "Brand",
      productsTotalCost: "",
      imageUrl: "",
      shipmentMethod: "D2D",
      productQuantity: "",
      othersProductName: "",
      productUrl: "",
      productVariant: "",
      image_loader: false,
      trackingNumbers: [""],
      waybillImage: "",
      waybillImage_loader: false,
      packingListUrl: "",
      packingList_loader: false,
    });
  };

  renderShowSuggestion = () => {
    let suggestionArray = [];
    console.log(this.state.customer);
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

    // The exact rows the table renders - the bottom bar totals over this, so
    // searching a user id gives that one customer's figures.
    const searching = Boolean(this.state.searchFor.trim());
    let displayedRequests = this.props.allShipmentRequests || [];
    if (searching) {
      displayedRequests = (this.state.searchPool || displayedRequests).filter(
        (request) => this.matchesSearch(request, this.state.searchFor),
      );
    }
    if (this.state.paymentFilter) {
      displayedRequests = displayedRequests.filter(
        (request) =>
          getPaymentState(request, getShipmentPayable) ===
          this.state.paymentFilter,
      );
    }
    if (!searching && (this.state.dateFrom || this.state.dateTo)) {
      displayedRequests = displayedRequests.filter((request) =>
        isWithinDateRange(request, this.state.dateFrom, this.state.dateTo),
      );
    }
    // Counts come from the search/payment-filtered set, before the Air/Sea
    // split, so each tab shows how many rows it would actually reveal.
    const modeCounts = {
      All: displayedRequests.length,
      Air: displayedRequests.filter((r) => getShipmentMode(r) === "Air").length,
      Sea: displayedRequests.filter((r) => getShipmentMode(r) === "Sea").length,
    };
    if (this.state.shipmentTab !== "All") {
      displayedRequests = displayedRequests.filter(
        (request) => getShipmentMode(request) === this.state.shipmentTab,
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
      STATUS_LABELS[this.props.match.params.bookingStatus] ||
      this.props.match.params.bookingStatus;
    return (
      <Fragment>
        <UpdateRequestModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          singleRequest={this.state.singleRequest}
        />

        <Breadcrumb title={statusLabel} parent="Shipment Requests" />
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
                  {/* Title row */}
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
                        {displayedRequests.length}{" "}
                        {displayedRequests.length === 1
                          ? "shipment request"
                          : "shipment requests"}
                      </p>
                    </div>
                    <button
                      className="btn"
                      data-toggle="modal"
                      data-target="#personalInfoModal"
                      style={{
                        background: "#FF6A00",
                        border: "none",
                        color: "white",
                        fontSize: 13,
                        fontWeight: 700,
                        borderRadius: 10,
                        padding: "9px 18px",
                      }}
                      onClick={() => {
                          this.setState({
                            imageUrl: man,
                            visual: "INPUT",
                            shipFrom: "",
                            method: "",
                            productType: "",
                            methodError: false,
                            shipFromError: false,
                            productTypeError: false,
                            weightError: false,
                            submit_loader: false,
                            submit_loader2: false,
                            result: null,
                            weight: "",
                            date: new Date().toLocaleDateString("en-GB"),
                            ctnQuantity: "",
                            totalCbm: "",
                            productContains: "liquid",
                            productBrand: "Brand",
                            productsTotalCost: "",
                            shipTo: "",
                            shipTo2: "",
                            validTo: "",
                            shipmentMethod: "D2D",
                            productQuantity: "",
                            othersProductName: "",
                            productUrl: "",
                            productVariant: "",
                            image_loader: false,
                            trackingNumbers: [""],
                            waybillImage: "",
                            waybillImage_loader: false,
                            packingListUrl: "",
                            packingList_loader: false,
                          });
                      }}
                    >
                      + Create New Shipment
                    </button>
                  </div>

                  <ModeTabs
                    value={this.state.shipmentTab}
                    counts={modeCounts}
                    onChange={(tab) => this.setState({ shipmentTab: tab })}
                  />

                  {/* Search + payment filter */}
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
                        flex: "1 1 320px",
                        maxWidth: 460,
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
                        placeholder="Search by user name, user Id, booking Id or tracking no"
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

                    {/* Filters the loaded bookings by booked date. Left empty
                        by default: a preset window would hide the older
                        bookings that sit in these tabs for months. */}
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
                        Booked
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
                  orders={displayedRequests}
                  filtered={isFiltered}
                  payableOf={getShipmentPayable}
                  countLabel="Total Bookings"
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
                      props={this.props}
                      bookingStatus={this.props.match.params.bookingStatus}
                      multiSelectOption={false}
                      myData={displayedRequests}
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
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
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
                  Create New Shipment Request
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
                          METHOD (Sea/Air)
                        </label>

                        <select
                          className="custom-select"
                          name="method"
                          value={this.state.method}
                          onChange={this.handleChange}
                        >
                          <option value="">Choose Method</option>
                          <option value="sea">Sea</option>
                          <option value="air">Air</option>
                        </select>
                      </div>
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          ORIGIN OF SHIPMENT
                        </label>

                        <select
                          className="custom-select"
                          name="shipFrom"
                          value={this.state.shipFrom}
                          onChange={this.handleChange}
                        >
                          <option value="">Select Country</option>
                          <option value="china">China</option>
                          <option value="uk">UK</option>
                          <option value="usa">Usa</option>
                          <option value="hongkong">Hongkong</option>
                          <option value="thailand">Thailand</option>
                          {this.state.method === "air" && (
                            <>
                              <option value="india">India</option>
                            </>
                          )}
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
                          TOTAL WEIGHT
                        </label>

                        <input
                          type="number"
                          name="weight"
                          value={this.state.weight}
                          onChange={(event) => {
                            this.setState({
                              weight: event.target.value,
                            });
                          }}
                          className="form-control"
                          placeholder="Enter Weight"
                        />
                      </div>
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
                          <option value="">Select Product</option>

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
                          PRODUCT LINK (optional)
                        </label>
                        <textarea
                          type="text"
                          name="productUrl"
                          value={this.state.productUrl}
                          onChange={this.handleChangeBooking}
                          className="form-control"
                          placeholder="Enter product Url here"
                        />
                      </div>
                    </div>
                    <div
                      className="form-row"
                      style={{
                        color: "#555",
                        marginTop: 15,
                        marginBottom: 10,
                        borderBottom: "1px solid gray",
                      }}
                    >
                      Shipping Information
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
                          CARTON QUANTITY
                        </label>

                        <input
                          type="text"
                          name="ctnQuantity"
                          value={this.state.ctnQuantity}
                          onChange={this.handleChangeBooking}
                          className="form-control"
                          placeholder="Carton Quantity"
                        />
                      </div>
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
                          onChange={this.handleChangeBooking}
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
                          PRODUCT TOTAL COST
                        </label>

                        <input
                          type="text"
                          name="productsTotalCost"
                          value={this.state.productsTotalCost}
                          onChange={this.handleChangeBooking}
                          className="form-control"
                          placeholder="Products total cost"
                        />
                      </div>
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          PRODUCT NAME
                        </label>

                        <input
                          type="text"
                          name="othersProductName"
                          value={this.state.othersProductName}
                          onChange={this.handleChangeBooking}
                          className="form-control"
                          placeholder="Product Name"
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
                          PRODUCT CONTAINS
                        </label>

                        <select
                          className="custom-select"
                          name="productContains"
                          value={this.state.productContains}
                          onChange={this.handleChangeBooking}
                          required
                        >
                          <option value="none">None</option>
                          <option value="battery">Battery</option>
                          <option value="magnet">Magnet</option>
                          <option value="liquid">Liquid</option>
                          <option value="powder">Powder</option>
                        </select>
                      </div>
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          BRAND/NON-BRAND
                        </label>

                        <select
                          className="custom-select"
                          name="productBrand"
                          value={this.state.productBrand}
                          onChange={this.handleChangeBooking}
                          required
                        >
                          <option value="Brand">Brand</option>
                          <option value="Non Brand">Non Brand</option>
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
                          Total CBM (in cm3)
                        </label>
                        <input
                          type="text"
                          name="totalCbm"
                          value={this.state.totalCbm}
                          onChange={this.handleChangeBooking}
                          className="form-control"
                          placeholder="Enter total CBM (height x width x length) in cm"
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
                          SHIP TO
                        </label>
                        <input
                          type="date"
                          name="shipTo"
                          value={this.state.shipTo}
                          onChange={(e) => {
                            this.handleChangeBooking2(e);
                          }}
                          className="form-control"
                          required
                          min={toDateInputValue(new Date())}
                        />
                      </div>
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          VALID TO
                        </label>

                        <input
                          type="text"
                          name="validTo"
                          value={this.state.validTo}
                          className="form-control"
                          placeholder="Shipping Deadline"
                          required
                          readOnly
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
                          ADDITIONAL INFORMATION
                        </label>

                        <textarea
                          style={{
                            borderRadius: 5,
                            height: 80,
                          }}
                          type="text"
                          name="productVariant"
                          value={this.state.productVariant}
                          onChange={this.handleChangeBooking}
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
                          TRACKING NUMBERS
                        </label>
                        {this.state.trackingNumbers.map((t, i) => (
                          <div
                            key={i}
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              marginBottom: 6,
                            }}
                          >
                            <input
                              type="text"
                              value={t}
                              onChange={(e) =>
                                this.handleTrackingChange(i, e.target.value)
                              }
                              className="form-control"
                              placeholder="Enter tracking number"
                            />
                            {this.state.trackingNumbers.length > 1 && (
                              <button
                                type="button"
                                className="btn"
                                style={{ color: "red" }}
                                onClick={() => this.removeTrackingField(i)}
                              >
                                &times;
                              </button>
                            )}
                            {i === this.state.trackingNumbers.length - 1 && (
                              <button
                                type="button"
                                className="btn"
                                style={{ color: "darkorange" }}
                                onClick={this.addTrackingField}
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        ))}
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
                    <div className="form-row mb-2">
                      <div className="col">
                        <label
                          style={{
                            color: "#555",
                            marginBottom: 0,
                            fontSize: 13,
                          }}
                        >
                          WAYBILL PICTURE
                        </label>
                        <div
                          className="box-input-file"
                          style={{
                            display: "flex",
                            justifyContent: "flex-start",
                          }}
                        >
                          {this.state.waybillImage_loader ? (
                            <CircleLoader
                              loading={this.state.waybillImage_loader}
                              color="darkorange"
                              size={35}
                            />
                          ) : (
                            <>
                              <img
                                className="img-100 lazyloaded blur-up"
                                src={this.state.waybillImage || man}
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
                                    .getElementById("upload-waybill-input")
                                    .click();
                                }}
                              />
                              <input
                                id="upload-waybill-input"
                                className="upload"
                                type="file"
                                style={{
                                  position: "absolute",
                                  zIndex: 5,
                                  maxWidth: "50px",
                                  marginTop: "20px",
                                }}
                                onChange={this._handleWaybillChange}
                              />
                            </>
                          )}
                        </div>
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
                          PACKING LIST (PDF/IMAGE/WORD, OPTIONAL)
                        </label>
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="file"
                            accept="image/*,application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                            onChange={this._handlePackingListChange}
                          />
                          {this.state.packingList_loader && (
                            <CircleLoader
                              loading={this.state.packingList_loader}
                              color="darkorange"
                              size={20}
                            />
                          )}
                          {this.state.packingListUrl && (
                            <a
                              href={this.state.packingListUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ marginLeft: 10 }}
                            >
                              View uploaded file
                            </a>
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
                >
                  Create Shipment Request
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
    allShipmentRequests: state.productRequests.shipmentRequests,
    warehouses: state.warehouses.warehouses,
    d2dRates: state.d2dRates.d2dRates,
    allUsers: state.users.users,
  };
};

export default connect(mapStateToProps, {
  getAllShipmentRequestsRedux,
  getAllWarehousesRedux,
  getAllD2DRatesRedux,
  getAllUsersRedux,
  setShipForMeRedux,
})(New);
