import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";

import { getAllFundsRedux } from "../../../actions/index";

import { connect } from "react-redux";

export class Fund extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      singleLot: null,
      expenseObj: null,
      loader: false,
    };
  }

  componentDidMount = async () => {
    this.props.getAllFundsRedux();
  };

  render() {
    const { funds } = this.props;

    let total = 0;

    funds.map((expense) => (total += parseInt(expense.amount)));
    let balance = 0;
    let renderableFunds = funds.map((fund) => {
      if (fund.type === "expense") {
        balance += parseInt(fund.amount);
        return { ...fund, balance };
      } else {
        balance -= parseInt(fund.amount);
        return { ...fund, balance };
      }
    });

    return (
      <Fragment>
        <Breadcrumb title={"Fund"} parent="Office" />
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
                    Paicart Fund
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
                            Balance
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {renderableFunds.map((fund, index) => (
                          <tr key={index}>
                            <th
                              scope="row"
                              style={{
                                color: fund.type == "cashIn" ? "red" : "green",
                              }}
                            >
                              {index + 1}
                            </th>
                            <td
                              style={{
                                color: fund.type == "cashIn" ? "red" : "green",
                              }}
                            >
                              {fund.date}
                            </td>
                            <td
                              style={{
                                color: fund.type == "cashIn" ? "red" : "green",
                              }}
                            >
                              {fund.category}
                            </td>
                            <td
                              style={{
                                color: fund.type == "cashIn" ? "red" : "green",
                              }}
                            >
                              {fund.note}
                            </td>
                            <td
                              style={{
                                color: fund.type == "cashIn" ? "red" : "green",
                              }}
                            >
                              {fund.type == "cashIn" ? "-" : "+"}
                              {fund.amount}
                              Tk
                            </td>
                            <td
                              style={{
                                fontWeight: "bold",
                              }}
                            >
                              {fund.balance}
                              Tk
                            </td>
                          </tr>
                        ))}
                        <tr>
                          <td colSpan={4} style={{ border: 0 }}></td>
                          <td style={{ fontWeight: "bold", border: 0 }}>
                            Total
                          </td>
                          <td style={{ fontWeight: "bold" }}>
                            {renderableFunds.length > 0 &&
                              renderableFunds[renderableFunds.length - 1]
                                .balance}
                            Tk
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
        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
    funds: state.expenses.funds,
  };
};

export default connect(mapStateToProps, {
  getAllFundsRedux,
})(Fund);
