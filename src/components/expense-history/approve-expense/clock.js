import React, { Component, Fragment } from "react";
import Breadcrumb from "../../common/breadcrumb";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import { getAllDocumentExpressRatesRedux } from "../../../actions/index";
import { Link } from "react-router-dom";
import { connect } from "react-redux";

export class Clock extends Component {
  constructor(props) {
    super(props);
    this.state = {
      open: false,
      toggleModal: true,
      singleLot: null,
      time: "",
    };
  }

  componentWillMount = () => {
    setInterval(() => {
      let date = new Date();
      let time = date.toLocaleTimeString("en-US");
      this.setState({
        time,
      });
    }, 1000);
  };

  render() {
    const { open } = this.state;
    let date = new Date();
    let onlyDate = date.toDateString();

    return (
      <div style={{ fontWeight: "bold", color: "rgb(255, 128, 132)" }}>
        {onlyDate} &nbsp; &nbsp;{this.state.time}
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    allExpressDocumentsRates: state.expressRatesDocuments.expressRatesDocuments,
  };
};

export default connect(mapStateToProps, { getAllDocumentExpressRatesRedux })(
  Clock
);
