import React, { Component, Fragment } from "react";
import Breadcrumb from "../common/breadcrumb";
import TaxesDatatable from "./taxesDatatable";
import { getAllProductsTax } from "../../firebase/firebase.utils";
import { connect } from "react-redux";
export class Taxes extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      allProductsTax: [],
    };
  }
  componentDidMount = async () => {
    const allProductsTax = await getAllProductsTax();
    this.setState({ allProductsTax });
  };
  render() {
    return (
      <Fragment>
        <Breadcrumb title="Shipping Charges" parent="Localization" />
        <div className="container-fluid">
          <div className="row">
            <div className="col-sm-12">
              <div className="card">
                <div className="card-header">
                  <h5>Shipping Charge Detail List</h5>
                </div>
                <div className="card-body">
                  <div
                    id="basicScenario"
                    className="product-list translation-list"
                  >
                    <TaxesDatatable
                      history={this.props.history}
                      multiSelectOption={false}
                      myData={this.state.allProductsTax}
                      pageSize={10}
                      pagination={true}
                      class="-striped -highlight"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    currentAdmin: state.admins.currentAdmin,
  };
};

export default connect(mapStateToProps, null)(Taxes);
