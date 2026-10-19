import React, { Component } from "react";
import { Search } from "react-feather";
import { HashLoader } from "react-spinners";
import { StatTile, StatRow, Button } from "./listUi.jsx";
import { uploadImageRechargeRequest } from "../../firebase/firebase.utils";

/* Pieces shared by the RMB purchase-batch screens (1688 payment links and
 * product-request payment batches). Everything here is freight-agnostic: the
 * 1688-specific parts (payment link column, regenerate, link-failure handling)
 * stay on their own page. */

/* ---------------------------------------------------------------- stats -- */

export const RmbBatchStats = ({
  totalRmb,
  totalRmbPaid,
  count,
  countLabel = "Payments",
}) => {
  const outstanding = Math.max(totalRmb - totalRmbPaid, 0);
  return (
    <StatRow>
      <StatTile
        tone="teal"
        label="Total RMB"
        value={`¥ ${parseFloat(totalRmb || 0).toFixed(2)}`}
        hint="linked requests"
      />
      <StatTile
        tone="green"
        label="RMB Paid"
        value={`¥ ${parseFloat(totalRmbPaid || 0).toFixed(2)}`}
      />
      <StatTile
        tone={outstanding > 0 ? "orange" : "green"}
        label="RMB Outstanding"
        value={`¥ ${parseFloat(outstanding).toFixed(2)}`}
      />
      <StatTile tone="gray" label={countLabel} value={count} />
    </StatRow>
  );
};

/* --------------------------------------------------------------- filters -- */

const controlStyle = {
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 13,
  color: "#0f172a",
  outline: "none",
};

/* `filters` is an array so the 1688 page can pass two selects (link + rmb
   status) while the product-request page passes only one. */
export const RmbBatchFilters = ({
  searchValue,
  searchName = "searchFor",
  searchPlaceholder = "Search by Payment ID",
  onChange,
  onSearchSubmit,
  filters = [],
  startDate,
  endDate,
  startName = "customStart",
  endName = "customEnd",
  dateLabel = "Created",
  onApply,
}) => (
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
        flex: "1 1 280px",
        maxWidth: 420,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 10,
        padding: "0 12px",
      }}
    >
      <Search size={16} color="#94a3b8" />
      <input
        name={searchName}
        value={searchValue}
        type="search"
        placeholder={searchPlaceholder}
        onChange={onChange}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onSearchSubmit) onSearchSubmit(e);
        }}
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

    {filters.map((filter) => (
      <select
        key={filter.name}
        name={filter.name}
        value={filter.value}
        onChange={onChange}
        style={controlStyle}
      >
        {filter.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ))}

    {/* This range queries Firestore, so it needs an explicit Apply. */}
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
      <span style={{ fontSize: 12, color: "#94a3b8" }}>{dateLabel}</span>
      <input
        type="date"
        name={startName}
        value={startDate}
        onChange={onChange}
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
        name={endName}
        value={endDate}
        min={startDate}
        onChange={onChange}
        style={{
          border: "none",
          background: "transparent",
          outline: "none",
          fontSize: 12.5,
          color: "#0f172a",
          padding: "6px 0",
        }}
      />
      <Button variant="dark" onClick={onApply} style={{ padding: "6px 14px" }}>
        Apply
      </Button>
    </div>
  </div>
);

/* -------------------------------------------------------------- cash out -- */

/* Owns its own upload/rate state rather than pushing four more keys into the
 * host page's state. `onSubmit(rmbRate, totalRmb, imageUrl)` does the write. */
export class CashOutModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rmbRate: "",
      totalRmb: "",
      imageUrl: props.placeholderImage,
      loading: false,
      submitting: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    const current = this.props.paymentObj;
    const next = nextProps.paymentObj;
    const changed = (current && current.paymentId) !== (next && next.paymentId);
    if (changed) {
      this.setState({
        rmbRate: (next && next.rmbRate) || "",
        totalRmb: (next && (next.totalRmbPaid || next.totalRmb)) || "",
        imageUrl: (next && next.receipt) || nextProps.placeholderImage,
        loading: false,
        submitting: false,
      });
    }
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleImageChange = async (e) => {
    e.preventDefault();
    const file = e.target.files[0];
    if (!file) return;
    this.setState({ loading: true });
    const imgUrl = await uploadImageRechargeRequest(file);
    this.setState({ imageUrl: imgUrl || this.props.placeholderImage, loading: false });
  };

  handleSubmit = async () => {
    const { rmbRate, totalRmb, imageUrl, loading } = this.state;
    if (loading) {
      alert("Wait for the receipt to finish uploading.");
      return;
    }
    /* Compared against the imported placeholder module, not a hardcoded
       /static/media/... path - that string carries a content hash that
       changes on every rebuild. */
    if (!imageUrl || imageUrl === this.props.placeholderImage) {
      alert("Please upload the payment receipt.");
      return;
    }
    if (!rmbRate || !totalRmb) {
      alert("Enter both the total RMB and the RMB rate.");
      return;
    }
    this.setState({ submitting: true });
    await this.props.onSubmit(rmbRate, totalRmb, imageUrl);
    this.setState({ submitting: false });
  };

  render() {
    const { modalId, paymentObj } = this.props;
    const { rmbRate, totalRmb, imageUrl, loading, submitting } = this.state;
    const inputId = `${modalId}-receipt-input`;

    return (
      <div
        className="modal fade"
        id={modalId}
        tabIndex="-1"
        role="dialog"
        aria-hidden="true"
      >
        <div className="modal-dialog" role="document" style={{ margin: "auto" }}>
          <div className="modal-content">
            <div
              className="modal-header"
              style={{ background: "rgb(0, 37, 76)", color: "#fff" }}
            >
              <div>
                <h5 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#fff" }}>
                  Cash Out
                </h5>
                <p style={{ margin: "3px 0 0", fontSize: 12, opacity: 0.75 }}>
                  Payment Id: {paymentObj && paymentObj.paymentId}
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
              <p style={{ fontSize: 12.5, color: "#64748b", marginBottom: 16 }}>
                This amount is deducted from the daily cash balance and recorded
                as an expense.
              </p>

              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <label>Total RMB (in receipt)</label>
                  <input
                    type="number"
                    name="totalRmb"
                    className="form-control"
                    value={totalRmb}
                    onChange={this.handleChange}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label>RMB Rate</label>
                  <input
                    type="number"
                    name="rmbRate"
                    className="form-control"
                    value={rmbRate}
                    onChange={this.handleChange}
                  />
                </div>
              </div>

              <label>Payment Receipt</label>
              <div style={{ marginBottom: 12 }}>
                <input
                  id={inputId}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={this.handleImageChange}
                />
                {loading ? (
                  <div style={{ padding: 24 }}>
                    <HashLoader loading size={26} color="#FF6A00" />
                  </div>
                ) : (
                  <img
                    src={imageUrl}
                    alt="receipt"
                    onClick={() => document.getElementById(inputId).click()}
                    style={{
                      height: 120,
                      width: 120,
                      objectFit: "cover",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      cursor: "pointer",
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  borderRadius: 10,
                  padding: "10px 12px",
                  fontSize: 13,
                  color: "#334155",
                }}
              >
                Total BDT:{" "}
                <b>
                  ৳
                  {parseInt(
                    (parseFloat(rmbRate) || 0) * (parseFloat(totalRmb) || 0),
                  ).toLocaleString()}
                </b>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-dismiss="modal">
                Close
              </button>
              <Button
                variant="primary"
                data-dismiss="modal"
                disabled={submitting}
                onClick={this.handleSubmit}
              >
                {submitting ? "Saving…" : "Cash Out"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
