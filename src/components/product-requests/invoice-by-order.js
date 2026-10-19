import React, { Component, Fragment } from "react";

// import { getSingleOrderRedux, updateOrderRedux } from "../../actions/index";
import "./invoice-by-order.css";
import Alg from "./alg.png";
import { withRouter } from "react-router-dom";
import { connect } from "react-redux";
import { Search } from "react-feather";
import Print from "./print";
export class InvoiceByOrder extends Component {
  state = {
    userObj: null,
    discountInvoice: 0,
    otherCharges: 0,
  };
  componentDidMount = async () => {
    if (this.props.orderObj) {
      this.setState({
        userObj: this.props.users.find(
          (user) => user.uid == this.props.orderObj.customerUid
        ),
      });
    }
  };

  componentWillReceiveProps = (nextProps) => {
    if (nextProps.orderObj) {
      this.setState({
        userObj: nextProps.users.find(
          (user) => user.uid == nextProps.orderObj.customerUid
        ),
      });
    }
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  handleSubmit = async (event) => {
    event.preventDefault();
    const { orderObj } = this.props;
    const { userObj } = this.state;
    if (userObj && orderObj) {
      const discountInvoice = orderObj.discountInvoice
        ? orderObj.discountInvoice + parseInt(this.state.discountInvoice)
        : parseInt(this.state.discountInvoice);
      const otherCharges = orderObj.otherCharges
        ? orderObj.otherCharges + parseInt(this.state.otherCharges)
        : parseInt(this.state.otherCharges);

      await this.props.updateOrderRedux({
        ...orderObj,
        discountInvoice,
        otherCharges,
        subTotal: orderObj.subTotal + parseInt(this.state.otherCharges),
        finalTotal: orderObj.finalTotal
          ? orderObj.finalTotal -
            parseInt(this.state.discountInvoice) +
            parseInt(this.state.otherCharges)
          : orderObj.subTotal -
            parseInt(this.state.discountInvoice) +
            parseInt(this.state.otherCharges),
      });
      await this.props.getSingleOrderRedux(orderObj.parcelId);
      this.setState({ discountInvoice: 0, otherCharges: 0 });
    }
  };

  render() {
    const { orderObj } = this.props;
    return (
      <Fragment>
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-body">
                  <Print orderObj={true} />
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
  return {
    orderObj: null,
    users: [],
  };
};
export default withRouter(
  connect(mapStateToProps, {
    // getSingleOrderRedux,
    // updateOrderRedux,
  })(InvoiceByOrder)
);
