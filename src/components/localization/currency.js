import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import { setRmbPrice } from "../../firebase/firebase.utils";
import { connect } from "react-redux";
export class Currency extends Component {
  constructor(props) {
    super(props);
    this.state = {
      taka: "",
      rmbRate: "",
    };
  }

  componentDidMount = async () => {
    const rmbRate = await setRmbPrice();
    this.setState({ rmbRate: rmbRate });
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleFormSubmit = async (event) => {
    event.preventDefault();
    const rmbRate = await setRmbPrice(parseInt(this.state.taka));
    this.setState({ taka: "", rmbRate: rmbRate });
  };

  render() {
    const { currentAdmin } = this.props;
    return (
      <Fragment>
        <Breadcrumb title="Currency converter" parent="localization" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5>Currency Converter</h5>
                  <h6>
                    Current Rmb rate is{" "}
                    <span style={{ fontSize: "150%", color: "#ff8084" }}>
                      {this.state.rmbRate}{" "}
                    </span>
                    taka
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row product-adding">
                    <div className="col-xl-12">
                      <form
                        className="needs-validation add-product-form"
                        onSubmit={this.handleFormSubmit}
                      >
                        <div className="form form-label-center">
                          <div className="form-group mb-3 row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              1 rmb :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="taka"
                                placeholder="Bangladeshi taka"
                                value={this.state.taka}
                                type="number"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                        </div>
                        <div className="offset-xl-3 offset-sm-4">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                              currentAdmin && currentAdmin.status == "Partner"
                                ? true
                                : false
                            }
                          >
                            change
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, null)(Currency);
