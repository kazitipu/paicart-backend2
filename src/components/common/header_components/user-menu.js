import React, { Component, Fragment } from "react";
import { Link, withRouter } from "react-router-dom";
import { auth } from "../../../firebase/firebase.utils";
import { connect } from "react-redux";
//images import
import man from "../../../assets/images/dashboard/user2.jpg";
export class User_menu extends Component {
  render() {
    const { currentAdmin } = this.props;
    return (
      <Fragment>
        <li className="onhover-dropdown">
          <div className="media align-items-center">
            {currentAdmin && currentAdmin.image ? (
              <img
                className="align-self-center pull-right img-50 rounded-circle blur-up lazyloaded"
                src={currentAdmin.image}
                alt="header-user"
              />
            ) : (
              <img
                className="align-self-center pull-right img-50 rounded-circle blur-up lazyloaded"
                src={man}
                alt="header-user"
              />
            )}
            <div className="dotted-animation">
              <span
                className="animate-circle"
                style={{ border: "5px solid #18768f" }}
              ></span>
              <span
                className="main-circle"
                style={{ backgroundColor: "#18768f" }}
              ></span>
            </div>
          </div>
          <ul className="profile-dropdown onhover-show-div p-20 profile-dropdown-hover">
            <li>
              <Link to={`${process.env.PUBLIC_URL}/settings/profile`}>
                <i data-feather="user"></i>Profile
              </Link>
            </li>
            {/* <li><a href="javascript:void(0)"><i data-feather="mail"></i>Inbox</a></li>
                            <li><a href="javascript:void(0)"><i data-feather="lock"></i>Lock Screen</a></li>
                            <li><a href="javascript:void(0)"><i data-feather="settings"></i>Settings</a></li> */}
            <li
              style={{ cursor: "pointer" }}
              onClick={() => {
                auth.signOut();
                this.props.history.push("/");
              }}
            >
              <i data-feather="log-out"></i>Logout
            </li>
          </ul>
        </li>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};
export default withRouter(connect(mapStateToProps, null)(User_menu));
