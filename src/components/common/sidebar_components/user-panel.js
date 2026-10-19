import React, { Component, Fragment } from "react";
import man from "../../../assets/images/dashboard/user2.jpg";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

export class User_panel extends Component {
  render() {
    const { currentAdmin } = this.props;
    return (
      <div>
        <div className="sidebar-user text-center">
          <div>
            {currentAdmin && currentAdmin.image ? (
              <img
                className="img-60 rounded-circle lazyloaded blur-up"
                src={currentAdmin.image}
                alt="#"
              />
            ) : (
              <img
                className="img-60 rounded-circle lazyloaded blur-up"
                src={man}
                alt="#"
              />
            )}
          </div>
          {/* currentAdmin lands a beat after a cold page load, so the card
              shimmers instead of showing a nameless, 0Tk profile. */}
          {currentAdmin ? (
            <Fragment>
              <h6 className="mt-3 f-14" style={{ color: "#18768f" }}>
                {currentAdmin.name}
              </h6>
              <p>{currentAdmin.status}</p>
              <Link
                to={`${process.env.PUBLIC_URL}/expense/partner/${currentAdmin.adminId}`}
              >
                <p
                  style={{
                    marginTop: 5,
                    cursor: "pointer",
                    color: "orange",
                    fontSize: "bold",
                  }}
                >
                  Balance:{currentAdmin.balance}Tk
                </p>
              </Link>
            </Fragment>
          ) : (
            <Fragment>
              <span
                className="pc-user-skeleton"
                style={{ width: 120, marginTop: 16 }}
              />
              <span className="pc-user-skeleton" style={{ width: 64 }} />
              <span className="pc-user-skeleton" style={{ width: 88 }} />
            </Fragment>
          )}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, null)(User_panel);
