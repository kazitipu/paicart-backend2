import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import {
  getAllEmployeeRedux,
  getAllSourcingRequestRedux,
  updateSourcingRequestRedux,
  deleteSourcingRequestRedux,
} from "../../actions";
import "./purchasing/invoice/monthly-invoice.css";
import man from "./plus image.jpeg";
import { sendNotifications } from "../../firebase/fcmRestApi";
export class NewRequest extends Component {
  constructor(props) {
    super(props);
    this.state = {
      totalBill: "",
      agent: "",
      totalRmb: "",
      sellRate: "",
      buyRate: "",
      shipping: "",
      productLink: "",
      productName: "",
      totalPaid: 0,
      purchasingObj: null,
      type: "",
      buyingCost: 0,
      finalProfit: 0,
      customer: "",
      customerUid: "",
      cursor: -1,
      productDetails: "",
      country: "",
      filterCountry: "",
      trackingNo: "",
      shippingInformation: null,
      tkRefund: 0,
      tkRefundNote: "",
      rmbRefund: 0,
      rmbRefundNote: "",
      refundType: "",
      cashOutType: "",
      otherCharge: 0,
      otherChargeNote: "",
      quantity: 0,
    };
  }

  componentDidMount = async () => {
    this.props.getAllSourcingRequestRedux();
    this.props.getAllEmployeeRedux();
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
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
          customer: `${result[cursor].userId}-${result[cursor].displayName}`,
          customerUid: result[cursor].uid,
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
              customer: `${user.userId}-${user.displayName}`,
              customerUid: user.uid,
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

  handleSubmit = async (purchasing) => {
    let date = new Date();
    if (this.state.customerUid === "") {
      alert("Please select a customer first");
      return;
    }
    if (this.state.productName === "" || !this.state.productName) {
      alert("Please enter product name");
      return;
    }

    let purchasingObj = {
      ...this.state,
      id: purchasing.id,
      month: purchasing.month,
      date: purchasing.date,
      category: purchasing.category,
      status: "pending",
      totalBill: parseInt(
        parseFloat(this.state.sellRate || 0) *
          parseFloat(this.state.totalRmb || 0) +
          parseInt(this.state.shipping || 0)
      ),
    };
    await this.props.updateSourcingRequestRedux(purchasingObj);
    const message = {
      title: `${purchasingObj.category.toUpperCase()} Request`,
      body: `Your ${purchasingObj.category.toUpperCase()} request Id:${
        purchasing.id
      } is approved. Thank you`,
    };
    const userObj = this.props.allUsers.find(
      (user) => user.uid == this.state.customerUid
    );
    console.log(userObj);
    if (userObj && userObj.deviceToken && userObj.deviceToken.length > 0) {
      userObj.deviceToken.map((token) => {
        sendNotifications(token, message);
      });
    }

    this.setState({
      totalBill: "",
      agent: "",
      totalRmb: "",
      sellRate: "",
      buyRate: "",
      productLink: "",
      productName: "",
      productDetails: "",
      quantity: 0,
      shipping: "",
      totalPaid: 0,
      purchasingObj: null,
      type: "",
      buyingCost: 0,
      finalProfit: 0,
      customer: "",
      customerUid: "",
      cursor: -1,
      country: "",
    });
  };

  render() {
    const { open, purchasingObj, shippingInformation } = this.state;
    const { purchasings, allEmployees, currentAdmin } = this.props;

    let renderablePurchasings = [];
    if (!this.state.filterCountry) {
      renderablePurchasings = purchasings.filter(
        (purchasing) => !purchasing.agent
      );
    } else {
      renderablePurchasings = purchasings
        .filter((purchasing) => !purchasing.agent)
        .filter(
          (purchasing) => purchasing.country === this.state.filterCountry
        );
    }
    return (
      <Fragment>
        <Breadcrumb title={"New Request"} parent="Business Consultancy" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
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
                      className="icofont-money"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#00254c",
                      }}
                    ></i>
                    New Request
                  </h5>
                  <div style={{ display: "flex", flexDirection: "row" }}>
                    <div>
                      <select
                        title="Filter by country"
                        required
                        name="filterCountry"
                        className="custom-select"
                        aria-required="true"
                        aria-invalid="false"
                        onChange={this.handleChange}
                        value={this.state.filterCountry}
                      >
                        <option value="">Filter by country </option>
                        <option value="">All</option>
                        <option value="INDIA">INDIA</option>
                        <option value="CHINA">CHINA</option>
                      </select>
                    </div>
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
                            Category
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Id
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Agent
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
                            Product Name
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Product Link
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Country
                          </th>

                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Total
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Sell Rate
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Buy Rate
                          </th>

                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Total Paid
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Total Bill
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Buying Cost
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Total Profit
                          </th>

                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderablePurchasings.map((purchasing, index) => (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{purchasing.date}</td>
                            <td>
                              {" "}
                              <a href={purchasing.imageUrl} target="_blank">
                                <img
                                  style={{ height: 70, width: 70 }}
                                  src={
                                    purchasing.imageUrl
                                      ? purchasing.imageUrl
                                      : man
                                  }
                                />
                              </a>
                            </td>
                            <td>{purchasing.category.toUpperCase()}</td>
                            <td>{purchasing.id}</td>
                            <td>{purchasing.agent}</td>
                            <td style={{ color: "#ff8084" }}>
                              <Link
                                to={`/users/list-user/${purchasing.customerUid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {purchasing.customer}
                              </Link>
                            </td>
                            <td>{purchasing.productName}</td>
                            <td>{purchasing.quantity}</td>
                            <td>
                              <a href={purchasing.productLink} target="_blank">
                                <i
                                  className="icofont-eye-alt"
                                  style={{
                                    color: "black",
                                    textAlign: "center",
                                  }}
                                />
                              </a>
                            </td>

                            <td>{purchasing.country}</td>
                            <td>
                              {purchasing.totalRmb || 0}
                              {purchasing.country == "INDIA"
                                ? " rupees"
                                : " rmb"}
                            </td>
                            <td>{purchasing.sellRate || 0}Tk</td>
                            <td>{purchasing.buyRate || 0}Tk</td>
                            <td>{purchasing.totalPaid || 0}Tk</td>
                            <td>{purchasing.totalBill || 0}Tk</td>
                            <td>{purchasing.buyingCost || 0}Tk</td>
                            <td>{purchasing.finalProfit || 0}Tk</td>

                            {purchasing.status === "pending" ? (
                              <td>
                                <div
                                  className="row"
                                  style={{ justifyContent: "center" }}
                                >
                                  <i
                                    className="icofont-edit"
                                    data-toggle="modal"
                                    data-target="#personalInfoModal"
                                    onClick={() => {
                                      this.setState({
                                        purchasingObj: purchasing,
                                        totalBill: purchasing.totalBill,
                                        totalPaid: 0,
                                        agent: purchasing.agent,
                                        productLink: purchasing.productLink,
                                        productName: purchasing.productName,
                                        productDetails:
                                          purchasing.productDetails,
                                        quantity: purchasing.quantity,
                                        buyingCost: 0,
                                        sellRate: purchasing.sellRate || 0,
                                        buyRate: purchasing.buyRate,
                                        totalRmb: purchasing.totalRmb || 0,
                                        finalProfit: 0,
                                        status: "pending",
                                        type: "update",
                                        customer: purchasing.customer,
                                        customerUid: purchasing.customerUid,
                                        cursor: -1,
                                        [purchasing.category + "Status"]:
                                          purchasing.sourcingStatus ||
                                          purchasing.purchasingStatus,
                                        country: purchasing.country,
                                      });
                                    }}
                                    style={{
                                      color: "green",
                                      marginRight: 8,
                                      cursor: "pointer",
                                    }}
                                  />{" "}
                                  <i
                                    className="icofont-trash"
                                    data-toggle="modal"
                                    data-target="#deleteExpenseModal"
                                    onClick={() => {
                                      this.setState({
                                        purchasingObj: purchasing,
                                      });
                                    }}
                                    style={{
                                      color: "red",
                                      marginLeft: 8,
                                      cursor: "pointer",
                                    }}
                                  />
                                </div>
                              </td>
                            ) : (
                              <td></td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  Create Invoice
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
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      PURCHASING AGENT
                    </label>
                    <select
                      title="Please choose a package"
                      required
                      name="agent"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      value={this.state.agent}
                    >
                      <option value="">SELECT EMPLOYEE</option>
                      {allEmployees.map((employee) => (
                        <option value={`${employee.name}`}>
                          {employee.name}-{employee.designation}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
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
                          display: this.state.showSuggestion ? "flex" : "none",
                          zIndex: 11,
                        }}
                      >
                        {this.renderShowSuggestion()}
                      </ul>
                    )}
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      SELECT COUNTRY
                    </label>
                    <select
                      title="Please choose a package"
                      required
                      name="country"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      value={this.state.country}
                    >
                      <option value="">SELECT COUNTRY</option>
                      <option value="INDIA">INDIA</option>
                      <option value="CHINA">CHINA</option>
                    </select>
                  </div>
                  {this.state.country && (
                    <>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          PRODUCT NAME
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="productName"
                          onChange={this.handleChange}
                          value={this.state.productName}
                          id="exampleFormControlInput1"
                          placeholder="Enter product name"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          PRODUCT LINK
                        </label>
                        <textarea
                          type="text"
                          className="form-control"
                          name="productLink"
                          onChange={this.handleChange}
                          value={this.state.productLink}
                          id="exampleFormControlInput1"
                          placeholder="Product link"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          PRODUCT QUANTITY
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="quantity"
                          onChange={this.handleChange}
                          value={this.state.quantity}
                          id="exampleFormControlInput1"
                          placeholder="Product Quantity"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          PRODUCT DETIALS
                        </label>
                        <textarea
                          type="text"
                          className="form-control"
                          name="productDetails"
                          onChange={this.handleChange}
                          value={this.state.productDetails}
                          id="exampleFormControlInput1"
                          placeholder="Ex (size,color,weight,pcs) etc"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          TOTAL{" "}
                          {this.state.country == "INDIA" ? "RUPEES" : "RMB"}
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="totalRmb"
                          value={this.state.totalRmb}
                          onChange={this.handleChange}
                          id="exampleFormControlInput1"
                          placeholder={`Total ${
                            this.state.country == "INDIA" ? "RUPEES" : "RMB"
                          }`}
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          {this.state.country == "INDIA" ? "RUPEES" : "RMB"}{" "}
                          SELL RATE
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="sellRate"
                          value={this.state.sellRate}
                          onChange={this.handleChange}
                          id="exampleFormControlInput1"
                          placeholder="sell rate"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          {this.state.country == "INDIA" ? "RUPEES" : "RMB"} BUY
                          RATE
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="buyRate"
                          value={this.state.buyRate}
                          onChange={this.handleChange}
                          id="exampleFormControlInput1"
                          placeholder="buy rate"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </>
                  )}
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
                    this.handleSubmit(purchasingObj);
                  }}
                >
                  Create Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteExpenseModal"
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
                  Delete Request
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
                  <div>Are you sure you want to delete this request?</div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{purchasingObj && purchasingObj.id}</td>
                      <td>{purchasingObj && purchasingObj.category}</td>
                      <td>{purchasingObj && purchasingObj.customer}</td>
                      <td>
                        {(purchasingObj && purchasingObj.totalRmb) || 0}Rmb
                      </td>
                      <td>
                        {(purchasingObj && purchasingObj.sellRate) || 0}Tk/Rmb
                      </td>
                      <td>{purchasingObj && purchasingObj.totalBill}Tk</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  No
                </button>
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
                    this.props.deleteSourcingRequestRedux(purchasingObj);
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
    currentAdmin: state.admins.currentAdmin,
    purchasings: state.sourcings.sourcingRequests,
    allEmployees: state.employees.employees,
    lots: state.lots.lots,
  };
};

export default connect(mapStateToProps, {
  getAllSourcingRequestRedux,
  updateSourcingRequestRedux,
  deleteSourcingRequestRedux,
  getAllEmployeeRedux,
})(NewRequest);
