import React, { Component } from "react";
import "./d2dRatesModal.css";
import { uploadD2DRatesRedux, updateD2DRatesRedux } from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { withRouter } from "react-router-dom";
class D2DRatesModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      parcel: "",
      algParcel: "",
      ten: "",
      algTen: "",
      eleven: "",
      algEleven: "",
      "100kg": "",
      alg_100kg: "",
      below_1000kg: "",
      algBelow_1000kg: "",
      above_1000kg: "",
      algAbove_1000kg: "",
      shippingCompany: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { singleLot } = nextProps;
    console.log(singleLot);
    console.log("create Lot modal component will receive props is called");
    const [freightType, country] = nextProps.match.params.country.split("-");
    if (singleLot != null) {
      if (freightType === "air") {
        this.setState({
          id: singleLot["Product Type"],
          parcel: singleLot["Parcel"].replace("tk/kg", ""),
          algParcel: singleLot["SC Parcel"].replace("tk/kg", ""),
          ten: singleLot["Below 5kg"].replace("tk/kg", ""),
          algTen: singleLot["SC Below 5kg"].replace("tk/kg", ""),
          eleven: singleLot["Above 5kg"].replace("tk/kg", ""),
          algEleven: singleLot["SC Above 5kg"].replace("tk/kg", ""),
          shippingCompany: singleLot["Shipping Company"],
        });
      } else {
        this.setState({
          id: singleLot["Product Type"],
          "100kg": singleLot["100kg"].replace("tk/kg", ""),
          alg_100kg: singleLot["SC 100kg"].replace("tk/kg", ""),
          below_1000kg: singleLot["Below 1000kg"].replace("tk/kg", ""),
          algBelow_1000kg: singleLot["SC Below 1000kg"].replace("tk/kg", ""),
          above_1000kg: singleLot["Above 1000kg"].replace("tk/kg", ""),
          algAbove_1000kg: singleLot["SC Above 1000kg"].replace("tk/kg", ""),
          shippingCompany: singleLot["Shipping Company"],
        });
      }
    } else {
      this.setState({
        id: "",
        parcel: "",
        algParcel: "",
        ten: "",
        algTen: "",
        eleven: "",
        algEleven: "",
        "100kg": "",
        alg_100kg: "",
        below_1000kg: "",
        algBelow_1000kg: "",
        above_1000kg: "",
        algAbove_1000kg: "",
        shippingCompany: "",
      });
    }
  };

  handleSubmit = async (event) => {
    const [freightType, country] = this.props.match.params.country.split("-");
    event.preventDefault();
    if (this.props.singleLot === null) {
      if (freightType === "air") {
        const airRateObj = {
          id: this.state.id,
          parcel: this.state.parcel,
          algParcel: this.state.algParcel,
          algTen: this.state.algTen,
          algEleven: this.state.algEleven,
          ten: this.state.ten,
          eleven: this.state.eleven,
          shippingCompany: this.state.shippingCompany,
        };
        await this.props.uploadD2DRatesRedux(freightType, country, airRateObj);
      } else {
        const seaRateObj = {
          id: this.state.id,
          "100kg": this.state["100kg"],
          alg_100kg: this.state.alg_100kg,
          algAbove_1000kg: this.state.algAbove_1000kg,
          algBelow_1000kg: this.state.algBelow_1000kg,
          below_1000kg: this.state.below_1000kg,
          above_1000kg: this.state.above_1000kg,
          shippingCompany: this.state.shippingCompany,
        };
        await this.props.uploadD2DRatesRedux(freightType, country, seaRateObj);
      }

      toast.success(`Successfully created rate for ${this.state.id}`);
    } else {
      if (freightType === "sea") {
        const seaRateObj = {
          id: this.state.id,
          "100kg": this.state["100kg"],
          alg_100kg: this.state.alg_100kg,
          algAbove_1000kg: this.state.algAbove_1000kg,
          algBelow_1000kg: this.state.algBelow_1000kg,
          below_1000kg: this.state.below_1000kg,
          above_1000kg: this.state.above_1000kg,
          shippingCompany: this.state.shippingCompany,
        };
        await this.props.updateD2DRatesRedux(freightType, country, seaRateObj);
      } else {
        const airRateObj = {
          id: this.state.id,
          parcel: this.state.parcel,
          algParcel: this.state.algParcel,
          algTen: this.state.algTen,
          algEleven: this.state.algEleven,
          ten: this.state.ten,
          eleven: this.state.eleven,
          shippingCompany: this.state.shippingCompany,
        };
        await this.props.updateD2DRatesRedux(freightType, country, airRateObj);
      }

      toast.success(`successfully updated rate for ${this.state.id}`);
    }

    this.setState({
      id: "",
      parcel: "",
      algParcel: "",
      ten: "",
      algTen: "",
      eleven: "",
      algEleven: "",
      "100kg": "",
      alg_100kg: "",
      below_1000kg: "",
      algBelow_1000kg: "",
      above_1000kg: "",
      algAbove_1000kg: "",
      shippingCompany: "",
    });
    this.props.startToggleModal(null);
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };
  render() {
    console.log(this.props.singleLot);
    const [freightType, country] = this.props.match.params.country.split("-");
    return (
      <>
        <div
          className={
            this.props.toggleModal
              ? "modal fade show"
              : "modal fade show visible-modal"
          }
          id="request_popup"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div
            className="modal-dialog modal-dialog-centered request_popup"
            role="document"
          >
            <div
              className="modal-content visible-modal-content-3"
              style={{ backgroundColor: "rgb(68 0 97)" }}
            >
              <div className="modal-body p-0">
                <section className="pos-rel bg-light-gray">
                  <div className="container-fluid p-3">
                    <a
                      onClick={() => this.props.startToggleModal(null)}
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <i
                        className="icofont-close-line"
                        style={{ color: "white" }}
                      ></i>
                    </a>
                    <div className="d-lg-flex justify-content-end no-gutters mb-spacer-md">
                      {/* <div className="col bg-fixed bg-img-7 request_pag_img">
                        &nbsp;
                      </div> */}

                      <div className="col">
                        <div className="px-3 m-5">
                          <h2
                            className="h2-xl mb-3 fw-6 pb-2"
                            style={{
                              color: "white",
                              textTransform: "none",
                              fontSize: "200%",
                              borderBottom: "2px dotted white",
                            }}
                          >
                            {!this.props.singleLot
                              ? "Create New Product Type"
                              : "Update Product Type"}
                          </h2>
                          <form
                            onSubmit={this.handleSubmit}
                            noValidate="novalidate"
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Proudct Type
                                </label>
                                <input
                                  type="text"
                                  name="id"
                                  className="form-control"
                                  placeholder="Enter Product Type"
                                  style={{ fontSize: "1rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.id}
                                  required
                                  readOnly={this.props.singleLot ? true : false}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Shipping Company
                                </label>
                                <input
                                  type="text"
                                  name="shippingCompany"
                                  className="form-control"
                                  placeholder="Enter Company Name"
                                  style={{ fontSize: "1rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.shippingCompany}
                                  required
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air"
                                    ? "SC Parcel"
                                    : "100kg"}{" "}
                                </label>
                                <input
                                  type="number"
                                  required
                                  name={
                                    freightType === "air"
                                      ? "algParcel"
                                      : "alg_100kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.algParcel
                                      : this.state.alg_100kg
                                  }
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air" ? "Parcel" : "100kg"}{" "}
                                </label>
                                <input
                                  type="number"
                                  required
                                  name={
                                    freightType === "air" ? "parcel" : "100kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.parcel
                                      : this.state["100kg"]
                                  }
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air"
                                    ? "SC Below 5kg"
                                    : "SC Below 1000kg"}
                                </label>
                                <input
                                  type="number"
                                  required
                                  name={
                                    freightType === "air"
                                      ? "algTen"
                                      : "algBelow_1000kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.algTen
                                      : this.state.algBelow_1000kg
                                  }
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air"
                                    ? "Below 5kg"
                                    : "Below 1000kg"}
                                </label>
                                <input
                                  type="number"
                                  required
                                  name={
                                    freightType === "air"
                                      ? "ten"
                                      : "below_1000kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.ten
                                      : this.state.below_1000kg
                                  }
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air"
                                    ? "SC Above 5kg"
                                    : "SC Above 1000kg"}
                                </label>
                                <input
                                  type="number"
                                  name={
                                    freightType === "air"
                                      ? "algEleven"
                                      : "algAbove_1000kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.algEleven
                                      : this.state.algAbove_1000kg
                                  }
                                  required
                                />
                              </div>
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  {freightType === "air"
                                    ? "Above 5kg"
                                    : "Above 1000kg"}
                                </label>
                                <input
                                  type="number"
                                  name={
                                    freightType === "air"
                                      ? "eleven"
                                      : "above_1000kg"
                                  }
                                  className="form-control"
                                  placeholder="Enter rate/kg"
                                  onChange={this.handleChange}
                                  value={
                                    freightType === "air"
                                      ? this.state.eleven
                                      : this.state.above_1000kg
                                  }
                                  required
                                />
                              </div>
                            </div>

                            <div className="form-row">
                              <div
                                className="col pt-3"
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                {this.props.singleLot == null ? (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Create Product Type
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Update Product Type
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                )}
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default withRouter(
  connect(null, {
    updateD2DRatesRedux,
    uploadD2DRatesRedux,
  })(D2DRatesModal)
);
