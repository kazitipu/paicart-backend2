import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseByMonthDatatable";

import { getAllCnfBillMonthsRedux } from "../../../actions/index";
import { Link } from "react-router-dom";

import { connect } from "react-redux";

export class MonthlyExpenseByMonth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {
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
    let month = `${monthNames[d.getMonth()]},${d.getFullYear()}`;
    this.props.getAllCnfBillMonthsRedux(month);
  };

  render() {
    const { open } = this.state;

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="InvestMent" parent="Monthly expense" />
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
                      className="icofont-building"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "darkblue",
                      }}
                    ></i>
                    {this.props.match.params.name}
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
                      class="-striped -highlight"
                      name={this.props.match.params.name}
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
    allMonths: state.cnfs.cnfMonths,
  };
};

export default connect(mapStateToProps, {
  getAllCnfBillMonthsRedux,
})(MonthlyExpenseByMonth);
