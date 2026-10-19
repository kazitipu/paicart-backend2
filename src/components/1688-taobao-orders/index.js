import React, { Component } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import "./index.scss";
import App from "./components/app";
import { ScrollContext } from "react-router-scroll-4";
import { Provider } from "react-redux";

// Components
import store from "./store";
import Dashboard from "./components/dashboard";

// Products physical
import Category from "./components/products/physical/category";
import Sub_category from "./components/products/physical/sub-category";
import Product_list from "./components/products/physical/product-list";
import Add_product from "./components/products/physical/add-product";
import Add_Aliexpress_product from "./components/products/physical/add-aliexpress-product";
import Update_product from "./components/products/physical/update-product";
import Product_detail from "./components/products/physical/product-detail";

//Sales
import Orders from "./components/sales/orders";
import PendingOrders from "./components/sales/pendingOrders";
import PaymentApproved from "./components/sales/paymentApproved";
import Ordered from "./components/sales/ordered";
import ChinaWarehouse from "./components/sales/chinaWarehouse";
import InShipment from "./components/sales/inShipment";
import InStock from "./components/sales/inStock";
import Delivered from "./components/sales/delivered";
import UpdateOrder from "./components/sales/updateOrder";

//Coupons
import UnverifiedPayments from "./components/payments/unVerifiedPayments";
import VerifiedPayments from "./components/payments/verifiedPayments";
import Create_coupons from "./components/payments/create-coupons";

//Pages
import ProductToOrder from "./components/pages/product-to-order";
import Create_page from "./components/pages/create-page";
import Media from "./components/media/media";
import List_menu from "./components/menus/list-menu";
import Create_menu from "./components/menus/create-menu";
import List_user from "./components/users/list-user";
import Create_user from "./components/users/create-user";
import ListSuppliers from "./components/suppliers/list-suppliers";
import DetailUser from "./components/users/detail-user";
import Currency from "./components/localization/currency";
import Taxes from "./components/localization/taxes";
import Add_Product_Tax from "./components/localization/add_product_tax";
import Update_Product_Tax from "./components/localization/update-product-tax";
import Profile from "./components/settings/profile";
import Reports from "./components/reports/report";
import Invoice from "./components/invoice";
import Datatable from "./components/common/datatable";
import Login from "./components/auth/login";
import SearchedOrder from "./components/searched-order/searched-order";
import PaymentRequest from "./components/payment-request/paymentRequest";
// Product Reqeust
import New from "./components/product-requests/new";
import NewShipmentRequest from "./components/shipment-request/new";
import ShipForMeInvoice from "./components/shipment-request/invoice-by-order.js";
import BuyAndShipForMeInvoice from "./components/1688-taobao-orders/invoice-by-order.js";
import OrdersApi from "./components/1688-taobao-orders/new";
import PaymentRequestOrder from "./components/payment-request/paymentRequestOrder";
import Message from "./components/messages/App";
import D2DRates from "./components/d2d-rates/d2dRates";
import AllCoupons from "./components/products/physical/allCoupons";
import AllCampaigns from "./components/products/physical/allCampaigns";
import AllHomeCategories from "./components/products/physical/homeCategory";
import Banners from "./components/products/physical/banner";
import Warehouse from "./components/d2d-rates/warehouse";
class Root extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentAdmin: null,
    };
  }

  setCurrentAdmin = (adminObj) => {
    this.setState({ currentAdmin: adminObj });
    console.log(this.state.currentAdmin);
  };

  render() {
    const { currentAdmin } = this.state;
    return (
      <Provider store={store}>
        <BrowserRouter basename={"/"}>
          <ScrollContext>
            <Switch>
              <Route
                exact
                path={`${process.env.PUBLIC_URL}/`}
                component={() => (
                  <Login
                    setCurrentAdmin={this.setCurrentAdmin}
                    currentAdmin={currentAdmin}
                  />
                )}
              />
              {/* <Route exact path={`${process.env.PUBLIC_URL}/auth/login`} component={Login} /> */}

              <App>
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/dashboard`}
                  component={Dashboard}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/messages`}
                  component={Message}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/searched-order/:orderId`}
                  component={SearchedOrder}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/category`}
                  component={(props) => <Category history={props.history} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/sub-category`}
                  component={() =>
                    currentAdmin ? <Sub_category /> : <Redirect to="/" />
                  }
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/product-list`}
                  component={() =>
                    currentAdmin ? <Product_list /> : <Redirect to="/" />
                  }
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/product-detail`}
                  component={() =>
                    currentAdmin ? <Product_detail /> : <Redirect to="/" />
                  }
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/add-product`}
                  component={() =>
                    currentAdmin ? <Add_product /> : <Redirect to="/" />
                  }
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/add-aliexpress-product`}
                  component={() => <Add_Aliexpress_product />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/add-product/:id`}
                  component={(props) => <Update_product {...props} />}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/orders`}
                  component={Orders}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/orders/update-status/:orderId`}
                  component={(props) => <UpdateOrder {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/order_pending`}
                  component={(props) => <PendingOrders {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/payment_approved`}
                  component={(props) => <PaymentApproved {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/ordered`}
                  component={(props) => <Ordered {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/china_warehouse`}
                  component={(props) => <ChinaWarehouse {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/in-shipping`}
                  component={(props) => <InShipment {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/in_stock`}
                  component={(props) => <InStock {...props} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/sales/delivered`}
                  component={(props) => <Delivered {...props} />}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/payments/unVerified`}
                  component={UnverifiedPayments}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/payments/verified`}
                  component={VerifiedPayments}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/coupons/physical/all-coupons`}
                  component={AllCoupons}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/coupons/physical/all-campaigns`}
                  component={AllCampaigns}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/home-category`}
                  component={AllHomeCategories}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/pages/product-to-order`}
                  component={ProductToOrder}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/pages/create-page`}
                  component={() =>
                    currentAdmin ? <Create_page /> : <Redirect to="/" />
                  }
                />

                {/* <Route exact epath={`${process.env.PUBLIC_URL}/media`} component={Media} /> */}

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/menus/list-menu`}
                  component={() =>
                    currentAdmin ? <List_menu /> : <Redirect to="/" />
                  }
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/menus/create-menu`}
                  component={() =>
                    currentAdmin ? <Create_menu /> : <Redirect to="/" />
                  }
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/users/list-user`}
                  component={List_user}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/users/list-user/:userId`}
                  component={DetailUser}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/users/create-user`}
                  component={() =>
                    currentAdmin ? <Create_user /> : <Redirect to="/" />
                  }
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/suppliers/list_suppliers`}
                  component={() => <ListSuppliers />}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/localization/currency-rates`}
                  component={Currency}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/localization/shipping-charges`}
                  component={Taxes}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/localization/shipping-charge/add-product`}
                  component={Add_Product_Tax}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/localization/shipping-charges/add-product/:id`}
                  component={Update_Product_Tax}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/settings/profile`}
                  component={Profile}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/invoice`}
                  component={Invoice}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/product-request/:bookingStatus`}
                  component={New}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/shipment-request/:bookingStatus`}
                  component={NewShipmentRequest}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/pages/dashboard/ship-for/invoice/:bookingId`}
                  component={ShipForMeInvoice}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/pages/dashboard/buy-and-ship-for/invoice/:bookingId`}
                  component={BuyAndShipForMeInvoice}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/ship-for-me/:country`}
                  component={D2DRates}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/ship-for-me-warehouse`}
                  component={Warehouse}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/1688-taobao-orders/:orderStatus`}
                  component={OrdersApi}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/payment-request/pending`}
                  component={PaymentRequest}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/payment-request-order/pending`}
                  component={PaymentRequestOrder}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/banners`}
                  component={Banners}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/data-table`}
                  component={() =>
                    currentAdmin ? <Datatable /> : <Redirect to="/" />
                  }
                />
              </App>
            </Switch>
          </ScrollContext>
        </BrowserRouter>
      </Provider>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById("root"));
