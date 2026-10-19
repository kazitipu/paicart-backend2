import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./agentDatatable";

import {
  getAllEmployeeRedux,
  uploadExpenseRedux,
  updateEmployeeRedux,
  uploadTransactionRedux,
} from "../../../../actions/index";

import { connect } from "react-redux";
import employee from "../../../expense-history/employee/employee";

export class Agents extends Component {
  constructor(props) {
    super(props);
    this.state = {
      fundType: "",
      totalBill: "",
      agent: "",
      totalRmb: "",
      sellRate: "",
      buyRate: "",
      shipping: "",
      productLink: "",
      totalPaid: 0,
      sourcingObj: null,
      type: "",
      buyingCost: 0,
      finalProfit: 0,
      customer: "",
      customerUid: "",
      cursor: -1,
      sourcingStatus: "",
      productDetails: "",
    };
  }

  componentDidMount = async () => {
    this.props.getAllEmployeeRedux();
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
          customer: `${result[cursor].userId}-${result[cursor].displayName}`,
          customerUid: result[cursor].uid,
          showSuggestion: false,
        });
      }
    } else {
      result = [];
    }
  };

  handleChangeCustomer = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, showSuggestion: true, cursor: -1 });
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

  handleSubmit = async () => {
    const { currentAdmin, allEmployees } = this.props;
    const selectedEmployee = allEmployees.find(
      (employee) => employee.employeeId == this.state.agent
    );
    let date = new Date();
    if (!selectedEmployee) {
      alert("Please select agent first.");
      return;
    }
    if (this.state.customerUid === "") {
      alert("Please select buying from first");
      return;
    }
    if (this.state.fundType == "") {
      alert("Select fund type first");
      return;
    }
    if (this.state.agent == "") {
      alert("Must Select giving to agent first");
      return;
    }
    if (this.state.buyRate == "") {
      alert("BuyRate cant be empty");
      return;
    }
    if (this.state.totalRmb == "") {
      alert("Total fund cant be empty");
      return;
    }
    if (this.state.totalBill == "") {
      alert("Total cash out cant be empty");
      return;
    }

    let rupeeBalance = 0;
    if (this.state.fundType == "RUPEES") {
      if (selectedEmployee.rupeeBalance) {
        rupeeBalance =
          parseInt(selectedEmployee.rupeeBalance) +
          parseInt(this.state.totalRmb);
      } else {
        rupeeBalance = parseInt(this.state.totalRmb);
      }
    } else {
      if (selectedEmployee.rupeeBalance) {
        rupeeBalance = parseInt(selectedEmployee.rupeeBalance);
      } else {
        rupeeBalance = 0;
      }
    }
    let rmbBalance = 0;
    if (this.state.fundType == "RMB") {
      if (selectedEmployee.rmbBalance) {
        rmbBalance =
          parseInt(selectedEmployee.rmbBalance) + parseInt(this.state.totalRmb);
      } else {
        rmbBalance = parseInt(this.state.totalRmb);
      }
    } else {
      if (selectedEmployee.rmbBalance) {
        rmbBalance = parseInt(selectedEmployee.rmbBalance);
      } else {
        rmbBalance = 0;
      }
    }
    // ekhane transaction add korte hobe ekhon ekta recharge hobe r jokhon kono product er taka dibe tokhon minus hobe oi figure ta.
    await this.props.uploadTransactionRedux({
      id: date.getTime().toString(),
      fundType: `${this.state.fundType}`,
      subCategory: `Bought from = ${this.state.customer}`,
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: `Buy Rate = ${this.state.buyRate}`,
      amount: this.state.totalBill,
      totalRmb: this.state.totalRmb,
      expenseBy: currentAdmin.name,
      uid: this.state.customerUid,
      unEditable: true,
      employeeId: this.state.agent,
      rmbBalance,
      rupeeBalance,
    });
    // employee profile te gele monthly er pashapashi transaction ekta option thakbe jekhane tare koto rate te rmb/rupees fund kora hoise oita thakbe. and shekhan theke koto fund she kon invoice te khoroch korse oita entry hobe .
    await this.props.updateEmployeeRedux({
      ...selectedEmployee,
      rmbBalance,
      rupeeBalance,
    });
    await this.props.uploadExpenseRedux({
      amount: this.state.totalBill,
      category: `Buy Fund ${this.state.fundType}`,
      subCategory: `Bought from = ${this.state.customer}, Giving to =${selectedEmployee.employeeId}`,
      note: `Buy Rate = ${this.state.buyRate} Tk, Total ${this.state.fundType} =${this.state.totalRmb}`,
      date: date.toLocaleDateString("en-GB"),
      id: date.getTime().toString(),
      month: this.getMonthName(),
      receiveBy: currentAdmin.name,
      status: "pending",
      unEditable: true,
    });
    // and update in redux so that it gets live update.
    this.setState({
      fundType: "",
      totalBill: "",
      agent: "",
      totalRmb: "",
      sellRate: "",
      buyRate: "",
      shipping: "",
      productLink: "",
      totalPaid: 0,
      sourcingObj: null,
      type: "",
      buyingCost: 0,
      finalProfit: 0,
      customer: "",
      customerUid: "",
      cursor: -1,
      sourcingStatus: "",
      productDetails: "",
    });
    toast.success("New fund added to the selected agent. ");
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { months, allEmployees, currentAdmin } = this.props;

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb
          title="Sourcing Agents"
          parent="Business Consultancy/Sourcing"
        />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="col-sm-12">
            <div className="card">
              <div
                className="card-header"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <h5>
                  <i
                    className="icofont-list"
                    style={{
                      fontSize: "130%",
                      marginRight: "5px",
                      color: "darkblue",
                    }}
                  ></i>
                  Sourcing Agents
                </h5>
                {(currentAdmin && currentAdmin.status == "Admin") ||
                (currentAdmin && currentAdmin.status == "Accounts") ? (
                  <button
                    className="btn btn-primary"
                    data-toggle="modal"
                    data-target="#personalInfoModal"
                    onClick={() => {
                      this.setState({
                        totalBill: "",
                        agent: "",
                        totalRmb: "",
                        sellRate: "",
                        buyRate: "",
                        productLink: "",
                        totalPaid: 0,
                        sourcingObj: null,
                        type: "upload",
                        buyingCost: 0,
                        finalProfit: 0,
                        customer: "",
                        customerUid: "",
                        cursor: -1,
                      });
                    }}
                    disabled={
                      currentAdmin && currentAdmin.status == "Partner"
                        ? true
                        : false
                    }
                  >
                    BUY FUND
                  </button>
                ) : null}
              </div>
              <div className="card-body">
                <div className="clearfix"></div>
                <div id="basicScenario" className="product-physical">
                  <Datatable
                    startToggleModal={this.startToggleModal}
                    history={this.props.history}
                    multiSelectOption={false}
                    myData={allEmployees.filter((employee) => employee.adminId)}
                    pageSize={50}
                    pagination={true}
                    class="-striped -highlight"
                    type="expense"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
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
                  Buy Fund
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
                      FUND TYPE
                    </label>
                    <select
                      title="Please choose a package"
                      required
                      name="fundType"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      value={this.state.fundType}
                    >
                      <option value="">SELECT CURRENCY</option>
                      <option value="RMB">RMB</option>
                      <option value="RUPEES">RUPEES</option>
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
                      BUYING FROM
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
                      GIVING TO
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
                  {this.state.fundType && (
                    <>
                      <div className="form-group">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          {this.state.fundType} BUY RATE
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="buyRate"
                          value={this.state.buyRate}
                          onChange={this.handleChange}
                          id="exampleFormControlInput1"
                          placeholder="buy rate in tk"
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
                          TOTAL {this.state.fundType} FUND
                        </label>
                        <input
                          type="number"
                          className="form-control"
                          name="totalRmb"
                          value={this.state.totalRmb}
                          onChange={this.handleChange}
                          id="exampleFormControlInput1"
                          placeholder="Total rupees/rmb balance"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </>
                  )}
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      TOTAL CASH OUT
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="totalBill"
                      value={this.state.totalBill}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Total In Taka"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
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
                    this.handleSubmit();
                  }}
                >
                  Cash out
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
    allEmployees: state.employees.employees.filter(
      (employee) => employee.status == "Active"
    ),
    months: state.admins.months,
    allUsers: state.users.users,
    currentAdmin: state.admins.currentAdmin,
    sourcings: state.sourcings.sourcings,
  };
};

export default connect(mapStateToProps, {
  getAllEmployeeRedux,
  uploadExpenseRedux,
  updateEmployeeRedux,
  uploadTransactionRedux,
})(Agents);
