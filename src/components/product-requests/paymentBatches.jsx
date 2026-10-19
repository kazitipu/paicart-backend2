import React, { Component, Fragment } from "react";
import { connect } from "react-redux";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Breadcrumb from "../common/breadcrumb";
import man from "../products/physical/plus image.jpeg";
import { Badge, Button, IconButton } from "../common/listUi.jsx";
import {
  RmbBatchStats,
  RmbBatchFilters,
  CashOutModal,
} from "../common/rmbBatchUi.jsx";
import "../common/list-modern.css";
import { getDefaultDateRange } from "../../constants/dateRange";
import { parseRmb } from "../../constants/productRequestPayment";
import {
  getProductRequestPaymentsByDateRange,
  getSingleProductRequestPayment,
  payProductRequestPayment,
  removeRequestFromProductRequestPayment,
  deleteProductRequestPayment,
} from "../../firebase/firebase.utils";

/* Purchase batches for Product Requests — the twin of the 1688 payment-link
 * page, without the payment link. The RMB total comes from the purchasingRmb
 * typed on each request rather than from the 1688 API.
 *
 * Like that page, the batch list lives in component state: it is a
 * server-filtered, date-ranged query with exactly one consumer, so putting it
 * in redux would only add a second cache to go stale. */
export class ProductRequestPayments extends Component {
  constructor(props) {
    super(props);
    const range = getDefaultDateRange(30);
    this.state = {
      data: [],
      loading: true,
      searchFor: "",
      searchedPayment: null,
      rmbStatus: "",
      customStart: range.startDate,
      customEnd: range.endDate,
      paymentObj: null,
      removingId: null,
    };
  }

  componentDidMount() {
    this.load(this.state.customStart, this.state.customEnd, this.state.rmbStatus);
  }

  load = async (startDate, endDate, rmbStatus) => {
    this.setState({ loading: true });
    const data = await getProductRequestPaymentsByDateRange(
      startDate,
      endDate,
      rmbStatus,
    );
    this.setState({ data: data || [], loading: false });
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  applyRange = () => {
    /* Clear a pinned search result, otherwise applying a range appears to do
       nothing — the bug the 1688 page still has. */
    this.setState({ searchedPayment: null, searchFor: "" });
    this.load(this.state.customStart, this.state.customEnd, this.state.rmbStatus);
  };

  handleSearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const id = this.state.searchFor.trim();
    if (!id) {
      this.setState({ searchedPayment: null });
      return;
    }
    const payment = await getSingleProductRequestPayment(id);
    if (!payment) {
      toast.error("No payment batch found with that Payment Id");
      return;
    }
    this.setState({ searchedPayment: payment });
  };

  patchRow = (updated) =>
    this.setState((state) => ({
      data: state.data.map((row) =>
        row.paymentId === updated.paymentId ? { ...row, ...updated } : row,
      ),
      paymentObj:
        state.paymentObj && state.paymentObj.paymentId === updated.paymentId
          ? { ...state.paymentObj, ...updated }
          : state.paymentObj,
      searchedPayment:
        state.searchedPayment &&
        state.searchedPayment.paymentId === updated.paymentId
          ? { ...state.searchedPayment, ...updated }
          : state.searchedPayment,
    }));

  handleCashOut = async (rmbRate, totalRmb, imageUrl) => {
    const { currentAdmin } = this.props;
    const updated = await payProductRequestPayment(
      this.state.paymentObj,
      rmbRate,
      totalRmb,
      imageUrl,
      currentAdmin ? currentAdmin.name : "admin",
    );
    if (!updated) {
      toast.error("Could not record the payment");
      return;
    }
    this.patchRow(updated);
    toast.success("Payment recorded and expense booked");
  };

  handleRemoveRequest = async (request) => {
    this.setState({ removingId: request.bookingId });
    const result = await removeRequestFromProductRequestPayment(
      this.state.paymentObj,
      request,
    );
    this.setState({ removingId: null });
    if (!result.ok) {
      const messages = {
        "already-paid":
          "This batch is already paid — the expense is booked, so it cannot be changed.",
        "last-request":
          "This is the only request in the batch. Delete the whole batch instead.",
      };
      toast.error(messages[result.reason] || "Could not remove the request");
      return;
    }
    this.patchRow({
      paymentId: this.state.paymentObj.paymentId,
      requests: result.remainingRequests,
      requestIds: result.remainingRequests.map((r) => r.bookingId),
      totalRmb: result.totalRmb,
    });
    toast.success(`${request.bookingId} removed — it can be batched again`);
  };

  handleDeleteBatch = async (payment) => {
    const result = await deleteProductRequestPayment(payment);
    if (!result.ok) {
      toast.error(
        result.reason === "already-paid"
          ? "A paid batch cannot be deleted."
          : "Could not delete the batch",
      );
      return;
    }
    this.setState((state) => ({
      data: state.data.filter((row) => row.paymentId !== payment.paymentId),
    }));
    toast.success("Batch deleted — its requests are selectable again");
  };

  render() {
    const { searchedPayment, loading } = this.state;
    const rows = (searchedPayment ? [searchedPayment] : this.state.data)
      .slice()
      .sort((a, b) => parseInt(b.paymentId) - parseInt(a.paymentId));

    let totalRmb = 0;
    let totalRmbPaid = 0;
    rows.forEach((payment) => {
      totalRmb += parseFloat(payment.totalRmb) || 0;
      totalRmbPaid += parseFloat(payment.totalRmbPaid) || 0;
    });

    const activeBatch = this.state.paymentObj;

    return (
      <Fragment>
        <Breadcrumb title="Payment Batches" parent="Product Request" />
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
                  <div>
                    <h5
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#0f172a",
                        fontSize: 20,
                      }}
                    >
                      Product Request Payments
                    </h5>
                    <p
                      style={{
                        margin: "4px 0 0",
                        fontSize: 13,
                        color: "#94a3b8",
                      }}
                    >
                      {rows.length} {rows.length === 1 ? "batch" : "batches"}
                      {searchedPayment ? " (searched)" : " in this range"}
                    </p>
                  </div>

                  <RmbBatchFilters
                    searchValue={this.state.searchFor}
                    searchPlaceholder="Search by Payment ID"
                    onChange={this.handleChange}
                    onSearchSubmit={this.handleSearch}
                    filters={[
                      {
                        name: "rmbStatus",
                        value: this.state.rmbStatus,
                        options: [
                          { value: "", label: "All RMB Status" },
                          { value: "Paid", label: "RMB Paid" },
                          { value: "Not Paid", label: "RMB Not Paid" },
                        ],
                      },
                    ]}
                    startDate={this.state.customStart}
                    endDate={this.state.customEnd}
                    onApply={this.applyRange}
                  />

                  <RmbBatchStats
                    totalRmb={totalRmb}
                    totalRmbPaid={totalRmbPaid}
                    count={rows.length}
                    countLabel="Batches"
                  />
                </div>

                <div
                  className="card-body"
                  style={{ paddingTop: 0, borderTop: "1px solid #eef2f7" }}
                >
                  <div
                    id="basicScenario"
                    className="product-physical list-modern paylink-modern"
                  >
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Payment ID</th>
                          <th>Total Amount</th>
                          <th>RMB Paid</th>
                          <th>Requests</th>
                          <th>Payment Receipt</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((payment) => (
                          <tr key={payment.paymentId}>
                            <td style={{ fontWeight: "bold" }}>{payment.date}</td>
                            <td>{payment.paymentId}</td>
                            <td>
                              <div style={{ fontWeight: "bold" }}>
                                BDT:{" "}
                                {payment.totalRmbPaid && payment.rmbRate
                                  ? `Tk ${parseInt(
                                      payment.totalRmbPaid * payment.rmbRate,
                                    ).toLocaleString()}`
                                  : "—"}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                Rmb: ¥{parseFloat(payment.totalRmb || 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                Rmb(paid): ¥
                                {parseFloat(payment.totalRmbPaid || 0).toFixed(2)}
                              </div>
                              <div style={{ fontSize: 12, color: "#64748b" }}>
                                Rmb Rate: {payment.rmbRate || "—"}
                              </div>
                            </td>
                            <td>
                              <Badge
                                tone={
                                  payment.rmbStatus === "Paid" ? "green" : "red"
                                }
                              >
                                {payment.rmbStatus}
                              </Badge>
                            </td>
                            <td>
                              <Button
                                variant="subtle"
                                data-toggle="modal"
                                data-target="#requestBatchData"
                                onClick={() =>
                                  this.setState({ paymentObj: payment })
                                }
                              >
                                {(payment.requests || []).length} Request
                                {(payment.requests || []).length === 1 ? "" : "s"}
                              </Button>
                            </td>
                            <td>
                              {payment.receipt ? (
                                <a
                                  href={payment.receipt}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <img
                                    src={payment.receipt}
                                    alt="receipt"
                                    style={{ height: 70, width: 110, objectFit: "cover" }}
                                  />
                                </a>
                              ) : (
                                <img
                                  src={man}
                                  alt=""
                                  style={{ height: 70, width: 110, objectFit: "cover" }}
                                />
                              )}
                            </td>
                            <td>
                              {payment.rmbStatus !== "Paid" && (
                                <div style={{ display: "flex", gap: 4 }}>
                                  <IconButton
                                    tone="green"
                                    title="Record payment"
                                    data-toggle="modal"
                                    data-target="#prCashOutModal"
                                    onClick={() =>
                                      this.setState({ paymentObj: payment })
                                    }
                                  >
                                    <i
                                      className="fa fa-money"
                                      style={{ fontSize: 13 }}
                                    ></i>
                                  </IconButton>
                                  <IconButton
                                    tone="red"
                                    title="Delete batch"
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Delete batch #${payment.paymentId}? Its ${
                                            (payment.requests || []).length
                                          } request(s) become selectable again.`,
                                        )
                                      ) {
                                        this.handleDeleteBatch(payment);
                                      }
                                    }}
                                  >
                                    <i
                                      className="fa fa-trash"
                                      style={{ fontSize: 13 }}
                                    ></i>
                                  </IconButton>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {!loading && rows.length === 0 && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "48px 16px",
                          color: "#94a3b8",
                          fontSize: 14,
                        }}
                      >
                        No payment batches in the selected date range.
                      </div>
                    )}
                    {loading && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "48px 16px",
                          color: "#94a3b8",
                          fontSize: 14,
                        }}
                      >
                        Loading…
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Members of one batch, with removal while it is still unpaid. */}
        <div
          className="modal fade"
          id="requestBatchData"
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
                    Batch #{activeBatch && activeBatch.paymentId}
                  </h5>
                  <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.75 }}>
                    ¥{" "}
                    {parseFloat(
                      (activeBatch && activeBatch.totalRmb) || 0,
                    ).toFixed(2)}{" "}
                    · {activeBatch && activeBatch.rmbStatus}
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
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Booking Id</th>
                      <th>Customer</th>
                      <th>Purchasing RMB</th>
                      {activeBatch && activeBatch.rmbStatus !== "Paid" && (
                        <th>Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeBatch &&
                      (activeBatch.requests || []).map((request) => (
                        <tr key={request.bookingId}>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "center",
                              }}
                            >
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
                              <div>
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
                            ¥ {parseRmb(request.batchedRmb)}
                          </td>
                          {activeBatch.rmbStatus !== "Paid" && (
                            <td>
                              <Button
                                variant="danger"
                                disabled={
                                  this.state.removingId === request.bookingId
                                }
                                onClick={() => this.handleRemoveRequest(request)}
                              >
                                {this.state.removingId === request.bookingId
                                  ? "Removing…"
                                  : "Remove"}
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                  </tbody>
                </table>
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

        <CashOutModal
          modalId="prCashOutModal"
          paymentObj={activeBatch}
          placeholderImage={man}
          onSubmit={this.handleCashOut}
        />

        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => ({
  currentAdmin: state.admins.currentAdmin,
});

export default connect(mapStateToProps)(ProductRequestPayments);
