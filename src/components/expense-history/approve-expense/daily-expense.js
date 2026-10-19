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
  getSingleCashSummaryRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import Clock from "./clock";
import { CircleLoader } from "react-spinners";
import {
  approveExpense,
  approveCashIn,
  updateCashSummaryCashOut,
  updateCashSummaryCashIn,
} from "../../../firebase/firebase.utils";
export class DailyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      singleLot: null,
      expenseObj: null,
      loader: false,
      filterCategoryCashIn: "",
      filterCategoryCashOut: "",
    };
  }

  componentDidMount = async () => {
    const { expenses, allOffices, allCnfs, allEmployees } = this.props;
    let [type, day, month, year] = this.props.match.params.date.split("-");

    day = parseInt(day);
    month = parseInt(month) - 1;
    year = parseInt(year);
    let date = new Date(year, month, day);

    if (type === "expense") {
      this.props.getAllPendingExpenseByDayRedux(
        date.toLocaleDateString("en-GB")
      );
    } else {
      this.props.getAllPendingCashInByDayRedux(
        date.toLocaleDateString("en-GB")
      );
    }
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { expenseObj } = this.state;
    const {
      expenses,
      allOffices,
      allCnfs,
      allEmployees,
      cashIns,
      currentAdmin,
    } = this.props;
    let [type, day, month, year] = this.props.match.params.date.split("-");
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
        <Breadcrumb
          title={type === "expense" ? "Cash Out" : "Cash In"}
          parent="Daily Expense"
        />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
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
                  <div style={{ display: "flex", flexDirection: "row" }}>
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
                          <option value="AGENT COMMISION">
                            AGENT COMMISION
                          </option>
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
                          <option value="Product Request">
                            Product Request
                          </option>
                          <option value="Ship For Me">Ship For Me</option>
                          <option value="LOAN">LOAN</option>
                          <option value="INVEST">INVEST</option>
                          <option value="OTHERS">OTHERS</option>
                          <option value="FUND">FUND</option>
                        </select>
                      </div>
                    )}
                    <button
                      style={{
                        padding: 12,
                        backgroundColor: "darkgreen",
                        color: "white",
                        borderRadius: 5,
                        border: "none",
                        cursor: "pointer",
                        marginLeft: 10,
                        marginTop: -2,
                      }}
                      data-toggle="modal"
                      data-target="#approveExpenseModal"
                      disabled={
                        currentAdmin && currentAdmin.status == "Partner"
                          ? true
                          : false
                      }
                    >
                      <i className="icofont-tick-mark" /> Approve
                    </button>
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
                      {type === "expense" ? (
                        <tbody>
                          {renderableExpense.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                              <td>
                                {currentAdmin &&
                                currentAdmin.adminId ===
                                  "KEd9E4BHofTnhbZbJlViinz3g1G3" ? (
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
                                          expenseObj: expense,
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
                                        });
                                      }}
                                      style={{
                                        color: "red",
                                        marginLeft: 8,
                                        cursor: "pointer",
                                      }}
                                    />
                                  </div>
                                ) : expense.unEditable ? (
                                  ""
                                ) : (
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
                                          expenseObj: expense,
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
                      ) : (
                        <tbody>
                          {renderableCashIn.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                              <td>
                                {currentAdmin &&
                                currentAdmin.adminId ==
                                  "KEd9E4BHofTnhbZbJlViinz3g1G3" ? (
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
                                          expenseObj: expense,
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
                                        });
                                      }}
                                      style={{
                                        color: "red",
                                        marginLeft: 8,
                                        cursor: "pointer",
                                      }}
                                    />
                                  </div>
                                ) : expense.unEditable ? (
                                  ""
                                ) : (
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
                                          expenseObj: expense,
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
                    if (type === "expense") {
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
                    if (type === "expense") {
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
          id="approveExpenseModal"
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
                  Approve {type === "expense" ? "Cash Out" : "Cash In"}
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
                  <div>
                    Are you sure you want to approve{" "}
                    {type === "expense" ? "Cash Out" : "Cash In"} of{" "}
                    <span style={{ color: "red", fontWeight: "bold" }}>
                      {date.toDateString()}
                    </span>
                    ?
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                  style={{ minHeight: 40 }}
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn "
                  // data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    minHeight: 40,
                    minWidth: 70,
                    textAlign: "center",
                  }}
                  onClick={async () => {
                    this.setState({ loader: true });
                    if (type === "expense") {
                      let expenseDate = renderableExpense[0].date;
                      let expenseMonth = renderableExpense[0].month;
                      for (let i = 0; i < renderableExpense.length; i++) {
                        await approveExpense(renderableExpense[i]);
                      }
                      await updateCashSummaryCashOut(
                        expenseMonth,
                        expenseDate,
                        total
                      );
                    } else {
                      let cashInDate = renderableCashIn[0].date;
                      let cashInMonth = renderableCashIn[0].month;
                      for (let i = 0; i < renderableCashIn.length; i++) {
                        await approveCashIn(renderableCashIn[i]);
                      }
                      await updateCashSummaryCashIn(
                        cashInMonth,
                        cashInDate,
                        totalCashIns
                      );
                    }

                    this.setState({ loader: false });
                    document.getElementById("dismiss-modal").click();
                    this.props.history.push("/expense/approve-expense");
                  }}
                >
                  {!this.state.loader && "Yes"}

                  {this.state.loader && (
                    <div style={{ marginTop: -5, marginLeft: -8 }}>
                      <CircleLoader
                        loading={this.state.loader}
                        color="white"
                        size={15}
                      />
                    </div>
                  )}
                </button>
              </div>
            </div>
            <button data-dismiss="modal" id="dismiss-modal"></button>
          </div>
        </div>
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
  getSingleCashSummaryRedux,
})(DailyExpense);
