import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./partnerDatatable";

import { getAllOfficeRedux, getAllCnfRedux } from "../../../actions/index";
import { Link } from "react-router-dom";
import CreateDocumentModal from "./createDocumentModal";
import { connect } from "react-redux";

export class Partner extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      cnf: null,
    };
  }

  componentDidMount = async () => {};

  render() {
    const { open } = this.state;
    const { currentAdmin } = this.props;
    let partners = [];
    if (this.props.allAdmins && this.props.allAdmins.length > 0) {
      partners = this.props.allAdmins.filter(
        (admin) => admin.status == "Partner"
      );
    }
    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Business Partner" parent="Paicart" />
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
                    Business Partner
                  </h5>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={partners}
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
    allCnfs: state.cnfs.cnfs,
    currentAdmin: state.admins.currentAdmin,
    allAdmins: state.admins.admins,
  };
};

export default connect(mapStateToProps, {})(Partner);
