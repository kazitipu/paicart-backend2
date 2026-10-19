import React, { Component, Fragment } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../common/breadcrumb";
import data from "../../assets/data/listUser";
import Datatable from "./usersDatatable";
import { Search } from "react-feather";
import { getAllUsersRedux } from "../../actions/index";
import { connect } from "react-redux";
import NotificationModal from "./notificationModal";
import ChangeUserStatusModal from "./changeUserStatusModal";
/* Newest customer first: user ids are assigned in ascending order, so the
   biggest id is the most recent signup. Sorts a copy - the array handed in is
   the redux users array when no search is active, and sorting in place
   mutated the store. Ids that are not numeric sink to the bottom rather than
   turning the comparison into NaN. */
const sortByNewestUserId = (users) => {
  const toNumber = (user) => {
    const parsed = parseInt(user && user.userId, 10);
    return Number.isFinite(parsed) ? parsed : -Infinity;
  };
  return (users || []).slice().sort((a, b) => toNumber(b) - toNumber(a));
};

export class List_user extends Component {
  constructor(props) {
    super(props);
    this.state = {
      searchFor: "",
      toggleModal: true,
      toggleModal2: true,
      singleLot: null,
      userObj: null,
    };
  }

  componentDidMount = async () => {
    await this.props.getAllUsersRedux();
  };
  handleSearchBarChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
    console.log(this.state.searchFor);
  };

  startToggleModal = async (showModal) => {
    if (showModal) {
      this.setState({ toggleModal: !this.state.toggleModal });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
      });
    }
  };

  startToggleModal2 = async (userObj) => {
    if (userObj == null) {
      this.setState({ toggleModal2: !this.state.toggleModal2, userObj: null });
    } else {
      this.setState({
        toggleModal2: !this.state.toggleModal2,
        userObj,
      });
    }
  };

  render() {
    const { searchFor } = this.state;
    const { allUsers } = this.props;
    let renderableUsers = allUsers;
    if (!searchFor) {
      renderableUsers = allUsers;
    } else {
      renderableUsers = allUsers.filter(
        (user) =>
          (user.userId && user.userId.includes(searchFor)) ||
          (user.displayName &&
            user.displayName.toLowerCase().includes(searchFor.toLowerCase()))
      );
    }
    return (
      <Fragment>
        <NotificationModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          singleLot={this.state.singleLot}
        />
        <ChangeUserStatusModal
          toggleModal={this.state.toggleModal2}
          startToggleModal={this.startToggleModal2}
          userObj={this.state.userObj}
        />
        <Breadcrumb title="User List" parent="Users" />
        <div className="container-fluid">
          <div className="card">
            <div
              className="card-header"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <h5>User Details</h5>
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
                        placeholder="Search user"
                        onChange={this.handleSearchBarChange}
                        style={{ paddingLeft: 10 }}
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
                <li>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 5,
                      background: "purple",
                      color: "white",
                      fontWeight: "bold",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                    onClick={() => {
                      this.startToggleModal(true);
                    }}
                  >
                    Send Notification
                  </div>
                </li>
              </div>
            </div>
            <div className="card-body">
              <div className="clearfix"></div>
              <div
                id="batchDelete"
                className="category-table user-list order-table coupon-list-delete"
              >
                <Datatable
                  multiSelectOption={false}
                  myData={sortByNewestUserId(renderableUsers)}
                  pageSize={100}
                  pagination={true}
                  class="-striped -highlight"
                  startToggleModal={this.startToggleModal2}
                />
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
  };
};
export default connect(mapStateToProps, { getAllUsersRedux })(List_user);
