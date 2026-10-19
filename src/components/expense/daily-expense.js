import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import {
  getAllDocumentExpressRatesRedux,
  getAllOfficeRedux,
  getAllCnfRedux,
  getAllEmployeeRedux,
  uploadExpenseRedux,
  uploadCashInRedux,
  getAllExpenseRedux,
  getAllPendingExpenseByDayRedux,
  getAllPendingCashInByDayRedux,
  deleteExpenseRedux,
  deleteCashInRedux,
  updateExpenseRedux,
  updateCashInRedux,
  getSingleCashSummaryRedux,
  getSingleMonthlyRedux,
  getAllMonthlyRedux,
  getAllPromotionRedux,
} from "../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Clock from "./clock";
import { DollarSign } from "react-feather";
import { CircleLoader } from "react-spinners";
import { getMonth, createSalaryMonth } from "../../firebase/firebase.utils";

export class DailyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      customer: "",
      customerUid: "",
      showSuggestion: true,
      open: false,
      toggleModal: true,
      singleLot: null,
      time: "",
      monthName: "",
      category: "",
      subCategory: "",
      note: "",
      amount: "",
      expenseObj: null,
      cursor: -1,
      loader: false,
      months: [],
      filterCategoryCashIn: "",
      filterCategoryCashOut: "",
    };
  }

  componentDidMount = async () => {
    let date = new Date();
    console.log("component did mount is getting called!");
    this.props.getSingleCashSummaryRedux();
    console.log(date.toLocaleDateString("en-GB"));
    this.props.getAllPendingExpenseByDayRedux(date.toLocaleDateString("en-GB"));
    this.props.getAllPendingCashInByDayRedux(date.toLocaleDateString("en-GB"));
    this.props.getAllCnfRedux();
    this.props.getAllEmployeeRedux();
    this.props.getAllOfficeRedux();
    this.props.getAllPromotionRedux();
  };

  componentWillReceiveProps = async (nextProps) => {
    if (this.props.allEmployees.length !== nextProps.allEmployees.length) {
      if (nextProps.allEmployees && nextProps.allEmployees.length > 0) {
        nextProps.allEmployees.map(async (employee) => {
          await createSalaryMonth(this.getMonthName(), employee);
        });
      }
    }
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState(
      {
        [name]: value,
      },
      async () => {
        if (this.state.category === "SALARY" && this.state.subCategory !== "") {
          const months = await getMonth(
            this.state.subCategory,
            this.getMonthName()
          );
          this.props.getAllMonthlyRedux("SALARY", this.state.subCategory);
          this.setState({ months });
        }
      }
    );
  };
  handleMonthChange = (e) => {
    const { name, value } = e.target;
    this.setState(
      {
        [name]: value,
      },
      async () => {
        if (this.state.category === "SALARY" && this.state.subCategory !== "") {
          if (this.state.note !== "") {
            document.getElementById("salary").click();
            this.props.getSingleMonthlyRedux(
              this.state.note,
              "SALARY",
              this.state.subCategory
            );
          }
        }
      }
    );
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
              customer: user.userId,
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

  renderSubCategory = () => {
    const { category } = this.state;
    const { allOffices, allCnfs, allEmployees, allAdmins, allPromotions } =
      this.props;
    const allPartners = allAdmins.filter((admin) => admin.status == "Partner");
    if (
      category === "DAILY COST" ||
      category === "REFUND" ||
      category === "AGENT COMMISION" ||
      category === "LOT TRANSPORT"
    ) {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>{category}</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
          >
            <option value={category}>{category}</option>
          </select>
        </div>
      );
    } else if (category === "OFFICE") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>OFFICE</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            value={this.state.subCategory}
            onChange={this.handleChange}
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
          >
            <option value="">SELECT OFFICE</option>
            {allOffices.map((office) => (
              <option value={office.name}>{office.name}</option>
            ))}
          </select>
        </div>
      );
    } else if (category === "PROMOTION") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>Select Promotion Method</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            value={this.state.subCategory}
            onChange={this.handleChange}
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
          >
            <option value="">SELECT METHOD</option>
            {allPromotions.map((office) => (
              <option value={office.name}>{office.name}</option>
            ))}
          </select>
        </div>
      );
    } else if (
      category === "SALARY" ||
      category === "SOURCING" ||
      category === "PURCHASING"
    ) {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>{category}</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
            onChange={this.handleChange}
            value={this.state.subCategory}
          >
            <option value="">SELECT EMPLOYEE</option>
            {allEmployees.map((employee, index) => (
              <option value={`${employee.name}`} key={index}>
                {employee.name}-{employee.designation}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (category === "PARTNER PAYMENT") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>PARTNER PAYMENT</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
            onChange={this.handleChange}
            value={this.state.subCategory}
          >
            <option value="">SELECT PARTNER</option>
            <option value="ISMAIL HOSSAIN NIBIR">ISMAIL HOSSAIN NIBIR</option>
            <option value="AHMADULLAH TIPU">AHMADULLAH TIPU</option>
          </select>
        </div>
      );
    } else if (category === "CNF") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>CNF</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
            onChange={this.handleChange}
            value={this.state.subCategory}
          >
            <option value="">SELECT CNF</option>
            {allCnfs.map((cnf) => (
              <option value={cnf.name}>
                {cnf.name}-{cnf.address}
              </option>
            ))}
          </select>
        </div>
      );
    } else if (category === "INVEST") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>INVEST</label>
          <select
            title="Please choose a package"
            name="subCategory"
            required
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
          >
            <option value="OFFICE INVESTMENT">OFFICE INVESTMENT</option>
          </select>
        </div>
      );
    } else if (category === "FUND") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>FUND</label>
          <select
            title="Please choose a package"
            name="subCategory"
            required
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
          >
            <option value="OFFICE FUND">OFFICE FUND</option>
          </select>
        </div>
      );
    } else if (category === "LOAN" || category === "MONTHLY INSTALLMENT") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>{category}</label>
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
              }}
            >
              {this.renderShowSuggestion()}
            </ul>
          )}
        </div>
      );
    } else if (category === "OTHERS") {
      return (
        <div className="col">
          <label
            style={{
              marginBottom: 5,
            }}
          >
            SUB CATEGORY
          </label>

          <input
            style={{ padding: 18 }}
            type="text"
            name="subCategory"
            className="form-control"
            placeholder="ENTER SUB CATEGORY"
            onChange={this.handleChange}
            value={this.state.subCategory}
            required
          />
        </div>
      );
    } else if (category === "PARTNER") {
      return (
        <div className="col">
          <label style={{ marginBottom: 5 }}>PARTNER</label>
          <select
            title="Please choose a package"
            required
            name="subCategory"
            className="custom-select"
            aria-required="true"
            aria-invalid="false"
            onChange={(e) => {
              const selectedIndex = e.target.value;
              const selectedPartner = allPartners[selectedIndex];
              this.setState({ selectedPartner });
            }}
            value={allPartners.findIndex(
              (p) => p.email === this.state.selectedPartner?.email
            )}
          >
            <option value="">SELECT PARTNER</option>
            {allPartners.map((partner, index) => (
              <option value={index}>
                {partner.name}-{partner.email}
              </option>
            ))}
          </select>
        </div>
      );
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

  handleSubmitCashOut = async (e) => {
    e.preventDefault();

    let remainingSalary = 0;

    let selectedMonths = this.state.months.find(
      (month) => month.month == this.state.note
    );
    if (selectedMonths) {
      remainingSalary =
        parseInt(selectedMonths.salary) - parseInt(selectedMonths.amount);
    }
    if (this.state.loader) {
      return;
    }
    if (
      this.state.category === "SALARY" &&
      this.state.amount > remainingSalary
    ) {
      alert(`Paid Amount can't be greater than ${remainingSalary}`);
      return;
    }
    this.setState({ loader: true });
    const { currentAdmin } = this.props;
    let date = new Date();
    let subCategory = this.state.subCategory;
    if (this.state.category === "LOAN" && this.state.customerUid === "") {
      alert("Please select a customer first");
      return;
    }
    if (this.state.category === "DAILY COST") {
      subCategory = "DAILY OFFICE COST";
    } else if (this.state.category === "INVEST") {
      subCategory = "OFFICE INVESTMENT";
    } else if (this.state.category === "FUND") {
      subCategory = "OFFICE FUND";
    } else if (this.state.category === "REFUND") {
      subCategory = "REFUND PURPOSE";
    } else if (this.state.category === "AGENT COMMISION") {
      subCategory = "COMMISION PURPOSE";
    } else if (this.state.category === "LOT TRANSPORT") {
      subCategory = "LOT TRANSPORT";
    }
    let expenseObj = {
      id: date.getTime().toString(),
      category: this.state.category,
      subCategory,
      month:
        this.state.category === "SALARY"
          ? this.state.note
          : this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: this.state.note,
      amount: this.state.amount,
      expenseBy: currentAdmin.name,
      status: "pending",
      uid: this.state.customerUid,
    };

    await this.props.uploadExpenseRedux(expenseObj);
    this.setState({
      time: "",
      category: "",
      subCategory: "",
      note: "",
      amount: "",
      customer: "",
      customerUid: "",
      loader: false,
    });
  };
  handleSubmitCashIn = async (e) => {
    e.preventDefault();
    if (this.state.loader) {
      return;
    }
    this.setState({
      loader: true,
    });
    const { currentAdmin, allAdmins } = this.props;
    let date = new Date();
    let subCategory = this.state.subCategory;
    if (this.state.category === "LOAN" && this.state.customerUid === "") {
      alert("Please select a customer first");
      return;
    }
    if (this.state.category === "FUND") {
      subCategory = "OFFICE FUND";
    }
    if (this.state.category === "INVEST") {
      subCategory = "OFFICE INVESTMENT";
    }
    let partnerId = "";
    if (this.state.category == "PARTNER") {
      partnerId = this.state.selectedPartner.adminId;
      subCategory = `${this.state.selectedPartner.name}-${this.state.selectedPartner.email}`;
    }
    let cashInObj = {
      id: date.getTime().toString(),
      category: this.state.category,
      subCategory,
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      note: this.state.note,
      amount: this.state.amount,
      receiveBy: currentAdmin.name,
      status: "pending",
      uid: this.state.customerUid,
      partnerId: partnerId,
    };

    await this.props.uploadCashInRedux(cashInObj);
    this.setState({
      time: "",
      category: "",
      subCategory: "",
      note: "",
      amount: "",
      customer: "",
      customerUid: "",
      loader: false,
    });
  };

  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
    this.setState({
      category: "",
      subCategory: "",
      note: "",
      amount: "",
    });
  };

  renderMonths = () => {
    const { months } = this.state;
    console.log(months);

    return (
      <select
        title="Please choose a package"
        required
        name="note"
        className="custom-select"
        aria-required="true"
        aria-invalid="false"
        onChange={this.handleMonthChange}
        value={this.state.note}
        aria-disabled
      >
        {(months.length > 0) & (this.state.subCategory !== "") ? (
          <>
            <option value="">SELECT A MONTH</option>
            {months.map((month) => (
              <option value={month.month}>{month.month}</option>
            ))}
          </>
        ) : this.state.subCategory == "" ? (
          <option value="" disabled>
            SELECT AN EMPLOYEE FIRST
          </option>
        ) : (
          <option value="" disabled>
            PLEASE CREATE A MONTH FIRST- (upto date salary is given)
          </option>
        )}
      </select>
    );
  };

  render() {
    const { open, expenseObj, allMonths } = this.state;
    const {
      expenses,
      allOffices,
      allCnfs,
      allEmployees,
      cashIns,
      todaysCash,
      allExpenses,
      currentAdmin,
    } = this.props;
    let date = new Date();
    let total = 0;
    let totalCashIns = 0;

    let remainingSalary = 0;

    let renderableExpense = expenses;
    if (this.state.filterCategoryCashOut) {
      renderableExpense = expenses.filter(
        (expense) =>
          expense.category &&
          expense.category.toLowerCase() ==
            this.state.filterCategoryCashOut.toLowerCase()
      );
    }
    renderableExpense.map((expense) => (total += parseInt(expense.amount)));

    let renderableCashIn = cashIns;
    if (this.state.filterCategoryCashIn) {
      renderableCashIn = cashIns.filter(
        (expense) =>
          expense.category &&
          expense.category.toLowerCase() ==
            this.state.filterCategoryCashIn.toLowerCase()
      );
    }
    renderableCashIn.map(
      (expense) => (totalCashIns += parseInt(expense.amount))
    );

    console.log(this.props);
    let selectedMonths = this.state.months.find(
      (month) => month.month == this.state.note
    );
    console.log(selectedMonths);
    if (selectedMonths) {
      remainingSalary =
        parseInt(selectedMonths.salary) - parseInt(selectedMonths.amount);
    }
    return (
      <Fragment>
        <Breadcrumb title={date.toDateString()} parent="Cash" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row">
            <>
              <div className="col-xl-3 col-md-6 xl-50">
                <div className="card o-hidden widget-cards">
                  <div
                    className="card-body"
                    style={{ backgroundColor: "#16004c" }}
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
                            fontSize: "130%",
                            color: "white",
                          }}
                        >
                          Remaining Cash
                        </span>
                        <h3 className="mb-0">
                          <CountUp
                            className="counter"
                            end={todaysCash && todaysCash.remainingBalance}
                          />
                          Tk
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 xl-50">
                <div className="card o-hidden  widget-cards">
                  <div
                    className="card-body"
                    style={{ backgroundColor: "darkgreen" }}
                  >
                    <div className="media static-top-widget row">
                      <div className="icons-widgets col-4">
                        <div className="align-self-center text-center">
                          <DollarSign className="font-secondary" />
                        </div>
                      </div>
                      <div className="media-body col-8">
                        <span
                          className="m-0"
                          style={{
                            fontWeight: "bold",
                            fontSize: "130%",
                            color: "white",
                          }}
                        >
                          {" "}
                          Todays Cash In
                        </span>
                        <h3 className="mb-0">
                          <CountUp
                            className="counter"
                            end={todaysCash && todaysCash.totalCashIns}
                          />
                          Tk
                          <small></small>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 xl-50">
                <div className="card o-hidden widget-cards">
                  <div
                    className="card-body"
                    style={{ backgroundColor: "#e50000" }}
                  >
                    <div className="media static-top-widget row">
                      <div className="icons-widgets col-4">
                        <div className="align-self-center text-center">
                          <DollarSign className="font-primary" />
                        </div>
                      </div>
                      <div className="media-body col-8">
                        <span
                          className="m-0"
                          style={{
                            fontWeight: "bold",
                            fontSize: "130%",
                            color: "white",
                          }}
                        >
                          {" "}
                          Todays Cash Out
                        </span>
                        <h3 className="mb-0">
                          <CountUp
                            className="counter"
                            end={todaysCash && todaysCash.totalCashOuts}
                          />
                          Tk
                          <small></small>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-md-6 xl-50">
                <div className="card o-hidden widget-cards">
                  <div
                    className="card-body"
                    style={{ backgroundColor: "gray" }}
                  >
                    <div className="media static-top-widget row">
                      <div className="icons-widgets col-4">
                        <div className="align-self-center text-center">
                          <DollarSign className="font-danger" />
                        </div>
                      </div>
                      <div className="media-body col-8">
                        <span
                          className="m-0"
                          style={{
                            fontWeight: "bold",
                            fontSize: "130%",
                            color: "white",
                          }}
                        >
                          Previous Cash
                        </span>
                        <h3 className="mb-0">
                          <CountUp
                            className="counter"
                            end={todaysCash && todaysCash.previousCash}
                          />
                          Tk
                          <small></small>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
            <Tabs>
              <TabList
                className="nav nav-tabs tab-coupon"
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
              >
                <Tab
                  className="nav-link"
                  onClick={(e) => this.clickActive(e)}
                  style={{ fontSize: 25 }}
                >
                  Cash Out
                </Tab>

                <Tab
                  className="nav-link"
                  onClick={(e) => this.clickActive(e)}
                  style={{ fontSize: 25 }}
                >
                  Cash In
                </Tab>
              </TabList>
              <TabPanel>
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
                          className="icofont-bill"
                          style={{
                            fontSize: "130%",
                            marginRight: "5px",
                            color: "#ff8084",
                          }}
                        ></i>
                        Cash Out
                      </h5>
                      <Clock />
                    </div>
                    <div
                      className="card-body"
                      style={{ paddingTop: 20, backgroundColor: "#fbfbfb" }}
                    >
                      <div className="clearfix"></div>
                      <div>
                        <div id="basicScenario" className="product-physical">
                          <form
                            style={{
                              padding: 20,
                              paddingBottom: 0,
                              paddingTop: 0,
                            }}
                            onSubmit={this.handleSubmitCashOut}
                          >
                            <div className="form-row mb-2">
                              <div className="col">
                                <label style={{ marginBottom: 5 }}>
                                  CATEGORY
                                </label>
                                <select
                                  title="Please choose a package"
                                  required
                                  name="category"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  value={this.state.category}
                                >
                                  <option value="">SELECT CATEGORY </option>
                                  <option value="DAILY COST">
                                    DAILY COST (BD)
                                  </option>
                                  <option value="OFFICE">
                                    OFFICE (BD,CN,IN)
                                  </option>
                                  <option value="PROMOTION">
                                    PROMOTION/BOOSTING
                                  </option>
                                  <option value="SALARY">SALARY</option>

                                  <option value="CNF">CNF</option>
                                  <option value="INVEST">INVEST</option>
                                  <option value="FUND">FUND</option>
                                  <option value="LOAN">LOAN</option>

                                  <option value="AGENT COMMISION">
                                    AGENT COMMISION
                                  </option>
                                  <option value="MONTHLY INSTALLMENT">
                                    MONTHLY INSTALLMENT
                                  </option>
                                  <option value="LOT TRANSPORT">
                                    LOT TRANSPORT
                                  </option>
                                </select>
                              </div>
                              {!this.state.category ? (
                                <div className="col">
                                  <label
                                    style={{
                                      color: "#6c757d",
                                      marginBottom: 5,
                                    }}
                                  >
                                    {" "}
                                    SUB CATEGORY
                                  </label>

                                  <select
                                    title="Please choose a package"
                                    required
                                    name="selectCountry"
                                    className="custom-select"
                                    aria-required="true"
                                    aria-invalid="false"
                                    onChange={this.handleChange}
                                    value={this.state.selectCountry}
                                    aria-disabled
                                    disabled
                                  >
                                    <option value="">
                                      ***CHOOSE CATGEGORY FIRST
                                    </option>
                                  </select>
                                </div>
                              ) : (
                                this.renderSubCategory()
                              )}
                              {this.state.category === "SALARY" ? (
                                <div className="col">
                                  <label
                                    style={{
                                      color: "#6c757d",
                                      marginBottom: 5,
                                    }}
                                  >
                                    SELECT MONTH
                                  </label>
                                  {this.renderMonths()}
                                </div>
                              ) : null}

                              {this.state.category !== "SALARY" && (
                                <div className="col">
                                  <label style={{ marginBottom: 5 }}>
                                    NOTE
                                  </label>
                                  <input
                                    style={{ padding: 18 }}
                                    type="text"
                                    name="note"
                                    className="form-control"
                                    placeholder="ENTER ADDITIONAL NOTE"
                                    onChange={this.handleChange}
                                    value={this.state.note}
                                    required
                                  />
                                </div>
                              )}
                            </div>
                            <div
                              className="form-row mb-2"
                              style={{ marginTop: 20 }}
                            >
                              {" "}
                              <div className="col">
                                <label style={{ marginBottom: 5 }}>
                                  AMOUNT
                                </label>
                                <input
                                  style={{ padding: 18 }}
                                  type="text"
                                  name="amount"
                                  className="form-control"
                                  placeholder="ENTER AMOUNT"
                                  onChange={this.handleChange}
                                  value={this.state.amount}
                                  required
                                />
                              </div>
                            </div>
                            <div
                              className="form-row"
                              style={{
                                marginTop: 30,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="btn btn-primary"
                                style={{
                                  padding: "13px 20px",
                                  fontSize: 18,
                                  minWidth: 100,
                                  minHeight: 50,
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                                type="submit"
                                disabled={
                                  currentAdmin &&
                                  currentAdmin.status == "Partner"
                                    ? true
                                    : false
                                }
                              >
                                {!this.state.loader && "SUBMIT"}
                                <CircleLoader
                                  loading={this.state.loader}
                                  color="white"
                                  size={15}
                                />
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
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
                            color: "#ff8084",
                          }}
                        ></i>
                        Today's Pending Cash Out
                      </h5>
                      <div>
                        <select
                          title="Filter by category"
                          required
                          name="filterCategoryCashOut"
                          className="custom-select"
                          aria-required="true"
                          aria-invalid="false"
                          onChange={this.handleChange}
                          value={this.state.filterCategoryCashOut}
                        >
                          <option value="">Filter by category </option>
                          <option value="">All</option>
                          <option value="DAILY COST">DAILY COST (BD)</option>
                          <option value="OFFICE">OFFICE (BD,CN,IN)</option>
                          <option value="PROMOTION">BOOSTING/PROMOTION</option>
                          <option value="SALARY">SALARY</option>
                          <option value="CNF">CNF</option>
                          <option value="INVEST">INVEST</option>
                          <option value="FUND">FUND</option>
                          <option value="LOAN">LOAN</option>
                          <option value="REFUND">REFUND</option>
                          <option value="AGENT COMMISION">
                            AGENT COMMISION
                          </option>
                          <option value="MONTHLY INSTALLMENT">
                            MONTHLY INSTALLMENT
                          </option>
                          <option value="LOT TRANSPORT">LOT TRANSPORT</option>
                        </select>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <table className="table table-bordered table-striped table-hover">
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
                                Cateogry
                              </th>
                              <th
                                scope="col"
                                style={{
                                  padding: "30px 15px",
                                  color: "white",
                                  backgroundColor: "#00254c",
                                }}
                              >
                                Sub Category
                              </th>
                              <th
                                scope="col"
                                style={{
                                  padding: "30px 15px",
                                  color: "white",
                                  backgroundColor: "#00254c",
                                }}
                              >
                                Note
                              </th>
                              <th
                                scope="col"
                                style={{
                                  padding: "30px 15px",
                                  color: "white",
                                  backgroundColor: "#00254c",
                                }}
                              >
                                Amount
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
                            {renderableExpense.map((expense, index) => (
                              <tr key={index}>
                                <th scope="row">{index + 1}</th>
                                <td>{expense.category}</td>
                                <td>{expense.subCategory}</td>
                                <td>{expense.note}</td>
                                <td>{expense.amount}Tk</td>
                                <td>
                                  {expense.unEditable ? (
                                    ""
                                  ) : (
                                    <div
                                      className="row"
                                      style={{
                                        justifyContent: "center",
                                        display:
                                          currentAdmin &&
                                          currentAdmin.status == "Partner"
                                            ? "none"
                                            : "",
                                      }}
                                    >
                                      <i
                                        className="icofont-edit"
                                        data-toggle="modal"
                                        data-target="#personalInfoModal"
                                        onClick={() => {
                                          this.setState({
                                            expenseObj: expense,
                                            type: "expense",
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
                                            expenseObj: expense,
                                            type: "expense",
                                          });
                                        }}
                                        style={{
                                          color: "red",
                                          marginLeft: 8,
                                          cursor: "pointer",
                                        }}
                                      />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3} style={{ border: 0 }}></td>
                              <td style={{ fontWeight: "bold", border: 0 }}>
                                Total
                              </td>
                              <td style={{ fontWeight: "bold" }} colSpan={2}>
                                {total}Tk
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
              <TabPanel>
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
                          className="icofont-bill"
                          style={{
                            fontSize: "130%",
                            marginRight: "5px",
                            color: "#ff8084",
                          }}
                        ></i>
                        Cash In
                      </h5>
                      <Clock />
                    </div>
                    <div
                      className="card-body"
                      style={{ paddingTop: 20, backgroundColor: "#fbfbfb" }}
                    >
                      <div className="clearfix"></div>
                      <div>
                        <div id="basicScenario" className="product-physical">
                          <form
                            style={{
                              padding: 20,
                              paddingBottom: 0,
                              paddingTop: 0,
                            }}
                            onSubmit={this.handleSubmitCashIn}
                          >
                            <div className="form-row mb-2">
                              <div className="col">
                                <label style={{ marginBottom: 5 }}>
                                  CATEGORY
                                </label>
                                <select
                                  title="Please choose a package"
                                  required
                                  name="category"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  value={this.state.category}
                                >
                                  <option value="">SELECT CATEGORY </option>
                                  <option value="LOAN">LOAN</option>
                                  <option value="INVEST">INVEST</option>
                                  <option value="OTHERS">OTHERS</option>
                                  <option value="FUND">FUND</option>
                                  <option value="PARTNER">PARTNER</option>
                                </select>
                              </div>

                              {!this.state.category ? (
                                <div className="col">
                                  <label
                                    style={{
                                      color: "#6c757d",
                                      marginBottom: 5,
                                    }}
                                  >
                                    {" "}
                                    SUB CATEGORY
                                  </label>

                                  <select
                                    title="Please choose a package"
                                    required
                                    name="selectCountry"
                                    className="custom-select"
                                    aria-required="true"
                                    aria-invalid="false"
                                    onChange={this.handleChange}
                                    value={this.state.selectCountry}
                                    aria-disabled
                                    disabled
                                  >
                                    <option value="">
                                      ***CHOOSE CATGEGORY FIRST
                                    </option>
                                  </select>
                                </div>
                              ) : (
                                this.renderSubCategory()
                              )}

                              <div className="col">
                                <label style={{ marginBottom: 5 }}>NOTE</label>
                                <input
                                  style={{ padding: 18 }}
                                  type="text"
                                  name="note"
                                  className="form-control"
                                  placeholder="ENTER ADDITIONAL NOTE"
                                  onChange={this.handleChange}
                                  value={this.state.note}
                                  required
                                />
                              </div>
                            </div>
                            <div
                              className="form-row mb-2"
                              style={{ marginTop: 20 }}
                            >
                              {" "}
                              <div className="col">
                                <label style={{ marginBottom: 5 }}>
                                  AMOUNT
                                </label>
                                <input
                                  style={{ padding: 18 }}
                                  type="text"
                                  name="amount"
                                  className="form-control"
                                  placeholder="ENTER AMOUNT"
                                  onChange={this.handleChange}
                                  value={this.state.amount}
                                  required
                                />
                              </div>
                            </div>
                            <div
                              className="form-row"
                              style={{
                                marginTop: 30,
                                justifyContent: "flex-end",
                              }}
                            >
                              <button
                                className="btn btn-primary"
                                style={{
                                  padding: "13px 20px",
                                  fontSize: 18,
                                  minWidth: 100,
                                  minHeight: 50,
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                                type="submit"
                                disabled={
                                  currentAdmin &&
                                  currentAdmin.status == "Partner"
                                    ? true
                                    : false
                                }
                              >
                                {!this.state.loader && "SUBMIT"}
                                <CircleLoader
                                  loading={this.state.loader}
                                  color="white"
                                  size={15}
                                />
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
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
                            color: "#ff8084",
                          }}
                        ></i>
                        Today's Pending Cash In
                      </h5>
                      <div>
                        <select
                          title="Filter by category"
                          required
                          name="filterCategoryCashIn"
                          className="custom-select"
                          aria-required="true"
                          aria-invalid="false"
                          onChange={this.handleChange}
                          value={this.state.filterCategoryCashIn}
                        >
                          <option value="">Filter by category </option>
                          <option value="">All </option>
                          <option value="1688 Order">1688 Order</option>
                          <option value="Product Request">
                            Product Request{" "}
                          </option>
                          <option value="Ship For Me">Ship For Me</option>
                          <option value="LOAN">LOAN</option>
                          <option value="INVEST">INVEST</option>
                          <option value="OTHERS">OTHERS</option>
                          <option value="FUND">FUND</option>
                        </select>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <table className="table table-bordered table-striped table-hover">
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
                                Sub Category
                              </th>
                              <th
                                scope="col"
                                style={{
                                  padding: "30px 15px",
                                  color: "white",
                                  backgroundColor: "#00254c",
                                }}
                              >
                                Note
                              </th>
                              <th
                                scope="col"
                                style={{
                                  padding: "30px 15px",
                                  color: "white",
                                  backgroundColor: "#00254c",
                                }}
                              >
                                Amount
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
                            {renderableCashIn.map((expense, index) => (
                              <tr key={index}>
                                <th scope="row">{index + 1}</th>
                                <td>{expense.category}</td>
                                <td>{expense.subCategory}</td>
                                <td>{expense.note}</td>
                                <td>{expense.amount}Tk</td>
                                <td>
                                  {expense.unEditable ? (
                                    ""
                                  ) : (
                                    <div
                                      className="row"
                                      style={{
                                        justifyContent: "center",
                                        display:
                                          currentAdmin &&
                                          currentAdmin.status == "Partner"
                                            ? "none"
                                            : "",
                                      }}
                                    >
                                      <i
                                        className="icofont-edit"
                                        data-toggle="modal"
                                        data-target="#personalInfoModal"
                                        onClick={() => {
                                          this.setState({
                                            expenseObj: expense,
                                            type: "cashIn",
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
                                            expenseObj: expense,
                                            type: "cashIn",
                                          });
                                        }}
                                        style={{
                                          color: "red",
                                          marginLeft: 8,
                                          cursor: "pointer",
                                        }}
                                      />
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={3} style={{ border: 0 }}></td>
                              <td style={{ fontWeight: "bold", border: 0 }}>
                                Total
                              </td>
                              <td style={{ fontWeight: "bold" }} colSpan={2}>
                                {totalCashIns}Tk
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </TabPanel>
            </Tabs>
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
                  Update Expense
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
                      CATEGORY
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="note"
                      value={expenseObj ? expenseObj.category : ""}
                      id="exampleFormControlInput1"
                      placeholder="Enter Additional Note"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                      readOnly
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
                      SUB CATEGORY
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="note"
                      value={expenseObj ? expenseObj.subCategory : ""}
                      id="exampleFormControlInput1"
                      placeholder="Enter Additional Note"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                      readOnly
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
                      NOTE
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="note"
                      onChange={(e) => {
                        const { name, value } = e.target;
                        this.setState({
                          expenseObj: { ...this.state.expenseObj, note: value },
                        });
                      }}
                      value={expenseObj ? expenseObj.note : ""}
                      id="exampleFormControlInput1"
                      placeholder="Enter Additional Note"
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
                      AMOUNT
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="amount"
                      onChange={(e) => {
                        const { name, value } = e.target;
                        this.setState({
                          expenseObj: {
                            ...this.state.expenseObj,
                            amount: value,
                          },
                        });
                      }}
                      value={expenseObj ? expenseObj.amount : ""}
                      id="exampleFormControlInput1"
                      placeholder="Enter Amount"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                {/* <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  Close
                </button> */}
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
                    if (this.state.type === "expense") {
                      this.props.updateExpenseRedux(expenseObj);
                    } else {
                      this.props.updateCashInRedux(expenseObj);
                    }
                  }}
                >
                  Save changes
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
            <div
              className="modal-content"
              style={{ top: 10, margin: "auto", minWidth: "140%" }}
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
                  Delete Expense
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
                  <div>Are you sure you want to delete this Expense?</div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{expenseObj && expenseObj.category}</td>
                      <td>{expenseObj && expenseObj.subCategory}</td>
                      <td>{expenseObj && expenseObj.note}</td>
                      <td>{expenseObj && expenseObj.amount}Tk</td>
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
                    if (this.state.type === "expense") {
                      this.props.deleteExpenseRedux(expenseObj.id);
                    } else {
                      this.props.deleteCashInRedux(expenseObj.id);
                    }
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="salaryModal"
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
              style={{ top: 10, margin: "auto", minWidth: "140%" }}
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
                  {this.state.note} Salary Details
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
                  <div style={{ fontWeight: "bold" }}>
                    {this.state.note} Salary:{" "}
                    {selectedMonths ? selectedMonths.salary : 0}Tk
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    {allExpenses.map((expense) => (
                      <tr>
                        <td>{expense.note}</td>
                        <td>{expense.date}</td>
                        <td>{expense.amount} Tk </td>
                      </tr>
                    ))}
                    <tr>
                      <td></td>
                      <td style={{ fontWeight: "bold" }}>Total </td>
                      <td style={{ fontWeight: "bold" }}>
                        {selectedMonths ? selectedMonths.amount : 0} Tk
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ fontWeight: "bold" }}>
                  Remaining Salary {remainingSalary} Tk
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  close
                </button>
              </div>
            </div>
          </div>
        </div>
        <div id="salary" data-toggle="modal" data-target="#salaryModal"></div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allExpressDocumentsRates: state.expressRatesDocuments.expressRatesDocuments,
    allOffices: state.offices.offices,
    allPromotions: state.promotions.promotions,
    allCnfs: state.cnfs.cnfs,
    allEmployees: state.employees.employees.filter(
      (employee) => employee.status == "Active"
    ),
    currentAdmin: state.admins.currentAdmin,
    expenses: state.expenses.expenses,
    cashIns: state.cashIns.cashIns,
    todaysCash: state.expenses.todaysCash,
    allUsers: state.users.users,
    allExpenses: state.expenses.singleMonth,
    allMonths: state.expenses.monthly,
    allAdmins: state.admins.admins,
  };
};

export default connect(mapStateToProps, {
  getAllDocumentExpressRatesRedux,
  getAllOfficeRedux,
  getAllPromotionRedux,
  getAllCnfRedux,
  getAllEmployeeRedux,
  uploadExpenseRedux,
  uploadCashInRedux,
  deleteExpenseRedux,
  deleteCashInRedux,
  updateExpenseRedux,
  updateCashInRedux,
  getAllPendingExpenseByDayRedux,
  getAllPendingCashInByDayRedux,
  getSingleCashSummaryRedux,
  getSingleMonthlyRedux,
  getAllMonthlyRedux,
})(DailyExpense);
