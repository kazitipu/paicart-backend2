import React, { Component, Fragment } from "react";
import { Users } from "react-feather";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connect } from "react-redux";
import { updatePaymentRequestOrderStatusRedux } from "../../actions/index";
import {
  getSingleUser,
  getSinglePaymentRequestOrder,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { getMultipleOrders } from "../../firebase/firebase.utils";
import { CircleLoader } from "react-spinners";
import { Badge, Button } from "../common/listUi.jsx";
import { coveredIds } from "../../constants/paymentSearch";
export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
      loader: false,
      paymentId: null,
    };
  }

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

  createNotification = (paymentRequestObj) => {
    let msg;
    if (paymentRequestObj.status === "approved") {
      msg = {
        title: `Payment ${paymentRequestObj.status}`,
        body: `Your payment for Payment Id:-${paymentRequestObj.paymentId} is ${paymentRequestObj.status}.`,
      };
      return msg;
    } else {
      msg = {
        title: `Payment ${paymentRequestObj.status}`,
        body: `Your payment for Payment Id:-${paymentRequestObj.paymentId} is rejected. Please Pay again or contact us for details.`,
      };
      return msg;
    }
  };

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  render() {
    const { pageSize, myClass, multiSelectOption, pagination, currentAdmin } =
      this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((paymentRequest) => {
        //  this is not affecting my output see line 104
        const userObj = this.props.allUser.find(
          (user) => user.uid === paymentRequest.userId
        );
        newData.push({
          "Payment Id": paymentRequest ? paymentRequest.paymentId : "",
          /* What the customer quotes when asking about a payment */
          "Order / Booking Id": paymentRequest ? coveredIds(paymentRequest).join(", ") : "",
          Date: paymentRequest ? paymentRequest.date : "",
          Name: paymentRequest ? paymentRequest.displayName : "",
          Type:
            paymentRequest && paymentRequest.productRequest
              ? "Product Request"
              : "1688 Order",
          Method: paymentRequest ? paymentRequest.method : "",
          Amount: paymentRequest ? `${paymentRequest.payableTotal}Tk` : "",
          image: (
            <a
              target="_blank"
              href={paymentRequest ? paymentRequest.imageUrl : ""}
            >
              <img
                style={{ width: "150px", height: "100px" }}
                src={paymentRequest ? paymentRequest.imageUrl : ""}
              ></img>
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
          <Button
            variant="danger"
            onClick={(e) => {
              if (window.confirm("Are you sure you wish to delete this item?"))
                this.handleRemoveRow();
            }}
          >
            Delete
          </Button>
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
          Header: <b>status</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => {
            if (myData.length > 0) {
              const paymentRequest = myData.find(
                (paymentRequest) =>
                  paymentRequest.paymentId === row.original["Payment Id"]
              );
              const tone =
                paymentRequest.status === "approved"
                  ? "green"
                  : paymentRequest.status === "reject"
                    ? "red"
                    : "orange";
              const label =
                paymentRequest.status === "reject"
                  ? "Rejected"
                  : paymentRequest.status === "approved"
                    ? "Approved"
                    : "Pending";
              return <Badge tone={tone}>{label}</Badge>;
            }
          },
          style: {
            textAlign: "center",
          },
          sortable: false,
        },
        {
          Header: <b>Paid Orders</b>,
          id: "orderDetails",
          accessor: (str) => "orderDetails",
          Cell: (row) => {
            const paymentObj = myData.find(
              (payment) => payment.paymentId === row.original["Payment Id"]
            );
            console.log(paymentObj);
            return (
              <OverlayTrigger
                trigger="click"
                placement="bottom"
                overlay={
                  <Popover
                    id={`popover-positioned-bottom`}
                    style={{ minWidth: "12%" }}
                  >
                    <Popover.Title
                      style={{ backgroundColor: "rgb(0, 37, 76)", color: "white" }}
                      as="h3"
                    >
                      Order Id List
                    </Popover.Title>
                    <Popover.Content className="popover-body-container">
                      <div
                        style={{
                          paddingBottom: "10px",
                        }}
                      >
                        {paymentObj &&
                          paymentObj.pendingOrders &&
                          paymentObj.pendingOrders.map((order) => (
                            <div
                              key={order.orderId}
                              style={{
                                borderBottom: "1px solid gainsboro",
                                paddingBottom: "5px",
                                paddingTop: 5,
                              }}
                            >
                              {paymentObj.productRequest
                                ? order.bookingId
                                : order.orderId}
                            </div>
                          ))}
                      </div>
                    </Popover.Content>
                  </Popover>
                }
              >
                <Button variant="subtle">Invoices</Button>
              </OverlayTrigger>
            );
          },
          style: {
            textAlign: "center",
          },
          sortable: false,
        },
        {
          Header: <b>Action</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => {
            const paymentRequest =
              myData.length > 0
                ? myData.find(
                    (paymentRequest) =>
                      paymentRequest.paymentId === row.original["Payment Id"]
                  )
                : null;
            return (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  width: "100%",
                }}
              >
                {paymentRequest && paymentRequest.status === "pending" ? (
                  <>
                    <span style={{ cursor: "pointer", width: "100%" }}>
                      <Button
                        variant="primary"
                        style={{ background: "#16a34a", width: "100%" }}
                        type="button"
                        onClick={async () => {
                          if (myData.length > 0) {
                            this.setState({
                              loader: true,
                              paymentId: row.original["Payment Id"],
                            });
                            const orderIdArray =
                              paymentRequest.pendingOrders.map(
                                (order) => order.orderId
                              );

                            this.setState({
                              loader: false,
                              paymentId: null,
                            });
                            this.props.startToggleModal(
                              paymentRequest,
                              paymentRequest.pendingOrders
                            );
                          }
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        {this.state.paymentId !== row.original["Payment Id"] && "Approve"}
                        {this.state.paymentId ===
                          row.original["Payment Id"] && (
                          <div style={{ marginTop: -5 }}>
                            <CircleLoader
                              loading={this.state.loader}
                              color="white"
                              size={15}
                            />
                          </div>
                        )}
                      </Button>
                    </span>

                    <span style={{ cursor: "pointer", width: "100%" }}>
                      <Button
                        variant="danger"
                        style={{ width: "100%" }}
                        type="button"
                        onClick={async () => {
                          if (myData.length > 0) {
                            const paymentRequest = myData.find(
                              (paymentRequest) =>
                                paymentRequest.paymentId ==
                                row.original["Payment Id"]
                            );
                            await this.props.updatePaymentRequestOrderStatusRedux(
                              {
                                ...paymentRequest,
                                status: "reject",
                              }
                            );
                            const newRequest =
                              await getSinglePaymentRequestOrder(
                                paymentRequest.paymentId
                              );

                            const msg = this.createNotification(newRequest);
                            console.log(msg);
                            const user = await getSingleUser(
                              paymentRequest.userId
                            );
                            console.log(user);
                            const message = {
                              title: msg.title,
                              body: msg.body,
                            };
                            if (
                              user.deviceToken &&
                              user.deviceToken.length > 0
                            ) {
                              user.deviceToken.map((token) => {
                                console.log(token);
                                sendNotifications(token, message);
                              });
                            }
                          }
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        {" "}
                        Reject
                      </Button>
                    </span>
                  </>
                ) : null}
              </div>
            );
          },
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
const mapStateToProps = (state) => {
  return {
    allUser: state.users.users,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  updatePaymentRequestOrderStatusRedux,
})(Datatable);
