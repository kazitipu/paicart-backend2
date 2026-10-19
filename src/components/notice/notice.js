import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import NoticeModal from "./noticeModal";
import Datatable from "./noticeDatatable";
import { getAllNoticesRedux } from "../../actions/index";
import { Search } from "react-feather";
import { connect } from "react-redux";

export class Notice extends Component {
  constructor(props) {
    super(props);
    this.state = {
      toggleModal: true,
      noticeObj: null,
    };
  }

  componentDidMount = async () => {
    await this.props.getAllNoticesRedux();
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
        <Breadcrumb title="All Notices" parent="NOtices" />
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
                <i
                  className="icofont-send-mail"
                  style={{
                    fontSize: "180%",
                    marginRight: "5px",
                    marginTop: "5px",
                    color: "#ff8084",
                  }}
                ></i>
                Notices
              </h5>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
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
                  myData={this.props.allNotice}
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
    allNotice: state.notices.notices,
  };
};
export default connect(mapStateToProps, { getAllNoticesRedux })(Notice);
