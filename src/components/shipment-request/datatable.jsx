import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { Truck } from "react-feather";
import EmptyState from "../common/empty-state.jsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { connect } from "react-redux";
import man from "../products/physical/plus image.jpeg";
import { getShipmentMode } from "../../constants/shipment";
import {
  Badge,
  ModeBadge,
  Button,
  IconButton,
  StatTile,
  StatRow,
} from "../common/listUi.jsx";
import "../common/list-modern.css";
import {
  getDisplayPaymentState,
  getShipmentPayable,
  PAYMENT_STATE_COLORS,
} from "../../constants/paymentMath";
import {
  getOrderTrackingResultRedux,
  updateShipmentRequestRedux,
  deleteShipmentRequestRedux,
} from "../../actions/index";
import "./updateRequestModal.css";
import { Link } from "react-router-dom";
import { statusDisplay } from "../../constants/statusDisplay";
import { joinList, withUnit } from "../../constants/displayList";

/* The booking's product name — the customer app writes othersProductName */
const productNameOf = (request) =>
  (request &&
    (request.othersProductName || request.productName || request.productType)) ||
  "—";
const PAYMENT_STATE_TONES = {
  Paid: "green",
  "Partially Paid": "orange",
  "Not Paid": "red",
  purchaseLater: "gray",
  pending: "orange",
};

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
      productObj: null,
      requestObj: null,
      method: "",
      amount: "",
      paymentStatus: "",
      days: -1,
      minutes: 0,
      seconds: 0,
      hours: 0,
    };
  }
  componentDidMount = () => {
    this.timerID = setInterval(() => this.tick(), 1000);
  };

  componentWillReceiveProps = (nextProps) => {
    const { orderTracking } = nextProps;
  };

  componentWillUnmount = () => {
    clearInterval(this.timerID);
  };

  tick = () => {
    const { productObj } = this.state;
    if (productObj && productObj.validTo) {
      const [day, month, year] = productObj.validTo.split("-");
      let dateFuture = new Date(
        parseInt(year),
        parseInt(month - 1),
        parseInt(day)
      );
      let dateNow = new Date();
      var seconds = Math.floor((dateFuture - dateNow) / 1000);
      var minutes = Math.floor(seconds / 60);
      var hours = Math.floor(minutes / 60);
      var days = Math.floor(hours / 24);

      hours = hours - days * 24;
      minutes = minutes - days * 24 * 60 - hours * 60;
      seconds = seconds - days * 24 * 60 * 60 - hours * 60 * 60 - minutes * 60;

      this.setState({
        days: days + 1,
        hours,
        minutes,
        seconds,
      });
    }
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

  handleSubmit = async (event) => {
    event.preventDefault();
    const { productObj } = this.state;
    console.log(this.state);
    let date = new Date();
    await this.props.updateShipmentRequestRedux({
      ...this.state.productObj,
      paymentStatus:
        this.state.paymentStatus !== "" ? this.state.paymentStatus : "Not Paid",
      payments:
        this.state.productObj.payments &&
        this.state.productObj.payments.length > 0
          ? [
              ...this.state.productObj.payments,
              {
                amount: this.state.amount,
                method: this.state.method,
                paidBy: this.props.currentAdmin.name,
                approvedBy: this.props.currentAdmin.name,
                date: new Date().toLocaleDateString("en-GB"),
              },
            ]
          : [
              {
                amount: this.state.amount,
                method: this.state.method,
                paidBy: this.props.currentAdmin.name,
                approvedBy: this.props.currentAdmin.name,
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
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
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
  render() {
    const { pageSize, myClass, multiSelectOption, pagination, orderTracking } =
      this.props;
    const { productObj } = this.state;

    const { myData } = this.props;

    const newData = [];
    if (myData.length > 0) {
      myData.forEach((request) => {
        //  this is not affecting my output see line 104
        newData.push({
          Date: request ? request.date : "",
          "Booking Id": request ? request.bookingId : "",
          /* Bookings from the customer app keep the name in
             othersProductName and the photo in imageUrl; productType is an
             old field that is now saved empty. */
          Product: request ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
              <img
                src={request.imageUrl || man}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  objectFit: "cover",
                  borderRadius: 6,
                  border: "1px solid gainsboro",
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 600 }}>{productNameOf(request)}</span>
            </div>
          ) : (
            ""
          ),
          Cargo: request ? request.cargoCompany : "",
          Weight:
            request && request.receivedWeight
              ? request.receivedWeight
              : request.weight
              ? request.weight
              : "",
          "Per Kg": request ? request.result && request.result.perKg : "",
          Total: request
            ? request.result &&
              `${request.result.result ? `${request.result.result}Tk` : ""}`
            : "",
          "Tracking No": request ? request.trackingNo : "",
        });
      });
    }
    /* Headers must not depend on there being data: newData[0] is undefined
       whenever a filter empties the table, which collapsed the header row. */
    const BASE_COLUMN_KEYS = ["Date", "Booking Id", "Product", "Cargo", "Weight", "Per Kg", "Total", "Tracking No"];
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

    if (multiSelectOption == true) {
      columns.push({
        Header: (
          <button
            className="btn btn-danger btn-sm btn-delete mb-0 b-r-4"
            onClick={(e) => {
              if (window.confirm("Are you sure you wish to delete this item?"))
                this.handleRemoveRow();
            }}
          >
            Delete
          </button>
        ),
        id: "delete",
        accessor: (str) => "delete",
        sortable: false,
        style: {
          textAlign: "center",
        },
        Cell: (row) => (
          <div>
            <span>
              <input
                type="checkbox"
                name={row.original.id}
                defaultChecked={this.state.checkedValues.includes(
                  row.original.id
                )}
                onChange={(e) => this.selectRow(e, row.original.id)}
              />
            </span>
          </div>
        ),
        accessor: key,
        style: {
          textAlign: "center",
        },
      });
    } else {
      columns.push(
        {
          Header: <b>Method</b>,
          id: "orderDetails",
          accessor: (str) => "orderDetails",
          Cell: (row) => {
            const requestObj = myData.find(
              (request) => request.bookingId == row.original["Booking Id"]
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
              (request) => request.bookingId == row.original["Booking Id"]
            );
            return (
              <span
                data-toggle="modal"
                data-target="#paymentModal"
                onClick={() => {
                  this.setState({
                    productObj: requestObj,
                  });
                }}
                style={{ cursor: "pointer" }}
              >
                <Badge
                  tone={PAYMENT_STATE_TONES[
                    getDisplayPaymentState(requestObj, getShipmentPayable)
                  ] || "gray"}
                >
                  {getDisplayPaymentState(requestObj, getShipmentPayable)}
                </Badge>
              </span>
            );
          },
          style: {
            textAlign: "center",
          },
          sortable: false,
        },
        {
          Header: <b>Start Shipping</b>,
          id: "orderDetails",
          accessor: (str) => "orderDetails",
          Cell: (row) => {
            const requestObj = myData.find(
              (request) => request.bookingId == row.original["Booking Id"]
            );
            return (
              <Badge tone={requestObj && requestObj.shipping ? "green" : "red"}>
                {requestObj && requestObj.shipping
                  ? "Permitted"
                  : "Not Permitted"}
              </Badge>
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
              (request) => request.bookingId == row.original["Booking Id"]
            );
            return (
              <Button
                variant="subtle"
                data-toggle="modal"
                data-target="#detailInfoModal"
                onClick={async () => {
                  this.setState({
                    productObj: requestObj,
                  });
                  let orderTracking2 =
                    await this.props.getOrderTrackingResultRedux(
                      requestObj.trackingNo
                    );
                  console.log(orderTracking2);
                  if (orderTracking2) {
                    this.props.updateShipmentRequestRedux({
                      ...requestObj,
                      shippingMark: orderTracking2.parcelsArray.map(
                        (parcel) => `${parcel.shippingMark}`
                      ),
                      cargoCompany: "ALG Limited",
                      lotNo: orderTracking2.lotArray.map((lot) => `${lot}`),
                      ctnNo: orderTracking2.parcelsArray.map(
                        (parcel) => `${parcel.parcelId}`
                      ),

                      cargoRate: orderTracking2.parcelsArray.map(
                        (parcel) => `${parcel.ratePerKg} tk/kg`
                      ),

                      shippingChargeCargo: orderTracking2.parcelsArray.map(
                        (parcel) => `${parcel.finalTotal} Tk`
                      ),
                    });
                  }
                }}
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
                    onClick={() =>
                      this.props.history.push(
                        `${process.env.PUBLIC_URL}/users/list-user/${requestObj.userId}`
                      )
                    }
                  >
                    {requestObj && requestObj.displayName}
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
          Header: <b>Update</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => {
            return (
              <div>
                <IconButton
                  tone="green"
                  title="Edit request"
                  onClick={() => {
                    const requestObj = myData.find(
                      (request) =>
                        request.bookingId == row.original["Booking Id"]
                    );
                    this.props.startToggleModal(requestObj);
                  }}
                >
                  <i className="fa fa-pencil" style={{ fontSize: 14 }}></i>
                </IconButton>
                {(this.props.bookingStatus == "new" ||
                  this.props.bookingStatus == "rejected") && (
                  <IconButton
                    tone="red"
                    title="Delete request"
                    data-toggle="modal"
                    data-target="#deleteModal"
                    onClick={() => {
                      const requestObj = myData.find(
                        (request) =>
                          request.bookingId == row.original["Booking Id"]
                      );
                      this.setState({
                        productObj: requestObj,
                      });
                    }}
                  >
                    <i className="fa fa-trash" style={{ fontSize: 14 }}></i>
                  </IconButton>
                )}
              </div>
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
            const booking = myData.find(
              (request) => request.bookingId == row.original["Booking Id"]
            );
            return (
              <Link
                to={`${process.env.PUBLIC_URL}/pages/dashboard/ship-for/invoice/${booking.bookingId}`}
                target="_blank"
              >
                <Badge tone="orange">Invoice</Badge>
              </Link>
            );
          },
          style: {
            textAlign: "center",
          },
          sortable: false,
        }
      );
    }

    return (
      <Fragment>
        {newData.length === 0 ? (
          <EmptyState
            icon={Truck}
            accent="#3b82f6"
            title={
              this.props.isFiltered
                ? "No shipment requests match these filters"
                : `No shipment requests in \u201c${this.props.statusLabel || "this list"}\u201d`
            }
            message={
              this.props.isFiltered
                ? "Nothing here matches your search, payment filter or date range. Try widening the range or clearing the filters."
                : "Bookings appear here as customers ship parcels through this stage."
            }
            actionLabel={this.props.isFiltered ? "Clear filters" : undefined}
            onAction={
              this.props.isFiltered ? this.props.onClearFilters : undefined
            }
          />
        ) : (
          <ReactTable
            data={newData}
            columns={columns}
            defaultPageSize={pageSize}
            className={myClass}
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
                  Booking Id: {productObj && productObj.bookingId}
                  {productObj && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <ModeBadge mode={getShipmentMode(productObj)} />
                      <Badge
                        tone={
                          PAYMENT_STATE_TONES[
                            getDisplayPaymentState(
                              productObj,
                              getShipmentPayable
                            )
                          ] || "gray"
                        }
                      >
                        {getDisplayPaymentState(productObj, getShipmentPayable)}
                      </Badge>
                      <Badge
                        tone={productObj.status === "Reject" ? "red" : "violet"}
                      >
                        {statusDisplay(productObj.status) || "Pending"}
                      </Badge>
                      <Badge tone={productObj.shipping ? "green" : "gray"}>
                        {productObj.shipping
                          ? "Shipping permitted"
                          : "Shipping not permitted"}
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
              {productObj && productObj.status == "Rates Provided" && (
                <>
                  {productObj && productObj.validTo && this.state.days > -1 ? (
                    <div
                      style={{
                        color: "white",
                        position: "absolute",
                        right: 50,
                        top: "-3px",
                      }}
                    >
                      <span
                        style={{
                          background: "white",
                          padding: 5,
                          borderRadius: 10,
                          color: "black",
                          border: "2px solid #18768f",
                        }}
                      >
                        {this.state.days}days
                      </span>{" "}
                      :{" "}
                      <span
                        style={{
                          background: "white",
                          padding: 5,
                          borderRadius: 10,
                          color: "black",
                          border: "2px solid #18768f",
                        }}
                      >
                        {this.state.hours}hrs
                      </span>{" "}
                      :{" "}
                      <span
                        style={{
                          background: "white",
                          padding: 5,
                          borderRadius: 10,
                          color: "black",
                          border: "2px solid #18768f",
                        }}
                      >
                        {this.state.minutes}mins
                      </span>{" "}
                      :{" "}
                      <span
                        style={{
                          background: "white",
                          padding: 5,
                          borderRadius: 10,
                          color: "black",
                          border: "2px solid #18768f",
                        }}
                      >
                        {this.state.seconds}secs
                      </span>
                    </div>
                  ) : (
                    productObj &&
                    productObj.validTo && (
                      <div
                        style={{
                          color: "white",
                          position: "absolute",
                          right: 50,
                          top: "-3px",
                        }}
                      >
                        <span
                          style={{
                            background: "white",
                            padding: 5,
                            borderRadius: 10,
                            color: "red",
                            border: "2px solid #18768f",
                          }}
                        >
                          00days
                        </span>{" "}
                        :{" "}
                        <span
                          style={{
                            background: "white",
                            padding: 5,
                            borderRadius: 10,
                            color: "red",
                            border: "2px solid #18768f",
                          }}
                        >
                          00hrs
                        </span>{" "}
                        :{" "}
                        <span
                          style={{
                            background: "white",
                            padding: 5,
                            borderRadius: 10,
                            color: "red",
                            border: "2px solid #18768f",
                          }}
                        >
                          00mins
                        </span>{" "}
                        :{" "}
                        <span
                          style={{
                            background: "white",
                            padding: 5,
                            borderRadius: 10,
                            color: "red",
                            border: "2px solid #18768f",
                          }}
                        >
                          00secs
                        </span>
                      </div>
                    )
                  )}
                </>
              )}
              <div className="modal-body">
                {productObj &&
                  (() => {
                    // The figures an admin opens this dialog to check, read
                    // off before wading through the detail sections below.
                    const bill = getShipmentPayable(productObj);
                    const paid = this.getTotal(productObj.payments);
                    const due = Math.max(bill - paid, 0);
                    return (
                      <StatRow>
                        <StatTile
                          tone="blue"
                          label="Weight"
                          value={`${
                            productObj.receivedWeight ||
                            productObj.weight ||
                            0
                          } Kg`}
                          hint={
                            productObj.receivedWeight ? "received" : "booked"
                          }
                        />
                        <StatTile
                          tone="violet"
                          label="Boxes / CBM"
                          value={`${productObj.ctnQuantity || 0} / ${
                            productObj.totalCbm || 0
                          }`}
                        />
                        <StatTile
                          tone="gray"
                          label="Total Bill"
                          value={`৳${bill.toLocaleString()}`}
                        />
                        <StatTile
                          tone="green"
                          label="Paid"
                          value={`৳${paid.toLocaleString()}`}
                        />
                        <StatTile
                          tone={due > 0 ? "orange" : "green"}
                          label={due > 0 ? "Due" : "Settled"}
                          value={`৳${due.toLocaleString()}`}
                        />
                      </StatRow>
                    );
                  })()}
                <div style={{ fontWeight: "bold" }}>
                  {productObj && productObj.othersProductName}
                </div>
                {productObj && productObj.warehouse && (
                  <div style={{ fontSize: 11 }}>
                    Warehouse Address:{" "}
                    <span style={{ color: "gray", fontSize: 11 }}>
                      {productObj && productObj.warehouse}
                    </span>
                  </div>
                )}
                {productObj && productObj.productUrl && (
                  <div style={{ marginBottom: 8, fontSize: 11 }}>
                    Product Link:{" "}
                    <a href={productObj.productUrl} target="_blank" style={{}}>
                      {productObj && productObj.productUrl}
                    </a>
                  </div>
                )}
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr>
                      <td style={{ fontWeight: "bold" }}>Product Image</td>
                      <td style={{ fontWeight: "bold" }}>Product Category</td>
                      <td style={{ fontWeight: "bold" }}>Total Quantity</td>
                      <td style={{ fontWeight: "bold" }}>Total Weight</td>
                      <td style={{ fontWeight: "bold" }}>Total Price</td>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {productObj && (
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
                        )}
                      </td>
                      <td>{(productObj && productObj.productType) || "—"}</td>
                      <td>
                        {productObj && productObj.productQuantity
                          ? `${productObj.productQuantity} pcs`
                          : "—"}
                      </td>
                      <td>
                        {productObj && (productObj.receivedWeight || productObj.weight)
                          ? `${productObj.receivedWeight || productObj.weight} Kg`
                          : "—"}
                      </td>
                      <td>
                        {productObj && productObj.productsTotalCost
                          ? `${productObj.productsTotalCost} Tk`
                          : "—"}
                      </td>
                    </tr>
                  </tbody>
                </table>
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
                      Product Information
                    </div>
                    <div className="category-list-shipping">
                      Origin Country:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.shipFrom}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Ship By:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.shipBy}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Ship to:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.shipTo}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Valid to:{" "}
                      <span
                        style={{
                          fontWeight: "lighter",
                          textTransform: "capitalize",
                        }}
                      >
                        {productObj && productObj.validTo}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Brand/Non-brand:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {" "}
                        {productObj && productObj.productBrand}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Product Contains:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {" "}
                        {productObj && productObj.productContains}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Carton Quantity:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {" "}
                        {productObj && productObj.ctnQuantity}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Total CBM:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {" "}
                        {productObj && productObj.totalCbm}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Product details:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {" "}
                        {productObj && productObj.productVariant}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Status:{" "}
                      <span
                        style={{
                          padding: 10,
                          fontWeight: "bold",
                          paddingTop: 0,
                          color: "white",
                          padding: "3px 7px",
                          borderRadius: 5,
                          backgroundColor: productObj
                            ? productObj.status == "Pending"
                              ? "gainsboro"
                              : productObj.status == "Rates Provided"
                              ? "gray"
                              : productObj.status == "Received in Warehouse"
                              ? "orange"
                              : productObj.status == "Ready for fly"
                              ? "darkorange"
                              : productObj.status == "Bangladesh customs"
                              ? "chocolate"
                              : productObj.status == "Paicart warehouse"
                              ? "green"
                              : productObj.status == "Bangladesh warehouse"
                              ? "#00a3a3"
                              : productObj.status == "Delivered"
                              ? "darkgreen"
                              : "red"
                            : "white",
                          textAlign: "center",
                        }}
                      >
                        {productObj && statusDisplay(productObj.status)}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Payment Status:{" "}
                      <span
                        style={{
                          padding: "1px 6px",
                          fontWeight: "bold",
                          color: "white",
                          borderRadius: 5,
                          backgroundColor:
                            PAYMENT_STATE_COLORS[
                              getDisplayPaymentState(
                                productObj,
                                getShipmentPayable,
                              )
                            ] || "red",

                          textAlign: "center",
                        }}
                      >
                        {getDisplayPaymentState(productObj, getShipmentPayable)}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Start Shipping:{" "}
                      <span
                        style={{
                          fontWeight: "bold",
                          borderRadius: 5,
                          color: productObj
                            ? productObj.shipping
                              ? "green"
                              : "red"
                            : "red",
                          textAlign: "center",
                        }}
                      >
                        {productObj && productObj.shipping
                          ? "Permitted"
                          : "Not Permitted Yet"}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Waybill Image: <br />
                      {productObj && (
                        <img
                          style={{
                            height: 50,
                            width: 50,
                            border: "1px solid gainsboro",
                            borderRadius: 5,
                          }}
                          src={
                            productObj.waybillImage
                              ? productObj.waybillImage
                              : man
                          }
                        />
                      )}
                    </div>
                    <div className="category-list-shipping">
                      Packing List: <br />
                      {productObj && productObj.packingListUrl ? (
                        /\.(png|jpe?g|gif|webp|bmp)($|\?)/i.test(
                          productObj.packingListUrl
                        ) ? (
                          <img
                            style={{
                              height: 50,
                              width: 50,
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                            }}
                            src={productObj.packingListUrl}
                          />
                        ) : (
                          <a
                            href={productObj.packingListUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            View File
                          </a>
                        )
                      ) : (
                        <span style={{ color: "gainsboro" }}>—</span>
                      )}
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
                      Booking Date:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj.date}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Rates Provided:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && productObj["Rates ProvidedDate"]}
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
                      Customer rate:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj && parseFloat(productObj.customerRate) > 0
                          ? `${productObj.customerRate} Tk/Kg`
                          : "—"}
                      </span>
                    </div>

                    <div className="category-list-shipping">
                      Packaging & other cost:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.otherCost &&
                          `${productObj.otherCost}`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Discount:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.discount &&
                          `${productObj.discount}Tk`}
                      </span>
                    </div>
                    <div className="category-list-shipping">
                      Refund amount:{" "}
                      <span style={{ fontWeight: "lighter" }}>
                        {productObj &&
                          productObj.refund &&
                          `${productObj.refund}Tk`}
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
                            Paicart LIMITED
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
                            {orderTracking.parcelsArray.map(
                              (parcel) => `${parcel.ratePerKg} tk/kg,`
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Other charge:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.parcelsArray.map(
                              (parcel) => `${parcel.otherCharges} Tk,`
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Packaging cost:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.parcelsArray.map(
                              (parcel) => `${parcel.packagingCost} Tk,`
                            )}
                          </span>
                        </div>
                        <div className="category-list-shipping">
                          Final Total:{" "}
                          <span style={{ fontWeight: "lighter" }}>
                            {orderTracking.parcelsArray.map(
                              (parcel) => `${parcel.finalTotal} Tk,`
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
          id="paymentModal"
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
                  Booking Id: {productObj && productObj.bookingId}
                  {productObj && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                      <ModeBadge mode={getShipmentMode(productObj)} />
                      <Badge
                        tone={
                          PAYMENT_STATE_TONES[
                            getDisplayPaymentState(
                              productObj,
                              getShipmentPayable
                            )
                          ] || "gray"
                        }
                      >
                        {getDisplayPaymentState(productObj, getShipmentPayable)}
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
                    const bill = getShipmentPayable(productObj);
                    const paid = this.getTotal(productObj.payments);
                    const due = Math.max(bill - paid, 0);
                    return (
                      <StatRow>
                        <StatTile
                          tone="gray"
                          label="Total Bill"
                          value={`৳${bill.toLocaleString()}`}
                          hint={
                            productObj.shippingChargeCustomer
                              ? "actual"
                              : "estimate"
                          }
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
                          value={`৳${due.toLocaleString()}`}
                        />
                      </StatRow>
                    );
                  })()}
                <div className="row">
                  <div
                    className="col"
                    style={{
                      fontWeight: "bold",
                      borderBottom: "1px solid gainsboro",
                      paddingBottom: 5,
                    }}
                  >
                    Make New Payment
                  </div>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <div className="col">
                    <div style={{ fontSize: 12 }}>
                      Booking weight:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.weight}Kg
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Booking rate:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.result
                          ? productObj.result.perKg
                          : "N/A"}
                        Tk/kg
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Booking Total shipping rate:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.result
                          ? productObj.result.result
                          : "N/A"}
                        Tk
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row" style={{ marginTop: 10 }}>
                  <div className="col">
                    <div style={{ fontSize: 12 }}>
                      Received weight:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.receivedWeight}Kg
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Actual rate:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.customerRate}Tk/kg
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Actual Total shipping rate:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && productObj.shippingChargeCustomer}Tk
                      </span>
                    </div>
                    <div style={{ fontSize: 12 }}>
                      Total Paid:
                      <span style={{ fontWeight: "bold" }}>
                        {productObj && this.getTotal(productObj.payments)}Tk
                      </span>
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col">
                    <form
                      onSubmit={this.handleSubmit}
                      className="rounded-field mt-2"
                    >
                      <div className="form-row mb-2">
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Payment Method
                          </label>

                          <select
                            title=""
                            name="method"
                            className="custom-select"
                            aria-required="true"
                            aria-invalid="false"
                            onChange={this.handleChange}
                            style={{ fontSize: ".8rem" }}
                            value={this.state.method}
                            required
                          >
                            <option value="">Select Method</option>
                            <option value="Bkash">Bkash</option>
                            <option value="Nagad">Nagad</option>
                            <option value="Rocket">Rocket</option>
                            <option value="City Bank">City Bank</option>
                            <option value="Brack Bank">Brack Bank</option>
                            <option value="Loan">Loan</option>
                          </select>
                        </div>
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Paid amount
                          </label>

                          <input
                            type="number"
                            name="amount"
                            className="form-control"
                            placeholder="Enter amount"
                            style={{ fontSize: "1rem" }}
                            onChange={this.handleChange}
                            value={this.state.amount}
                            required
                          />
                        </div>
                        <div className="col">
                          <label
                            style={{
                              marginBottom: 0,
                              fontSize: 13,
                              fontWeight: "bold",
                            }}
                          >
                            Payment Status
                          </label>

                          <select
                            title=""
                            name="paymentStatus"
                            className="custom-select"
                            aria-required="true"
                            aria-invalid="false"
                            onChange={this.handleChange}
                            style={{ fontSize: ".8rem" }}
                            value={this.state.paymentStatus}
                            required
                          >
                            <option value="">Select Payment Status</option>
                            <option value="Partially Paid">
                              Partially Paid
                            </option>
                            <option value="Paid">Full Paid</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-row">
                        <div
                          className="col pt-3"
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                          }}
                        >
                          <button
                            type="submit"
                            className="btn"
                            style={{
                              background: "rgb(0, 37, 76)",
                              color: "white",
                            }}
                          >
                            Update
                            <i className="icofont-rounded-right"></i>
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
                <div className="row">
                  {this.state.productObj &&
                    this.state.productObj.payments &&
                    this.state.productObj.payments.length > 0 && (
                      <div className="col">
                        <div
                          className="row"
                          style={{
                            height: 1,
                            width: "100%",
                            background: "gainsboro",
                            marginTop: 20,
                            marginBottom: 20,
                            marginRight: 0,
                            marginLeft: 0,
                          }}
                        ></div>
                        <div
                          style={{
                            paddingLeft: 0,
                            color: "#18768f",
                            fontWeight: "bold",
                          }}
                        >
                          Previous Payments
                        </div>
                        <table className="table table-bordered table-striped table-hover">
                          <thead
                            style={{ background: "#18768f", color: "white" }}
                          >
                            <tr>
                              <td style={{ fontWeight: "bold" }}>Date</td>
                              <td style={{ fontWeight: "bold" }}>Method</td>
                              <td style={{ fontWeight: "bold" }}>Amount</td>
                              <td style={{ fontWeight: "bold" }}>Paid by</td>
                              <td style={{ fontWeight: "bold" }}>
                                Approved by
                              </td>
                            </tr>
                          </thead>
                          <tbody>
                            {this.state.productObj.payments.map((payment) => (
                              <tr>
                                <td>{payment.date}</td>
                                <td>{payment.method}</td>
                                <td>{payment.amount}Tk</td>
                                <td>{payment.paidBy}</td>
                                <td>{payment.approvedBy}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
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
                {/* Deletion is irreversible, so the dialog states exactly
                    which request is about to go and what it carries. */}
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 4,
                  }}
                >
                  Delete this shipment request?
                </p>
                <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
                  This cannot be undone.
                </p>
                {(() => {
                  const paid = ((productObj && productObj.payments) || []).reduce(
                    (total, p) => total + (parseFloat(p && p.amount) || 0),
                    0
                  );
                  return paid > 0 ? (
                    <p style={{ fontSize: 13, color: "#b91c1c", marginBottom: 16 }}>
                      Warning: ৳{Math.round(paid).toLocaleString()} in payments is recorded on it — its payment history will be deleted too.
                    </p>
                  ) : null;
                })()}
                {productObj && (
                  <StatRow>
                    <StatTile
                      tone="gray"
                      label="Booking Id"
                      value={productObj.bookingId}
                    />
                    <StatTile
                      tone="blue"
                      label="Product"
                      value={productNameOf(productObj)}
                    />
                    <StatTile
                      tone="violet"
                      label="Weight"
                      value={`${
                        productObj.receivedWeight || productObj.weight || 0
                      } Kg`}
                    />
                    <StatTile
                      tone="green"
                      label="Paid so far"
                      value={`৳${this.getTotal(
                        productObj.payments
                      ).toLocaleString()}`}
                    />
                  </StatRow>
                )}
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
                    this.props.deleteShipmentRequestRedux(productObj);
                  }}
                >
                  Yes
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
    allUsers: state.users.users,
    orderTracking: state.orders.orderTracking,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  getOrderTrackingResultRedux,
  updateShipmentRequestRedux,
  deleteShipmentRequestRedux,
})(Datatable);
