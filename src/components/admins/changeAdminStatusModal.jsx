import React, { Component } from "react";
import "./changeAdminStatusModal.css";
import { updateAdminStatusRedux } from "../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
class ChangeAdminStatusModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: "",
    };
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    let { adminObj } = this.props;
    const { status } = this.state;
    console.log(status);

    await this.props.updateAdminStatusRedux({
      ...adminObj,
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
    console.log(this.props.adminObj);
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
              className="modal-content visible-modal-content-3"
              style={{ backgroundColor: "#13c9ca" }}
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
                            Update Admin Status
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
                                <option value="Admin">Admin</option>
                                <option value="Accounts">Accounts</option>
                                <option value="Employee">Employee</option>
                                <option value="Officer">Officer</option>
                                <option value="Partner">Partner</option>
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

export default connect(null, { updateAdminStatusRedux })(
  ChangeAdminStatusModal
);
