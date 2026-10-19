import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";

import {
  uploadCnfBillRedux,
  getAllCnfBillRedux,
  getAllCnfExpenseRedux,
  getAllCnfBillAllMonthsRedux,
  getAllCnfExpenseAllMonthsRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";

import { connect } from "react-redux";

export class MonthlyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      lotNumber: "",
      totalCarton: "",
      totalWeight: "",
      cartonInBd: "",
      weightInBd: "",
      bill: "",
      totalBill: "",
    };
  }

  componentDidMount = async () => {
    const [month, name] = this.props.match.params.month.split(/-(.+)/);
    this.props.getAllCnfBillRedux(month, name);
    this.props.getAllCnfExpenseRedux(month, name);
    this.props.getAllCnfBillAllMonthsRedux(name);
    this.props.getAllCnfExpenseAllMonthsRedux(name);
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
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  addBillClick = async () => {
    console.log("add bill click called");
    const [month, name] = this.props.match.params.month.split(/-(.+)/);
    let date = new Date();
    this.props.uploadCnfBillRedux({
      id: date.getTime().toString(),
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      cnf: name,
      ...this.state,
    });
  };

  render() {
    console.log(this.props);
    const [month, name] = this.props.match.params.month.split(/-(.+)/);
    let expenses = [];
    const {
      cnfBills,
      cnfExpenses,
      cnfBillsAllMonths,
      cnfExpensesAllMonths,
      currentAdmin,
    } = this.props;
    let cnfBillsTotal = 0;
    cnfBills.map((bill) => {
      cnfBillsTotal += parseInt(bill.totalBill);
    });
    let cnfExpenseTotal = 0;
    cnfExpenses.map((expense) => {
      cnfExpenseTotal += parseInt(expense.amount);
    });
    let cnfBillsTotalAllMonths = 0;
    cnfBillsAllMonths.map((bill) => {
      cnfBillsTotalAllMonths += parseInt(bill.totalBill);
    });
    let cnfExpenseTotalAllMonths = 0;
    cnfExpensesAllMonths.map((expense) => {
      cnfExpenseTotalAllMonths += parseInt(expense.amount);
    });

    return (
      <Fragment>
        <Breadcrumb title={name} parent="CNF expense" />
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
                    {month}
                  </h5>
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        marginBottom: 10,
                        fontSize: 18,
                      }}
                    >
                      {month} Monthly due {cnfBillsTotal - cnfExpenseTotal} Tk
                    </div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 19,
                      }}
                    >
                      Total Due{" "}
                      {cnfBillsTotalAllMonths - cnfExpenseTotalAllMonths}Tk
                    </div>
                  </div>
                  <button
                    className="btn "
                    style={{ backgroundColor: "darkblue", color: "white" }}
                    type="button"
                    data-toggle="modal"
                    data-target="#addBillModal"
                    disabled={
                      currentAdmin && currentAdmin.status == "Partner"
                        ? true
                        : false
                    }
                  >
                    ADD BILL
                  </button>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical row">
                    <div className="col-8" style={{ padding: 0 }}>
                      <table className="table table-bordered table-striped table-hover">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Shipment Date
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Lot Number
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Total Carton
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Total Weight
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Received Carton
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
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
                                fontSize: 12,
                              }}
                            >
                              Bill
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Total Bill
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cnfBills.map((cnf, index) => (
                            <tr key={index}>
                              <td>{cnf.date}</td>
                              <td>{cnf.lotNumber}</td>
                              <td>{cnf.totalCarton}</td>
                              <td>{cnf.totalWeight}Kg</td>
                              <td>{cnf.cartonInBd}</td>
                              <td>{cnf.weightInBd}Kg</td>
                              <td>{cnf.bill}Tk</td>
                              <td>{cnf.totalBill}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                fontWeight: "bold",
                                fontSize: 17,
                                textAlign: "end",
                              }}
                            >
                              {month} Total Bill
                            </td>
                            <td style={{ fontWeight: "bold", fontSize: 17 }}>
                              {cnfBillsTotal}Tk
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="col" style={{ padding: 0 }}>
                      <table className="table table-bordered table-striped table-hover">
                        <thead>
                          <tr>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
                              }}
                            >
                              Payment Date
                            </th>
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                                fontSize: 12,
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
                                fontSize: 12,
                              }}
                            >
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {cnfExpenses.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{expense.date}</th>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td
                              colSpan={2}
                              style={{ fontSize: 17, fontWeight: "bold" }}
                            >
                              {month} Total Paid
                            </td>
                            <td style={{ fontSize: 17, fontWeight: "bold" }}>
                              {cnfExpenseTotal}Tk
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
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
          id="addBillModal"
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
              <form onSubmit={this.addBillClick}>
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
                    ADD BILL ({name})
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
                    <div className="form-row">
                      <div className="col">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          Lot Number
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="lotNumber"
                          onChange={this.handleChange}
                          value={this.state.lotNumber}
                          id="exampleFormControlInput1"
                          placeholder="Enter Lot No"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-row mt-3">
                      <div className="col">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          Total Carton
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="totalCarton"
                          onChange={this.handleChange}
                          value={this.state.totalCarton}
                          id="exampleFormControlInput1"
                          placeholder="Total Carton"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="col">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          Total Weight
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="totalWeight"
                          onChange={this.handleChange}
                          value={this.state.totalWeight}
                          id="exampleFormControlInput1"
                          placeholder="Total Weight(kg)"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-row mt-3">
                      <div className="col">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          Received Carton (BD)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="cartonInBd"
                          onChange={this.handleChange}
                          value={this.state.cartonInBd}
                          id="exampleFormControlInput1"
                          placeholder="Recieved Carton"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                      <div className="col">
                        <label
                          style={{
                            fontWeight: "bold",
                            color: "#505050",
                            marginBottom: 5,
                          }}
                        >
                          Received Weight (BD)
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="weightInBd"
                          onChange={this.handleChange}
                          value={this.state.weightInBd}
                          id="exampleFormControlInput1"
                          placeholder="Received Weight(kg)"
                          style={{
                            borderColor: "gainsboro",
                            borderRadius: 5,
                          }}
                        />
                      </div>
                    </div>
                    <div className="form-group mt-3">
                      <label
                        style={{
                          fontWeight: "bold",
                          color: "#505050",
                          marginBottom: 5,
                        }}
                      >
                        Bill
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="bill"
                        onChange={this.handleChange}
                        value={this.state.bill}
                        id="exampleFormControlInput1"
                        placeholder="perkg"
                        style={{
                          borderColor: "gainsboro",
                          borderRadius: 5,
                        }}
                      />
                    </div>
                    <div className="form-group mt-3">
                      <label
                        style={{
                          fontWeight: "bold",
                          color: "#505050",
                          marginBottom: 5,
                        }}
                      >
                        Total Bill
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        name="totalBill"
                        onChange={this.handleChange}
                        value={this.state.totalBill}
                        id="exampleFormControlInput1"
                        placeholder="Total Bill"
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
                    type="submit"
                    className="btn "
                    data-dismiss="modal"
                    style={{
                      backgroundColor: "darkorange",
                      color: "white",
                      padding: 8,
                      borderRadius: 5,
                      fontWeight: "lighter",
                    }}
                    onClick={this.addBillClick}
                  >
                    Add Bill
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    cnfBills: state.cnfs.cnfBills,
    cnfExpenses: state.cnfs.cnfExpenses,
    cnfBillsAllMonths: state.cnfs.cnfBillsAllMonths,
    cnfExpensesAllMonths: state.cnfs.cnfExpensesAllMonths,
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  uploadCnfBillRedux,
  getAllCnfBillRedux,
  getAllCnfExpenseRedux,
  getAllCnfExpenseAllMonthsRedux,
  getAllCnfBillAllMonthsRedux,
})(MonthlyExpense);
