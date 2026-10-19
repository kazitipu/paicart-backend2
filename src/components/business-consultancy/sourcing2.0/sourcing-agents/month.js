import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthData";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllEmployeeRedux } from "../../../../actions/index";

import { connect } from "react-redux";

export class SoldMonth extends Component {
  render() {
    const { months, allEmployees } = this.props;

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Monthly" parent="Business Consultancy/ Sourcing" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
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
                  {this.props.match.params.agent}
                </h5>
              </div>
              <div className="card-body">
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
                    type="expense"
                    agent={this.props.match.params.agent}
                  />
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
    allEmployees: state.employees.employees.filter(
      (employee) => employee.status == "Active"
    ),
    months: state.admins.months,
  };
};

export default connect(mapStateToProps, {
  getAllEmployeeRedux,
})(SoldMonth);
