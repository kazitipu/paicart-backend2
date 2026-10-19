import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./afterSaleDatatable";
import {
  getAllAfterSaleRedux,
  getApprovedAfterSaleRedux,
} from "../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { Search } from "react-feather";
import MakeRefundAfterSaleModal from "./makeRefundAfterSaleModal";
import DirectRefundPanel from "./directRefundPanel.jsx";
import { SegmentTabs, StatTile, StatRow } from "../common/listUi.jsx";
import "../common/list-modern.css";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class RefundRequestOrder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchFor: "",
      approvedSearchOrderId: "",
      open: false,
      toggleModal: true,
      payableOrders: [],
      refundRequest: null,
      activeTab: "pending",
    };
  }

  componentDidMount = async () => {
    this.props.getAllAfterSaleRedux();
    this.props.getApprovedAfterSaleRedux();
  };

  /* A direct refund is filed already approved, so only the approved tab can
     have changed - but both are cheap and this keeps the counts honest. */
  refresh = () => {
    this.props.getAllAfterSaleRedux();
    this.props.getApprovedAfterSaleRedux();
    this.setState({ activeTab: "approved" });
  };

  startToggleModal = async (refundRequest) => {
    if (refundRequest) {
      this.setState({
        toggleModal: false,
        refundRequest,
      });
    } else {
      this.setState({
        toggleModal: true,
        refundRequest: null,
      });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  getRefundRequestArray = () => {
    console.log(this.props.allRefundRequests);
    if (!this.state.searchFor) {
      return this.props.allRefundRequests;
    }

    let filterByStatus = this.props.allRefundRequests.filter((refundRequest) =>
      refundRequest.status
        .toLowerCase()
        .includes(this.state.searchFor.toLowerCase())
    );
    let filterByMethod = this.props.allRefundRequests.filter((refundRequest) =>
      refundRequest.method
        .toLowerCase()
        .includes(this.state.searchFor.toLowerCase())
    );

    return [...filterByStatus, ...filterByMethod];
  };

  getApprovedRefundRequestArray = () => {
    const all = this.props.allApprovedRefundRequests || [];
    const searchId = this.state.approvedSearchOrderId.trim().toLowerCase();

    if (searchId) {
      // Search looks across all approved history, not just the last 30 days.
      return all.filter((refundRequest) => {
        const orderId = refundRequest.order?.orderId || refundRequest.order?.bookingId || "";
        return (
          String(refundRequest.refundId || "").toLowerCase().includes(searchId) ||
          String(orderId).toLowerCase().includes(searchId)
        );
      });
    }

    const cutoff = Date.now() - THIRTY_DAYS_MS;
    return all.filter((refundRequest) => (refundRequest.time || 0) >= cutoff);
  };

  render() {
    const pendingRows = this.getRefundRequestArray() || [];
    const approvedRows = this.getApprovedRefundRequestArray() || [];
    const isApproved = this.state.activeTab === "approved";
    const rows = isApproved ? approvedRows : pendingRows;

    /* Refund figures for the tab on screen. `refundAmount` is only written
       when a refund is approved, so the pending tab totals the order values
       that are at stake instead. */
    const sum = (list, pick) =>
      list.reduce((total, r) => total + (parseFloat(pick(r)) || 0), 0);
    const atStake = sum(pendingRows, (r) => r.order && r.order.orderTotal);
    const refunded = sum(approvedRows, (r) => r.refundAmount);
    const awaitingCount = pendingRows.filter(
      (r) => r.status === "pending"
    ).length;

    return (
      <Fragment>
        <MakeRefundAfterSaleModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          payableOrders={this.state.payableOrders}
          refundRequestObj={this.state.refundRequest}
        />
        <Breadcrumb title="Refund Request" parent="After Sale Service" />
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <DirectRefundPanel quickRefund={false} onRefunded={this.refresh} />

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
                        Refund Requests
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
                        name={
                          isApproved ? "approvedSearchOrderId" : "searchFor"
                        }
                        value={
                          isApproved
                            ? this.state.approvedSearchOrderId
                            : this.state.searchFor
                        }
                        type="search"
                        placeholder={
                          isApproved
                            ? "Search approved refunds by Refund or Order Id"
                            : "Search pending refunds by status or method"
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
                      label="Order value at stake"
                      value={`৳${Math.round(atStake).toLocaleString()}`}
                      hint="across pending requests"
                    />
                    <StatTile
                      tone="green"
                      label="Approved refunds"
                      value={approvedRows.length}
                    />
                    <StatTile
                      tone="teal"
                      label="Refunded"
                      value={`৳${Math.round(refunded).toLocaleString()}`}
                      hint="approved amount"
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
                      Showing approved refunds from the last 30 days. Search by
                      Refund or Order Id to look up any approved refund,
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
                        No {isApproved ? "approved" : "pending"} refund
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
    allRefundRequests: state.payments.afterSale,
    allApprovedRefundRequests: state.payments.approvedAfterSale,
    allUser: state.users.users,
  };
};

export default connect(mapStateToProps, {
  getAllAfterSaleRedux,
  getApprovedAfterSaleRedux,
})(RefundRequestOrder);
