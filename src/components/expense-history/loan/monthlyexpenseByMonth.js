import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

import {
  getSingleMonthlyLoanCashOutRedux,
  getSingleMonthlyLoanCashInRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";

import { connect } from "react-redux";

export class MonthlyExpenseByMonth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {
    const [type, month] = this.props.match.params.month.split("-");
    if (type === "expense") {
      this.props.getSingleMonthlyLoanCashOutRedux(month, "LOAN");
    } else {
      this.props.getSingleMonthlyLoanCashInRedux(month, "LOAN");
    }
  };

  startToggleModal = async (employeeObj) => {
    if (employeeObj == null) {
      this.setState({ toggleModal: !this.state.toggleModal, employee: null });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
        employee: employeeObj,
      });
    }
  };

  render() {
    const { open } = this.state;
    const { allExpenses, allCashIns } = this.props;
    const [type, month] = this.props.match.params.month.split("-");

    let totalCashIn = 0;
    let totalCashOut = 0;
    allExpenses.map((expense) => {
      totalCashOut += parseInt(expense.amount);
    });
    allCashIns.map((cashIn) => {
      totalCashIn += parseInt(cashIn.amount);
    });
    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb
          title={type === "expense" ? "Cash Out" : "Cash In"}
          parent="Loan"
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
                    {month} (LOAN)
                  </h5>
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
                          {this.props.allExpenses.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.date}</td>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={4} style={{ border: 0 }}></td>
                            <td style={{ fontWeight: "bold", border: 0 }}>
                              Total
                            </td>
                            <td style={{ fontWeight: "bold" }}>
                              {totalCashOut}Tk
                            </td>
                          </tr>
                        </tbody>
                      ) : (
                        <tbody>
                          {this.props.allCashIns.map((expense, index) => (
                            <tr key={index}>
                              <th scope="row">{index + 1}</th>
                              <td>{expense.date}</td>
                              <td>{expense.category}</td>
                              <td>{expense.subCategory}</td>
                              <td>{expense.note}</td>
                              <td>{expense.amount}Tk</td>
                            </tr>
                          ))}
                          <tr>
                            <td colSpan={4} style={{ border: 0 }}></td>
                            <td style={{ fontWeight: "bold", border: 0 }}>
                              Total
                            </td>
                            <td style={{ fontWeight: "bold" }}>
                              {totalCashIn}Tk
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
    allExpenses: state.loans.monthlyCashOuts,
    allCashIns: state.loans.monthlyCashIns,
  };
};

export default connect(mapStateToProps, {
  getSingleMonthlyLoanCashInRedux,
  getSingleMonthlyLoanCashOutRedux,
})(MonthlyExpenseByMonth);
