import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import { uploadProductTax } from "../../firebase/firebase.utils";
import { connect } from "react-redux";

export class Add_Product_Tax extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      below_1kg: "",
    };
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleFormSubmit = async (event) => {
    event.preventDefault();
    await uploadProductTax({ ...this.state });
    alert(`shipping charge for ${this.state.name} added successfully!`);
    this.setState({
      id: "",
      name: "",
      below_1kg: "",
    });
  };

  handleDiscard = () => {
    this.setState({
      id: "",
      name: "",
      below_1kg: "",
    });
  };

  render() {
    const { loader } = this.state;
    const { currentAdmin } = this.props;

    return (
      <Fragment>
        <Breadcrumb
          title="Add Product Shipping Charges"
          parent="localization"
        />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5>Add Product shipping charges</h5>
                  <h6>
                    add product id,name and below_1kg shipping charges.Other
                    shipping charges will be auto updated.{" "}
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
                              Product Id :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                name="id"
                                value={this.state.id}
                                type="text"
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                            <div className="valid-feedback">Looks good!</div>
                          </div>

                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Product Name :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                id="exampleFormControlSelect1"
                                name="name"
                                value={this.state.name}
                                onChange={this.handleChange}
                                required
                              />
                            </div>
                          </div>
                          <div className="form-group row">
                            <label className="col-xl-3 col-sm-4 mb-0">
                              Below 1kg :
                            </label>
                            <div className="col-xl-8 col-sm-7">
                              <input
                                className="form-control"
                                id="exampleFormControlSelect1"
                                name="below_1kg"
                                value={this.state.below_1kg}
                                onChange={this.handleChange}
                                required
                              />
                            </div>
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
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={this.handleDiscard}
                            className="btn btn-light"
                            disabled={
                              currentAdmin && currentAdmin.status == "Partner"
                                ? true
                                : false
                            }
                          >
                            Discard
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

export default connect(mapStateToProps, {})(Add_Product_Tax);
