import React, { Component } from "react";
import "./introModal.css";

import { connect } from "react-redux";
import { toast } from "react-toastify";
import { createIntroRedux } from "../../../actions/index";
import man from "../../products/physical/plus image.jpeg";
import { uploadImageIntro } from "../../../firebase/firebase.utils";
class IntroModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      imageUrl: man,
      file: "",
    };
  }

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.noticeObj) {
      this.setState({});
    }
  };

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState({ [name]: value });
  };

  _handleImgChange = async (e, i) => {
    e.preventDefault();

    let reader = new FileReader();
    let file = e.target.files[0];
    const { imageUrl } = this.state;

    reader.onloadend = () => {
      this.setState({
        file: file,
        imageUrl,
      });
    };
    if (file) {
      reader.readAsDataURL(file);
      const imgUrl = await uploadImageIntro(file);
      console.log(imgUrl);

      this.setState({
        imageUrl: imgUrl,
      });
      console.log(imageUrl);
    }
  };

  handleSubmit = async (event) => {
    event.preventDefault();

    const uniqueId = Math.floor(Math.random() * 10000 - 1);
    const createdAt = new Date().toLocaleDateString("en-US");
    await this.props.createIntroRedux({
      id: uniqueId,
      createdAt,
      ...this.state,
    });
    this.props.startToggleModal(null);
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
                            Upload Intro Image (550 * 650)
                          </h2>
                          <form
                            onSubmit={this.handleSubmit}
                            className="rounded-field mt-4"
                          >
                            <div className="form-row mb-4">
                              <div
                                className="box-input-file"
                                style={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <img
                                  className="img-100 lazyloaded blur-up"
                                  src={this.state.imageUrl}
                                  alt="#"
                                  style={{
                                    zIndex: 10,
                                    cursor: "pointer",
                                  }}
                                  onClick={() => {
                                    document
                                      .getElementById("upload-image-input")
                                      .click();
                                  }}
                                />

                                <input
                                  id="upload-image-input"
                                  className="upload"
                                  type="file"
                                  style={{
                                    position: "absolute",
                                    zIndex: 5,
                                    maxWidth: "50px",
                                    marginTop: "20px",
                                  }}
                                  onChange={(e) => this._handleImgChange(e, 0)}
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
  createIntroRedux,
})(IntroModal);
