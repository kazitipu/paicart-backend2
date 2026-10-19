import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { deleteUser } from "./../../firebase/firebase.utils";
import { withRouter } from "react-router";
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

  Capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  toDateTime = (secs) => {
    var t = new Date(1970, 0, 1); // Epoch
    t.setSeconds(secs);
    return t;
  };

  render() {
    const { pageSize, myClass, multiSelectOption, pagination } = this.props;

    const { myData } = this.props;

    const newData = [];
    if (myData.length > 0) {
      myData.forEach((user) => {
        newData.push({
          uid: user.uid,
          "User Id": user.userId,
          name: user.displayName,
          number: user.mobileNo,
          email: user.email,
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
        Header: <b style={{ color: "gray" }}>Status</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => {
          if (myData.length > 0) {
            const userObj = myData.find(
              (user) => user.uid === row.original.uid
            );

            return (
              <div
                style={{
                  color:
                    userObj.status === "Vip Partner"
                      ? "darkViolet"
                      : userObj.status === "Corporate"
                      ? "gold"
                      : userObj.status == "Merchant"
                      ? "green"
                      : userObj.status == "Customer"
                      ? "darkorange"
                      : "white",
                  cursor: "pointer",
                }}
                onClick={() => {
                  const userObj = myData.find(
                    (user) => user.uid === row.original.uid
                  );
                  console.log(userObj);
                  this.props.startToggleModal(userObj);
                }}
              >
                <i className="icofont-disc"></i>&nbsp;{userObj.status}
              </div>
            );
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
        Header: <b style={{ color: "green" }}>Inspect</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => (
          <div>
            <button
              className="btn"
              style={{
                backgroundColor: "green",
                color: "white",
              }}
              type="button"
              onClick={() =>
                this.props.history.push(
                  `${process.env.PUBLIC_URL}/users/list-user/${row.original.uid}`
                )
              }
            >
              <i className="icofont-eye"></i>&nbsp; View
            </button>
          </div>
        ),
        style: {
          textAlign: "center",
        },
        sortable: false,
      }
    );

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

export default withRouter(Datatable);
