import React, { Component, Fragment } from "react";
import ReactTable from "react-table";
import "react-table/react-table.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { updateComplaintStatus } from "../../firebase/firebase.utils";

export class Datatable extends Component {
  markResolved = async (row) => {
    const nextStatus = row.original.Status === "resolved" ? "pending" : "resolved";
    await updateComplaintStatus(row.original.Id, nextStatus);
    this.props.onStatusChange(row.original.Id, nextStatus);
    toast.success(
      nextStatus === "resolved" ? "Marked as resolved" : "Reopened complaint"
    );
  };

  render() {
    const { pageSize, myClass, pagination, myData } = this.props;

    const newData = (myData || []).map((c) => ({
      Id: c.complaintId,
      Date: c.date || (c.time ? new Date(c.time).toLocaleDateString("en-GB") : ""),
      Subject: c.subject || "—",
      Message: c.message || "",
      Customer: c.displayName || c.email || c.userId || "Guest",
      Contact: [c.email, c.phone].filter(Boolean).join(" / "),
      Status: c.status || "pending",
    }));

    const columns = [
      {
        Header: <b>Date</b>,
        accessor: "Date",
        width: 110,
        style: { textAlign: "center" },
      },
      {
        Header: <b>Subject</b>,
        accessor: "Subject",
        width: 150,
        style: { textAlign: "center" },
      },
      {
        Header: <b>Complaint</b>,
        accessor: "Message",
        Cell: (row) => (
          <div
            style={{
              whiteSpace: "normal",
              textAlign: "left",
              maxHeight: 80,
              overflowY: "auto",
            }}
          >
            {row.value}
          </div>
        ),
      },
      {
        Header: <b>Customer</b>,
        accessor: "Customer",
        width: 150,
        style: { textAlign: "center" },
      },
      {
        Header: <b>Contact</b>,
        accessor: "Contact",
        width: 180,
        style: { textAlign: "center" },
      },
      {
        Header: <b>Status</b>,
        accessor: "Status",
        width: 130,
        style: { textAlign: "center" },
        Cell: (row) => (
          <span
            style={{
              padding: "4px 12px",
              borderRadius: 20,
              fontWeight: "bold",
              fontSize: 12,
              color: "white",
              background: row.value === "resolved" ? "#28a745" : "#ff8084",
            }}
          >
            {row.value === "resolved" ? "Resolved" : "Pending"}
          </span>
        ),
      },
      {
        Header: <b>Action</b>,
        id: "action",
        accessor: () => "action",
        width: 130,
        sortable: false,
        style: { textAlign: "center" },
        Cell: (row) => (
          <button
            className="btn btn-sm"
            style={{
              background: row.original.Status === "resolved" ? "#e4566e" : "rgb(22 67 140)",
              color: "white",
            }}
            onClick={() => this.markResolved(row)}
          >
            {row.original.Status === "resolved" ? "Reopen" : "Mark Resolved"}
          </button>
        ),
      },
    ];

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
