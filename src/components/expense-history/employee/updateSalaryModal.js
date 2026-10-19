import React, { Component } from "react";
import "./createDocumentModal.css";

import { updateSalaryRedux } from "../../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
class CreateDocumentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      salary: 0,
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { employee } = nextProps;
    console.log(employee);
    console.log(this.props.name);

    if (employee != null) {
      this.setState(
        {
          salary: employee.salary,
        },
        () => {
          console.log(this.state);
        }
      );
    } else {
      this.setState({
        salary: 0,
      });
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    console.log(this.state);
    console.log(this.props.employee);

    let employee = {
      id: `${this.props.employee.month}-SALARY-${this.props.name}`,
      salary: this.state.salary,
    };

    await this.props.updateSalaryRedux(employee);
    toast.success(`successfully updated employee ${this.props.name}`);

    this.setState({
      salary: 0,
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
                            Update Salary Of {this.props.name}
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
                                    marginBottom: "4px",
                                  }}
                                >
                                  Salary
                                </label>
                                <input
                                  type="number"
                                  name="salary"
                                  className="form-control"
                                  placeholder="Enter Salary"
                                  style={{ fontSize: "1rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.salary}
                                  required
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
                                <button
                                  type="submit"
                                  className="btn btn-secondary"
                                >
                                  Update Salary
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

export default connect(null, {
  updateSalaryRedux,
})(CreateDocumentModal);
