import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllMonthlyRedux } from "../../../actions/index";
import { Link } from "react-router-dom";

import { connect } from "react-redux";

export class MonthlyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
      category: "1688-orders",
    };
  }

  componentDidMount = async () => {
    this.props.getAllMonthlyRedux("REFUND", "REFUND PURPOSE");
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

  clickActive = (event, category) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
    this.setState({
      category: category,
      subCategory: "",
      note: "",
      amount: "",
    });
  };

  render() {
    const { open } = this.state;

    let months = [];
    if (this.props.allMonths && this.props.allMonths.length > 0) {
      if (this.state.category === "1688-orders") {
        months = this.props.allMonths.filter(
          (month) => month.subCategory === "1688 Orders"
        );
      } else {
        months = this.props.allMonths.filter(
          (month) => month.subCategory === "Product Request"
        );
      }
    }

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="monthly-expense" parent="expense-history" />
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
                      className="icofont-list"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "darkblue",
                      }}
                    ></i>
                    Refunds
                  </h5>
                </div>
                <div className="card-body">
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
                        onClick={(e) => this.clickActive(e, "1688-orders")}
                        style={{ fontSize: 25 }}
                      >
                        1688 Orders
                      </Tab>

                      <Tab
                        className="nav-link"
                        onClick={(e) => this.clickActive(e, "product-request")}
                        style={{ fontSize: 25 }}
                      >
                        Product Request
                      </Tab>
                    </TabList>
                  </Tabs>
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={months}
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
    allMonths: state.expenses.monthly,
  };
};

export default connect(mapStateToProps, {
  getAllMonthlyRedux,
})(MonthlyExpense);
