import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import {
  getAllLoansCashInCustomerRedux,
  getAllLoansCashOutCustomerRedux,
} from "../../../actions/index";

import { connect } from "react-redux";

import { DollarSign } from "react-feather";
export class SingleCustomer extends Component {
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
      category: "",
      subCategory: "",
      note: "",
      amount: "",
      expenseObj: null,
      cursor: -1,
    };
  }

  componentDidMount = async () => {
    this.props.getAllLoansCashInCustomerRedux(this.props.match.params.customer);
    this.props.getAllLoansCashOutCustomerRedux(
      this.props.match.params.customer
    );
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { expenses, cashIns, todaysCash } = this.props;
    let total = 0;
    let totalCashIns = 0;
    expenses.map((expense) => {
      total += parseInt(expense.amount);
    });
    cashIns.map((cashIn) => {
      totalCashIns += parseInt(cashIn.amount);
    });
    let all = [...expenses, ...cashIns];
    return (
      <Fragment>
        <Breadcrumb
          title={all.length > 0 && all[all.length - 1].subCategory}
          parent="Loan summary"
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
                      className="icofont-user-alt-3"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#ff8084",
                      }}
                    ></i>
                    {all.length > 0 && all[all.length - 1].subCategory}
                  </h5>
                </div>

                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <div className="row">
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
                                Cash Out
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {expenses.map((expense, index) => (
                              <tr key={index}>
                                <td>{expense.date}</td>

                                <td>{expense.note}</td>
                                <td>{expense.amount}Tk</td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ border: 0 }}></td>
                              <td style={{ fontWeight: "bold", border: 0 }}>
                                Total
                              </td>
                              <td style={{ fontWeight: "bold" }}>{total}Tk</td>
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
                                Cash In
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {cashIns.map((expense, index) => (
                              <tr key={index}>
                                <td>{expense.date}</td>

                                <td>{expense.note}</td>
                                <td>{expense.amount}Tk</td>
                              </tr>
                            ))}
                            <tr>
                              <td style={{ border: 0 }}></td>
                              <td style={{ fontWeight: "bold", border: 0 }}>
                                Total
                              </td>
                              <td style={{ fontWeight: "bold" }}>
                                {totalCashIns}Tk
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
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    cashIns: state.loans.singleCustomerCashIns,
    expenses: state.loans.singleCustomerCashOuts,
  };
};

export default connect(mapStateToProps, {
  getAllLoansCashInCustomerRedux,
  getAllLoansCashOutCustomerRedux,
})(SingleCustomer);
