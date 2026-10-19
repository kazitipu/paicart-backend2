import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connect } from "react-redux";
import { deleteNotice } from "../../firebase/firebase.utils";
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
    const { pageSize, myClass, multiSelectOption, pagination, currentAdmin } =
      this.props;
    console.log(this.props);
    const { myData } = this.props;
    console.log(myData);
    const newData = [];
    if (myData.length > 0) {
      myData.forEach((notice) => {
        newData.push({
          Id: notice.id,
          "Published At": notice.createdAt,
          Title: notice.noticeTitle,
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
      Header: <b>Action</b>,
      id: "delete",
      accessor: (str) => "delete",
      Cell: (row) => (
        <>
          {currentAdmin && currentAdmin.status == "Partner" ? (
            <></>
          ) : (
            <div>
              <span
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  let data = myData;
                  data.splice(row.index, 1);
                  this.setState({ myData: data });
                  console.log(row);
                  await deleteNotice(row.original.Id);
                }}
              >
                <i
                  className="fa fa-trash"
                  style={{
                    width: 35,
                    fontSize: 20,
                    padding: 11,
                    color: "#e4566e",
                  }}
                ></i>
              </span>

              <span
                style={{ cursor: "pointer" }}
                onClick={() => {
                  const noticeObj = myData.find(
                    (notice) => notice.id === row.original.Id
                  );
                  this.props.startToggleModal(noticeObj);
                }}
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
          )}
        </>
      ),
      style: {
        textAlign: "center",
      },
      sortable: false,
    });

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
