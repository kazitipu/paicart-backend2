import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllCouponsRedux,
  uploadCouponRedux,
  updateCouponRedux,
  deleteCouponRedux,
} from "../../../actions";
import {
  uploadImageRechargeRequest,
  getFreeShipping,
  uploadfreeShipping,
} from "../../../firebase/firebase.utils";
import man from "./plus image.jpeg";
import { Search } from "react-feather";
export class Coupons extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      discountType: "percentage",
      discountAmount: "",
      expirationDate: "",
      usageLimit: "",
      minimumOrder: "",
      maximumDiscount: "",
      checkedValues: [],
      selectAll: false,
      searchFor: "",
      type: "upload",
    };
  }

  componentDidMount = async () => {
    this.props.getAllCouponsRedux();
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
      let couponObj = {
        ...this.state,
        id: date.getTime().toString(),
      };
      await this.props.uploadCouponRedux(couponObj);
    } else if (this.state.type === "update") {
      let couponObj = {
        ...this.state,
        id: this.state.id,
      };
      await this.props.updateCouponRedux(couponObj);
    }

    this.setState({
      id: "",
      name: "",
      discountType: "percentage",
      discountAmount: "",
      expirationDate: "",
      usageLimit: "",
      minimumOrder: "",
      maximumDiscount: "",
      checkedValues: [],
      selectAll: false,
      searchFor: "",
    });
  };

  selectRow = (e, i) => {
    if (!e.target.checked) {
      this.setState({
        checkedValues: this.state.checkedValues.filter((item, j) => i !== item),
        selectAll: false,
      });
    } else {
      this.state.checkedValues.push(i);
      this.setState(
        {
          checkedValues: this.state.checkedValues,
        },
        () => {
          console.log(this.state.checkedValues);
        }
      );
    }
  };

  render() {
    const { open, productObj } = this.state;
    const { coupons, currentAdmin } = this.props;
    let renderableCoupons = coupons;
    if (this.state.searchFor) {
      renderableCoupons = coupons.filter((coupon) =>
        coupon.name.toLowerCase().includes(this.state.searchFor.toLowerCase())
      );
    }
    renderableCoupons = renderableCoupons.sort((a, b) => b.id - a.id);
    return (
      <Fragment>
        <Breadcrumb title={"All Coupons"} parent="Coupons" />
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
                      Coupons <br />
                    </h5>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-between",
                      }}
                    >
                      {" "}
                      <li
                        style={{
                          border: "1px solid gainsboro",
                          borderRadius: "5rem",
                          padding: "0px 20px",
                          background: "whitesmoke",
                          marginRight: "20px",
                        }}
                      >
                        <form
                          className="form-inline search-form"
                          onSubmit={this.handleSubmit}
                        >
                          <div
                            // className="form-group"
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "space-around",
                            }}
                          >
                            <input
                              className={
                                "form-control-plaintext " +
                                (this.state.searchbar ? "open" : "")
                              }
                              name="searchFor"
                              value={this.state.searchFor}
                              type="search"
                              placeholder="Search Coupon"
                              style={{ paddingLeft: 10 }}
                              onChange={this.handleSearchBarChange}
                            />
                            <span>
                              <Search
                                style={{
                                  marginTop: "5px",
                                  borderLeft: "1px solid gainsboro",
                                  paddingLeft: "7px",
                                  color: "gray",
                                }}
                              />
                            </span>
                          </div>
                        </form>
                      </li>
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
                              discountAmount: "",
                              expirationDate: "",
                              usageLimit: "",
                              minimumOrder: "",
                              maximumDiscount: "",
                              checkedValues: [],
                              selectAll: false,
                              searchFor: "",
                              type: "upload",
                            });
                          }}
                          disabled={
                            currentAdmin && currentAdmin.status == "Partner"
                              ? true
                              : false
                          }
                        >
                          Add New Coupon
                        </button>
                      </li>
                    </div>
                  </div>
                </div>

                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    {this.state.checkedValues.length > 0 ? (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          background: "#1A73E8",
                          width: "100%",
                          borderRadius: "5px",
                          justifyContent: "flex-start",
                          padding: 10,
                        }}
                      >
                        <div
                          style={{
                            alignSelf: "center",
                          }}
                        >
                          <i
                            className="icofont-close-line"
                            onClick={() => {
                              this.setState({
                                selectAll: false,
                                checkedValues: [],
                              });
                            }}
                            style={{
                              color: "white",
                              cursor: "pointer",
                              fontSize: "25px",
                            }}
                          />
                        </div>
                        <div
                          style={{
                            color: "white",
                            alignSelf: "center",
                            marginLeft: 20,
                          }}
                        >
                          {this.state.checkedValues.length} selected
                        </div>
                        <div
                          style={{
                            width: "1px",
                            height: "25px",
                            background: "white",
                            alignSelf: "center",
                            marginLeft: 40,
                          }}
                        ></div>
                        <div
                          style={{
                            color: "white",
                            alignSelf: "center",
                            marginLeft: 40,
                            padding: "5px 10px",
                            border: "1px solid white",
                            borderRadius: "5px",
                            cursor: "pointer",
                          }}
                          data-toggle="modal"
                          data-target="#deleteExpenseModal2"
                        >
                          Delete
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: 26.5 }}></div>
                    )}
                    <table className="table table-bordered table-striped table-hover">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                              minWidth: "150px",
                              maxWidth: "150px",
                            }}
                          >
                            <div>
                              {currentAdmin &&
                              currentAdmin.status == "Partner" ? (
                                <></>
                              ) : (
                                <span
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    name={this.state.selectAll}
                                    checked={this.state.selectAll}
                                    onChange={(e) =>
                                      this.setState(
                                        {
                                          selectAll: !this.state.selectAll,
                                        },
                                        () => {
                                          if (this.state.selectAll) {
                                            this.setState(
                                              {
                                                checkedValues: coupons.map(
                                                  (coupon) => {
                                                    return coupon.id;
                                                  }
                                                ),
                                              },
                                              () => {
                                                console.log(
                                                  this.state.checkedValues
                                                );
                                              }
                                            );
                                          } else {
                                            this.setState({
                                              checkedValues: [],
                                            });
                                          }
                                        }
                                      )
                                    }
                                    style={{
                                      height: 20,
                                      width: 20,
                                    }}
                                  />

                                  <div style={{ marginLeft: 5 }}>
                                    Select All
                                  </div>
                                </span>
                              )}
                            </div>
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
                            Discount Type
                          </th>

                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Discount Amount
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
                            Usage Limit
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
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
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {renderableCoupons.map((coupon, index) => (
                          <tr key={index}>
                            <th scope="row">
                              {" "}
                              <div>
                                {currentAdmin &&
                                currentAdmin.status == "Partner" ? (
                                  <></>
                                ) : (
                                  <span
                                    style={{
                                      display: "flex",
                                      flexDirection: "row",
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      name={coupon.id}
                                      checked={this.state.checkedValues.includes(
                                        coupon.id
                                      )}
                                      style={{
                                        height: 20,
                                        width: 20,
                                      }}
                                      onChange={(e) =>
                                        this.selectRow(e, coupon.id)
                                      }
                                    />
                                  </span>
                                )}
                              </div>
                            </th>

                            <td>{coupon.name}</td>
                            <td>{coupon.discountType}</td>
                            <td>{coupon.discountAmount}</td>
                            <td>{coupon.expirationDate}</td>
                            <td>{coupon.usageLimit}</td>
                            <td>{coupon.minimumOrder}</td>
                            <td>{coupon.maximumDiscount}</td>

                            <td>
                              {currentAdmin &&
                              currentAdmin.status == "Partner" ? (
                                <></>
                              ) : (
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
                                        id: coupon.id,
                                        name: coupon.name,
                                        discountType: coupon.discountType,
                                        discountAmount: coupon.discountAmount,
                                        expirationDate: coupon.expirationDate,
                                        usageLimit: coupon.usageLimit,
                                        minimumOrder: coupon.minimumOrder,
                                        maximumDiscount: coupon.maximumDiscount,
                                        checkedValues: [],
                                        selectAll: false,
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
                                        productObj: coupon,
                                      });
                                    }}
                                    style={{
                                      color: "red",
                                      marginLeft: 8,
                                      cursor: "pointer",
                                    }}
                                  />
                                </div>
                              )}
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
                  {this.state.id ? "Update" : "Add New"} Coupon
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
                      placeholder="Enter coupon name"
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
                      Discount Type
                    </label>
                    <select
                      title="Please choose a package"
                      required
                      name="discountType"
                      className="custom-select"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChange}
                      value={this.state.discountType}
                    >
                      <option value="percentage">Percentage Discount</option>
                      <option value="cash">Cash Discount</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Discount Amount
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="discountAmount"
                      value={this.state.discountAmount}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter discount amount"
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
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Usage Limit
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="usageLimit"
                      value={this.state.usageLimit}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter usage limit"
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
                      Minimum Order Amount
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="minimumOrder"
                      value={this.state.minimumOrder}
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
                      Maximum Discount Amount
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="maximumDiscount"
                      value={this.state.maximumDiscount}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter maximum discount amount"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
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
                  {productObj ? "UPDATE" : "ADD"} COUPON
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
                  Delete Coupon
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
                  <div>Are you sure you want to delete this coupon?</div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{productObj && productObj.name}</td>
                      <td>{productObj && productObj.discountType}</td>
                      <td>{productObj && productObj.discountAmount}</td>
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
                    this.props.deleteCouponRedux(productObj.id);
                    this.setState({
                      selectAll: false,
                      checkedValues: [],
                    });
                  }}
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="deleteExpenseModal2"
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
                  Delete All Selected Coupon
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
                    Are you sure you want to delete{" "}
                    {this.state.checkedValues.length} Coupon?
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
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
                  onClick={() => {
                    this.state.checkedValues.map(async (id) => {
                      await this.props.deleteCouponRedux(id);
                    });
                    this.setState({
                      selectAll: false,
                      checkedValues: [],
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
    coupons: state.coupons.coupons,
  };
};

export default connect(mapStateToProps, {
  getAllCouponsRedux,
  uploadCouponRedux,
  updateCouponRedux,
  deleteCouponRedux,
})(Coupons);
