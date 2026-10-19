import React from "react";
import OnlyInvoieToPrint from "./onlyInvoiceToPrint";

import ReactToPrint from "react-to-print";

class PrintableInvoice extends React.PureComponent {
  render() {
    return (
      <div>
        <OnlyInvoieToPrint />
      </div>
    );
  }
}

class Print extends React.PureComponent {
  render() {
    return (
      <div>
        <ReactToPrint
          trigger={() => {
            // NOTE: could just as easily return <SomeComponent />. Do NOT pass an `onClick` prop
            // to the root node of the returned component as it will be overwritten.
            return (
              <button
                className="btn"
                style={{
                  backgroundColor: "#18768f",
                  color: "white",
                  borderRadius: 5,
                  padding: 10,
                  display: "block",
                  margin: "auto",
                  marginBottom: 10,
                }}
                href="#"
              >
                <i className="icofont-printer" />
                &nbsp;Print
              </button>
            );
          }}
          content={() => this.componentRef}
        />
        <PrintableInvoice
          ref={(el) => (this.componentRef = el)}
          orderObj={this.props.orderObj}
        />
      </div>
    );
  }
}

export default Print;
