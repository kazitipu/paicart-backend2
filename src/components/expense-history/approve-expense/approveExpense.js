import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./approveExpenseDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import {
  getAllPendingExpensesRedux,
  getAllPendingCashInsRedux,
} from "../../../actions/index";

import { connect } from "react-redux";

export class ApproveExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {
    this.props.getAllPendingExpensesRedux();
    this.props.getAllPendingCashInsRedux();
  };

  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
  };

  render() {
    const { open } = this.state;
    const { pendingExpenses, pendingCashIns } = this.props;
    let expenseDates = [
      ...new Set(pendingExpenses.map((expense) => expense.date)),
    ];
    let cashInDates = [
      ...new Set(pendingCashIns.map((expense) => expense.date)),
    ];

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Approve Cash In/Out" parent="expense-history" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <Tabs>
            <TabList
              className="nav nav-tabs tab-coupon"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
              }}
            >
              <Tab
                className="nav-link"
                onClick={(e) => this.clickActive(e)}
                style={{ fontSize: 25 }}
              >
                Cash Out
              </Tab>

              <Tab
                className="nav-link"
                onClick={(e) => this.clickActive(e)}
                style={{ fontSize: 25 }}
              >
                Cash In
              </Tab>
            </TabList>
            <TabPanel>
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
                        className="icofont-list"
                        style={{
                          fontSize: "130%",
                          marginRight: "5px",
                          color: "darkblue",
                        }}
                      ></i>
                      Pending Cash Out
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="clearfix"></div>
                    <div id="basicScenario" className="product-physical">
                      <Datatable
                        startToggleModal={this.startToggleModal}
                        history={this.props.history}
                        multiSelectOption={false}
                        myData={expenseDates}
                        pageSize={50}
                        pagination={true}
                        class="-striped -highlight"
                        type="expense"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
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
                        className="icofont-list"
                        style={{
                          fontSize: "130%",
                          marginRight: "5px",
                          color: "darkblue",
                        }}
                      ></i>
                      Pending Cash In
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="clearfix"></div>
                    <div id="basicScenario" className="product-physical">
                      <Datatable
                        startToggleModal={this.startToggleModal}
                        history={this.props.history}
                        multiSelectOption={false}
                        myData={cashInDates}
                        pageSize={50}
                        pagination={true}
                        class="-striped -highlight"
                        type="cashIn"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allEmployees: state.employees.employees,
    pendingExpenses: state.expenses.pendingExpenses,
    pendingCashIns: state.cashIns.pendingCashIns,
  };
};

export default connect(mapStateToProps, {
  getAllPendingExpensesRedux,
  getAllPendingCashInsRedux,
})(ApproveExpense);
