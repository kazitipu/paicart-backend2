import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { connect } from "react-redux";
import {
  getAllSiteDiscountsRedux,
  uploadSiteDiscountRedux,
  updateSiteDiscountRedux,
  deleteSiteDiscountRedux,
} from "../../../actions";

export class SiteDiscount extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      percentage: "",
      expirationDate: "",
      searchFor: "",
      type: "upload",
      productObj: null,
    };
  }

  componentDidMount = async () => {
    this.props.getAllSiteDiscountsRedux();
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = async () => {
    let date = new Date();

    if (this.state.type === "upload") {
      let discountObj = {
        id: date.getTime().toString(),
        name: this.state.name,
        percentage: this.state.percentage,
        expirationDate: this.state.expirationDate,
      };
      await this.props.uploadSiteDiscountRedux(discountObj);
    } else if (this.state.type === "update") {
      let discountObj = {
        id: this.state.id,
        name: this.state.name,
        percentage: this.state.percentage,
        expirationDate: this.state.expirationDate,
      };
      await this.props.updateSiteDiscountRedux(discountObj);
    }

    this.setState({
      id: "",
      name: "",
      percentage: "",
      expirationDate: "",
      searchFor: "",
      type: "upload",
    });
  };

  render() {
    const { productObj } = this.state;
    const { siteDiscounts } = this.props;
    let renderableDiscounts = siteDiscounts || [];
    if (this.state.searchFor) {
      renderableDiscounts = renderableDiscounts.filter((d) =>
        d.name.toLowerCase().includes(this.state.searchFor.toLowerCase())
      );
    }
    renderableDiscounts = renderableDiscounts.sort((a, b) => b.id - a.id);
    return (
      <Fragment>
        <Breadcrumb title={"Site Discount"} parent="1688-orders" />
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <div className="col-sm-12">
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    borderBottom: "1px solid gainsboro",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <h5>
                      <i
                        className="icofont-layout"
                        style={{
                          fontSize: "130%",
                          marginRight: "5px",
                          color: "#00254c",
                        }}
                      ></i>
                      Site Discount (configuration) <br />
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      <li>
                        {" "}
                        <button
                          className="btn"
                          data-toggle="modal"
                          data-target="#siteDiscountModal"
                          style={{
                            backgroundColor: "rgb(0, 37, 76)",
                            border: "none",
                            color: "white",
                            fontSize: 11,
                          }}
                          onClick={() => {
                            this.setState({
                              id: "",
                              name: "",
                              percentage: "",
                              expirationDate: "",
                              searchFor: "",
                              type: "upload",
                            });
                          }}
                        >
                          Add Configuration
                        </button>
                      </li>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <table className="table table-bordered table-striped table-hover">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                              maxWidth: "150px",
                              minWidth: "150px",
                            }}
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                              maxWidth: "150px",
                              minWidth: "150px",
                            }}
                          >
                            Discount %
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Expiration Date
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderableDiscounts.map((discount, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: "bold" }}>
                              {discount.name}
                            </td>
                            <td>{discount.percentage}%</td>
                            <td>{discount.expirationDate}</td>
                            <td>
                              <div
                                className="row"
                                style={{ justifyContent: "center" }}
                              >
                                <i
                                  className="icofont-edit"
                                  data-toggle="modal"
                                  data-target="#siteDiscountModal"
                                  onClick={() => {
                                    this.setState({
                                      id: discount.id,
                                      name: discount.name,
                                      percentage: discount.percentage,
                                      expirationDate: discount.expirationDate,
                                      searchFor: "",
                                      type: "update",
                                    });
                                  }}
                                  style={{
                                    color: "green",
                                    marginRight: 8,
                                    cursor: "pointer",
                                  }}
                                />{" "}
                                <i
                                  className="icofont-trash"
                                  data-toggle="modal"
                                  data-target="#deleteSiteDiscountModal"
                                  onClick={() => {
                                    this.setState({
                                      productObj: discount,
                                    });
                                  }}
                                  style={{
                                    color: "red",
                                    marginLeft: 8,
                                    cursor: "pointer",
                                  }}
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />

        {/* Add / Update modal */}
        <div
          className="modal fade"
          id="siteDiscountModal"
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
            <div
              className="modal-content"
              style={{ top: 10, width: "95%", margin: "auto" }}
            >
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
                  {this.state.id ? "Update" : "Add New"} Site Discount
                  Configuration
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="site-discount-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body" style={{ paddingTop: 5 }}>
                <div style={{ padding: "10px 15px", paddingTop: 0 }}>
                  <div
                    style={{ color: "gray", fontSize: 13, marginBottom: 10 }}
                  >
                    বিঃদ্রঃ নতুন কনফিগারেশন যোগ করলে আপনার পূর্বের কনফিগারেশন সব
                    বাদ যাবে। এই ছাড়টি সাইটের সকল পণ্যের মূল্যে প্রযোজ্য হবে।
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={this.state.name}
                      onChange={this.handleChange}
                      placeholder="Enter name"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Discount Percentage (%)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="percentage"
                      value={this.state.percentage}
                      onChange={this.handleChange}
                      placeholder="Enter Percentage"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Expiration Date
                    </label>
                    <input
                      className="form-control"
                      name="expirationDate"
                      value={this.state.expirationDate}
                      onChange={this.handleChange}
                      placeholder="Enter expiration date"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                      type="date"
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "darkorange",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={() => {
                    this.handleSubmit();
                  }}
                >
                  {this.state.id ? "UPDATE" : "ADD"} Configuration
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation modal */}
        <div
          className="modal fade"
          id="deleteSiteDiscountModal"
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
            <div
              className="modal-content"
              style={{ top: 10, margin: "auto", minWidth: "140%" }}
            >
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
                  Delete Configuration
                </div>
                <button
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                  id="site-discount-delete-close"
                >
                  <span aria-hidden="true" style={{ color: "white" }}>
                    &times;
                  </span>
                </button>
              </div>
              <div className="modal-body">
                <div style={{ padding: "10px 15px" }}>
                  <div>
                    Are you sure you want to delete this site discount
                    configuration?
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{productObj && productObj.name}</td>
                      <td>{productObj && productObj.percentage}%</td>
                      <td>{productObj && productObj.expirationDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  data-dismiss="modal"
                  onClick={() => {
                    this.setState({
                      productObj: null,
                    });
                  }}
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
                  onClick={() => {
                    this.props.deleteSiteDiscountRedux(productObj.id);
                  }}
                >
                  Yes
                </button>
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
    siteDiscounts: state.siteDiscounts.siteDiscounts,
  };
};

export default connect(mapStateToProps, {
  getAllSiteDiscountsRedux,
  uploadSiteDiscountRedux,
  updateSiteDiscountRedux,
  deleteSiteDiscountRedux,
})(SiteDiscount);
