import React, { Component, Fragment } from "react";
import Breadcrumb from "../../../components/common/breadcrumb";

import "./css/invoice-by-order.css";

import { withRouter } from "react-router-dom";
import { connect } from "react-redux";

import Print from "./print";
export class InvoiceByOrder extends Component {
  state = {
    userObj: null,
    discountInvoice: 0,
    otherCharges: 0,
  };

  render() {
    return (
      <Fragment>
        <Breadcrumb
          title={this.props.match.params.month}
          parent="Bill history/monthly statement"
        />
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <Print />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state, ownProps) => {
  return {};
};
export default withRouter(connect(mapStateToProps, {})(InvoiceByOrder));
