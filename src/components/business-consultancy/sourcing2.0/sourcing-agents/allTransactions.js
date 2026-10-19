import React, { Component, Fragment } from "react";

import "react-toastify/dist/ReactToastify.css";

import { getAllTransactionRedux } from "../../../../actions/index";

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
    this.props.getAllTransactionRedux(this.props.agent, this.props.month);
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

  render() {
    console.log(this.props);

    let expenses = [];
    const { cnfBills, cnfExpenses, transactions } = this.props;

    let sortedTransfers = transactions.sort((a, b) => b.id - a.id);
    if (this.props.selectedTab == "rmb") {
      sortedTransfers = sortedTransfers.filter(
        (transfer) => transfer.fundType == "RMB"
      );
    }
    if (this.props.selectedTab == "rupee") {
      sortedTransfers = sortedTransfers.filter(
        (transfer) => transfer.fundType == "RUPEES"
      );
    }

    return (
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
              {this.props.month}
            </h5>
          </div>

          <div className="card-body">
            <div className="clearfix"></div>
            <div id="basicScenario" className="product-physical row">
              <div className="col" style={{ padding: 0 }}>
                <table
                  className={`table table-bordered table-striped table-hover ${
                    window.innerWidth < 600 ? "table-responsive" : ""
                  }`}
                >
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
                        Date
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
                        Fund Type
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
                        Fund from
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
                        {this.props.selectedTab} buy Rate
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
                        Total Amount
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
                        Total Received {this.props.selectedTab}
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
                        Image
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
                        Tracking No
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
                        Order Id
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
                        Product Type
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
                      <th
                        scope="col"
                        style={{
                          padding: "30px 15px",
                          color: "white",
                          backgroundColor: "#00254c",
                          fontSize: 12,
                        }}
                      >
                        Total Paid {this.props.selectedTab}
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
                        Remaining balance
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
                        Entry By
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTransfers.map((transfer, index) => (
                      <tr key={index}>
                        <td>{transfer.date}</td>
                        <td
                          style={{
                            color: "green",
                          }}
                        >
                          {!transfer.country && transfer.fundType}
                        </td>
                        <td
                          style={{
                            color: "green",
                          }}
                        >
                          {!transfer.country && transfer.subCategory}
                        </td>

                        <td
                          style={{
                            color: "green",
                          }}
                        >
                          {!transfer.country && transfer.note
                            ? `${transfer.note.slice(10)}Tk`
                            : ""}
                        </td>
                        <td
                          style={{
                            color: "green",
                          }}
                        >
                          {!transfer.country && transfer.amount
                            ? `${transfer.amount} Tk`
                            : ""}
                        </td>
                        <td
                          style={{
                            color: "green",
                          }}
                        >
                          {!transfer.country && transfer.totalRmb
                            ? `+${transfer.totalRmb} ${this.props.selectedTab}`
                            : ""}
                        </td>

                        <td
                          style={{
                            color: "rgb(15 91 151)",
                            fontWeight: "bold",
                          }}
                        >
                          {transfer.country && (
                            <a href={transfer.productImage} target="_blank">
                              <img
                                src={transfer.country && transfer.productImage}
                                style={{
                                  minHeight: 60,
                                  maxHeight: 60,
                                  minWidth: 60,
                                  maxWidth: 60,
                                  border: "2px solid gray",
                                  borderRadius: 10,
                                  cursor: "pointer",
                                }}
                              />
                            </a>
                          )}
                        </td>
                        <td
                          style={{
                            color: "rgb(15 91 151)",
                            fontWeight: "bold",
                          }}
                        >
                          {transfer.country && transfer.trackingNo}
                        </td>
                        <td
                          style={{
                            color: "rgb(15 91 151)",
                          }}
                        >
                          {transfer.country && transfer.paidInvoice}
                        </td>

                        <td
                          style={{
                            color: "rgb(15 91 151)",
                          }}
                        >
                          {transfer.country && transfer.productType}
                        </td>
                        <td
                          style={{
                            color: "rgb(15 91 151)",
                          }}
                        >
                          {transfer.country && transfer.totalRmb
                            ? `${transfer.totalRmb} ${this.props.selectedTab}`
                            : ""}
                        </td>
                        <td
                          style={{
                            color: "rgb(15 91 151)",
                          }}
                        >
                          {transfer.country && transfer.amount
                            ? `-${transfer.amount} ${this.props.selectedTab}`
                            : ""}
                        </td>
                        <td
                          style={{
                            fontWeight: "bold",
                            color: transfer.fundType ? "darkgreen" : "darkred",
                          }}
                        >
                          {transfer.fundType === "RMB"
                            ? `${parseFloat(transfer.rmbBalance).toFixed(
                                2
                              )} Rmb`
                            : `${parseFloat(transfer.rupeeBalance).toFixed(
                                2
                              )} Rupees`}
                        </td>

                        <td style={{ fontWeight: "bold" }}>
                          {transfer.expenseBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    cnfBills: state.cnfs.cnfBills,
    cnfExpenses: state.cnfs.cnfExpenses,
    transactions: state.employees.transactions,
  };
};

export default connect(mapStateToProps, {
  getAllTransactionRedux,
})(MonthlyExpense);
