import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseByMonthDatatable";

import {
  getSingleMonthlyExpenseRedux,
  getSingleMonthlyCashInRedux,
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
      filterCategoryCashIn: "",
      filterCategoryCashOut: "",
    };
  }

  componentDidMount = async () => {
    const [type, month] = this.props.match.params.month.split("-");
    if (type === "expense") {
      this.props.getSingleMonthlyExpenseRedux(month);
    } else {
      this.props.getSingleMonthlyCashInRedux(month);
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

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  render() {
    const { open } = this.state;
    const [type, month] = this.props.match.params.month.split("-");
    console.log(this.props);
    let totalCashIns = 0;
    let totalCashOuts = 0;
    let renderableExpense = this.props.allExpenses;
    if (this.state.filterCategoryCashOut) {
      renderableExpense = this.props.allExpenses.filter(
        (expense) =>
          expense.category &&
          expense.category.toLowerCase() ==
            this.state.filterCategoryCashOut.toLowerCase()
      );
    }
    renderableExpense.map((expense) => {
      totalCashOuts += parseInt(expense.amount);
    });

    let renderableCashIn = this.props.allCashIns;
    if (this.state.filterCategoryCashIn) {
      renderableCashIn = this.props.allCashIns.filter(
        (expense) =>
          expense.category &&
          expense.category.toLowerCase() ==
            this.state.filterCategoryCashIn.toLowerCase()
      );
    }
    renderableCashIn.map((cashIn) => {
      totalCashIns += parseInt(cashIn.amount);
    });

    return (
      <Fragment>
        <Breadcrumb
          title={type === "expense" ? "Cash Out" : "Cash In"}
          parent="expense history"
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
                    {month}
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
                  <div style={{ fontWeight: "bold", marginBottom: 5 }}>
                    Total:
                    {type == "expense" ? totalCashOuts : totalCashIns}Tk
                  </div>
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={
                        type === "expense"
                          ? renderableExpense
                          : renderableCashIn
                      }
                      pageSize={50}
                      pagination={true}
                      class="-striped -highlight"
                    />
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
    allExpenses: state.expenses.singleMonthExpense,
    allCashIns: state.cashIns.singleMonthCashIn,
  };
};

export default connect(mapStateToProps, {
  getSingleMonthlyExpenseRedux,
  getSingleMonthlyCashInRedux,
})(MonthlyExpenseByMonth);
