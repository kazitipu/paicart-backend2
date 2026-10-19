import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./customerDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllCustomerInstallmentRedux } from "../../../actions/index";
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
    this.props.getAllCustomerInstallmentRedux();
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

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Monthly Installments" parent="expense history" />
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
                    Monthly Installments
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
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allCustomers: state.installments.allCustomers,
  };
};

export default connect(mapStateToProps, {
  getAllCustomerInstallmentRedux,
})(Customers);
