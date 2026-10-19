import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import Datatable from "./complainDatatable";
import { getAllComplaints } from "../../firebase/firebase.utils";
import { RefreshCw } from "react-feather";
import { Tabs, TabList, TabPanel, Tab } from "react-tabs";

export class Complain extends Component {
  constructor(props) {
    super(props);
    this.state = {
      complaints: [],
      loading: true,
    };
  }

  componentDidMount = async () => {
    await this.fetchComplaints();
  };

  fetchComplaints = async () => {
    this.setState({ loading: true });
    const complaints = await getAllComplaints();
    this.setState({ complaints: complaints || [], loading: false });
  };

  handleStatusChange = (complaintId, status) => {
    this.setState({
      complaints: this.state.complaints.map((c) =>
        c.complaintId === complaintId ? { ...c, status } : c
      ),
    });
  };

  getPending = () => {
    return this.state.complaints.filter((c) => (c.status || "pending") !== "resolved");
  };

  getResolved = () => {
    return this.state.complaints.filter((c) => c.status === "resolved");
  };

  render() {
    const { complaints, loading } = this.state;
    const pendingCount = this.getPending().length;
    const resolvedCount = this.getResolved().length;

    return (
      <Fragment>
        <Breadcrumb title="Complaints" parent="Complain" />
        <div className="container-fluid">
          <div className="card">
            <div
              className="card-header"
              style={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h5>
                <i
                  className="icofont-warning-alt"
                  style={{
                    fontSize: "180%",
                    marginRight: "5px",
                    marginTop: "5px",
                    color: "#ff8084",
                  }}
                ></i>
                Complaints
                {pendingCount > 0 && (
                  <span
                    style={{
                      marginLeft: 10,
                      padding: "3px 10px",
                      borderRadius: 20,
                      fontSize: 13,
                      color: "white",
                      background: "#ff8084",
                    }}
                  >
                    {pendingCount} pending
                  </span>
                )}
              </h5>
              <button
                className="btn"
                style={{ backgroundColor: "rgb(22 67 140)", color: "white" }}
                onClick={this.fetchComplaints}
              >
                <RefreshCw size={14} style={{ marginRight: 5 }} />
                Refresh
              </button>
            </div>
            <div className="card-body">
              <div className="clearfix"></div>
              <div
                id="batchDelete"
                className="category-table user-list order-table coupon-list-delete"
              >
                {loading ? (
                  <p style={{ textAlign: "center", padding: 30 }}>Loading complaints...</p>
                ) : (
                  <Tabs>
                    <TabList>
                      <Tab>Pending ({pendingCount})</Tab>
                      <Tab>Resolved ({resolvedCount})</Tab>
                    </TabList>
                    <TabPanel>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          myData={this.getPending()}
                          onStatusChange={this.handleStatusChange}
                          pageSize={50}
                          pagination={true}
                          class="-striped -highlight"
                        />
                      </div>
                    </TabPanel>
                    <TabPanel>
                      <div id="basicScenario" className="product-physical">
                        <Datatable
                          myData={this.getResolved()}
                          onStatusChange={this.handleStatusChange}
                          pageSize={50}
                          pagination={true}
                          class="-striped -highlight"
                        />
                      </div>
                    </TabPanel>
                  </Tabs>
                )}
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default Complain;
