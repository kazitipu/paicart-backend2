import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  updateMultipleOrder,
  rechargeAdmin,
} from "./../../firebase/firebase.utils";
import { rechargeAdminredux } from "../../actions";
import { connect } from "react-redux";

import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      rechargeBalance: 0,
      myData: this.props.myData,
    };
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

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };
  handleRechargeSubmit = async (e) => {
    e.preventDefault();
    const adminIdArray = this.state.checkedValues;
    try {
      await rechargeAdmin(adminIdArray, this.state.rechargeBalance);
      this.props.rechargeAdminredux(adminIdArray, this.state.rechargeBalance);
      toast.success(
        `Successfully Recharged amount of ${this.state.rechargeBalance} !`
      );
      this.setState({
        checkedValues: [],
        rechargeBalance: "",
        myData: this.props.myData,
      });
    } catch (error) {
      alert(error);
    }
  };

  render() {
    const { pageSize, myClass, pagination } = this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];

    if (myData && myData.length > 0) {
      myData.forEach((admin) => {
        newData.push({
          adminId: admin.adminId,
          name: admin.name,
          totalBalance: admin.balance,
          remainingBalance:
            parseInt(admin.balance) - parseInt(admin.used_balance),
          usedBalance: admin.used_balance,
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
    columns.push(
      {
        Header: <b>PendingOrders</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => (
          <OverlayTrigger
            trigger="click"
            placement="bottom"
            overlay={
              <Popover
                id={`popover-positioned-bottom`}
                style={{ minWidth: "15%" }}
              >
                <Popover.Title as="h3">
                  Pending Orders to {row.original.name}{" "}
                </Popover.Title>
                <Popover.Content>
                  {myData.length > 0
                    ? myData
                        .find((admin) => admin.adminId === row.original.adminId)
                        .pending_orders.map((orderId) => (
                          <div className="order-details-flexbox" key={orderId}>
                            orderId: {orderId}
                          </div>
                        ))
                    : ""}
                </Popover.Content>
              </Popover>
            }
          >
            <button className="btn btn-secondary">view</button>
          </OverlayTrigger>
        ),
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>DeliveredOrders</b>,
        id: "orderDetails",
        accessor: (str) => "orderDetails",
        Cell: (row) => (
          <OverlayTrigger
            trigger="click"
            placement="bottom"
            overlay={
              <Popover
                id={`popover-positioned-bottom`}
                style={{ minWidth: "15%" }}
              >
                <Popover.Title as="h3">
                  total delivered orders from {row.original.name}
                </Popover.Title>
                <Popover.Content>
                  {myData.length > 0
                    ? myData
                        .find((admin) => admin.adminId === row.original.adminId)
                        .successfully_delivered_orders.map((orderId) => (
                          <div className="order-details-flexbox" key={orderId}>
                            orderId: {orderId}
                          </div>
                        ))
                    : ""}
                </Popover.Content>
              </Popover>
            }
          >
            <button className="btn btn-success">view</button>
          </OverlayTrigger>
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
                      recharge amount to selected suppliers
                    </Popover.Title>
                    <Popover.Content></Popover.Content>
                    <form
                      className="needs-validation add-product-form"
                      onSubmit={this.handleRechargeSubmit}
                    >
                      <div
                        className="form-group mb-3 row"
                        style={{ padding: "1rem" }}
                      >
                        <input
                          className="form-control digits"
                          id="exampleFormControlSelect1"
                          name="rechargeBalance"
                          value={this.state.rechargeBalance}
                          onChange={this.handleChange}
                        />
                        <div className="valid-feedback">Looks good!</div>
                      </div>

                      <div
                        className="offset-xl-3 offset-sm-4"
                        style={{ padding: "2px" }}
                      >
                        <button type="submit" className="btn btn-primary">
                          recharge
                        </button>
                      </div>
                    </form>
                  </Popover>
                }
              >
                <button className="btn btn-primary">Recharge</button>
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
                style={{ cursor: "pointer" }}
                type="checkbox"
                name={row.original.adminId}
                defaultChecked={this.state.checkedValues.includes(
                  row.original.adminId
                )}
                onChange={(e) => this.selectRow(e, row.original.adminId)}
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

export default connect(null, { rechargeAdminredux })(Datatable);
