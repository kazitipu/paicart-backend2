import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllWarehousesRedux,
  uploadWarehouseRedux,
  updateWarehouseRedux,
  deleteWarehouseRedux,
} from "../../actions";
import { uploadImageRechargeRequest } from "../../firebase/firebase.utils";
import { Search } from "react-feather";
export class Warehouses extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      country: "",
      companyName: "",
      address: "",
      phone: "",
      isDefault: false,
      checkedValues: [],
      selectAll: false,
      searchFor: "",
      type: "upload",
    };
  }

  componentDidMount = async () => {
    this.props.getAllWarehousesRedux();
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

  /* Only one warehouse per country can be the default shown to
     customers — unset any other default for this country. */
  unsetOtherDefaults = async (country, keepId) => {
    const others = (this.props.warehouses || []).filter(
      (w) => w.country === country && w.isDefault && w.id !== keepId
    );
    for (const w of others) {
      await this.props.updateWarehouseRedux({ id: w.id, isDefault: false });
    }
    if (others.length) this.props.getAllWarehousesRedux();
  };

  handleSubmit = async () => {
    let date = new Date();

    if (this.state.type === "upload") {
      let warehouseObj = {
        ...this.state,
        id: date.getTime().toString(),
      };
      await this.props.uploadWarehouseRedux(warehouseObj);
      if (this.state.isDefault) {
        await this.unsetOtherDefaults(this.state.country, warehouseObj.id);
      }
    } else if (this.state.type === "update") {
      let warehouseObj = {
        ...this.state,
        id: this.state.id,
      };
      await this.props.updateWarehouseRedux(warehouseObj);
      if (this.state.isDefault) {
        await this.unsetOtherDefaults(this.state.country, warehouseObj.id);
      }
    }
    this.setState({
      id: "",
      country: "",
      companyName: "",
      address: "",
      phone: "",
      isDefault: false,
      checkedValues: [],
      selectAll: false,
      searchFor: "",
      type: "upload",
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
    const { warehouses, currentAdmin } = this.props;
    let renderableWarehouses = warehouses;
    if (this.state.searchFor) {
      renderableWarehouses = warehouses.filter((warehouse) =>
        warehouse.address
          .toLowerCase()
          .includes(this.state.searchFor.toLowerCase())
      );
    }
    renderableWarehouses = renderableWarehouses.sort((a, b) => b.id - a.id);
    return (
      <Fragment>
        <Breadcrumb title={"All Warehouses"} parent="Warehouses" />
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
                      Warehouses <br />
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
                              placeholder="Search Warehouse"
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
                              country: "",
                              companyName: "",
                              address: "",
                              phone: "",
                              isDefault: false,
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
                          Add New Address
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
                              <span
                                style={{
                                  display: "flex",
                                  flexDirection: "row",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  readOnly={
                                    currentAdmin &&
                                    currentAdmin.status == "Partner"
                                      ? true
                                      : false
                                  }
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
                                              checkedValues: warehouses.map(
                                                (warehouse) => {
                                                  return warehouse.id;
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

                                <div style={{ marginLeft: 5 }}>Select All</div>
                              </span>
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
                            Shipping Company
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
                            Country
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
                            Phone
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                              maxWidth: "100px",
                              minWidth: "100px",
                            }}
                          >
                            Default
                          </th>
                          <th
                            scope="col"
                            colSpan={2}
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                              maxWidth: "150px",
                              minWidth: "150px",
                            }}
                          >
                            Warehouse address
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
                        {renderableWarehouses.map((warehouse, index) => (
                          <tr key={index}>
                            <th scope="row">
                              {" "}
                              <div>
                                <span
                                  style={{
                                    display: "flex",
                                    flexDirection: "row",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    readOnly={
                                      currentAdmin &&
                                      currentAdmin.status == "Partner"
                                        ? true
                                        : false
                                    }
                                    name={warehouse.id}
                                    checked={this.state.checkedValues.includes(
                                      warehouse.id
                                    )}
                                    style={{
                                      height: 20,
                                      width: 20,
                                    }}
                                    onChange={(e) =>
                                      this.selectRow(e, warehouse.id)
                                    }
                                  />
                                </span>
                              </div>
                            </th>

                            <td>{warehouse.companyName}</td>
                            <td>{warehouse.country}</td>
                            <td>{warehouse.phone}</td>
                            <td>
                              {warehouse.isDefault ? (
                                <span
                                  style={{
                                    color: "white",
                                    backgroundColor: "green",
                                    padding: "2px 8px",
                                    borderRadius: 4,
                                    fontSize: 11,
                                  }}
                                >
                                  Default
                                </span>
                              ) : (
                                ""
                              )}
                            </td>
                            <td colSpan={2}>{warehouse.address}</td>

                            <td>
                              <>
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
                                          id: warehouse.id,
                                          country: warehouse.country,
                                          companyName: warehouse.companyName,
                                          address: warehouse.address,
                                          phone: warehouse.phone || "",
                                          isDefault: warehouse.isDefault || false,
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
                                          productObj: warehouse,
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
                              </>
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
                  {this.state.id ? "Update" : "Add New"} Warehouse address
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
                      Company name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="companyName"
                      value={this.state.companyName}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter shipping company name"
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
                      Country
                    </label>
                    <select
                      className="custom-select"
                      name="country"
                      value={this.state.country}
                      onChange={this.handleChange}
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    >
                      <option value="">Select country</option>
                      <option value="china">China</option>
                      <option value="uk">UK</option>
                      <option value="usa">USA</option>
                      <option value="hongkong">Hong Kong</option>
                      <option value="thailand">Thailand</option>
                      <option value="india">India</option>
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
                      Phone
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="phone"
                      value={this.state.phone}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter phone number"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                    />
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: "bold", color: "#505050" }}>
                      <input
                        type="checkbox"
                        name="isDefault"
                        checked={this.state.isDefault}
                        onChange={(e) =>
                          this.setState({ isDefault: e.target.checked })
                        }
                        style={{ marginRight: 8 }}
                      />
                      Set as default warehouse for this country
                    </label>
                    <p style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                      Only one warehouse per country is shown to customers on
                      the booking form. Marking this as default will unmark
                      any other default warehouse already set for the same
                      country.
                    </p>
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      Address
                    </label>
                    <textarea
                      type="text"
                      className="form-control"
                      name="address"
                      value={this.state.address}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter address name"
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
                  {productObj ? "UPDATE" : "ADD"} WAREHOUSE
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
                  Delete Warehouse Address
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
                    Are you sure you want to delete this warehouse address?
                  </div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{productObj && productObj.companyName}</td>
                      <td>{productObj && productObj.country}</td>
                      <td>{productObj && productObj.address}</td>
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
                    this.props.deleteWarehouseRedux(productObj.id);
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
                  Delete All Selected Warehouse Address
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
                    {this.state.checkedValues.length} warehouse addresses?
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
                      await this.props.deleteWarehouseRedux(id);
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
    warehouses: state.warehouses.warehouses,
  };
};

export default connect(mapStateToProps, {
  getAllWarehousesRedux,
  uploadWarehouseRedux,
  updateWarehouseRedux,
  deleteWarehouseRedux,
})(Warehouses);
