import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllHomeCategoryRedux,
  uploadHomeCategoryRedux,
  updateHomeCategoryRedux,
  deleteHomeCategoryRedux,
} from "../../../actions";
import {
  uploadAliProduct,
  uploadImageRechargeRequest,
  deleteAliProductsCollection,
} from "../../../firebase/firebase.utils";
import ClipLoader from "react-spinners/ClipLoader";
import man from "./plus image.jpeg";
import { batchSearchItemsFrameByCategoryId } from "../../../actions/get1688Data";
import { Search } from "react-feather";
export class HomeCategories extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      categoryId: "",
      productObj: null,
      checkedValues: [],
      selectAll: false,
      searchFor: "",
      submit_loader: false,
    };
  }

  componentDidMount = async () => {
    this.props.getAllHomeCategoryRedux();
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

    if (this.state.loading || this.state.loading2) {
      alert("Please wait.. your image is uploading");
      return;
    }
    if (this.state.type === "upload") {
      let campaignObj = {
        id: date.getTime().toString(),
        name: this.state.name,
        categoryId: this.state.categoryId,
      };

      await this.props.uploadHomeCategoryRedux(campaignObj);
    } else if (this.state.type === "update") {
      let campaignObj = {
        id: this.state.id,
        name: this.state.name,
        categoryId: this.state.categoryId,
      };
      await this.props.updateHomeCategoryRedux(campaignObj);
    }

    this.setState({
      id: "",
      name: "",
      categoryId: "",
      productObj: null,
      checkedValues: [],
      selectAll: false,
      searchFor: "",
    });
  };

  selectRow = (e, campaign) => {
    if (!e.target.checked) {
      this.props.updateHomeCategoryRedux({ ...campaign, visible: false });
    } else {
      this.props.updateHomeCategoryRedux({ ...campaign, visible: true });
    }
  };

  render() {
    const { open, productObj } = this.state;
    const { homeCategories, currentAdmin } = this.props;
    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title={"Home Categories"} parent="Products" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
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
                      className="icofont-layout"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#00254c",
                      }}
                    ></i>
                    Home Categories
                  </h5>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-around",
                    }}
                  >
                    <li>
                      {" "}
                      <button
                        className="btn"
                        style={{
                          backgroundColor: "red",
                          border: "none",
                          color: "white",
                          fontSize: 11,
                          minWidth: 300,
                        }}
                        onClick={async () => {
                          if (this.state.submit_loader) {
                            alert(
                              "Please let the product to updated. It may take upto 1 minutes."
                            );
                            return;
                          }
                          this.setState({
                            submit_loader: true,
                          });
                          await deleteAliProductsCollection();
                          for (let i = 0; i < homeCategories.length; i++) {
                            const element = homeCategories[i];
                            let products =
                              await batchSearchItemsFrameByCategoryId(
                                element.categoryId
                              );
                            if (products.length > 0) {
                              for (
                                let index = 0;
                                index < products.length;
                                index++
                              ) {
                                const el = products[index];
                                await uploadAliProduct({
                                  ...el,
                                  categoryName: element.name,
                                });
                              }
                            }
                          }
                          alert("Success. All products feched to database.");
                          this.setState({
                            submit_loader: false,
                          });
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        {this.state.submit_loader ? (
                          <ClipLoader
                            color={"white"}
                            loading={this.state.submit_loader}
                            size={15}
                            aria-label="Loading Spinner"
                            data-testid="loader"
                          />
                        ) : (
                          "Update all Home Products"
                        )}
                      </button>
                    </li>
                    <li style={{ marginLeft: 30 }}>
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
                            slug: "",
                            productObj: null,
                            loading: false,
                            loading2: false,
                            imageUrl: man,
                            imageUrl2: man,
                            file: "",
                            checkedValues: [],
                            selectAll: false,
                            type: "upload",
                          });
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        Add New Home Category
                      </button>
                    </li>
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
                            SL No
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
                            Category name
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
                            Category Id
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
                        {homeCategories.map((campaign, index) => (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>

                            <td>{campaign.name}</td>
                            <td>{campaign.categoryId}</td>
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
                                        id: campaign.id,
                                        name: campaign.name,
                                        categoryId: campaign.categoryId,
                                        type: "update",
                                        productObj: campaign,
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
                                        productObj: campaign,
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
                  {productObj ? "Update" : "Add New"} Home category
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
                      placeholder="Enter category name. ex:bag,sneakers,shirt etc"
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
                      Category Id
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="categoryId"
                      value={this.state.categoryId}
                      onChange={this.handleChange}
                      id="exampleFormControlInput1"
                      placeholder="Enter category id. ex: 121660001"
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
                  {productObj ? "UPDATE" : "ADD"} Home Category
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
                  Delete Home category (this category will be removed from
                  homescreen)
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
                  <div>Are you sure you want to delete this Home category?</div>
                </div>
                <table className="table table-bordered table-striped table-hover">
                  <thead>
                    <tr></tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{productObj && productObj.name}</td>
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
                    this.props.deleteHomeCategoryRedux(productObj.id);
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
    homeCategories: state.campaigns.homeCategories,
  };
};

export default connect(mapStateToProps, {
  getAllHomeCategoryRedux,
  uploadHomeCategoryRedux,
  updateHomeCategoryRedux,
  deleteHomeCategoryRedux,
})(HomeCategories);
