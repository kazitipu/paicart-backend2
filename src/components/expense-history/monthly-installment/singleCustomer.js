import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import {
  getAllInstallmentsCashOutCustomerRedux,
  getSingleCustomerLoanRedux,
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
    this.props.getAllInstallmentsCashOutCustomerRedux(
      this.props.match.params.customer
    );
    this.props.getSingleCustomerLoanRedux(this.props.match.params.customer);
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { expenses, cashIns, todaysCash, customerLoan } = this.props;
    let total = 0;
    let totalCashIns = 0;
    expenses.map((expense) => {
      total += parseInt(expense.amount);
    });

    let all = [...expenses];

    return (
      <Fragment>
        <Breadcrumb
          title={all.length > 0 && all[all.length - 1].subCategory}
          parent="Loan summary"
        />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <div className="col-xl-3 col-md-6 xl-50">
              <div className="card o-hidden widget-cards">
                <div
                  className="card-body"
                  style={{ backgroundColor: "darkgreen" }}
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
                        Total Loan amount
                      </span>
                      <h3 className="mb-0">
                        <CountUp
                          className="counter"
                          end={customerLoan && customerLoan.amount}
                        />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
    expenses: state.installments.singleCustomerCashOuts,
    customerLoan: state.installments.loan,
  };
};

export default connect(mapStateToProps, {
  getAllInstallmentsCashOutCustomerRedux,
  getSingleCustomerLoanRedux,
})(SingleCustomer);
