import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllSourcingsAgentRedux,
  getAllEmployeeRedux,
  handleSourcingAgentPayRedux,
} from "../../../../actions";
import { Link } from "react-router-dom";
import "./monthly-invoice.css";
import {
  getAllOrdersByAgentId,
  getSingleEmployee,
} from "../../../../firebase/firebase.utils";
import AllTransactions from "./allTransactions";
export class MonthlyInvoices extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sourcingObj: null,
      filterOrderStatus: "",
      selectedTab: "month",
      agentPaid: 0,
      orders: [],
    };
  }

  componentDidMount = async () => {
    const { agent, month } = this.props.match.params;
    this.props.getAllEmployeeRedux();
    let employee = await getSingleEmployee(agent);
    let orders = await getAllOrdersByAgentId(employee.adminId, month);
    console.log(orders);
    this.setState({
      orders,
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
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

  handleCashOut = async () => {
    const { currentAdmin } = this.props;
    let date = new Date();
    if (!this.state.agentPaid) {
      alert("Please enter an amount first");
      return;
    }
    console.log(this.state.agentPaid);
    this.props.handleSourcingAgentPayRedux({
      ...this.state.sourcingObj,
      agentPaid: this.state.agentPaid,
      paymentId: date.getTime().toString(),
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      receiveBy: currentAdmin.name,
      agentPays:
        this.state.sourcingObj.agentPays &&
        this.state.sourcingObj.agentPays.length > 0
          ? [
              {
                id: date.getTime().toString(),
                amount: this.state.agentPaid,
                date: date.toLocaleDateString("en-GB"),
                expenseBy: currentAdmin.name,
              },
              ...this.state.sourcingObj.agentPays,
            ]
          : [
              {
                id: date.getTime().toString(),
                amount: this.state.agentPaid,
                date: date.toLocaleDateString("en-GB"),
                expenseBy: currentAdmin.name,
              },
            ],
    });
    this.setState({
      agentPaid: 0,
    });
  };

  getOrderTotal = (order) => {
    let totalPayableAmount =
      parseInt(order.orderTotal) +
      (order.otherCost ? parseInt(order.otherCost) : 0) +
      (order.localShipping ? parseInt(order.localShipping) : 0) -
      (order.discount ? parseInt(order.discount) : 0);

    let totalPayableAmountIncludingShipping =
      parseInt(totalPayableAmount) +
      (order.shippingChargeCustomer
        ? parseInt(order.shippingChargeCustomer)
        : 0);

    return totalPayableAmountIncludingShipping;
  };

  render() {
    const { sourcingObj, orders } = this.state;
    const { sourcings, currentAdmin } = this.props;
    let date = new Date();
    let totalBill = 0;
    let totalRmb = 0;
    let totalPaid = 0;
    let buyingCost = 0;
    let totalProfit = 0;
    let sellRate = 0;
    let buyRate = 0;
    let shipping = 0;
    let totalRefundGiven = 0;
    let totalRefundReceived = 0;
    let totalRefundReceivedTk = 0;
    let totalOtherCharges = 0;
    let totalOtherChargesTk = 0;
    let renderableOrders = [];

    if (
      sourcingObj &&
      sourcingObj.receivedRefund &&
      sourcingObj.receivedRefund.length > 0
    ) {
      sourcingObj.receivedRefund.map((refund) => {
        totalRefundReceived += parseFloat(refund.amount);
      });
      totalRefundReceivedTk = parseInt(
        totalRefundReceived * sourcingObj.buyRate
      );
    }
    if (
      sourcingObj &&
      sourcingObj.otherCharges &&
      sourcingObj.otherCharges.length > 0
    ) {
      sourcingObj.otherCharges.map((refund) => {
        totalOtherCharges += parseFloat(refund.rmb);
      });
      totalOtherChargesTk = parseInt(totalOtherCharges * sourcingObj.buyRate);
    }
    if (
      sourcingObj &&
      sourcingObj.givenRefund &&
      sourcingObj.givenRefund.length > 0
    ) {
      sourcingObj.givenRefund.map((refund) => {
        totalRefundGiven += parseFloat(refund.amount);
      });
    }
    if (!this.state.filterOrderStatus) {
      renderableOrders = orders;
    } else if (this.state.filterOrderStatus == "Picked") {
      renderableOrders = orders.filter(
        (order) => order.shipmentStatusScore < 2
      );
    } else {
      renderableOrders = orders.filter(
        (order) => order.orderStatus === this.state.filterOrderStatus
      );
    }
    if (renderableOrders.length > 0) {
      renderableOrders.map((order) => {
        totalRmb += parseFloat(order.purchasingRmb || 0);
      });
    }

    console.log(this.props);
    let employee = this.props.allEmployees.find(
      (employee) => employee.employeeId == this.props.match.params.agent
    );
    return (
      <Fragment>
        <Breadcrumb
          title={this.props.match.params.agent}
          parent="Business Consultancy/sourcing"
        />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <>
              <div
                className="card o-hidden widget-cards"
                style={{
                  marginLeft: 10,
                  border:
                    this.state.selectedTab === "month"
                      ? "2px solid red"
                      : "2px solid white",
                }}
              >
                <div
                  className="card-body"
                  style={{
                    backgroundColor: "#00254c",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ selectedTab: "month" });
                  }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-warning" />
                      </div>
                    </div>
                    <div className="media-body col-8">
                      <span
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "100%",
                          color: "white",
                        }}
                      >
                        {this.props.match.params.month}{" "}
                        {this.props.match.params.agent}
                      </span>
                      <h3 className="mb-0" style={{ color: "darkorange" }}>
                        <CountUp className="counter" end={totalRmb} />
                        Rmb
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="card o-hidden widget-cards"
                style={{
                  marginLeft: 10,
                  border:
                    this.state.selectedTab === "rmb"
                      ? "2px solid red"
                      : "2px solid white",
                }}
              >
                <div
                  className="card-body"
                  style={{
                    backgroundColor: "rgb(46 146 137)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ selectedTab: "rmb" });
                  }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-warning" />
                      </div>
                    </div>
                    <div className="media-body col-8">
                      <span
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "100%",
                          color: "white",
                        }}
                      >
                        RMB BALANCE
                      </span>
                      <h3 className="mb-0" style={{ color: "darkorange" }}>
                        <CountUp
                          className="counter"
                          end={
                            employee && employee.rmbBalance
                              ? employee.rmbBalance
                              : 0
                          }
                        />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="card o-hidden widget-cards"
                style={{
                  marginLeft: 10,
                  border:
                    this.state.selectedTab === "rupee"
                      ? "2px solid red"
                      : "2px solid white",
                }}
              >
                <div
                  className="card-body"
                  style={{
                    backgroundColor: "rgb(79 136 195)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    this.setState({ selectedTab: "rupee" });
                  }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-warning" />
                      </div>
                    </div>
                    <div className="media-body col-8">
                      <span
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "100%",
                          color: "white",
                        }}
                      >
                        RUPEE BALANCE
                      </span>
                      <h3 className="mb-0" style={{ color: "darkorange" }}>
                        <CountUp
                          className="counter"
                          end={
                            employee && employee.rupeeBalance
                              ? employee.rupeeBalance
                              : 0
                          }
                        />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </>
            {this.state.selectedTab === "month" ? (
              <div className="col-sm-12">
                <div className="card">
                  <div
                    className="card-header"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      borderBottom: "1px solid gainsboro",
                    }}
                  >
                    <h5>
                      <i
                        className="icofont-calendar"
                        style={{
                          fontSize: "130%",
                          marginRight: "5px",
                          color: "darkblue",
                        }}
                      ></i>
                      {this.props.match.params.month}
                    </h5>
                    <div>
                      <select
                        title="Filter by Order Status"
                        required
                        name="filterOrderStatus"
                        className="custom-select"
                        aria-required="true"
                        aria-invalid="false"
                        onChange={this.handleChange}
                        value={this.state.filterOrderStatus}
                      >
                        <option value="">Filter by order status </option>
                        <option value="">All</option>
                        <option value="Picked">Picked</option>
                        <option value="Purchased">Purchased</option>
                        <option value="Received in Warehouse">
                          Received in Warehouse
                        </option>
                        <option value="Ready for fly">Ready for fly</option>
                        <option value="Bangladesh customs">
                          Bangladesh customs
                        </option>
                        <option value="Bangladesh warehouse">
                          Bangladesh warehouse
                        </option>
                        <option value="Paicart warehouse">
                          Paicart warehouse
                        </option>
                        <option value="Delivered">Delivered</option>
                        <option value="Reject">Reject</option>
                      </select>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="clearfix"></div>
                    <div id="basicScenario" className="product-physical">
                      <table className="table table-bordered table-striped table-hover table-responsive-md">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              #
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Date
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Product Image
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Tracking No
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Order Id
                            </th>

                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Product Type
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              China Weight
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Received Weight
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Shipping Rate
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Total Shipping Charge
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Purchasing Rmb
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Total Bill{" "}
                              <span style={{ fontSize: 10 }}>
                                (including Shipping) Tk{" "}
                              </span>{" "}
                            </th>

                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Order Status
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Payment Status
                            </th>

                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Customer
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Warehouse Image
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {renderableOrders.map((order, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{order.orderedDate}</td>
                              <td>
                                <a
                                  href={order.items[0].picture}
                                  target="_blank"
                                >
                                  <img
                                    src={order.items[0].picture}
                                    style={{
                                      minHeight: 60,
                                      maxHeight: 60,
                                      minWidth: 60,
                                      maxWidth: 60,
                                      border: "2px solid gray",
                                      borderRadius: 10,
                                      cursor: "pointer",
                                    }}
                                  />
                                </a>
                              </td>
                              <td style={{ color: "#ff8084" }}>
                                {order.trackingNo}
                              </td>

                              <td>{order.orderId}</td>
                              <td>{order.agentCarton}</td>
                              <td>{order.chineseWeight || 0}kg</td>
                              <td>{order.receivedWeight || 0}kg</td>
                              <td>{order.customerRate}Tk</td>
                              <td>{order.shippingChargeCustomer}Tk</td>
                              <td>{order.purchasingRmb || 0}Rmb</td>
                              <td>{this.getOrderTotal(order)}Tk</td>
                              <td>
                                <span
                                  style={{
                                    padding: 10,
                                    fontWeight: "bold",
                                    paddingTop: 0,
                                    color: "white",
                                    padding: "3px 7px",
                                    borderRadius: 5,
                                    backgroundColor: order
                                      ? order.orderStatus == "pending"
                                        ? "gainsboro"
                                        : order.orderStatus == "Purchased"
                                        ? "gray"
                                        : order.orderStatus ==
                                          "Received in Warehouse"
                                        ? "orange"
                                        : order.orderStatus == "Ready for fly"
                                        ? "darkorange"
                                        : order.orderStatus ==
                                          "Bangladesh customs"
                                        ? "chocolate"
                                        : order.orderStatus ==
                                          "Paicart warehouse"
                                        ? "green"
                                        : order.orderStatus ==
                                          "Bangladesh warehouse"
                                        ? "#00a3a3"
                                        : order.orderStatus == "Delivered"
                                        ? "darkgreen"
                                        : "red"
                                      : "white",
                                    textAlign: "center",
                                    fontSize: 10,
                                  }}
                                >
                                  {order.orderStatus}
                                </span>
                              </td>
                              <td>
                                <span
                                  style={{
                                    padding: "1px 6px",
                                    fontWeight: "bold",
                                    color: "white",
                                    borderRadius: 5,
                                    background: order
                                      ? order.paymentStatus == "Partially Paid"
                                        ? "darkorange"
                                        : order.paymentStatus == "Not Paid"
                                        ? "red"
                                        : order.paymentStatus == "Paid"
                                        ? "green"
                                        : order.paymentStatus == "purchaseLater"
                                        ? "gray"
                                        : order.paymentStatus == "pending"
                                        ? "darkorange"
                                        : "red"
                                      : "red",
                                    textAlign: "center",
                                    fontSize: 10,
                                  }}
                                >
                                  {order.paymentStatus || "Not Paid"}
                                </span>
                              </td>
                              <td>
                                <span style={{ fontWeight: "bold" }}>
                                  {order.displayName || "Guest"}
                                </span>
                              </td>
                              <td>
                                <a
                                  href={order.imageUrl}
                                  target="_blank"
                                  onClick={(e) => {
                                    if (!order.imageUrl) {
                                      e.preventDefault();
                                    }
                                  }}
                                >
                                  <img
                                    src={order.imageUrl}
                                    style={{
                                      minHeight: 60,
                                      maxHeight: 60,
                                      minWidth: 60,
                                      maxWidth: 60,
                                      border: "2px solid gray",
                                      borderRadius: 10,
                                      cursor: "pointer",
                                    }}
                                  />
                                </a>
                              </td>
                            </tr>
                          ))}
                          <tr>
                            <td
                              colSpan={10}
                              style={{ fontWeight: "bold", textAlign: "end" }}
                            >
                              Total
                            </td>
                            <td style={{ fontWeight: "bold" }} colSpan={6}>
                              {totalRmb}Rmb
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <AllTransactions
                props={this.props}
                selectedTab={this.state.selectedTab}
                agent={this.props.match.params.agent}
                month={this.props.match.params.month}
              />
            )}
          </div>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}

        <div
          className="modal fade"
          id="InvoiceInfoModal2"
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
            <div className="modal-content responsive-modal">
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
                  AGENT PAY
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
                <div
                  style={{
                    padding: "10px 0px",
                    borderBottom: "1px solid gainsboro",
                  }}
                >
                  <div style={{ fontWeight: "bold" }}>
                    Invoice Id:{sourcingObj && sourcingObj.id}
                  </div>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total{" "}
                  {sourcingObj && sourcingObj.country == "INDIA"
                    ? " rupees"
                    : " rmb"}
                  :
                  <span
                    style={{
                      fontWeight: "bold",
                    }}
                  >
                    {" "}
                    {sourcingObj && sourcingObj.totalRmb}{" "}
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Buy Rate:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj && sourcingObj.buyRate} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Sell Rate:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj && sourcingObj.sellRate} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Bill:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj && sourcingObj.totalBill} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Paid:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {(sourcingObj && sourcingObj.totalPaid) || 0} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Buying Cost:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {(sourcingObj && sourcingObj.buyingCost) || 0} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Refund given:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {totalRefundGiven} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Refund Received:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {totalRefundReceived}{" "}
                    {sourcingObj && sourcingObj.country == "INDIA"
                      ? "rupees"
                      : "rmb"}{" "}
                    * {sourcingObj && sourcingObj.buyRate} ={" "}
                    {totalRefundReceivedTk} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Other charges:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {totalOtherCharges}{" "}
                    {sourcingObj && sourcingObj.country == "INDIA"
                      ? "rupees"
                      : "rmb"}{" "}
                    * {sourcingObj && sourcingObj.buyRate} ={" "}
                    {totalOtherChargesTk} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Total Profit:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj &&
                      sourcingObj.finalProfit +
                        totalRefundReceivedTk -
                        totalRefundGiven -
                        totalOtherChargesTk}{" "}
                    Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Agent Profit:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj && sourcingObj.agentPaid} Tk
                  </span>
                </div>
                <div style={{ padding: "5px 0px" }}>
                  Paicart Profit:{" "}
                  <span style={{ fontWeight: "bold" }}>
                    {" "}
                    {sourcingObj &&
                      sourcingObj.finalProfit +
                        totalRefundReceivedTk -
                        totalRefundGiven -
                        totalOtherChargesTk -
                        sourcingObj.agentPaid}{" "}
                    Tk
                  </span>
                </div>

                <div
                  style={{
                    padding: "2px 0px",
                    borderBottom: "1px solid gainsboro",
                    marginBottom: 20,
                  }}
                ></div>
                <div className="form-group">
                  <label
                    style={{
                      fontWeight: "bold",
                      color: "#505050",
                      marginBottom: 5,
                    }}
                  >
                    AGENT PAY
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="agentPaid"
                    value={this.state.agentPaid}
                    onChange={this.handleChange}
                    id="exampleFormControlInput1"
                    placeholder="Enter amount"
                    style={{
                      borderColor: "gainsboro",
                      borderRadius: 5,
                    }}
                  />
                </div>
                {sourcingObj &&
                  sourcingObj.agentPays &&
                  sourcingObj.agentPays.length > 0 && (
                    <div>
                      <label
                        style={{
                          fontWeight: "bold",
                          color: "#505050",
                          marginBottom: 5,
                        }}
                      >
                        PREVIOUS AGENT PAYMENT
                      </label>
                      <table className="table table-bordered table-striped table-hover">
                        <thead>
                          <tr style={{ background: "rgb(0, 37, 76)" }}>
                            <th style={{ color: "white" }}>Date</th>
                            <th style={{ color: "white" }}>Amount</th>
                            <th style={{ color: "white" }}>Entry By</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sourcingObj.agentPays
                            .sort((a, b) => a.id - b.id)
                            .map((refund) => (
                              <tr>
                                <td>{refund.date}</td>
                                <td>{refund.amount} Tk</td>
                                <td>{refund.expenseBy}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                  }}
                  onClick={() => {
                    this.handleCashOut(sourcingObj);
                  }}
                >
                  Cash Out
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
    sourcings: state.sourcings.sourcings,
    allEmployees: state.employees.employees.filter(
      (employee) => employee.status == "Active"
    ),
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  getAllSourcingsAgentRedux,
  getAllEmployeeRedux,
  handleSourcingAgentPayRedux,
})(MonthlyInvoices);
