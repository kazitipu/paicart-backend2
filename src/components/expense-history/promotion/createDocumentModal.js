import React, { Component } from "react";
import "./createDocumentModal.css";

import {
  uploadPromotionRedux,
  updatePromotionRedux,
} from "../../../actions/index";
import { connect } from "react-redux";
import { toast } from "react-toastify";
class CreateDocumentModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      name: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    const { office } = nextProps;
    console.log(office);
    console.log("create Lot modal component will receive props is called");
    if (office != null) {
      this.setState(
        {
          name: office.name,
        },
        () => {
          console.log(this.state);
        }
      );
    } else {
      this.setState({
        name: "",
      });
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    console.log(this.state);
    console.log(this.props.office);
    if (this.props.office === null) {
      await this.props.uploadPromotionRedux({
        name: this.state.name.replaceAll("_", "-"),
        officeId: this.state.name.replaceAll("_", "-"),
      });
      toast.success(`Successfully created method ${this.state.name}`);
    } else {
      await this.props.updatePromotionRedux({
        ...this.state,
        officeId: this.state.name,
      });
      toast.success(`successfully updated method ${this.state.name}`);
    }

    this.setState({
      name: "",
    });
    this.props.startToggleModal(null);
  };
  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };
  render() {
    console.log(this.props.office);
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
                            {!this.props.office
                              ? "Create New Method"
                              : "Update Method"}
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
                                  placeholder="Office name"
                                  style={{ fontSize: "1rem" }}
                                  onChange={this.handleChange}
                                  value={this.state.name}
                                  required
                                  readOnly={this.props.office ? true : false}
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
                                {this.props.office == null ? (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Create Method
                                    <i className="icofont-rounded-right"></i>
                                  </button>
                                ) : (
                                  <button
                                    type="submit"
                                    className="btn btn-secondary"
                                  >
                                    Update Method
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
  uploadPromotionRedux,
  updatePromotionRedux,
})(CreateDocumentModal);
