import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./promotionDatatable";

import {
  getAllDocumentExpressRatesRedux,
  getAllPromotionRedux,
} from "../../../actions/index";
import { Link } from "react-router-dom";
import CreateDocumentModal from "./createDocumentModal";
import { connect } from "react-redux";

export class Promotion extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      office: null,
    };
  }

  componentDidMount = async () => {
    this.props.getAllPromotionRedux();
  };

  startToggleModal = async (officeObj) => {
    if (officeObj == null) {
      this.setState({ toggleModal: !this.state.toggleModal, office: null });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
        office: officeObj,
      });
    }
  };

  render() {
    const { open } = this.state;
    const { currentAdmin } = this.props;

    console.log(this.props);
    return (
      <Fragment>
        <CreateDocumentModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          office={this.state.office}
        />
        <Breadcrumb title="office" parent="expense-history" />
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
                      className="icofont-building-alt"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "darkblue",
                      }}
                    ></i>
                    Boosting/Promotions
                  </h5>
                  <button
                    className="btn "
                    style={{ backgroundColor: "darkblue", color: "white" }}
                    type="button"
                    onClick={() => this.startToggleModal(null)}
                    disabled={
                      currentAdmin && currentAdmin.status == "Partner"
                        ? true
                        : false
                    }
                  >
                    ADD PROMOTION METHOD
                  </button>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={this.props.allPromotions}
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
    allPromotions: state.promotions.promotions,
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  getAllDocumentExpressRatesRedux,
  getAllPromotionRedux,
})(Promotion);
