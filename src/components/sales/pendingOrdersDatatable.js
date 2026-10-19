import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  deleteOrder,
  updateMultipleOrder,
  updateMultipleOrderwithOrderTo,
  orderProductsFromChina,
} from "./../../firebase/firebase.utils";
import "./pendingOrdersDatatable.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { connect } from "react-redux";

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
      showOrderDetails: false,
      showOrdersArray: [],
      status: "order_pending",
      orderTo: "Fahim",
    };
    this.handleUpdateRow = this.handleUpdateRow.bind(this);
  }

  componentDidMount = () => {
    console.log(this.props);
  };

  selectRow = (e, i) => {
    if (!e.target.checked) {
      this.setState({
        checkedValues: this.state.checkedValues.filter((item, j) => i !== item),
      });
    } else {
      this.state.checkedValues.push(i);
      this.setState({
        checkedValues: this.state.checkedValues,
      });
    }
  };

  handleUpdateRow = async (event) => {
    event.preventDefault();
    const selectedValues = this.state.checkedValues;
    const status = this.state.status;
    await updateMultipleOrder(selectedValues, status);
    toast.success("Successfully Updated !");
    console.log(this.props);
    this.props.handleUpdateRow(selectedValues);
    this.setState({
      checkedValues: [],
      myData: this.props.myData,
      showOrderDetails: false,
      showOrdersArray: [],
      status: "order_pending",
    });
  };

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  handleMouseHoverOn = () => {
    this.setState({ showOrderDetails: true });
  };

  handleMouseHoverOff = () => {
    this.setState({ showOrderDetails: false });
  };

  getOrderList = (orderId) => {
    const { myData } = this.props;
    const orderObj = myData.filter((order) => order.orderId == orderId)[0];
    this.setState({ showOrdersArray: orderObj.order });
    console.log(this.state.showOrdersArray);
  };
  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };
  handleOrderToSubmit = async (e) => {
    e.preventDefault();
    const selectedValues = this.state.checkedValues;
    const status = this.state.status;
    await orderProductsFromChina(selectedValues, this.state.orderTo);
    await updateMultipleOrderwithOrderTo(
      selectedValues,
      "ordered",
      this.state.orderTo
    );
    this.props.handleUpdateRow(selectedValues);
    toast.success("Successfully Ordered !");
    this.setState({
      checkedValues: [],
      myData: this.props.myData,
      showOrderDetails: false,
      showOrdersArray: [],
      status: "order_pending",
    });
  };

  render() {
    const { pageSize, myClass, pagination } = this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];
    const routeTo = [];
    const orderedto = [];

    if (myData.length > 0) {
      myData.forEach((order) => {
        routeTo.push(order.status);
        newData.push({
          orderId: order.orderId,
          Customer: order.otherInformation
            ? order.otherInformation.first_name +
              order.otherInformation.last_name
            : "",
          phone: order.otherInformation ? order.otherInformation.phone : "",
          total: `Tk ${order.sum}`,
          paid: order.paymentStatus ? `Tk ${order.paymentStatus.paid}` : "",
        });
      });
    }
    const columns = [];
    for (var key in newData[0]) {
      columns.push({
        Header: <b>{this.Capitalize(key.toString())}</b>,
        accessor: key,
        Cell: null,
        style: {
          textAlign: "center",
        },
      });
    }
    columns.push({
      Header: <b>Order Details</b>,
      id: "orderDetails",
      accessor: (str) => "orderDetails",
      Cell: (row) => (
        <OverlayTrigger
          trigger="click"
          placement="bottom"
          overlay={
            <Popover
              id={`popover-positioned-bottom`}
              style={{ minWidth: "30%" }}
            >
              <Popover.Title as="h3">{`Order Id: ${row.original.orderId}`}</Popover.Title>
              <Popover.Content className="popover-body-container">
                {myData.length > 0
                  ? myData
                      .filter(
                        (order) => order.orderId == row.original.orderId
                      )[0]
                      .order.map((order) => (
                        <div className="order-details-flexbox" key={order.id}>
                          <div>
                            <img
                              style={{ maxWidth: "25%" }}
                              src={order.pictures[0]}
                            />{" "}
                            <br />
                            <strong>
                              {`${order.salePrice} × ${order.qty}`} ={" "}
                              {parseInt(order.salePrice) * parseInt(order.qty)}{" "}
                              tk
                            </strong>
                            <br />
                          </div>
                          <div>
                            product Id:{order.id} <br />
                            {order.color ? `color:  ${order.color}` : ""}{" "}
                            {order.sizeOrShipsFrom
                              ? `sizeOrShipsFrom: ${order.sizeOrShipsFrom}`
                              : ""}{" "}
                            <br />
                            ordered At: 12/12/2025
                          </div>
                        </div>
                      ))
                  : ""}
              </Popover.Content>
            </Popover>
          }
        >
          <button className="btn btn-primary">show</button>
        </OverlayTrigger>
      ),
      style: {
        textAlign: "center",
      },
      sortable: false,
    });

    if (routeTo[0] == "payment_approved") {
      columns.push({
        Header: (
          <div>
            {this.state.checkedValues.length > 0 ? (
              <OverlayTrigger
                trigger="click"
                placement="bottom"
                overlay={
                  <Popover
                    id={`popover-positioned-bottom`}
                    style={{ minWidth: "15%" }}
                  >
                    <Popover.Title as="h3">order to</Popover.Title>
                    <Popover.Content></Popover.Content>
                    <form
                      className="needs-validation add-product-form"
                      onSubmit={this.handleOrderToSubmit}
                    >
                      <div
                        className="form-group mb-3 row"
                        style={{ padding: "1rem" }}
                      >
                        <select
                          className="form-control digits"
                          id="exampleFormControlSelect1"
                          name="orderTo"
                          value={this.state.orderTo}
                          onChange={this.handleChange}
                        >
                          {this.props.admins
                            ? this.props.admins.map((admin) => (
                                <option key={admin.adminId}>
                                  {admin.name}
                                </option>
                              ))
                            : ""}
                        </select>
                        <div className="valid-feedback">Looks good!</div>
                      </div>

                      <div
                        className="offset-xl-3 offset-sm-4"
                        style={{ padding: "2px" }}
                      >
                        <button type="submit" className="btn btn-success">
                          confirm
                        </button>
                      </div>
                    </form>
                  </Popover>
                }
              >
                <button className="btn btn-success">order to</button>
              </OverlayTrigger>
            ) : (
              ""
            )}
          </div>
        ),
        id: "delete",
        accessor: (str) => "delete",
        sortable: false,
        style: {
          textAlign: "center",
        },
        Cell: (row) => (
          <div>
            <span>
              <input
                type="checkbox"
                name={row.original.orderId}
                defaultChecked={this.state.checkedValues.includes(
                  row.original.orderId
                )}
                onChange={(e) => this.selectRow(e, row.original.orderId)}
              />
            </span>
          </div>
        ),
        accessor: key,
        style: {
          textAlign: "center",
        },
      });
    } else {
      columns.push(
        {
          Header: <b>Action</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => (
            <div>
              <span
                onClick={() => {
                  let data = myData;
                  data.splice(row.index, 1);
                  this.setState({ myData: data });
                  console.log(row);
                  deleteOrder(row.original.orderId);

                  toast.success("Successfully Deleted !");
                }}
              >
                <i
                  className="fa fa-trash"
                  style={{
                    width: 35,
                    fontSize: 20,
                    padding: 11,
                    color: "#e4566e",
                    cursor: "pointer",
                  }}
                ></i>
              </span>
              <span
                style={{ cursor: "pointer" }}
                onClick={() =>
                  this.props.history.push(
                    `/sales/orders/update-status/${row.original.orderId}`,
                    { from: `/sales/${routeTo[0]}` }
                  )
                }
              >
                <i
                  className="fa fa-pencil"
                  style={{
                    width: 35,
                    fontSize: 20,
                    padding: 11,
                    color: "rgb(40, 167, 69)",
                  }}
                ></i>
              </span>
            </div>
          ),
          style: {
            textAlign: "center",
          },
          sortable: false,
        },
        {
          Header: (
            <div>
              {this.state.checkedValues.length > 0 ? (
                <OverlayTrigger
                  trigger="click"
                  placement="bottom"
                  overlay={
                    <Popover
                      id={`popover-positioned-bottom`}
                      style={{ minWidth: "15%" }}
                    >
                      <Popover.Title as="h3">
                        update all order status
                      </Popover.Title>
                      <Popover.Content></Popover.Content>
                      <form
                        className="needs-validation add-product-form"
                        onSubmit={this.handleUpdateRow}
                      >
                        <div
                          className="form-group mb-3 row"
                          style={{ padding: "1rem" }}
                        >
                          <select
                            className="form-control digits"
                            id="exampleFormControlSelect1"
                            name="status"
                            value={this.state.status}
                            onChange={this.handleChange}
                          >
                            <option>order_pending</option>
                            <option>payment_approved</option>
                            <option>ordered</option>
                            <option>china_warehouse</option>
                            <option>in-shipping</option>
                            <option>in_stock</option>
                            <option>ready_to_ship</option>
                            <option>delivered</option>
                          </select>
                          <div className="valid-feedback">Looks good!</div>
                        </div>

                        <div
                          className="offset-xl-3 offset-sm-4"
                          style={{ padding: "2px" }}
                        >
                          <button type="submit" className="btn btn-primary">
                            Add
                          </button>
                        </div>
                      </form>
                    </Popover>
                  }
                >
                  <button className="btn btn-primary">update</button>
                </OverlayTrigger>
              ) : (
                ""
              )}
            </div>
          ),
          id: "delete",
          accessor: (str) => "delete",
          sortable: false,
          style: {
            textAlign: "center",
          },
          Cell: (row) => (
            <div>
              <span>
                <input
                  type="checkbox"
                  name={row.original.orderId}
                  defaultChecked={this.state.checkedValues.includes(
                    row.original.orderId
                  )}
                  onChange={(e) => this.selectRow(e, row.original.orderId)}
                />
              </span>
            </div>
          ),
          accessor: key,
          style: {
            textAlign: "center",
          },
        }
      );
    }

    return (
      <>
        <ReactTable
          style={{ zIndex: 1 }}
          data={newData}
          columns={columns}
          defaultPageSize={pageSize}
          className={myClass}
          showPagination={pagination}
        />

        <ToastContainer />
      </>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    admins: state.admins.admins,
  };
};
export default connect(mapStateToProps, null)(Datatable);
