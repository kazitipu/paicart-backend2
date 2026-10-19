import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

import {
  deletePayment,
  updatePaymentStatus,
  updateOrderAmount,
} from "../../firebase/firebase.utils";

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
      status: "unVerified",
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

  handleRemoveRow = () => {
    const selectedValues = this.state.checkedValues;
    const updatedData = this.state.myData.filter(function (el) {
      return selectedValues.indexOf(el.id) < 0;
    });
    this.setState({
      myData: updatedData,
    });
    toast.success("Successfully Deleted !");
  };

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  toDateTime = (secs) => {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
  };
  handleChange = (event, orderId, paymentId, amount) => {
    const { name, value } = event.target;
    this.setState({ [name]: value }, async () => {
      console.log(this.state.status);
      await updatePaymentStatus({
        paymentStatus: this.state.status,
        orderId: orderId,
        paymentId: paymentId,
      });
      this.props.handlePaymentStatusChange({
        paymentStatus: this.state.status,
        orderId: orderId,
        paymentId: paymentId,
      });
      await updateOrderAmount({ orderId: orderId, amount: amount });

      this.setState({
        checkedValues: [],
        myData: this.props.myData,
        status: "unVerified",
      });
    });
  };

  render() {
    const { pageSize, myClass, multiSelectOption, pagination } = this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((payment) => {
        newData.push({
          orderId: payment.orderId,
          paymentId: payment.paymentId,
          amount: payment.amount,
          paymentVia: payment.paymentVia,
          paidAt: this.toDateTime(payment.paidAt.seconds),
          image: (
            <a target="_blank" href={payment.paymentImage}>
              <button className="btn btn-primary">view</button>
            </a>
          ),
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

    if (multiSelectOption == true) {
      columns.push({
        Header: (
          <button
            className="btn btn-danger btn-sm btn-delete mb-0 b-r-4"
            onClick={(e) => {
              if (window.confirm("Are you sure you wish to delete this user?"))
                this.handleRemoveRow();
            }}
          >
            Delete
          </button>
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
                name={row.original.id}
                defaultChecked={this.state.checkedValues.includes(
                  row.original.id
                )}
                onChange={(e) => this.selectRow(e, row.original.id)}
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
          Header: <b>Verify</b>,
          id: "update",
          accessor: (str) => "update",
          Cell: (row) => (
            <div>
              {this.props.match.path === "/payments/verified" ? (
                <div
                  style={{
                    padding: "2px",
                    backgroundColor: "green",
                    textAlign: "center",
                    color: "white",
                  }}
                >
                  verified
                </div>
              ) : (
                <OverlayTrigger
                  trigger="click"
                  placement="bottom"
                  overlay={
                    <Popover
                      id={`popover-positioned-bottom`}
                      style={{ minWidth: "15%" }}
                    >
                      <Popover.Title as="h3">verify payment</Popover.Title>
                      <Popover.Content>
                        <form className="needs-validation add-product-form">
                          <div
                            className="form-group mb-3 row"
                            style={{ padding: "1rem" }}
                          >
                            <select
                              className="form-control digits"
                              id="exampleFormControlSelect2"
                              name="status"
                              value={this.state.status}
                              onChange={(e) =>
                                this.handleChange(
                                  e,
                                  row.original.orderId,
                                  row.original.paymentId,
                                  row.original.amount
                                )
                              }
                            >
                              <option>unVerified</option>
                              <option>Verified</option>
                            </select>
                            <div className="valid-feedback">Looks good!</div>
                          </div>
                        </form>
                      </Popover.Content>
                    </Popover>
                  }
                >
                  <button className="btn btn-primary">Verify</button>
                </OverlayTrigger>
              )}
            </div>
          ),
          style: {
            textAlign: "center",
          },
          sortable: false,
        },
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
                  deletePayment(row.original.orderId);

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
            </div>
          ),
          style: {
            textAlign: "center",
          },
          sortable: false,
        }
      );
    }

    return (
      <Fragment>
        <ReactTable
          data={newData}
          columns={columns}
          defaultPageSize={pageSize}
          className={myClass}
          showPagination={pagination}
        />
        <ToastContainer />
      </Fragment>
    );
  }
}

export default Datatable;
