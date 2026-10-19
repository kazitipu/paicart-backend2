import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import {
  getAllBannersRedux,
  uploadBannerRedux,
  updateBannerRedux,
  deleteBannerRedux,
} from "../../../actions";
import { uploadImageRechargeRequest } from "../../../firebase/firebase.utils";
import man from "./plus image.jpeg";
import { Search } from "react-feather";
export class Banners extends Component {
  constructor(props) {
    super(props);
    this.state = {
      id: "",
      name: "",
      slug: "",
      parentCategory: "",
      productObj: null,
      loading: false,
      loading2: false,
      imageUrl: man,
      imageUrl2: man,
      file: "",
      checkedValues: [],
      selectAll: false,
      searchFor: "",
      visible: false,
      secondBanner: false,
    };
  }

  componentDidMount = async () => {
    this.props.getAllBannersRedux();
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
      let bannerObj = {
        id: date.getTime().toString(),
        name: this.state.name,
        banner: this.state.imageUrl,
        visible: this.state.visible,
        secondBanner: this.state.secondBanner,
      };

      await this.props.uploadBannerRedux(bannerObj);
    } else if (this.state.type === "update") {
      let bannerObj = {
        id: this.state.id,
        name: this.state.name,
        banner: this.state.imageUrl,
        visible: this.state.visible,
        secondBanner: this.state.secondBanner,
      };
      await this.props.updateBannerRedux(bannerObj);
    }

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
    });
  };

  selectRow = (e, banner) => {
    if (!e.target.checked) {
      this.props.updateBannerRedux({ ...banner, visible: false });
    } else {
      this.props.updateBannerRedux({ ...banner, visible: true });
    }
  };

  render() {
    const { open, productObj } = this.state;
    const { banners, currentAdmin } = this.props;
    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title={"Banners"} parent="Products" />
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
                    Banners
                  </h5>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-around",
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
                            placeholder="Search Banner"
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
                            slug: "",
                            parentCategory: "",
                            productObj: null,
                            loading: false,
                            loading2: false,
                            imageUrl: man,
                            imageUrl2: man,
                            file: "",
                            checkedValues: [],
                            selectAll: false,
                            topCategory: false,
                            type: "upload",
                          });
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        Add New Banner
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
                              minWidth: "150px",
                              maxWidth: "150px",
                            }}
                          >
                            Active
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
                            Banner
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
                            Ship for Me
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
                        {banners.map((banner, index) => (
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
                                  {currentAdmin &&
                                  currentAdmin.status == "Partner" ? (
                                    <></>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      name={banner.id}
                                      checked={banner.visible}
                                      style={{
                                        height: 20,
                                        width: 20,
                                      }}
                                      onChange={(e) =>
                                        this.selectRow(e, banner)
                                      }
                                    />
                                  )}
                                </span>
                              </div>
                            </th>
                            <td>
                              <a href={banner.logo} target="_blank">
                                <img
                                  style={{ height: 100, width: 200 }}
                                  src={banner.banner || this.state.imageUrl}
                                />
                              </a>
                            </td>
                            <td>{banner.name}</td>
                            <td>
                              {banner.secondBanner ? (
                                <div style={{ color: "green" }}>yes</div>
                              ) : (
                                <div style={{ color: "red" }}>No</div>
                              )}
                            </td>
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
                                        id: banner.id,
                                        name: banner.name,
                                        visible: banner.visible,
                                        secondBanner: banner.secondBanner,
                                        imageUrl: banner.banner,
                                        type: "update",
                                        productObj: banner,
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
                                        productObj: banner,
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
                  {productObj ? "Update" : "Add New"} Banner
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
                      placeholder="Enter banner name"
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
                      Banner Image
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
                          className="spinner-border text-light mt-3 ml-2"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <>
                          <img
                            className="img-50 lazyloaded blur-up"
                            src={this.state.imageUrl}
                            alt="#"
                            style={{
                              zIndex: 10,
                              cursor: "pointer",
                              border: "1px solid gainsboro",
                              borderRadius: 5,
                              minHeight: 100,
                              maxHeight: 100,
                              minWidth: 200,
                              maxWidth: 200,
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
                    <div style={{ marginTop: 3, color: "gray" }}>
                      Dimensions (7000 * 3000), ship for me Dimensions ( 500 *
                      500)
                    </div>
                  </div>
                  <div className="form-group">
                    <span
                      style={{
                        display: "flex",
                        flexDirection: "row",
                      }}
                    >
                      <input
                        type="checkbox"
                        name={this.state.secondBanner}
                        checked={this.state.secondBanner}
                        onChange={(e) =>
                          this.setState({
                            secondBanner: !this.state.secondBanner,
                          })
                        }
                        style={{
                          height: 20,
                          width: 20,
                        }}
                      />

                      <div
                        style={{
                          marginLeft: 5,
                          fontWeight: "bold",
                          color: "#505050",
                          marginBottom: 5,
                        }}
                      >
                        Ship for me banner
                      </div>
                    </span>
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
                  {productObj ? "UPDATE" : "ADD"} Banner
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
                  Delete Banner
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
                  <div>Are you sure you want to delete this Image?</div>
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
                            src={productObj.logo}
                          />
                        )}
                      </td>
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
                    this.props.deleteBannerRedux(productObj.id);
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
    banners: state.categories.banners,
  };
};

export default connect(mapStateToProps, {
  getAllBannersRedux,
  uploadBannerRedux,
  updateBannerRedux,
  deleteBannerRedux,
})(Banners);
