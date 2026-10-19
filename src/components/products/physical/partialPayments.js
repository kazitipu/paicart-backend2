import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllPartialsRedux,
  uploadPartialRedux,
  updatePartialRedux,
  deletePartialRedux,
} from "../../../actions";
import {
  uploadImageRechargeRequest,
  getFreeShipping,
  uploadfreeShipping,
} from "../../../firebase/firebase.utils";
import man from "./plus image.jpeg";
import { Search } from "react-feather";
export class PartialPayment extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      expirationDate: "",
      payNow100: "",
      payNow80: "",
      payNow60: "",
      minimumOrderAmount: "",
      maximumDiscountAmount: "",
      searchFor: "",
      type: "upload",
    };
  }

  componentDidMount = async () => {
    this.props.getAllPartialsRedux();
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

  _handleImgChange = async (e, i) => {
    e.preventDefault();
    const { currentAdmin } = this.props;

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl } = this.state;

    reader.onloadend = () => {
      // imageUrl = reader.result;
      this.setState({
        file: file,
        imageUrl,
      });
    };
    if (file) {
      this.setState({ loading: true });
      reader.readAsDataURL(file);
      const imgUrl = await uploadImageRechargeRequest(file);
      console.log(imgUrl);

      this.setState({
        imageUrl: imgUrl,
      });
      console.log(imageUrl);
      this.setState({ loading: false });
    }
  };
  _handleImgChange2 = async (e, i) => {
    e.preventDefault();
    const { currentAdmin } = this.props;

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl2 } = this.state;

    reader.onloadend = () => {
      // imageUrl = reader.result;
      this.setState({
        file: file,
        imageUrl2,
      });
    };
    if (file) {
      this.setState({ loading2: true });
      reader.readAsDataURL(file);
      const imgUrl = await uploadImageRechargeRequest(file);
      console.log(imgUrl);

      this.setState({
        imageUrl2: imgUrl,
      });
      this.setState({ loading2: false });
    }
  };

  getMonthName = () => {
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const d = new Date();
    return `${monthNames[d.getMonth()]},${d.getFullYear()}`;
  };

  handleSubmit = async () => {
    let date = new Date();

    if (this.state.type === "upload") {
      let partialObj = {
        ...this.state,
        id: date.getTime().toString(),
      };
      await this.props.uploadPartialRedux(partialObj);
    } else if (this.state.type === "update") {
      let partialObj = {
        ...this.state,
        id: this.state.id,
      };
      await this.props.updatePartialRedux(partialObj);
    }

    this.setState({
      id: "",
      name: "",
      expirationDate: "",
      payNow100: "",
      payNow80: "",
      payNow60: "",
      minimumOrderAmount: "",
      maximumDiscountAmount: "",
      searchFor: "",
      type: "upload",
    });
  };

  render() {
    const { open, productObj } = this.state;
    const { partials, currentAdmin } = this.props;
    let renderablePartials = partials;
    if (this.state.searchFor) {
      renderablePartials = partials.filter((partial) =>
        partial.name.toLowerCase().includes(this.state.searchFor.toLowerCase())
      );
    }
    renderablePartials = renderablePartials.sort((a, b) => b.id - a.id);
    return (
      <Fragment>
        <Breadcrumb title={"All Partial Payments"} parent="1688-orders" />
        {/* <!-- Container-fluid starts--> */}
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
                      Partial Payments (configuration) <br />
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
                          data-target="#personalInfoModal"
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
                              discountType: "percentage",
                              payNow100: "",
                              payNow80: "",
                              payNow60: "",
                              minimumOrderAmount: "",
                              maximumDiscountAmount: "",
                              searchFor: "",
                              active: false,
                              type: "upload",
                              expirationDate: "",
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
                            Discount on(100% payment)
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
                            Discount on(80% payment)
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
                            Discount on(60% payment)
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
                            Minimum Order Amount
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
                            Maximum Discount Amount
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
                        {renderablePartials.map((partial, index) => (
                          <tr key={index}>
                            <td style={{ fontWeight: "bold" }}>
                              {partial.name}
                            </td>
                            <td>{partial.payNow100}</td>
                            <td>{partial.payNow80}</td>
                            <td>{partial.payNow60}</td>
                            <td>{partial.minimumOrderAmount || 0}</td>
                            <td>{partial.maximumDiscountAmount || "—"}</td>

                            <td>{partial.expirationDate}</td>

                            <td>
                              <div
                                className="row"
                                style={{ justifyContent: "center" }}
                              >
                                <i
                                  className="icofont-edit"
                                  data-toggle="modal"
                                  data-target="#personalInfoModal"
                                  onClick={() => {
                                    this.setState({
                                      id: partial.id,
                                      name: partial.name,
                                      expirationDate: partial.expirationDate,
                                      payNow100: partial.payNow100,
                                      payNow80: partial.payNow80,
                                      payNow60: partial.payNow60,
                                      minimumOrderAmount:
                                        partial.minimumOrderAmount || "",
                                      maximumDiscountAmount:
                                        partial.maximumDiscountAmount || "",
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
                                  data-target="#deleteExpenseModal"
                                  onClick={() => {
                                    this.setState({
                                      productObj: partial,
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
        {/* <!-- Container-fluid Ends--> */}
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
                  {this.state.id ? "Update" : "Add New"} Partial Payment
                  Configuration
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
              <div className="modal-body" style={{ paddingTop: 5 }}>
                <div style={{ padding: "10px 15px", paddingTop: 0 }}>
                  <div
                    style={{ color: "gray", fontSize: 13, marginBottom: 10 }}
                  >
                    বিঃদ্রঃ নতুন কনফিগারেশন যোগ করলে আপনার পূর্বের কনফিগারেশন সব
                    বাদ যাবে
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
                      id="exampleFormControlInput1"
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
                      Discount % On (100% payment)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="payNow100"
                      value={this.state.payNow100}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
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
                      Discount % On (80% payment)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="payNow80"
                      value={this.state.payNow80}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
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
                      Discount % On (60% payment)
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="payNow60"
                      value={this.state.payNow60}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
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
                      Minimum Order Amount (৳) — user's order total must be at
                      or above this to see/use this offer
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="minimumOrderAmount"
                      value={this.state.minimumOrderAmount}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter minimum order amount"
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
                      Maximum Discount Amount (৳) — the discount will never
                      exceed this, regardless of the tier percentage
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="maximumDiscountAmount"
                      value={this.state.maximumDiscountAmount}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter maximum discount amount"
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
                      id="exampleFormControlInput1"
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
                  {productObj ? "UPDATE" : "ADD"} Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteExpenseModal"
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
                    Are you sure you want to delete this partial payments
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
                      <td>{productObj && productObj.discountType}</td>

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
                    this.props.deletePartialRedux(productObj.id);
                    this.setState({
                      selectAll: false,
                    });
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
    allUsers: state.users.users,
    currentAdmin: state.admins.currentAdmin,
    partials: state.partials.partials,
  };
};

export default connect(mapStateToProps, {
  getAllPartialsRedux,
  uploadPartialRedux,
  updatePartialRedux,
  deletePartialRedux,
})(PartialPayment);
