import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../common/breadcrumb";

import Datatable from "./adminsDatatable";

import { Search } from "react-feather";
import ChangeAdminStatusModal from "./changeAdminStatusModal";
import { connect } from "react-redux";

export class List_admin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchFor: "",
      allAdmins: [],
      toggleModal: true,
      adminObj: null,
    };
  }

  componentDidMount = async () => {
    this.setState({ allAdmins: this.props.allAdmins });
  };
  componentWillReceiveProps = (nextProps) => {
    this.setState({ allAdmins: nextProps.allAdmins });
  };

  startToggleModal = async (adminObj) => {
    if (adminObj == null) {
      this.setState({ toggleModal: !this.state.toggleModal, adminObj: null });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
        adminObj,
      });
    }
  };

  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
    console.log(this.state.searchFor);
  };

  render() {
    const { allAdmins, searchFor } = this.state;
    let renderableAdmins = [];
    if (allAdmins.length > 0) {
      renderableAdmins = allAdmins;
    }
    console.log(searchFor);
    return (
      <Fragment>
        <ChangeAdminStatusModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          adminObj={this.state.adminObj}
        />
        <Breadcrumb title="Admin List" parent="Admin" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <h5>
                    {" "}
                    <i
                      className="icofont-user"
                      style={{
                        fontSize: "180%",
                        marginRight: "5px",
                        marginTop: "5px",
                        color: "#ff8084",
                      }}
                    ></i>
                    Admin List
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
                            placeholder="Search admin"
                            onChange={this.handleSearchBarChange}
                          />
                          <span
                            // className="d-sm-none mobile-search"
                            onClick={() => this.handleSearchClick()}
                          >
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
                    <li></li>
                  </div>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <Datatable
                      startToggleModal={this.startToggleModal}
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={
                        !searchFor
                          ? renderableAdmins
                          : renderableAdmins.filter(
                              (admin) =>
                                admin.mobileNo
                                  .toString()
                                  .toLowerCase()
                                  .includes(searchFor.toLowerCase()) ||
                                admin.name
                                  .toLowerCase()
                                  .includes(searchFor.toLowerCase())
                            )
                      }
                      pageSize={50}
                      pagination={true}
                      class="-striped -highlight"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allAdmins: state.admins.admins,
  };
};
export default connect(mapStateToProps)(List_admin);
