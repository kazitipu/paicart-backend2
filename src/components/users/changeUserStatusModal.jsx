import React, { Component } from "react";
import "./changeUserStatusModal.css";
import { updateUserStatusRedux } from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
class ChangeUserStatusModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "",
    };
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    let { userObj } = this.props;
    const { status } = this.state;
    console.log(status);

    await this.props.updateUserStatusRedux({
      ...userObj,
      status: status,
    });

    this.props.startToggleModal(null);
    this.setState({
      status: "",
    });
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value }, () => console.log(this.state.status));
  };
  render() {
    console.log(this.props.userObj);
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
              className="modal-content visible-modal-content-6"
              style={{ backgroundColor: "#18768f" }}
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
                            Update user Status
                          </h2>
                          <form
                            onSubmit={this.handleSubmit}
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-4">
                              <select
                                title="Please choose a status"
                                required
                                name="status"
                                className="custom-select"
                                aria-required="true"
                                aria-invalid="false"
                                onChange={this.handleChange}
                                value={this.state.status}
                              >
                                <option value="">Select Status</option>
                                <option value="Vip Partner">Vip Partner</option>
                                <option value="Corporate">Corporate</option>
                                <option value="Merchant">Merchant</option>
                                <option value="Customer">Customer</option>
                              </select>
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
                                  className="btn"
                                  style={{
                                    background: "purple",
                                    color: "white",
                                  }}
                                >
                                  Update Status
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

export default connect(null, { updateUserStatusRedux })(ChangeUserStatusModal);
