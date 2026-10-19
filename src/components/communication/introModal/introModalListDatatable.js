import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { connect } from "react-redux";
import { deleteIntro, selectIntro } from "../../../firebase/firebase.utils";
export class Datatable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checkedValues: [],
      myData: this.props.myData,
    };
  }

  componentDidMount = () => {
    const { myData } = this.props;
    const selectedIntro =
      myData.length > 0 ? myData.find((intro) => intro.selected) : null;
    this.setState(
      {
        checkedValues: selectedIntro ? [selectedIntro.id] : [],
      },
      () => {
        console.log(this.state.checkedValues);
      }
    );
  };

  componentWillReceiveProps = (nextProps) => {
    const { myData } = nextProps;
    const selectedIntro =
      myData.length > 0 ? myData.find((intro) => intro.selected) : null;
    this.setState(
      {
        checkedValues: selectedIntro ? [selectedIntro.id] : [],
      },
      () => {
        console.log(this.state.checkedValues);
      }
    );
  };

  selectRow = (e, i) => {
    if (!e.target.checked) {
      this.setState(
        {
          checkedValues: this.state.checkedValues.filter(
            (item, j) => i !== item
          ),
        },
        () => {
          console.log(this.state.checkedValues);
        }
      );
    } else {
      this.setState(
        {
          checkedValues: [i],
        },
        async () => {
          await selectIntro(i);
        }
      );
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
      myData.forEach((intro) => {
        newData.push({
          Id: intro.id,
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
        Header: <b>Image</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => {
          const introObj =
            myData.length > 0
              ? myData.find((intro) => intro.id === row.original["Id"])
              : null;
          return (
            <a target="_blank" href={introObj ? introObj.imageUrl : ""}>
              <img
                style={{
                  width: "150px",
                  height: "100px",
                  borderRadius: 0,
                }}
                src={introObj ? introObj.imageUrl : ""}
              ></img>
            </a>
          );
        },
        style: {
          textAlign: "center",
        },
        sortable: false,
      },
      {
        Header: <b>Active</b>,
        id: "delete",
        accessor: (str) => "delete",
        sortable: false,
        style: {
          textAlign: "center",
        },
        Cell: (row) => {
          const introObj =
            myData.length > 0
              ? myData.find((intro) => intro.id === row.original["Id"])
              : null;
          console.log(this.state.checkedValues.includes(introObj.id));
          return (
            <div>
              {currentAdmin && currentAdmin.status == "Partner" ? (
                <></>
              ) : (
                <span>
                  <input
                    type="checkbox"
                    name={introObj.id}
                    defaultChecked={this.state.checkedValues.includes(
                      introObj.id
                    )}
                    onChange={(e) => this.selectRow(e, introObj.id)}
                  />
                </span>
              )}
            </div>
          );
        },
        accessor: key,
        style: {
          textAlign: "center",
        },
      },
      {
        Header: <b>Action</b>,
        id: "delete",
        accessor: (str) => "delete",
        Cell: (row) => (
          <div>
            {currentAdmin && currentAdmin.status == "Partner" ? (
              <></>
            ) : (
              <span
                style={{ cursor: "pointer" }}
                onClick={async () => {
                  let data = myData;
                  data.splice(row.index, 1);
                  this.setState({ myData: data });
                  console.log(row);
                  await deleteIntro(row.original.Id);
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
            )}
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

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, null)(Datatable);
