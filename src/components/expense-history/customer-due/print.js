import React from "react";
import OnlyInvoieToPrint from "./bill-summary-statement";

import ReactToPrint from "react-to-print";

class PrintableInvoice extends React.PureComponent {
  render() {
    return <OnlyInvoieToPrint />;
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
                  backgroundColor: "#8a0368",
                  color: "white",
                  marginLeft: 40,
                }}
                href="#"
              >
                <i className="icofont-printer"></i>&nbsp;Print PDF
              </button>
            );
          }}
          content={() => this.componentRef2}
        />
        <PrintableInvoice ref={(el) => (this.componentRef2 = el)} />
      </div>
    );
  }
}

export default Print;
