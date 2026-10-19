import React, { Component, Fragment } from "react";
import SearchHeader from "./searchHeader";
import Notification from "./notification";
import User_menu from "./user-menu";
import Language from "./language";
import {
  AlignLeft,
  Maximize2,
  Bell,
  MessageSquare,
  MoreHorizontal,
} from "react-feather";
import { connect } from "react-redux";

//images
import logo from "../../../assets/images/dashboard/14.png";

export class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      sidebar: true,
      rightSidebar: true,
      navMenus: false,
    };
  }
  toggle() {
    this.setState((prevState) => ({
      navMenus: !prevState.navMenus,
    }));
  }
  showRightSidebar = () => {
    if (this.state.rightSidebar) {
      this.setState({ rightSidebar: false });
      document.querySelector(".right-sidebar").classList.add("show");
    } else {
      this.setState({ rightSidebar: true });
      document.querySelector(".right-sidebar").classList.remove("show");
    }
  };
  goFull = () => {
    if (
      (document.fullScreenElement && document.fullScreenElement !== null) ||
      (!document.mozFullScreen && !document.webkitIsFullScreen)
    ) {
      if (document.documentElement.requestFullScreen) {
        document.documentElement.requestFullScreen();
      } else if (document.documentElement.mozRequestFullScreen) {
        document.documentElement.mozRequestFullScreen();
      } else if (document.documentElement.webkitRequestFullScreen) {
        document.documentElement.webkitRequestFullScreen(
          Element.ALLOW_KEYBOARD_INPUT
        );
      }
    } else {
      if (document.cancelFullScreen) {
        document.cancelFullScreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
      }
    }
  };
  openCloseSidebar = () => {
    if (this.state.sidebar) {
      this.setState({ sidebar: false });
      document.querySelector(".page-main-header").classList.add("open");
      document.querySelector(".page-sidebar").classList.add("open");
    } else {
      this.setState({ sidebar: true });
      document.querySelector(".page-main-header").classList.remove("open");
      document.querySelector(".page-sidebar").classList.remove("open");
    }
  };
  render() {
    var totalNotifacationCount = "";
    if (this.props.pendingOrders && this.props.unverifiedPayments) {
      totalNotifacationCount +=
        this.props.pendingOrders.length + this.props.unverifiedPayments.length;
    }

    return (
      <Fragment>
        {/* open */}
        <div className="page-main-header ">
          <div className="main-header-right row">
            <div className="main-header-left d-lg-none">
              <div className="logo-wrapper">
                <a href="index.html">
                  <img
                    className="blur-up lazyloaded"
                    src={logo}
                    alt=""
                    style={{ minWidth: "100%" }}
                  />
                </a>
              </div>
            </div>
            <div className="mobile-sidebar">
              <div className="media-body text-right switch-sm">
                <label className="switch">
                  <a onClick={this.openCloseSidebar}>
                    <AlignLeft color="#18768f" />
                  </a>
                </label>
              </div>
            </div>
            <div className="nav-right col">
              <ul
                className={"nav-menus " + (this.state.navMenus ? "open" : "")}
              >
                <li>
                  <SearchHeader color="#18768f" />
                </li>
                <li>
                  <a onClick={this.goFull} className="text-dark" href="#!">
                    <Maximize2 color="#18768f" />
                  </a>
                </li>
                <li className="onhover-dropdown">
                  <a className="txt-dark" href="#">
                    <h6 style={{ color: "#18768f" }}>EN</h6>
                  </a>
                  <Language color="#18768f" />
                </li>

                <li className="onhover-dropdown">
                  <Bell color="#18768f" />
                  <span
                    className="badge badge-pill badge-primary pull-right notification-badge"
                    style={{ backgroundColor: "#18768f" }}
                  >
                    {totalNotifacationCount}
                  </span>
                  <span
                    className="dot"
                    style={{ backgroundColor: "#18768f" }}
                  ></span>
                  <Notification
                    totalNotifacationCount={totalNotifacationCount}
                    color="#18768f"
                  />
                </li>
                <li>
                  <a onClick={this.showRightSidebar}>
                    <MessageSquare color="#18768f" />
                    <span
                      className="dot"
                      style={{ backgroundColor: "#18768f" }}
                    ></span>
                  </a>
                </li>
                <User_menu />
              </ul>
              <div
                className="d-lg-none mobile-toggle pull-right"
                onClick={() => this.toggle()}
              >
                <MoreHorizontal color="#18768f" />
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  const unVerifiedPaymentsArray = [];
  state.payments.payments.forEach((payment) => {
    payment.payments.forEach((inPayment) => {
      if (inPayment.paymentStatus === "unVerified") {
        unVerifiedPaymentsArray.push(inPayment);
      }
    });
  });
  return {
    pendingOrders: state.orders.orders.filter(
      (order) => order.status === "order_pending"
    ),
    unverifiedPayments: unVerifiedPaymentsArray,
  };
};

export default connect(mapStateToProps)(Header);
