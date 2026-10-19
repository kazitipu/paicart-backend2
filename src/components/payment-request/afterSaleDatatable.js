import React, { Component, Fragment } from "react";
import { Users } from "react-feather";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connect } from "react-redux";
import { updateRefundRequestOrderStatusRedux } from "../../actions/index";
import {
  getSingleUser,
  getSingleRefundRequestOrder,
} from "../../firebase/firebase.utils";
import { sendNotifications } from "../../firebase/fcmRestApi";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";
import { getMultipleOrders } from "../../firebase/firebase.utils";
import { CircleLoader } from "react-spinners";
import { Badge, Button } from "../common/listUi.jsx";
import "../common/list-modern.css";
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
      myData.forEach((refundRequest) => {
        //  this is not affecting my output see line 104
        const userObj = this.props.allUser.find(
          (user) => user.uid === refundRequest.userId
        );
        newData.push({
          "Refund Id": refundRequest ? refundRequest.refundId : "",
          Method: refundRequest ? refundRequest.paymentMethod : "",
          /* shipmentRequest is only set on refunds raised straight against a
             Ship For Me booking - everything older is one of the two
             original types. */
          Type: !refundRequest
            ? ""
            : refundRequest.shipmentRequest
              ? "Ship For Me"
              : refundRequest.productRequest
                ? "Product Request"
                : "1688 Orders",
          "Order Id": refundRequest
            ? refundRequest.order.orderId
              ? refundRequest.order.orderId
              : refundRequest.order.bookingId
            : "",
          /* A Ship For Me booking has no orderTotal — its bill is the
             shipping charge */
          "Order Total": refundRequest
            ? `৳${Math.round(
                parseFloat(
                  refundRequest.shipmentRequest
                    ? refundRequest.order.shippingChargeCustomer
                    : refundRequest.order.orderTotal
                ) || 0
              ).toLocaleString()}`
            : "",
          Reason: refundRequest ? refundRequest.reason || "" : "",
        });
      });
    }
    /* Headers must not depend on there being data: newData[0] is undefined
       whenever a filter or an empty tab clears the table. */
    const BASE_COLUMN_KEYS = [
      "Refund Id",
      "Method",
      "Type",
      "Order Id",
      "Order Total",
      "Reason",
    ];
    const columns = [];
    for (var key of BASE_COLUMN_KEYS) {
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
          Header: <b>Status</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => {
            if (myData.length > 0) {
              const refundRequest = myData.find(
                (refundRequest) =>
                  refundRequest.refundId === row.original["Refund Id"]
              );
              const tone =
                refundRequest.status === "approved"
                  ? "green"
                  : refundRequest.status === "reject"
                    ? "red"
                    : "orange";
              const label =
                refundRequest.status === "reject"
                  ? "Rejected"
                  : refundRequest.status === "approved"
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
          Header: <b>Bkash/Bank Info</b>,
          id: "orderDetails",
          accessor: (str) => "orderDetails",
          Cell: (row) => {
            const refundObj = myData.find(
              (refund) => refund.refundId === row.original["Refund Id"]
            );
            console.log(refundObj);
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
                      Bkash or Bank Information
                    </Popover.Title>
                    <Popover.Content className="popover-body-container">
                      <div
                        style={{
                          paddingBottom: "10px",
                        }}
                      >
                        {refundObj && refundObj.bankInfo && (
                          <div
                            style={{
                              borderBottom: "1px solid gainsboro",
                              paddingBottom: "5px",
                              paddingTop: 5,
                            }}
                          >
                            {refundObj.bankInfo}
                          </div>
                        )}
                      </div>
                    </Popover.Content>
                  </Popover>
                }
              >
                <Button variant="subtle">Info</Button>
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
            const refundRequest =
              myData.length > 0
                ? myData.find(
                    (refundRequest) =>
                      refundRequest.refundId === row.original["Refund Id"]
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
                {refundRequest && refundRequest.status === "pending" ? (
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
                              refundId: row.original["Refund Id"],
                            });

                            this.setState({
                              loader: false,
                              refundId: null,
                            });
                            this.props.startToggleModal(refundRequest);
                          }
                        }}
                        disabled={
                          currentAdmin && currentAdmin.status == "Partner"
                            ? true
                            : false
                        }
                      >
                        {this.state.refundId !== row.original["Refund Id"] ? (
                          "Approve"
                        ) : (
                          <CircleLoader
                            loading={this.state.loader}
                            color="white"
                            size={14}
                          />
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
                            const refundRequest = myData.find(
                              (refundRequest) =>
                                refundRequest.refundId ==
                                row.original["Refund Id"]
                            );
                            await this.props.updateRefundRequestOrderStatusRedux(
                              {
                                ...refundRequest,
                                status: "reject",
                              }
                            );
                            const newRequest =
                              await getSingleRefundRequestOrder(
                                refundRequest.refundId
                              );

                            const msg = this.createNotification(newRequest);
                            console.log(msg);
                            const user = await getSingleUser(
                              refundRequest.order.userId
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
  updateRefundRequestOrderStatusRedux,
})(Datatable);
