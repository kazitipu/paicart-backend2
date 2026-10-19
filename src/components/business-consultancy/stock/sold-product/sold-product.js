import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";
import { ToastContainer, toast } from "react-toastify";
import CountUp from "react-countup";
import { connect } from "react-redux";
import { DollarSign } from "react-feather";
import { Link } from "react-router-dom";
import { getAllSoldProductsMonthlyRedux } from "../../../../actions/index";
export class StockProduct extends Component {
  constructor(props) {
    super(props);
  }

  componentDidMount = async () => {
    this.props.getAllSoldProductsMonthlyRedux(this.props.match.params.month);
  };

  render() {
    const { products } = this.props;
    let date = new Date();
    let total = 0;
    if (products.length > 0) {
      products.map((product) => {
        total += parseInt(product.quantity) * parseInt(product.amount);
      });
    }

    console.log(this.props);
    return (
      <Fragment>
        <Breadcrumb
          title={this.props.match.params.month}
          parent="Business Consultancy"
        />
        {/* <!-- Container-fluid starts--> */}
        <div className="container-fluid">
          <div className="row" style={{ justifyContent: "center" }}>
            <>
              <div className="card o-hidden widget-cards">
                <div
                  className="card-body"
                  style={{ backgroundColor: "#00254c" }}
                >
                  <div className="media static-top-widget row">
                    <div className="icons-widgets col-4">
                      <div className="align-self-center text-center">
                        <DollarSign className="font-warning" />
                      </div>
                    </div>
                    <div className="media-body col-8">
                      <span
                        className="m-0"
                        style={{
                          fontWeight: "bold",
                          fontSize: "100%",
                          color: "white",
                        }}
                      >
                        {this.props.match.params.month} Stock Sold
                      </span>
                      <h3 className="mb-0" style={{ color: "darkorange" }}>
                        <CountUp className="counter" end={total} />
                        Tk
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </>
            <div className="col-sm-12">
              <div className="card">
                <div
                  className="card-header"
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    borderBottom: "1px solid gainsboro",
                  }}
                >
                  <h5>
                    <i
                      className="icofont-money"
                      style={{
                        fontSize: "130%",
                        marginRight: "5px",
                        color: "#00254c",
                      }}
                    ></i>
                    Sold Products
                  </h5>
                </div>
                <div className="card-body">
                  <div className="clearfix"></div>
                  <div id="basicScenario" className="product-physical">
                    <table className="table table-bordered table-striped table-hover">
                      <thead>
                        <tr>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            #
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Customer
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Image
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Name
                          </th>
                          <th
                            scope="col"
                            colSpan={3}
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Description
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Quantity
                          </th>
                          <th
                            scope="col"
                            style={{
                              padding: "30px 15px",
                              color: "white",
                              backgroundColor: "#00254c",
                            }}
                          >
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {products.map((product, index) => (
                          <tr key={index}>
                            <th scope="row">{index + 1}</th>
                            <td>{product.date}</td>
                            <td style={{ color: "#ff8084" }}>
                              <Link
                                to={`/users/list-user/${product.customerUid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {product.customer}
                              </Link>
                            </td>
                            <td>
                              <a href={product.imageUrl} target="_blank">
                                <img
                                  style={{ height: 70, width: 70 }}
                                  src={product.imageUrl}
                                />
                              </a>
                            </td>
                            <td>{product.name}</td>
                            <td colSpan={3}>{product.description}</td>
                            <td>{product.quantity}pc</td>
                            <td>{product.amount}Tk</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ToastContainer />
        {/* <!-- Container-fluid Ends--> */}
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    products: state.products.soldProductsMonthly,
  };
};

export default connect(mapStateToProps, { getAllSoldProductsMonthlyRedux })(
  StockProduct
);
