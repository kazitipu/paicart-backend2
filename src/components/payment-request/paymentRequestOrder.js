import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import Datatable from "./paymentRequestOrderDatatable";
import {
  getAllPaymentRequestOrderRedux,
  getApprovedPaymentRequestOrdersRedux,
} from "../../actions/index";
import MakePaymentOrderModal from "./makePaymentOrderModal";
import { connect } from "react-redux";
import { Search } from "react-feather";
import { matchesPaymentSearch } from "../../constants/paymentSearch";
import { SegmentTabs, StatTile, StatRow } from "../common/listUi.jsx";
import "../common/list-modern.css";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class PaymentRequestOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchFor: "",
      approvedSearchOrderId: "",
      open: false,
      toggleModal: true,
      payableOrders: [],
      paymentRequest: null,
      activeTab: "pending",
    };
  }

  componentDidMount = async () => {
    this.props.getAllPaymentRequestOrderRedux();
    this.props.getApprovedPaymentRequestOrdersRedux();
  };

  startToggleModal = async (paymentRequest, payableOrders) => {
    console.log(payableOrders);
    console.log(payableOrders.length);
    if (payableOrders.length == 0) {
      this.setState({
        toggleModal: true,
        payableOrders: [],
        paymentRequest: null,
      });
    } else {
      this.setState({
        toggleModal: false,
        payableOrders: payableOrders,
        paymentRequest,
      });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  /* Pending tab: Order / Booking / Payment ID, name, method, status, date */
  getPaymentRequestArray = () =>
    (this.props.allPaymentRequests || []).filter((paymentRequest) =>
      matchesPaymentSearch(paymentRequest, this.state.searchFor)
    );

  getApprovedPaymentRequestArray = () => {
    const all = this.props.allApprovedPaymentRequests || [];
    const searchId = this.state.approvedSearchOrderId.trim().toLowerCase();

    if (searchId) {
      // The search looks across all approved history, not just the last 30 days.
      return all.filter((paymentRequest) =>
        matchesPaymentSearch(paymentRequest, searchId)
      );
    }

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    return all.filter((paymentRequest) => (paymentRequest.time || 0) >= cutoff);
  };

  render() {
    const pendingRows = this.getPaymentRequestArray() || [];
    const approvedRows = this.getApprovedPaymentRequestArray() || [];
    const isApproved = this.state.activeTab === "approved";
    const rows = isApproved ? approvedRows : pendingRows;

    const sum = (list, pick) =>
      list.reduce((total, r) => total + (parseFloat(pick(r)) || 0), 0);
    const requestedTotal = sum(pendingRows, (r) => r.payableTotal);
    const approvedTotal = sum(approvedRows, (r) => r.payableTotal);
    const awaitingCount = pendingRows.filter(
      (r) => r.status === "pending"
    ).length;

    return (
      <Fragment>
        <MakePaymentOrderModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          payableOrders={this.state.payableOrders}
          paymentRequestObj={this.state.paymentRequest}
        />
        <Breadcrumb title="Order Payment Request" parent="Payment" />
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
                        Order Payment Requests
                      </h5>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          color: "#94a3b8",
                        }}
                      >
                        {rows.length}{" "}
                        {rows.length === 1 ? "request" : "requests"}
                        {isApproved ? " approved" : " pending review"}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: 18 }}>
                    <SegmentTabs
                      value={this.state.activeTab}
                      onChange={(tab) => this.setState({ activeTab: tab })}
                      items={[
                        {
                          key: "pending",
                          label: "Pending",
                          count: pendingRows.length,
                        },
                        {
                          key: "approved",
                          label: "Approved",
                          count: approvedRows.length,
                        },
                      ]}
                    />
                  </div>

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
                        flex: "1 1 300px",
                        maxWidth: 440,
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 10,
                        padding: "0 12px",
                      }}
                    >
                      <Search size={16} color="#94a3b8" />
                      {/* Each tab searches a different field set, so the box
                          is bound to whichever tab is showing. */}
                      <input
                        name={isApproved ? "approvedSearchOrderId" : "searchFor"}
                        value={
                          isApproved
                            ? this.state.approvedSearchOrderId
                            : this.state.searchFor
                        }
                        type="search"
                        placeholder={
                          isApproved
                            ? "Search by Order ID, Booking ID, Payment ID or name"
                            : "Search by Order ID, Booking ID, Payment ID, name, method or date"
                        }
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
                    </div>
                  </div>

                  <StatRow>
                    <StatTile
                      tone="orange"
                      label="Awaiting review"
                      value={awaitingCount}
                    />
                    <StatTile
                      tone="gray"
                      label="Amount requested"
                      value={`৳${Math.round(requestedTotal).toLocaleString()}`}
                      hint="across pending requests"
                    />
                    <StatTile
                      tone="green"
                      label="Approved requests"
                      value={approvedRows.length}
                    />
                    <StatTile
                      tone="teal"
                      label="Approved amount"
                      value={`৳${Math.round(approvedTotal).toLocaleString()}`}
                      hint="last 30 days"
                    />
                  </StatRow>
                </div>

                <div
                  className="card-body"
                  style={{ paddingTop: 0, borderTop: "1px solid #eef2f7" }}
                >
                  {isApproved && !this.state.approvedSearchOrderId.trim() && (
                    <p
                      style={{
                        color: "#94a3b8",
                        fontSize: 12.5,
                        margin: "14px 0 4px",
                      }}
                    >
                      Showing approved requests from the last 30 days. Search by
                       Order or Booking Id to look up any approved request,
                      regardless of date.
                    </p>
                  )}
                  <div
                    id="basicScenario"
                    className="product-physical list-modern"
                  >
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={rows}
                      pageSize={100}
                      pagination={true}
                      class="-striped -highlight"
                    />
                    {rows.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "48px 16px",
                          color: "#94a3b8",
                          fontSize: 14,
                        }}
                      >
                        No {isApproved ? "approved" : "pending"} payment
                        requests to show.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allPaymentRequests: state.payments.paymentRequestOrderArray,
    allApprovedPaymentRequests: state.payments.approvedPaymentRequestOrderArray,
    allUser: state.users.users,
  };
};

export default connect(mapStateToProps, {
  getAllPaymentRequestOrderRedux,
  getApprovedPaymentRequestOrdersRedux,
})(PaymentRequestOrder);
