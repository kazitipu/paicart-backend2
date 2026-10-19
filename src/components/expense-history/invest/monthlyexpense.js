import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";

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
    };
  }

  componentDidMount = async () => {
    this.props.getAllMonthlyRedux("INVEST", "OFFICE INVESTMENT");
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

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Monthly Investment" parent="expense-history" />
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
                      className="icofont-dollar"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "darkblue",
                      }}
                    ></i>
                    INVESTMENT
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
