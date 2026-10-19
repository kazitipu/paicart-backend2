import React, { Component } from "react";
import "./createDocumentModal.css";

import {
  uploadEmployeeRedux,
  updateEmployeeRedux,
} from "../../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
class CreateDocumentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
      address: "",
      designation: "",
      adminId: "",
      status: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { employee } = nextProps;
    console.log(employee);

    if (employee != null) {
      this.setState(
        {
          name: employee.name,
          designation: employee.designation,
          address: employee.address,
          adminId: employee.adminId ? employee.adminId : "",
          status: employee.status ? employee.status.props.children : "",
        },
        () => {
          console.log(this.state);
        }
      );
    } else {
      this.setState({
        name: "",
        designation: "",
        address: "",
        adminId: "",
        status: "",
      });
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    console.log(this.state);
    console.log(this.props.employee);
    if (this.props.employee === null) {
      await this.props.uploadEmployeeRedux({
        address: this.state.address,
        name: this.state.name.replaceAll("_", "-"),
        designation: this.state.designation,
        employeeId: this.state.name.replaceAll("_", "-"),
        adminId: this.state.adminId,
        status: this.state.status,
      });
      toast.success(`Successfully created employee ${this.state.name}`);
    } else {
      await this.props.updateEmployeeRedux({
        ...this.state,
        employeeId: this.state.name,
      });
      toast.success(`successfully updated employee ${this.state.name}`);
    }

    this.setState({
      name: "",
      address: "",
    });
    this.props.startToggleModal(null);
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };
  render() {
    console.log(this.props.employee);
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
              style={{ backgroundColor: "darkblue" }}
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
                            {!this.props.employee
                              ? "Create New Employee"
                              : "Update Employee"}
                          </h2>
                          <form
                            onSubmit={this.handleSubmit}
                            noValidate="novalidate"
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Name
                                </label>
                                <input
                                  type="text"
                                  name="name"
                                  className="form-control"
                                  placeholder="Employee name"
                                  style={{ fontSize: "1rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.name}
                                  required
                                  readOnly={this.props.employee ? true : false}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Designation
                                </label>
                                <input
                                  type="text"
                                  required
                                  name="designation"
                                  className="form-control"
                                  placeholder="Employee Designation"
                                  onChange={this.handleChange}
                                  value={this.state.designation}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Address
                                </label>
                                <input
                                  type="text"
                                  required
                                  name="address"
                                  className="form-control"
                                  placeholder="Home Address"
                                  onChange={this.handleChange}
                                  value={this.state.address}
                                />
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Status
                                </label>
                                <select
                                  title="Please choose a package"
                                  required
                                  name="status"
                                  className="custom-select"
                                  aria-required="true"
                                  aria-invalid="false"
                                  onChange={this.handleChange}
                                  value={this.state.status}
                                >
                                  <option value="">Select Status</option>
                                  <option value="Active">Active</option>
                                  <option value="Deactive">Deactive</option>
                                </select>
                              </div>
                            </div>
                            <div className="form-row mb-2">
                              <div className="col">
                                <label
                                  style={{
                                    color: "white",
                                    fontSize: "130%",
                                    marginBottom: "0px",
                                  }}
                                >
                                  Admin Id (attach admin for
                                  Sourcing/Purchasing)
                                </label>
                                <input
                                  type="text"
                                  required
                                  name="adminId"
                                  className="form-control"
                                  placeholder="Enter adminId"
                                  onChange={this.handleChange}
                                  value={this.state.adminId}
                                />
                              </div>
                            </div>

                            <div className="form-row">
                              <div
                                className="col pt-3"
                                style={{
                                  display: "flex",
                                  justifyContent: "flex-end",
                                }}
                              >
                                {this.props.employee == null ? (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Create Employee
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Update Employee
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

export default connect(null, {
  uploadEmployeeRedux,
  updateEmployeeRedux,
})(CreateDocumentModal);
