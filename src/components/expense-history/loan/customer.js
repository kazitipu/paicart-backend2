import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./customerDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllCustomerLoansRedux } from "../../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import CountUp from "react-countup";
export class Customers extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {
    this.props.getAllCustomerLoansRedux();
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
  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
  };
  render() {
    const { open } = this.state;
    const { allCustomers } = this.props;
    let dueCustomers = allCustomers.filter((customer) => customer.amount > 0);
    let algDueCustomers = allCustomers.filter(
      (customer) => customer.amount < 0
    );
    let totalCustomerDue = 0;
    let totalAlgDue = 0;
    dueCustomers.map((customer) => {
      totalCustomerDue += customer.amount;
    });
    algDueCustomers.map((customer) => {
      totalAlgDue += customer.amount;
    });

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Loan" parent="expense history" />
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
                        Total Customer Due
                      </span>
                      <h3 className="mb-0">
                        <CountUp className="counter" end={totalCustomerDue} />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 xl-50">
              <div className="card o-hidden  widget-cards">
                <div
                  className="card-body"
                  style={{ backgroundColor: "#16004c" }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-secondary" />
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
                        {" "}
                        Total Paicart Debt
                      </span>
                      <h3 className="mb-0">
                        <CountUp className="counter" end={totalAlgDue} />
                        Tk
                        <small></small>
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

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
                Customer Due
              </Tab>

              <Tab
                className="nav-link"
                onClick={(e) => this.clickActive(e)}
                style={{ fontSize: 25 }}
              >
                Paicart Debt
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
                        Customer Due
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          startToggleModal={this.startToggleModal}
                          history={this.props.history}
                          multiSelectOption={false}
                          myData={dueCustomers}
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
                        Paicart Debt
                      </h5>
                    </div>
                    <div className="card-body">
                      <div className="clearfix"></div>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          startToggleModal={this.startToggleModal}
                          history={this.props.history}
                          multiSelectOption={false}
                          myData={algDueCustomers}
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
    allCustomers: state.loans.allCustomers,
  };
};

export default connect(mapStateToProps, {
  getAllCustomerLoansRedux,
})(Customers);
