import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import NoticeModal from "./introModal";
import Datatable from "./introModalListDatatable";
import { getAllIntrosRedux } from "../../../actions/index";
import { Search } from "react-feather";
import { connect } from "react-redux";

export class IntroModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toggleModal: true,
      noticeObj: null,
    };
  }

  componentDidMount = async () => {
    await this.props.getAllIntrosRedux();
  };

  startToggleModal = async (noticeObj) => {
    if (noticeObj == null) {
      this.setState({ toggleModal: !this.state.toggleModal, noticeObj: null });
    } else {
      this.setState({
        toggleModal: !this.state.toggleModal,
        noticeObj: noticeObj,
      });
    }
  };

  render() {
    const { currentAdmin } = this.props;
    return (
      <Fragment>
        <NoticeModal
          toggleModal={this.state.toggleModal}
          startToggleModal={this.startToggleModal}
          noticeObj={this.state.noticeObj}
        />
        <Breadcrumb title="Intro Modal" parent="Communication" />
        <div className="container-fluid">
          <div className="card">
            <div
              className="card-header"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
              }}
            >
              <h5>
                {" "}
                <i
                  className="icofont-send-mail"
                  style={{
                    fontSize: "180%",
                    marginRight: "5px",
                    marginTop: "5px",
                    color: "#ff8084",
                  }}
                ></i>
                Intro Modal
              </h5>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <li
                  style={
                    {
                      // border: "1px solid gainsboro",
                      // borderRadius: "5rem",
                      // padding: "0px 20px",
                      // background: "whitesmoke",
                      // marginRight: "20px",
                    }
                  }
                >
                  {/* <form
                    className="form-inline search-form"
                    onSubmit={this.handleSubmit}
                  >
                    <div
                      // className="form-group"
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "space-around",
                      }}
                    >
                      <input
                        className={
                          "form-control-plaintext " +
                          (this.state.searchbar ? "open" : "")
                        }
                        name="searchFor"
                        value={this.state.searchFor}
                        type="search"
                        placeholder="Search Notice"
                        onChange={this.handleChange}
                      />
                      <span
                        // className="d-sm-none mobile-search"
                        onClick={() => this.handleSearchClick()}
                      >
                        <Search
                          style={{
                            marginTop: "5px",
                            borderLeft: "1px solid gainsboro",
                            paddingLeft: "7px",
                            color: "gray",
                          }}
                        />
                      </span>
                    </div>
                  </form> */}
                </li>

                <li>
                  <button
                    className="btn"
                    style={{
                      backgroundColor: "rgb(22 67 140)",
                      color: "white",
                      marginLeft: "5px",
                    }}
                    type="button"
                    onClick={() => this.startToggleModal(null)}
                    disabled={
                      currentAdmin && currentAdmin.status == "Partner"
                        ? true
                        : false
                    }
                  >
                    Create
                  </button>
                </li>
              </div>
            </div>
            <div className="card-body">
              <div className="clearfix"></div>
              <div
                id="batchDelete"
                className="category-table user-list order-table coupon-list-delete"
              >
                <Datatable
                  startToggleModal={this.startToggleModal}
                  history={this.props.history}
                  multiSelectOption={false}
                  myData={this.props.allIntro}
                  pageSize={50}
                  pagination={true}
                  class="-striped -highlight"
                />
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allIntro: state.products.intro,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, { getAllIntrosRedux })(IntroModal);
