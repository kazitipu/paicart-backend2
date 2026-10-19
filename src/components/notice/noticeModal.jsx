import React, { Component } from "react";
import "./noticeModal.css";

import { connect } from "react-redux";
import { toast } from "react-toastify";
import { createNoticeRedux, updateNoticeRedux } from "../../actions/index";

class TextOrMailModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      noticeTitle: "",
      noticeBody: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    this.setState({
      noticeTitle: nextProps.noticeObj ? nextProps.noticeObj.noticeTitle : "",
      noticeBody: nextProps.noticeObj ? nextProps.noticeObj.noticeBody : "",
    });
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { noticeObj } = this.props;
    if (noticeObj) {
      await this.props.updateNoticeRedux({ id: noticeObj.id, ...this.state });
      this.props.startToggleModal(null);
    } else {
      const uniqueId = Math.floor(Math.random() * 10000 - 1);
      const date = new Date();
      await this.props.createNoticeRedux({
        id: uniqueId,
        createdAt: date.toLocaleDateString("en-GB"),
        time: date.getTime(),
        ...this.state,
      });
      this.props.startToggleModal(null);
    }
  };

  render() {
    console.log(this.props.noticeObj);
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
              className="modal-content visible-modal-content-2"
              style={{
                backgroundColor: "rgb(22 67 140)",
                boxShadow: "rgb(29 47 76) 1px 5px 24px 0px",
              }}
            >
              <div className="modal-body p-0">
                <section className="pos-rel bg-light-gray">
                  <div className="container-fluid p-3">
                    <a
                      onClick={() => this.props.startToggleModal(null)}
                      className="close"
                      data-dismiss="modal"
                      aria-label="Close"
                    >
                      <i
                        className="icofont-close-line"
                        style={{ color: "white" }}
                      ></i>
                    </a>
                    <div className="d-lg-flex justify-content-end no-gutters mb-spacer-md">
                      {/* <div className="col bg-fixed bg-img-7 request_pag_img">
                        &nbsp;
                      </div> */}

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
                            {this.props.noticeObj
                              ? "Update Notice"
                              : "Create Notice"}
                          </h2>
                          <form
                            onSubmit={this.handleSubmit}
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-4">
                              <label
                                style={{
                                  color: "white",
                                  fontWeight: "bold",
                                  marginBottom: "5px",
                                }}
                              >
                                Notice Title
                              </label>
                              <textarea
                                type="text"
                                name="noticeTitle"
                                className="form-control"
                                placeholder="Enter text here..."
                                style={{ fontSize: "1rem", minHeight: "100px" }}
                                onChange={this.handleChange}
                                value={this.state.noticeTitle}
                                required
                              />
                            </div>
                            <div className="form-row mb-4">
                              <label
                                style={{
                                  color: "white",
                                  fontWeight: "bold",
                                  marginBottom: "5px",
                                }}
                              >
                                Notice Description
                              </label>
                              <textarea
                                type="text"
                                name="noticeBody"
                                className="form-control"
                                placeholder="Enter text here..."
                                style={{ fontSize: "1rem", minHeight: "270px" }}
                                onChange={this.handleChange}
                                value={this.state.noticeBody}
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
                                {this.props.noticeObj ? (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Update
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Create
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                )}
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
export default connect(mapStateToProps, {
  createNoticeRedux,
  updateNoticeRedux,
})(TextOrMailModal);
