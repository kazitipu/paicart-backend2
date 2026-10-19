import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseByMonthDatatable";

import {
  getSingleMonthlyRedux,
  clearSingleMonthRedux,
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
      filter: "",
    };
  }

  componentDidMount = async () => {
    this.props.getSingleMonthlyRedux(
      this.props.match.params.month,
      "REFUND",
      "REFUND PURPOSE"
    );
  };
  componentWillUnmount = () => {
    this.props.clearSingleMonthRedux();
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

  render() {
    const { open } = this.state;
    let allExpenses = this.props.allExpenses;
    if (this.state.filter) {
      if (this.state.filter == "1688 Orders") {
        allExpenses = this.props.allExpenses.filter(
          (expense) => expense.subCategory == "1688 Orders"
        );
      } else if (this.state.filter == "Product Request") {
        allExpenses = this.props.allExpenses.filter(
          (expense) => expense.subCategory == "Product Request"
        );
      }
    }
    console.log(allExpenses);
    return (
      <Fragment>
        <Breadcrumb title="Daily Office Cost" parent="Monthly expense" />
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
                    {this.props.match.params.month}
                  </h5>
                  <div>
                    <select
                      title="Filter by category"
                      required
                      name="filter"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={(e) => {
                        this.setState({
                          filter: e.target.value,
                        });
                      }}
                      value={this.state.filter}
                    >
                      <option value="">Filter by category </option>
                      <option value="">All</option>
                      <option value="1688 Orders">1688 Orders</option>
                      <option value="Product Request">Product Request</option>
                    </select>
                  </div>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={allExpenses}
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
    allExpenses: state.expenses.singleMonth,
  };
};

export default connect(mapStateToProps, {
  getSingleMonthlyRedux,
  clearSingleMonthRedux,
})(MonthlyExpenseByMonth);
