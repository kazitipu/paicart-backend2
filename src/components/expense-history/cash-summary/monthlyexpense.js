import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthlyExpenseDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllMonthlyCashSummaryRedux } from "../../../actions/index";
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
    this.props.getAllMonthlyCashSummaryRedux();
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
    const { allMonths } = this.props;

    let uniqueMonths = [...new Set(allMonths.map((expense) => expense.month))];
    console.log(uniqueMonths);

    return (
      <Fragment>
        <Breadcrumb title="Cash Summary" parent="expense history" />
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
                      className="icofont-bill"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "darkblue",
                      }}
                    ></i>
                    Cash Summary
                  </h5>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={uniqueMonths}
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
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allMonths: state.expenses.monthlyCashSummary,
  };
};

export default connect(mapStateToProps, {
  getAllMonthlyCashSummaryRedux,
})(MonthlyExpense);
