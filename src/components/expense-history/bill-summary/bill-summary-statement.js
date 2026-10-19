import React, { Component, Fragment } from "react";

import { connect } from "react-redux";
import "./css/invoice-by-order.css";
import Alg from "./alg.png";

import { withRouter } from "react-router-dom";
import { getSingleMonthlyCashSummaryRedux } from "../../../actions";
export class OnlyInvoieToPrint extends Component {
  state = {
    userObj: null,
    orderObj: null,
  };
  componentDidMount = async () => {
    this.props.getSingleMonthlyCashSummaryRedux(this.props.match.params.month);
  };

  render() {
    const { allExpenses } = this.props;
    let totalCashIn = 0;
    if (allExpenses.length > 0) {
      allExpenses.map((expense) => {
        totalCashIn += parseInt(expense.totalCashIns);
      });
    }
    let totalCashOut = 0;
    if (allExpenses.length > 0) {
      allExpenses.map((expense) => {
        totalCashOut += parseInt(expense.totalCashOuts);
      });
    }
    let closingBalance = 0;
    if (allExpenses.length > 0) {
      let expense = allExpenses.slice(-1)[0];
      closingBalance = parseInt(expense.remainingBalance) + 500000;
    }
    let date = new Date();
    return (
      <div
        id="container"
        className="container-div"
        style={{
          maxWidth: "1000px",
          borderRadius: ".2rem",
          border: "1px solid gainsboro",
        }}
      >
        <section id="memo" style={{ height: "auto" }}>
          <div className="logo">
            <img src={Alg} style={{ height: "auto", width: "200px" }} />
          </div>
          <div style={{ marginLeft: 5 }} className="company-info">
            <span>
              Suit#2F, (2nd floor) Tropical Razia Shopping Complex &nbsp;
            </span>{" "}
            <br />
            <span>26/10 Chamelibagh, Santinagar, Dhaka 1217</span>
            <br />
            <span>Hotline: 01979653009</span>
            <br />
            <span>
              {" "}
              <span>info@paicart.com</span>
            </span>
          </div>
        </section>

        <section>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              marginLeft: 35,
              marginTop: 10,
              marginRight: 35,
            }}
          >
            <div>
              <div style={{ fontWeight: "bold", color: "black" }}>
                Monthly Statement
              </div>
              <div style={{ color: "#333" }}>
                Statement Print Date:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  {date.toLocaleDateString("en-GB")}
                </span>
              </div>
              <div style={{ color: "#333" }}>
                Statement Month:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  {this.props.match.params.month}
                </span>
              </div>
              <div style={{ color: "#333" }}>
                Currency:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>BDT</span>
              </div>
            </div>
            <div>
              <div style={{ fontWeight: "bold", color: "black" }}>
                {this.props.match.params.month} Summary
              </div>
              <div style={{ color: "#333" }}>
                Total Cash In:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  {totalCashIn}Tk
                </span>
              </div>
              <div style={{ color: "#333" }}>
                Total Cash Out:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  {totalCashOut}Tk
                </span>
              </div>
              <div style={{ color: "#333" }}>
                Closing Balance:{" "}
                <span style={{ fontWeight: "bold", color: "black" }}>
                  {closingBalance}Tk
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="clearfix"></div>

        <div className="clearfix"></div>

        <section id="items" style={{ marginTop: 15 }}>
          <table cellPadding="0" cellSpacing="0">
            <tbody>
              <tr>
                <th className="t-header">#</th>
                <th className="t-header" style={{ maxWidth: "50px" }}>
                  Date
                </th>
                <th className="t-header">Previous Cash</th>
                <th className="t-header">Cash In</th>
                <th className="t-header">Cash Out</th>
                <th className="t-header">Remaining Balance</th>
              </tr>
              {allExpenses.length > 0 &&
                allExpenses.map((expense, index) => (
                  <tr data-iterate="item">
                    <td
                      className="t-data"
                      style={{
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      className="t-data"
                      style={{
                        maxWidth: "50px",
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {expense.date}
                    </td>
                    <td
                      className="t-data"
                      style={{
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {parseInt(expense.previousCash) + 500000}Tk
                    </td>
                    <td
                      className="t-data"
                      style={{
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {expense.totalCashIns}Tk
                    </td>
                    <td
                      className="t-data"
                      style={{
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {expense.totalCashOuts}Tk
                    </td>
                    <td
                      className="t-data"
                      style={{
                        fontWeight: "bold",
                        borderBottom:
                          index + 1 == allExpenses.length
                            ? "1px solid black"
                            : "none",
                      }}
                    >
                      {parseInt(expense.remainingBalance) + 500000}Tk
                    </td>
                  </tr>
                ))}
              <div style={{ marginBottom: 40 }}></div>
            </tbody>
          </table>
          <div
            style={{
              marginBottom: 40,
              display: "flex",
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            <span style={{ fontWeight: "bold", color: "black" }}>Note:</span>{" "}
            &nbsp; This statement should only be used by authorized person from
            PAICART
          </div>
        </section>
      </div>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {
    allExpenses: state.expenses.singleMonthCashSummary,
  };
};
export default withRouter(
  connect(mapStateToProps, { getSingleMonthlyCashSummaryRedux })(
    OnlyInvoieToPrint
  )
);
