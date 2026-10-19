import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import Tabset_user from "./tabset-user";
import { connect } from "react-redux";
import man from "../../assets/images/dashboard/user2.jpg";
import {
  getSingleUserRedux,
  getAllShipForMeOfSingleUserRedux,
  getAllOrderOfSingleUserRedux,
  getAllProductRequestOfSingleUserRedux,
  getAllPaymentOfSingleUserRedux,
} from "../../actions/index";
export class DetailUser extends Component {
  componentDidMount = () => {
    const { userId } = this.props.match.params;
    this.props.getSingleUserRedux(userId);
    this.props.getAllShipForMeOfSingleUserRedux(userId);
    this.props.getAllOrderOfSingleUserRedux(userId);
    this.props.getAllProductRequestOfSingleUserRedux(userId);
    this.props.getAllPaymentOfSingleUserRedux(userId);
  };
  render() {
    const { user } = this.props;
    console.log(user);
    return (
      <Fragment>
        {/* <Breadcrumb title={user && user.displayName} parent="Users" /> */}
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    {user && user.imageUrl ? (
                      <img
                        className="img-60 rounded-circle lazyloaded blur-up"
                        src={user.imageUrl}
                        alt="#"
                      />
                    ) : (
                      <img
                        className="img-60 rounded-circle lazyloaded blur-up"
                        src={man}
                        alt="#"
                      />
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      fontSize: "200%",
                      marginTop: "10px",
                      textTransform: "capitalize",
                    }}
                  >
                    {user && user.displayName}
                  </div>
                </div>
                <div className="card-body">
                  <Tabset_user
                    user={user}
                    rechargesArray={[]}
                    bookingsArray={[]}
                    parcelsArray={[]}
                    paymentsArray={[]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  console.log(ownProps.match.params.userId);
  return {
    user: state.users.users.find(
      (user) => user.uid === ownProps.match.params.userId
    ),
  };
};

export default connect(mapStateToProps, {
  getAllShipForMeOfSingleUserRedux,
  getAllOrderOfSingleUserRedux,
  getAllProductRequestOfSingleUserRedux,
  getAllPaymentOfSingleUserRedux,

  getSingleUserRedux,
})(DetailUser);
