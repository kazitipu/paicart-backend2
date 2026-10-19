import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import {
  getAllMonthlyExpenseRedux,
  getAllMonthlyCashInRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

export class MonthlyExpense extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {};

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
  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
  };
  render() {
    const { open } = this.state;

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Loan" parent="expense history" />
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
                Loan Given
              </Tab>

              <Tab
                className="nav-link"
                onClick={(e) => this.clickActive(e)}
                style={{ fontSize: 25 }}
              >
                Loan Taken
              </Tab>
            </TabList>
            <TabPanel>
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
                          className="icofont-bill"
                          style={{
                            fontSize: "130%",
                            marginRight: "5px",
                            color: "darkblue",
                          }}
                        ></i>
                        Loan Given
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          startToggleModal={this.startToggleModal}
                          history={this.props.history}
                          multiSelectOption={false}
                          myData={this.props.allMonths}
                          pageSize={50}
                          pagination={true}
                          className="-striped -highlight"
                          type="expense"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
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
                          className="icofont-bill"
                          style={{
                            fontSize: "130%",
                            marginRight: "5px",
                            color: "darkblue",
                          }}
                        ></i>
                        Loan Taken
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          startToggleModal={this.startToggleModal}
                          history={this.props.history}
                          multiSelectOption={false}
                          myData={this.props.allMonths}
                          pageSize={50}
                          pagination={true}
                          className="-striped -highlight"
                          type="cashIn"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabPanel>
          </Tabs>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allMonths: state.admins.months,
  };
};

export default connect(mapStateToProps, {
  getAllMonthlyExpenseRedux,
  getAllMonthlyCashInRedux,
})(MonthlyExpense);
