import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Datatable from "./monthDatatable";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { getAllSoldProductsRedux } from "../../../../actions/index";

import { connect } from "react-redux";

export class SoldMonth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      employee: null,
    };
  }

  componentDidMount = async () => {
    this.props.getAllSoldProductsRedux();
  };

  clickActive = (event) => {
    document.querySelector(".nav-link").classList.remove("show");
    event.target.classList.add("show");
  };

  render() {
    const { open } = this.state;
    const { products } = this.props;
    let months = [...new Set(products.map((product) => product.month))];

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb title="Monthly" parent="Business Consultancy" />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="col-sm-12">
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
                    className="icofont-list"
                    style={{
                      fontSize: "130%",
                      marginRight: "5px",
                      color: "darkblue",
                    }}
                  ></i>
                  Sold Stock Products
                </h5>
              </div>
              <div className="card-body">
                <div className="clearfix"></div>
                <div id="basicScenario" className="product-physical">
                  <Datatable
                    startToggleModal={this.startToggleModal}
                    history={this.props.history}
                    multiSelectOption={false}
                    myData={months}
                    pageSize={50}
                    pagination={true}
                    class="-striped -highlight"
                    type="expense"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    products: state.products.soldProducts,
  };
};

export default connect(mapStateToProps, {
  getAllSoldProductsRedux,
})(SoldMonth);
