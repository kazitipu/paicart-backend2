import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import {
  uploadExpenseRedux,
  getAllPendingExpenseByDayRedux,
  getAllPendingCashInByDayRedux,
  deleteExpenseRedux,
  updateExpenseRedux,
  approveExpenseRedux,
  updateCashInRedux,
  deleteCashInRedux,
  getAllExpenseRedux,
  getAllCashInsRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";

export class DailyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      singleLot: null,
      expenseObj: null,
      loader: false,
      type: "expense",
      filterCategoryCashIn: "",
      filterCategoryCashOut: "",
    };
  }

  componentDidMount = async () => {
    const { expenses, allOffices, allCnfs, allEmployees } = this.props;
    let [day, month, year] = this.props.match.params.date.split("-");
    day = parseInt(day);
    month = parseInt(month) - 1;
    year = parseInt(year);
    let date = new Date(year, month, day);
    this.props.getAllExpenseRedux(date.toLocaleDateString("en-GB"));
    this.props.getAllCashInsRedux(date.toLocaleDateString("en-GB"));
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
  };

  render() {
    const { expenseObj, type } = this.state;
    const { expenses, allOffices, allCnfs, allEmployees, cashIns } = this.props;
    let [day, month, year] = this.props.match.params.date.split("-");
    day = parseInt(day);
    month = parseInt(month) - 1;
    year = parseInt(year);
    let date = new Date(year, month, day);
    console.log(date.toDateString());

    console.log(this.props);
    let total = 0;
    let totalCashIns = 0;

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
    return (
      <Fragment>
        <Breadcrumb title={date.toDateString()} parent="bill history" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
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
                onClick={(e) => {
                  this.setState({ type: "expense" });
                  this.clickActive(e);
                }}
                style={{ fontSize: 25 }}
              >
                Cash Out
              </Tab>

              <Tab
                className="nav-link"
                onClick={(e) => {
                  this.setState({ type: "cashIn" });
                  this.clickActive(e);
                }}
                style={{ fontSize: 25 }}
              >
                Cash In
              </Tab>
            </TabList>
          </Tabs>
          <div className="row">
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
                        color: "#ff8084",
                      }}
                    ></i>
                    {date.toDateString()}
                  </h5>
                  {type === "expense" ? (
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
                        <option value="AGENT COMMISION">AGENT COMMISION</option>
                        <option value="MONTHLY INSTALLMENT">
                          MONTHLY INSTALLMENT
                        </option>
                        <option value="LOT TRANSPORT">LOT TRANSPORT</option>
                      </select>
                    </div>
                  ) : (
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
                        <option value="Product Request">Product Request</option>
                        <option value="Ship For Me">Ship For Me</option>
                        <option value="LOAN">LOAN</option>
                        <option value="INVEST">INVEST</option>
                        <option value="OTHERS">OTHERS</option>
                        <option value="FUND">FUND</option>
                      </select>
                    </div>
                  )}
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
                        </tr>
                      </thead>
                      {type === "expense" ? (
                        <tbody>
                          {renderableExpense.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} style={{ border: 0 }}></td>
                            <td style={{ fontWeight: "bold", border: 0 }}>
                              Total
                            </td>
                            <td style={{ fontWeight: "bold" }}>{total}Tk</td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {renderableCashIn.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={3} style={{ border: 0 }}></td>
                            <td style={{ fontWeight: "bold", border: 0 }}>
                              Total
                            </td>
                            <td style={{ fontWeight: "bold" }}>
                              {totalCashIns}Tk
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
    expenses: state.expenses.expenses,
    cashIns: state.cashIns.cashIns,
  };
};

export default connect(mapStateToProps, {
  uploadExpenseRedux,
  deleteExpenseRedux,
  deleteCashInRedux,
  updateCashInRedux,
  updateExpenseRedux,
  getAllPendingExpenseByDayRedux,
  getAllPendingCashInByDayRedux,
  approveExpenseRedux,
  getAllExpenseRedux,
  getAllCashInsRedux,
})(DailyExpense);
