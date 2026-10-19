import React, { Component } from "react";
import "./notificationModal.css";

import { connect } from "react-redux";
import { toast } from "react-toastify";
import { sendNotifications } from "../../firebase/fcmRestApi";
class NotificationModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messageBody: "",
      campaign_title: "",
    };
  }

  handleSubmit = (e) => {
    e.preventDefault();
    const { allUsers } = this.props;
    const UsersWithToken = allUsers.filter(
      (user) => user.deviceToken && user.deviceToken.length > 0
    );
    UsersWithToken.map((user) => {
      const message = {
        title: this.state.campaign_title,
        body: this.state.messageBody,
      };
      if (user.deviceToken && user.deviceToken.length > 0) {
        user.deviceToken.map((token) => {
          console.log(token);
          sendNotifications(token, message);
        });
      }
    });
    this.props.startToggleModal(false);
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  render() {
    console.log(this.props.singleLot);
    return (
      <>
        <div
          className={
            this.props.toggleModal
              ? "modal fade show"
              : "modal fade show visible-modal"
          }
          id="request_popup"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div
            className="modal-dialog modal-dialog-centered request_popup"
            role="document"
          >
            <div
              className="modal-content visible-modal-content-4"
              style={{
                backgroundColor:
                  this.props.singleLot && this.props.singleLot.action === "text"
                    ? "#67000a"
                    : "rgb(22 67 140)",
                boxShadow:
                  this.props.singleLot && this.props.singleLot.action === "text"
                    ? "rgb(107 58 63) 1px 5px 24px 0px"
                    : "rgb(29 47 76) 1px 5px 24px 0px",
              }}
            >
              <div className="modal-body p-0">
                <section className="pos-rel bg-light-gray">
                  <div className="container-fluid p-3">
                    <a
                      onClick={() => this.props.startToggleModal(false)}
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <i
                        className="icofont-close-line"
                        style={{ color: "white", cursor: "pointer" }}
                      ></i>
                    </a>
                    <div className="d-lg-flex justify-content-end no-gutters mb-spacer-md">
                      <div className="col">
                        <div className="px-3 m-5">
                          <h2
                            className="h2-xl mb-3 fw-6 pb-2"
                            style={{
                              color: "white",
                              textTransform: "none",
                              fontSize: "200%",
                              borderBottom: "2px dotted white",
                            }}
                          >
                            Send Notification
                          </h2>
                          <form
                            onSubmit={(e) => {
                              this.handleSubmit(e);
                            }}
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-4">
                              <input
                                type="text"
                                name="campaign_title"
                                className="form-control"
                                placeholder="Campaign Title"
                                style={{
                                  fontSize: "1rem",
                                }}
                                onChange={this.handleChange}
                                value={this.state.campaign_title}
                                required
                              />
                            </div>

                            <div className="form-row mb-4">
                              <textarea
                                type="text"
                                name="messageBody"
                                className="form-control"
                                placeholder="Enter text here..."
                                style={{ fontSize: "1rem", minHeight: "170px" }}
                                onChange={this.handleChange}
                                value={this.state.messageBody}
                                required
                              />
                            </div>

                            <div className="form-row">
                              <div
                                className="col pt-3"
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                <button
                                  type="submit"
                                  className="btn btn-secondary"
                                >
                                  Send Notification
                                  <i className="icofont-rounded-right"></i>
                                </button>
                              </div>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allUsers: state.users.users,
  };
};
export default connect(mapStateToProps, {})(NotificationModal);
