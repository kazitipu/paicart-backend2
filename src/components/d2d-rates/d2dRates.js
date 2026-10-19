import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./d2dRatesDatatable";
import { getAllD2DRatesRedux, uploadD2DRatesRedux } from "../../actions/index";
import { Link } from "react-router-dom";
import D2DRatesModal from "./d2dRatesModal";
import { connect } from "react-redux";
import ClipLoader from "react-spinners/ClipLoader";
import Axios from "axios";
import { get1688Categories } from "../../actions/get1688Data";
export class D2DRates extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      singleLot: null,
      submit_loader: false,
    };
  }

  componentDidMount = async () => {
    const [freightType, country] = this.props.match.params.country.split("-");
    this.props.getAllD2DRatesRedux(freightType, country);
  };

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.match.params.country !== this.props.match.params.country) {
      const [freightType, country] = nextProps.match.params.country.split("-");
      this.props.getAllD2DRatesRedux(freightType, country);
    }
  };

  startToggleModal = async (lotObj) => {
    if (lotObj == null) {
      this.setState({ toggleModal: !this.state.toggleModal, singleLot: null });
    } else {
      console.log(lotObj);
      this.setState({
        toggleModal: !this.state.toggleModal,
        singleLot: lotObj,
      });
    }
  };

  render() {
    const { open } = this.state;
    const [freightType, country] = this.props.match.params.country.split("-");
    const { currentAdmin } = this.props;
    console.log(this.props);
    return (
      <Fragment>
        <D2DRatesModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          singleLot={this.state.singleLot}
          {...this.props}
        />
        <Breadcrumb
          title={
            this.props.match.params.country.includes("air") ? "air" : "sea"
          }
          parent="d2d-rates"
        />
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
                      className="icofont-money"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#ff8084",
                      }}
                    ></i>
                    D2D Rates{" "}
                    <span
                      style={{
                        color: "#ff8084",
                        fontWeight: "bold",
                        fontSize: "130%",
                      }}
                    >
                      {" "}
                      {country}
                    </span>
                  </h5>
                  <li>
                    <button
                      className="btn btn-secondary"
                      data-toggle="modal"
                      data-target="#personalInfoModal"
                      type="button"
                      onClick={async () => {
                        if (this.state.submit_loader) {
                          alert("fetching shipping rates from alg server.");
                          return;
                        }
                      }}
                      style={{ marginRight: 10 }}
                      disabled={
                        currentAdmin && currentAdmin.status == "Partner"
                          ? true
                          : false
                      }
                    >
                      {this.state.submit_loader ? (
                        <div style={{ paddingLeft: 40, paddingRight: 40 }}>
                          <ClipLoader
                            color={"white"}
                            loading={this.state.submit_loader}
                            size={16}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                          />
                        </div>
                      ) : (
                        "Fetch ALG"
                      )}
                    </button>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={() => this.startToggleModal(null)}
                      disabled={
                        currentAdmin && currentAdmin.status == "Partner"
                          ? true
                          : false
                      }
                    >
                      Create Rate
                    </button>
                  </li>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={this.props.allD2DRates}
                      pageSize={50}
                      pagination={true}
                      class="-striped -highlight"
                      {...this.props}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        <div
          className="modal fade"
          id="personalInfoModal"
          tabIndex="-1"
          role="dialog"
          aria-labelledby="exampleModalLabel"
          aria-hidden="true"
        >
          <div
            className="modal-dialog"
            role="document"
            style={{ margin: "auto" }}
          >
            <div className="modal-content responsive-modal">
              <div
                className="modal-header"
                style={{
                  backgroundColor: "rgb(0, 37, 76)",
                  paddingTop: 20,
                  paddingBottom: 20,
                }}
              >
                <div
                  className="modal-title"
                  style={{
                    fontWeight: "bold",
                    fontSize: 17,
                    color: "white",
                  }}
                  id="exampleModalLabel"
                >
                  Get all shipping rates from ALG
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="personal-info-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div>
                    Are you sure you want to get the new shipping rates from
                    ALG? This will overrride all your pervious shipping rates.
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr></tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                >
                  No
                </button>
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "red",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                  }}
                  onClick={async () => {
                    if (this.state.submit_loader) {
                      alert("Fetching alg shipping rates");
                      return;
                    }
                    this.setState({
                      submit_loader: true,
                    });
                    const result = await Axios.post(
                      `https://alglimited.com/api/v1/get-all-d2d-rates`,
                      { freightType, country }
                    );
                    if (result.data && result.data.length > 0) {
                      for (let i = 0; i < result.data.length; i++) {
                        if (freightType == "air") {
                          await this.props.uploadD2DRatesRedux(
                            freightType,
                            country,
                            {
                              ...result.data[i],
                              shippingCompany: "ALG",
                              parcel: parseInt(result.data[i].parcel) + 50,
                              ten: parseInt(result.data[i].ten) + 50,
                              eleven: parseInt(result.data[i].eleven) + 50,
                              algParcel: parseInt(result.data[i].parcel),
                              algTen: parseInt(result.data[i].ten),
                              algEleven: parseInt(result.data[i].eleven),
                            }
                          );
                        } else {
                          await this.props.uploadD2DRatesRedux(
                            freightType,
                            country,
                            {
                              ...result.data[i],
                              shippingCompany: "ALG",
                              "100kg": parseInt(result.data[i]["100kg"]) + 50,
                              below_1000kg:
                                parseInt(result.data[i].below_1000kg) + 50,
                              above_1000kg:
                                parseInt(result.data[i].above_1000kg) + 50,
                              alg_100kg: parseInt(result.data[i]["100kg"]),
                              algBelow_1000kg: parseInt(
                                result.data[i].below_1000kg
                              ),
                              algAbove_1000kg: parseInt(
                                result.data[i].above_1000kg
                              ),
                            }
                          );
                        }
                      }
                      alert("Successfully fetched all shipping rates.");
                    } else {
                      alert(
                        "No shipping rates is available in this country. Please manually upload products."
                      );
                    }

                    this.setState({
                      submit_loader: false,
                    });
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allD2DRates: state.d2dRates.d2dRates,
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, {
  getAllD2DRatesRedux,
  uploadD2DRatesRedux,
})(D2DRates);
