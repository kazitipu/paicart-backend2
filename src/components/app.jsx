import React, { Component } from "react";
import Sidebar from "./common/sidebar_components/sidebar";
import Right_sidebar from "./common/right-sidebar";
import Footer from "./common/footer";
import Header from "./common/header_components/header";
import {
  getAllOrders,
  getAllPayments,
  getAllProducts,
  getAllAliProducts,
  updateAllUser,
  updateExecutionTime,
  getExecutionTime,
  uploadAliProduct,
  deleteAliProductsCollection,
} from "../firebase/firebase.utils";
import { connect } from "react-redux";
import {
  setAllOrders,
  setAllPayments,
  setAllAdmins,
  setAllProducts,
  setCurrentAdmin,
  getAllUsersRedux,
  getCurrencyRedux,
  getAllHomeCategoryRedux,
  createMonthRedux,
} from "../actions";
import "./app.css";
import { batchSearchItemsFrameByCategoryId } from "../actions/get1688Data";
export class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ltr: true,
      divName: "RTL",
    };
  }

  componentDidMount = async () => {
    const { homeCategories } = this.props;
    this.props.getAllHomeCategoryRedux();

    /* Signing in, the admin lookup and setAllAdmins all belong to AuthGate:
       App only mounts once the gate has opened, so currentAdmin is already in
       the store by the time this runs. Everything left here is bulk data the
       pages need, which must not hold up the sidebar. */
    const allOrdersArray = await getAllOrders();
    const allPaymentsArray = await getAllPayments();
    const allAliProductsArray = await getAllAliProducts();
    console.log(homeCategories);
    this.props.getCurrencyRedux();
    this.props.createMonthRedux();
    this.props.getAllUsersRedux();
    this.props.setAllOrders(allOrdersArray);
    this.props.setAllPayments(allPaymentsArray);
    this.props.setAllProducts([...allAliProductsArray]);
    // product jodi daily oder api te change hoy shekhetre call korbo other wise eta call kore lav nai karon product same e thake
    // this.runDailyTask();
  };

  hasOneDayPassed = async () => {
    let time = await getExecutionTime();

    if (!time) {
      console.log("no records found");
      return true; // No record of previous execution
    }
    const oneDay = 24 * 60 * 60 * 1000; // Milliseconds in one day
    const now = new Date().getTime();
    const lastExecutionTime = new Date(time.lastExecution).getTime();

    // Check if 24 hours have passed
    console.log(now - lastExecutionTime > oneDay);
    return now - lastExecutionTime > oneDay;
  };

  runDailyTask = async () => {
    const { homeCategories, currentAdmin } = this.props;
    console.log(await this.hasOneDayPassed());
    let hasOneDayPassed = await this.hasOneDayPassed();
    console.log(hasOneDayPassed);
    if (hasOneDayPassed) {
      await deleteAliProductsCollection();
      for (let i = 0; i < homeCategories.length; i++) {
        const element = homeCategories[i];
        let products = await batchSearchItemsFrameByCategoryId(
          element.categoryId,
        );
        if (products.length > 0) {
          for (let index = 0; index < products.length; index++) {
            const el = products[index];
            await uploadAliProduct({
              ...el,
              categoryName: element.name,
            });
          }
        }
      }
      // update the time in database
      await updateExecutionTime();
    } else {
      console.log("Task has already been executed today.");
    }
  };

  ChangeRtl(divName) {
    if (divName === "RTL") {
      document.body.classList.add("rtl");
      this.setState({ divName: "LTR" });
    } else {
      document.body.classList.remove("rtl");
      this.setState({ divName: "RTL" });
    }
  }
  render() {
    return (
      <div>
        <div className="page-wrapper">
          <Header />
          <div className="page-body-wrapper">
            <Sidebar />
            <Right_sidebar />
            <div className="page-body">{this.props.children}</div>
            <Footer />
          </div>
        </div>
        <div
          className="btn-light custom-theme"
          onClick={() => this.ChangeRtl(this.state.divName)}
        >
          {this.state.divName}
        </div>
      </div>
    );
  }
}
const mapStateToProps = (state) => {
  return {
    admins: state.admins.admins,
    homeCategories: state.campaigns.homeCategories,
    currentAdmin: state.admins.currentAdmin,
  };
};
export default connect(mapStateToProps, {
  getAllHomeCategoryRedux,
  setAllOrders,
  setAllPayments,
  setAllAdmins,
  setAllProducts,
  setCurrentAdmin,
  getAllUsersRedux,
  getCurrencyRedux,
  createMonthRedux,
})(App);
