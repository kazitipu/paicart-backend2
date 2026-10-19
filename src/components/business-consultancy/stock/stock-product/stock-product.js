import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllProductsRedux,
  uploadProductRedux,
  updateProductRedux,
  deleteProductRedux,
  handleProductPayRedux,
  handleProductPayGenerateRedux,
} from "../../../../actions";
import { uploadImageRechargeRequest } from "../../../../firebase/firebase.utils";
import man from "./plus image.jpeg";
export class StockProduct extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      quantity: "",
      amount: "",
      description: "",

      productObj: null,
      loading: false,
      imageUrl: man,
      file: "",
      type: "",
      customer: "",
      customerUid: "",
      cursor: -1,
    };
  }

  componentDidMount = async () => {
    this.props.getAllProductsRedux();
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({
      [name]: value,
    });
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

    if (this.state.loading) {
      alert("Please wait.. your image is uploading");
      return;
    }
    if (this.state.type === "upload") {
      let productObj = {
        id: date.getTime().toString(),
        name: this.state.name,
        imageUrl: this.state.imageUrl,
        description: this.state.description,
        amount: this.state.amount,
        quantity: this.state.quantity,
        status: "stock",
      };

      await this.props.uploadProductRedux(productObj);
    } else if (this.state.type === "update") {
      let productObj = {
        id: this.state.id,
        name: this.state.name,
        imageUrl: this.state.imageUrl,
        description: this.state.description,
        amount: this.state.amount,
        quantity: this.state.quantity,
        status: "stock",
      };
      await this.props.updateProductRedux(productObj);
    }

    this.setState({
      name: "",
      quantity: "",
      amount: "",
      description: "",

      productObj: null,
      loading: false,
      imageUrl: man,
      file: "",
    });
  };
  handleChangeCustomer = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value, showSuggestion: true, cursor: -1 });
  };
  handleKeyDown = (e) => {
    const { cursor } = this.state;
    let result = [];
    if (this.state.customer) {
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      result = [...suggestionById, ...suggestionByName].slice(0, 10);

      // arrow up/down button should select next/previous list element
      if (e.keyCode === 38 && cursor > -1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor - 1,
        }));
      } else if (e.keyCode === 40 && cursor < result.length - 1) {
        this.setState((prevState) => ({
          cursor: prevState.cursor + 1,
        }));
      } else if (e.keyCode === 13 && cursor > -1) {
        this.setState({
          customer: result[cursor].userId,
          customerUid: result[cursor].uid,
          showSuggestion: false,
        });
      }
    } else {
      result = [];
    }
  };
  renderShowSuggestion = () => {
    let suggestionArray = [];
    console.log(this.state.customer);
    if (this.state.customer) {
      console.log(this.state.customer);
      const suggestionById = this.props.allUsers.filter((user) =>
        user.userId.includes(this.state.customer)
      );
      const suggestionByName = this.props.allUsers.filter(
        (user) =>
          user.displayName &&
          user.displayName
            .toLowerCase()
            .includes(this.state.customer.toLowerCase())
      );
      suggestionArray = [...suggestionById, ...suggestionByName];
      const uniqueUser = [...new Set(suggestionArray)];
      console.log(suggestionArray);
      return uniqueUser.slice(0, 10).map((user, index) => (
        <li
          key={user.userId}
          style={{
            minWidth: "195px",
            backgroundColor: this.state.cursor == index ? "gainsboro" : "white",
          }}
          onClick={() =>
            this.setState({
              customer: `${user.userId}-${user.displayName}`,
              customerUid: user.uid,
              showSuggestion: false,
              subCategory: `${user.userId}-${user.displayName}`,
            })
          }
        >
          {user.userId}-{user.displayName ? user.displayName.slice(0, 13) : ""}
        </li>
      ));
    }
  };
  handlePayNow = async () => {
    const { currentAdmin } = this.props;
    if (this.state.customerUid == "") {
      alert("Please select a customer first");
      return;
    }
    let date = new Date();
    let productObj = {
      id: this.state.id,
      paymentId: date.getTime().toString(),
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      name: this.state.name,
      imageUrl: this.state.imageUrl,
      description: this.state.description,
      amount: this.state.amount,
      quantity: this.state.quantity,
      status: "sold",
      customer: this.state.subCategory,
      customerUid: this.state.customerUid,
      receiveBy: currentAdmin.name,
      category: "sold-products",
      invoiceStatus: "Paid",
      totalPaid: parseInt(this.state.amount) * parseInt(this.state.quantity),
    };
    this.props.handleProductPayRedux(productObj);
  };
  handleGenerateNow = async () => {
    const { currentAdmin } = this.props;
    if (this.state.customerUid == "") {
      alert("Please select a customer first");
      return;
    }
    let date = new Date();
    let productObj = {
      id: this.state.id,
      paymentId: date.getTime().toString(),
      month: this.getMonthName(),
      date: date.toLocaleDateString("en-GB"),
      name: this.state.name,
      imageUrl: this.state.imageUrl,
      description: this.state.description,
      amount: this.state.amount,
      quantity: this.state.quantity,
      status: "generated",
      customer: this.state.subCategory,
      customerUid: this.state.customerUid,
      receiveBy: currentAdmin.name,
      invoiceStatus: "Not Paid",
      category: "sold-products",
      totalPaid: 0,
    };
    this.props.handleProductPayGenerateRedux(productObj);
  };

  render() {
    const { open, productObj } = this.state;
    const { products, currentAdmin } = this.props;
    let date = new Date();
    let total = 0;
    if (products.length > 0) {
      products.map((product) => {
        total += parseInt(product.quantity) * parseInt(product.amount);
      });
    }

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title={date.toDateString()} parent="Business Consultancy" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <>
              <div className="card o-hidden widget-cards">
                <div
                  className="card-body"
                  style={{ backgroundColor: "#00254c" }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-warning" />
                      </div>
                    </div>
                    <div className="media-body col-8">
                      <span
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "100%",
                          color: "white",
                        }}
                      >
                        Total Stock Price
                      </span>
                      <h3 className="mb-0" style={{ color: "darkorange" }}>
                        <CountUp className="counter" end={total} />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </>
            <div className="col-sm-12">
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    borderBottom: "1px solid gainsboro",
                  }}
                >
                  <h5>
                    <i
                      className="icofont-money"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#00254c",
                      }}
                    ></i>
                    Stock Products
                  </h5>
                  <button
                    className="btn btn-primary"
                    data-toggle="modal"
                    data-target="#personalInfoModal"
                    onClick={() => {
                      this.setState({
                        name: "",
                        quantity: "",
                        amount: "",
                        description: "",
                        productObj: null,
                        loading: false,
                        imageUrl: man,
                        file: "",
                        type: "upload",
                      });
                    }}
                  >
                    Add Product
                  </button>
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
                            }}
                          >
                            #
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Image
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            colSpan={3}
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Amount
                          </th>
                          {currentAdmin && currentAdmin.status === "Admin" ? (
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
                          ) : null}
                          {currentAdmin &&
                          (currentAdmin.status === "Admin" ||
                            currentAdmin.status === "Accounts") ? (
                            <th
                              scope="col"
                              style={{
                                padding: "30px 15px",
                                color: "white",
                                backgroundColor: "#00254c",
                              }}
                            >
                              Sell
                            </th>
                          ) : null}
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>
                              <a href={product.imageUrl} target="_blank">
                                <img
                                  style={{ height: 70, width: 70 }}
                                  src={product.imageUrl}
                                />
                              </a>
                            </td>
                            <td>{product.name}</td>
                            <td colSpan={3}>
                              <pre>{product.description}</pre>
                            </td>
                            <td>{product.quantity}</td>
                            <td>{product.amount}Tk</td>
                            {currentAdmin && currentAdmin.status === "Admin" ? (
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
                                        id: product.id,
                                        name: product.name,
                                        quantity: product.quantity,
                                        amount: product.amount,
                                        description: product.description,
                                        imageUrl: product.imageUrl,
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
                                        productObj: product,
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
                            ) : null}
                            {currentAdmin &&
                            (currentAdmin.status === "Accounts" ||
                              currentAdmin.status === "Admin") ? (
                              <td>
                                <div
                                  style={{
                                    color: "white",
                                    padding: "3px 7px",
                                    borderRadius: 5,
                                    backgroundColor: "darkorange",
                                    textAlign: "center",
                                    cursor: "pointer",
                                  }}
                                  data-toggle="modal"
                                  data-target="#InvoiceInfoModal"
                                  onClick={() => {
                                    this.setState({
                                      id: product.id,
                                      name: product.name,
                                      quantity: product.quantity,
                                      amount: product.amount,
                                      description: product.description,
                                      imageUrl: product.imageUrl,
                                      type: "invoice",
                                    });
                                  }}
                                >
                                  <i className="icofont-tick-boxed" /> invoice
                                </div>
                              </td>
                            ) : null}
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
                  {productObj ? "Update" : "Add"} Product
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
                      PRODUCT IMAGE
                    </label>
                    <div
                      className="box-input-file"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      {this.state.loading ? (
                        <div
                          className="spinner-border text-light mt-3 ml-4"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <img
                            className="img-100 lazyloaded blur-up"
                            src={this.state.imageUrl}
                            alt="#"
                            style={{
                              zIndex: 10,
                              cursor: "pointer",
                            }}
                            onClick={() => {
                              document
                                .getElementById("upload-image-input")
                                .click();
                            }}
                          />

                          <input
                            id="upload-image-input"
                            className="upload"
                            type="file"
                            style={{
                              position: "absolute",
                              zIndex: 5,
                              maxWidth: "50px",
                              marginTop: "10px",
                            }}
                            onChange={(e) => this._handleImgChange(e, 0)}
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      PRODUCT NAME
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={this.state.name}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Product Name"
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
                      DESCRIPTION
                    </label>
                    <textarea
                      type="text"
                      className="form-control"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Ex: size, color, other details etc"
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
                      QUANTITY
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="quantity"
                      onChange={this.handleChange}
                      value={this.state.quantity}
                      id="exampleFormControlInput1"
                      placeholder="Enter Product Quantity"
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
                      PRICE/QUANTITY
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="amount"
                      onChange={this.handleChange}
                      value={this.state.amount}
                      id="exampleFormControlInput1"
                      placeholder="Enter Amount"
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
                  {productObj ? "UPDATE" : "ADD"} PRODUCT
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          className="modal fade"
          id="InvoiceInfoModal"
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
                  Sell
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
                      SELECT CUSTOMER
                    </label>
                    <input
                      title="Please choose a package"
                      style={{ padding: 18 }}
                      type="text"
                      name="customer"
                      className="form-control"
                      placeholder="Enter customer Id"
                      aria-required="true"
                      aria-invalid="false"
                      onChange={this.handleChangeCustomer}
                      value={this.state.customer}
                      required
                      autoComplete="off"
                      onKeyDown={this.handleKeyDown}
                    />
                    {this.state.customer && (
                      <ul
                        className="below-searchbar-recommendation"
                        style={{
                          display: this.state.showSuggestion ? "flex" : "none",
                          zIndex: 11,
                        }}
                      >
                        {this.renderShowSuggestion()}
                      </ul>
                    )}
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      PRODUCT IMAGE
                    </label>
                    <div
                      className="box-input-file"
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                      }}
                    >
                      <>
                        <img
                          className="img-100 lazyloaded blur-up"
                          src={this.state.imageUrl}
                          alt="#"
                          style={{
                            zIndex: 10,
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            document
                              .getElementById("upload-image-input")
                              .click();
                          }}
                        />
                      </>
                    </div>
                  </div>
                  <div className="form-group">
                    <label
                      style={{
                        fontWeight: "bold",
                        color: "#505050",
                        marginBottom: 5,
                      }}
                    >
                      PRODUCT NAME
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={this.state.name}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Product Name"
                      style={{
                        borderColor: "gainsboro",
                        borderRadius: 5,
                      }}
                      readOnly
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
                      DESCRIPTION
                    </label>
                    <textarea
                      type="text"
                      className="form-control"
                      name="description"
                      value={this.state.description}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Ex: size, color, other details etc"
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
                      QUANTITY
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="quantity"
                      onChange={this.handleChange}
                      value={this.state.quantity}
                      id="exampleFormControlInput1"
                      placeholder="Enter Product Quantity"
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
                      PRICE/QUANTITY
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      name="amount"
                      onChange={this.handleChange}
                      value={this.state.amount}
                      id="exampleFormControlInput1"
                      placeholder="Enter Amount"
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
                    this.handleGenerateNow();
                  }}
                >
                  Generate
                </button>
                <button
                  type="button"
                  className="btn "
                  data-dismiss="modal"
                  style={{
                    backgroundColor: "green",
                    color: "white",
                    padding: 8,
                    borderRadius: 5,
                    fontWeight: "lighter",
                  }}
                  onClick={() => {
                    this.handlePayNow();
                  }}
                >
                  Pay Now
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
                  Delete Product
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
                  <div>Are you sure you want to delete this Product?</div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {productObj && (
                          <img
                            style={{ height: 70, width: 70 }}
                            src={productObj.imageUrl}
                          />
                        )}
                      </td>
                      <td>{productObj && productObj.name}</td>
                      <td>{productObj && productObj.quantity}</td>
                      <td>{productObj && productObj.amount}Tk</td>
                    </tr>
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
                  onClick={() => {
                    this.props.deleteProductRedux(productObj.id);
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
    products: state.products.products,
  };
};

export default connect(mapStateToProps, {
  getAllProductsRedux,
  uploadProductRedux,
  updateProductRedux,
  deleteProductRedux,
  handleProductPayRedux,
  handleProductPayGenerateRedux,
})(StockProduct);
