import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";

import { Link } from "react-router-dom";
import { getAllPartnerCashIn } from "../../../firebase/firebase.utils";
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
      cashIns: [],
    };
  }

  componentDidMount = async () => {
    const adminId = this.props.match.params.id;
    let cashIns = await getAllPartnerCashIn(adminId);
    this.setState({
      cashIns: cashIns,
    });
  };
  componentWillReceiveProps = async (nextProps) => {
    const adminId = nextProps.match.params.id;
    if (this.props.match.params.id !== nextProps.match.params.id) {
      console.log("getting called database");
      let cashIns = await getAllPartnerCashIn(adminId);
      this.setState({
        cashIns: cashIns,
      });
    }
  };

  render() {
    console.log(this.props);
    const { allAdmins } = this.props;
    const partner = allAdmins.find(
      (admin) => admin.adminId == this.props.match.params.id
    );

    let partnerCashinTotal = 0;
    this.state.cashIns.map((cashIn) => {
      partnerCashinTotal += parseInt(cashIn.amount);
    });

    return (
      <Fragment>
        <Breadcrumb title={partner?.name} parent="Partner Payment" />
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
                    {partner?.name}
                  </h5>
                  <div>
                    <div
                      style={{
                        fontWeight: "bold",
                        fontSize: 19,
                      }}
                    >
                      Total Investment: {partnerCashinTotal}Tk
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical row">
                    {/* <div className="col-8" style={{ padding: 0 }}>
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
                    </div> */}
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
                          {this.state.cashIns.map((expense, index) => (
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
                              Total Investment
                            </td>
                            <td style={{ fontSize: 17, fontWeight: "bold" }}>
                              {partnerCashinTotal}Tk
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
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
    allAdmins: state.admins.admins,
  };
};

export default connect(mapStateToProps, {})(MonthlyExpense);
