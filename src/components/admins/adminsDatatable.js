import React, { Component, Fragment } from "react";
import { connect } from "react-redux";

import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
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

  renderEditable = (cellInfo) => {
    const { myData } = this.props;
    if (myData.length > 0) {
      const newData = [];
      myData.forEach((admin) => {
        //  this is not affecting my output see line 104
        newData.push({
          uid: admin.adminId,
          Name: admin.name,
          Mobile: admin.mobileNo ? admin.mobileNo : "",
          Email: admin.email,
          Balance: admin.balance,
        });
      });
      return (
        <div
          style={{ backgroundColor: "#fafafa" }}
          onBlur={(e) => {
            const data = [...newData];
            data[cellInfo.index][cellInfo.column.id] = e.target.innerHTML;
            this.setState({ myData: data });
          }}
          dangerouslySetInnerHTML={{
            __html: newData[cellInfo.index][cellInfo.column.id],
          }}
        />
      );
    } else {
      return null;
    }
  };

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  getStatus = (productQuantity) => {
    if (productQuantity < 10) {
      return <i className="fa fa-circle font-danger f-12" />;
    } else if (productQuantity > 50) {
      return <i className="fa fa-circle font-success f-12" />;
    } else {
      return <i className="fa fa-circle font-warning f-12" />;
    }
  };

  render() {
    const { pageSize, myClass, multiSelectOption, pagination, currentAdmin } =
      this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((admin) => {
        newData.push({
          uid: admin.adminId,
          Name: admin.name,
          Mobile: admin.mobileNo ? admin.mobileNo : "",
          Email: admin.email,
          Balance: admin.balance,
        });
      });
    }
    const columns = [];
    for (var key in newData[0]) {
      let editable = this.renderEditable;
      if (key == "image") {
        editable = null;
      }
      if (key == "status") {
        editable = null;
      }
      if (key === "avtar") {
        editable = null;
      }
      if (key === "vendor") {
        editable = null;
      }
      if (key === "order_status") {
        editable = null;
      }

      columns.push({
        Header: <b>{this.Capitalize(key.toString())}</b>,
        accessor: key,
        Cell: editable,
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
              if (window.confirm("Are you sure you wish to delete this item?"))
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
          Header: <b style={{ color: "gray" }}>Status</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => {
            if (myData.length > 0) {
              const adminObj = myData.find(
                (admin) => admin.adminId === row.original.uid
              );
              if (adminObj.status === "Admin") {
                return (
                  <div style={{ color: "darkViolet" }}>
                    <i className="icofont-disc"></i>&nbsp;{adminObj.status}
                  </div>
                );
              }
              if (adminObj.status === "Accounts") {
                return (
                  <div style={{ color: "gold" }}>
                    <i className="icofont-disc"></i>&nbsp;{adminObj.status}
                  </div>
                );
              }
              if (adminObj.status === "Officer") {
                return (
                  <div style={{ color: "green" }}>
                    <i className="icofont-disc"></i>&nbsp;{adminObj.status}
                  </div>
                );
              }
              if (adminObj.status === "Employee") {
                return (
                  <div style={{ color: "darkorange" }}>
                    <i className="icofont-disc"></i>&nbsp;{adminObj.status}
                  </div>
                );
              }
              if (adminObj.status === "Partner") {
                return (
                  <div style={{ color: "red" }}>
                    <i className="icofont-disc"></i>&nbsp;{adminObj.status}
                  </div>
                );
              }
            } else {
              return <div></div>;
            }
          },

          style: {
            textAlign: "center",
          },
          sortable: false,
        },
        {
          Header: <b style={{ color: "black" }}>Change Status</b>,
          id: "delete",
          accessor: (str) => "delete",
          Cell: (row) => (
            <div>
              <button
                className="btn btn-secondary"
                type="button"
                onClick={() => {
                  const adminObj = myData.find(
                    (admin) => admin.adminId === row.original.uid
                  );
                  console.log(adminObj);
                  this.props.startToggleModal(adminObj);
                }}
                disabled={
                  currentAdmin && currentAdmin.status == "Partner"
                    ? true
                    : false
                }
              >
                Change
              </button>
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

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, null)(Datatable);
