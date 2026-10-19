import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import {
  uploadProduct,
  uploadAliProduct,
  getSingleUser,
  getAllCartonBooking,
} from "../../../firebase/firebase.utils";
import "./add-aliexpress-product.css";
import { connect } from "react-redux";
import {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCnCartonsRedux,
  updateEmployeeRedux,
  getAllEmployeeRedux,
} from "../../../actions";

import { toast, ToastContainer } from "react-toastify";

import FullPageLoader from "./fullPageLoader";
export class Receive_Product extends Component {
  constructor(props) {
    super(props);
    this.state = {
      cartons: [],
    };
  }

  componentDidMount = async () => {
    let cartons = await getAllCartonBooking();
    this.setState({
      cartons,
    });
  };

  render() {
    const { cartons } = this.state;

    return (
      <Fragment>
        <Breadcrumb title="Recently Booked Cartons" parent="Physical" />

        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card" style={{ background: "#f8f8f9" }}>
                <div>
                  <div
                    className="card-header"
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <h5 style={{ fontSize: 25 }}>Recently booked Cartons</h5>
                    </div>
                  </div>
                </div>

                <div
                  className="card-body"
                  style={{ marginBottom: 20, background: "white" }}
                >
                  {cartons.map((carton, index) => {
                    return (
                      <div
                        style={{
                          padding: "20px 10px",
                          border: "1px solid gainsboro",
                          borderRadius: 10,
                          marginBottom: 20,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 20,
                            padding: 10,
                            fontWeight: "bold",
                            borderBottom: "1px solid gainsboro",
                            marginBottom: 10,
                          }}
                        >
                          {index + 1}. {carton.lotNo} :{" "}
                        </div>{" "}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "flex-start",
                            marginBottom: 15,
                            flexWrap: "wrap",
                            rowGap: 10,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "flex-start",
                            }}
                          >
                            {carton.cartons.map((carton1) => {
                              return (
                                <div style={{ position: "relative" }}>
                                  <div
                                    style={{
                                      padding: 10,
                                      borderRadius: 5,
                                      background: "aliceblue",
                                      border: "2px solid gray",
                                      fontWeight: "bold",
                                      fontSize: 18,
                                      marginRight: 10,
                                      cursor: "pointer",
                                    }}
                                    onClick={() => {
                                      this.props.history.push(
                                        `/products-physical/receive-products/${carton1.cartonId}`
                                      );
                                    }}
                                  >
                                    {carton1.name}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
    allUsers: state.users.users,
    currency: state.users.currency,
    orderTracking: state.orders.orderTracking,
    currentAdmin: state.admins.currentAdmin,
    employees: state.employees.employees,
    cartons: state.cartons.cartons,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  updateOrderApiRedux,
  uploadCartonRedux,
  updateCartonRedux,
  deleteCartonRedux,
  getAllCnCartonsRedux,
  updateEmployeeRedux,
  getAllEmployeeRedux,
})(Receive_Product);
