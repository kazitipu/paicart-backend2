import React, { Component, Fragment } from "react";
import User_panel from "./user-panel";
import { Link } from "react-router-dom";
import {
  MENUITEMSFORADMIN,
  MENUITEMSFORACCOUNTS,
  MENUITEMSFOREMPLOYEE,
  MENUITEMSFOROFFICER,
  MENUITEMSFORPARTNER,
} from "../../../constants/menu";
import { connect } from "react-redux";

// image import
import logo from "../../../assets/images/dashboard/14.png";
import "./colorful-sidebar.css";
// import { mapStateToProps } from '../header_components/user-menu';

// Palette used for sub-menu bullets so every child row gets its own colour.
const SUBMENU_COLORS = [
  "#4466f2",
  "#22c55e",
  "#f97316",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#eab308",
  "#ef4444",
  "#14b8a6",
  "#6366f1",
  "#84cc16",
  "#f43f5e",
  "#0ea5e9",
  "#d946ef",
  "#f59e0b",
];

// Ragged label widths for the loading placeholder rows.
const SKELETON_WIDTHS = [
  "62%",
  "48%",
  "70%",
  "55%",
  "66%",
  "44%",
  "58%",
  "72%",
  "50%",
  "64%",
];

// Safety net for any menu entry that has no colour defined in constants/menu.js
const FALLBACK_COLORS = SUBMENU_COLORS;

// "#4466f2" -> "rgba(68, 102, 242, 0.13)"
const withAlpha = (hex, alpha) => {
  const clean = String(hex || "").replace("#", "");
  if (clean.length !== 6) return `rgba(68, 102, 242, ${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export class sidebar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedPath: "1",
      mainmenu: [],
    };
  }

  onItemSelection = (arg, e) => {
    this.setState({ selectedPath: arg.path });
  };

  componentDidMount() {
    var currentUrl = window.location.pathname;
    console.log("i am called");
    if (this.props.currentAdmin) {
      if (this.props.currentAdmin.status === "Admin") {
        this.setState({
          mainmenu: MENUITEMSFORADMIN,
        });
      }
      if (this.props.currentAdmin.status === "Partner") {
        this.setState({
          mainmenu: MENUITEMSFORPARTNER,
        });
      }
      if (this.props.currentAdmin.status === "Accounts") {
        this.setState({
          mainmenu: MENUITEMSFORACCOUNTS,
        });
      }
      if (this.props.currentAdmin.status === "Employee") {
        this.setState({
          mainmenu: MENUITEMSFOREMPLOYEE,
        });
      }
      if (this.props.currentAdmin.status === "Officer") {
        this.setState({
          mainmenu: MENUITEMSFOROFFICER,
        });
      }
    }
    setTimeout(() => {
      this.state.mainmenu.filter((items) => {
        if (!items.children) {
          if (items.path === currentUrl) this.setNavActive(items);
          return false;
        }
        items.children.filter((subItems) => {
          if (subItems.path === currentUrl) this.setNavActive(subItems);
          if (!subItems.children) return false;
          subItems.children.filter((subSubItems) => {
            if (subSubItems.path === currentUrl) this.setNavActive(subSubItems);
          });
        });
      });
    }, 1000);
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.currentAdmin) {
      if (nextProps.currentAdmin.status == "Admin") {
        this.setState({ mainmenu: MENUITEMSFORADMIN });
      }
      if (nextProps.currentAdmin.status === "Partner") {
        this.setState({
          mainmenu: MENUITEMSFORPARTNER,
        });
      }
      if (nextProps.currentAdmin.status == "Accounts") {
        this.setState({ mainmenu: MENUITEMSFORACCOUNTS });
      }
      if (nextProps.currentAdmin.status == "Employee") {
        this.setState({ mainmenu: MENUITEMSFOREMPLOYEE });
      }
      if (nextProps.currentAdmin.status == "Officer") {
        this.setState({ mainmenu: MENUITEMSFOROFFICER });
      }
    }
    // setTimeout(() => {
    //   this.state.mainmenu.filter((items) => {
    //     if (!items.children) {
    //       if (items.path === currentUrl) this.setNavActive(items);
    //       return false;
    //     }
    //     items.children.filter((subItems) => {
    //       if (subItems.path === currentUrl) this.setNavActive(subItems);
    //       if (!subItems.children) return false;
    //       subItems.children.filter((subSubItems) => {
    //         if (subSubItems.path === currentUrl) this.setNavActive(subSubItems);
    //       });
    //     });
    //   });
    // }, 1000);
  };

  setNavActive(item) {
    this.state.mainmenu.filter((menuItem) => {
      if (menuItem != item) menuItem.active = false;
      if (menuItem.children && menuItem.children.includes(item))
        menuItem.active = true;
      if (menuItem.children) {
        menuItem.children.filter((submenuItems) => {
          if (submenuItems != item) {
            submenuItems.active = false;
          }
          if (submenuItems.children) {
            submenuItems.children.map((childItem) => {
              childItem.active = false;
            });
            if (submenuItems.children.includes(item)) {
              submenuItems.active = true;
              menuItem.active = true;
            }
          }
        });
      }
    });
    item.active = !item.active;

    if (this.props.currentAdmin.status === "Admin") {
      this.setState({
        mainmenu: MENUITEMSFORADMIN,
      });
    }
    if (this.props.currentAdmin.status === "Partner") {
      this.setState({
        mainmenu: MENUITEMSFORPARTNER,
      });
    }
    if (this.props.currentAdmin.status === "Accounts") {
      this.setState({
        mainmenu: MENUITEMSFORACCOUNTS,
      });
    }
    if (this.props.currentAdmin.status === "Employee") {
      this.setState({
        mainmenu: MENUITEMSFOREMPLOYEE,
      });
    }
    if (this.props.currentAdmin.status === "Officer") {
      this.setState({
        mainmenu: MENUITEMSFOROFFICER,
      });
    }
  }

  render() {
    const mainmenu = this.state.mainmenu.map((menuItem, i) => {
      const menuColor =
        menuItem.color || FALLBACK_COLORS[i % FALLBACK_COLORS.length];
      return (
        <li
          className={`${menuItem.active ? "active" : ""}`}
          key={i}
          style={{
            "--menu-color": menuColor,
            "--menu-color-soft": withAlpha(menuColor, 0.13),
          }}
        >
          {menuItem.sidebartitle ? (
            <div className="sidebar-title">{menuItem.sidebartitle}</div>
          ) : (
            ""
          )}
          {menuItem.type === "sub" ? (
            <a
              className="sidebar-header "
              href="javascript:void(0)"
              onClick={() => this.setNavActive(menuItem)}
            >
              <span className="menu-icon-badge">
                <menuItem.icon />
              </span>
              <span className="menu-label">{menuItem.title}</span>
              <i className="fa fa-angle-right pull-right"></i>
            </a>
          ) : (
            ""
          )}
          {menuItem.type === "link" ? (
            <Link
              to={`${process.env.PUBLIC_URL}${menuItem.path}`}
              className={`sidebar-header ${menuItem.active ? "active" : ""}`}
              onClick={() => this.setNavActive(menuItem)}
            >
              <span className="menu-icon-badge">
                <menuItem.icon />
              </span>
              <span className="menu-label">{menuItem.title}</span>
              {menuItem.children ? (
                <i className="fa fa-angle-right pull-right"></i>
              ) : (
                ""
              )}
            </Link>
          ) : (
            ""
          )}
          {menuItem.children ? (
            <ul
              className={`sidebar-submenu ${menuItem.active ? "menu-open" : ""}`}
              style={
                menuItem.active
                  ? { opacity: 1, transition: "opacity 500ms ease-in" }
                  : {}
              }
            >
              {menuItem.children.map((childrenItem, index) => {
                const childColor =
                  childrenItem.color ||
                  SUBMENU_COLORS[index % SUBMENU_COLORS.length];
                return (
                  <li
                    key={index}
                    style={{
                      "--menu-color": childColor,
                      "--menu-color-soft": withAlpha(childColor, 0.15),
                    }}
                    className={
                      childrenItem.children
                        ? childrenItem.active
                          ? "active"
                          : ""
                        : ""
                    }
                  >
                    {childrenItem.type === "sub" ? (
                      <a
                        href="javascript:void(0)"
                        onClick={() => this.setNavActive(childrenItem)}
                      >
                        <i className="fa fa-circle"></i>
                        {childrenItem.title}{" "}
                        <i className="fa fa-angle-right pull-right"></i>
                      </a>
                    ) : (
                      ""
                    )}

                    {childrenItem.type === "link" ? (
                      <Link
                        to={`${process.env.PUBLIC_URL}${childrenItem.path}`}
                        className={childrenItem.active ? "active" : ""}
                        onClick={() => this.setNavActive(childrenItem)}
                      >
                        <i className="fa fa-circle"></i>
                        {childrenItem.title}{" "}
                      </Link>
                    ) : (
                      ""
                    )}
                    {childrenItem.children ? (
                      <ul
                        className={`sidebar-submenu ${
                          childrenItem.active ? "menu-open" : "active"
                        }`}
                      >
                        {childrenItem.children.map((childrenSubItem, key) => {
                          const subColor =
                            childrenSubItem.color ||
                            SUBMENU_COLORS[
                              (index + key + 3) % SUBMENU_COLORS.length
                            ];
                          return (
                            <li
                              className={childrenSubItem.active ? "active" : ""}
                              key={key}
                              style={{
                                "--menu-color": subColor,
                                "--menu-color-soft": withAlpha(subColor, 0.15),
                              }}
                            >
                              {childrenSubItem.type === "link" ? (
                                <Link
                                  to={`${process.env.PUBLIC_URL}${childrenSubItem.path}`}
                                  className={
                                    childrenSubItem.active ? "active" : ""
                                  }
                                  onClick={() =>
                                    this.setNavActive(childrenSubItem)
                                  }
                                >
                                  <i className="fa fa-circle"></i>
                                  {childrenSubItem.title}
                                </Link>
                              ) : (
                                ""
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      ""
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            ""
          )}
        </li>
      );
    });

    return (
      <Fragment>
        <div className="page-sidebar">
          <div className="main-header-left d-none d-lg-block">
            <div className="logo-wrapper">
              <Link to={`${process.env.PUBLIC_URL}/dashboard`}>
                <img
                  className="blur-up lazyloaded sidebar-logo"
                  style={{ width: "70%" }}
                  src={logo}
                  alt=""
                />
              </Link>
            </div>
          </div>
          <div className="sidebar custom-scrollbar colorful-sidebar">
            <User_panel />
            <ul className="sidebar-menu">
              {/* The menu is built from currentAdmin, which arrives a moment
                  after a cold page load (an invoice opened in a new tab, say).
                  Shimmer rows stand in so the sidebar reads as loading rather
                  than as broken. */}
              {this.state.mainmenu.length === 0
                ? SKELETON_WIDTHS.map((width, i) => (
                    <li className="pc-menu-skeleton" key={`skeleton-${i}`}>
                      <span className="pc-menu-skeleton-icon" />
                      <span
                        className="pc-menu-skeleton-label"
                        style={{ width }}
                      />
                    </li>
                  ))
                : mainmenu}
            </ul>
          </div>
        </div>
      </Fragment>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, null)(sidebar);
