import React, { Component } from "react";
import ReactDOM from "react-dom";
import { BrowserRouter, Route, Switch } from "react-router-dom";
import "./index.scss";
import "react-tabs/style/react-tabs.css";
import App from "./components/app";
import AuthGate from "./components/common/auth-gate.jsx";
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

import IntroModal from "./components/communication/introModal/introModalList";
// Product Reqeust
import New from "./components/product-requests/new";
import NewShipmentRequest from "./components/shipment-request/new";
import ShipForMeInvoice from "./components/shipment-request/invoice-by-order.js";
import BuyAndShipForMeInvoice from "./components/1688-taobao-orders/invoice-by-order.js";
import OrdersApi from "./components/1688-taobao-orders/new";
import PaymentRequestOrder from "./components/payment-request/paymentRequestOrder";
import RefundRequestOrder from "./components/payment-request/refundRequestOrder";
import AfterSale from "./components/payment-request/afterSale.js";
import CargoCollection from "./components/cargo-collection/cargoCollection.jsx";
import Message from "./components/messages/App";
import D2DRates from "./components/d2d-rates/d2dRates";
import D2DRates2 from "./components/1688-rates/d2dRates";
import AllCoupons from "./components/products/physical/allCoupons";
import PartialPayment from "./components/products/physical/partialPayments.js";
import SiteDiscount from "./components/products/physical/siteDiscount.js";
import PaymentLink from "./components/products/physical/paymentLink.js";
import ProductRequestPayments from "./components/product-requests/paymentBatches.jsx";
import AllCampaigns from "./components/products/physical/allCampaigns";
import AllHomeCategories from "./components/products/physical/homeCategory";
import Banners from "./components/products/physical/banner";
import Warehouse from "./components/d2d-rates/warehouse";
import Notices from "./components/notice/notice.js";
import Complain from "./components/complain/complain.js";
import MonthlyExpense from "./components/expense-history/monthly-expense/monthlyexpense";
import DailyExpense from "./components/expense/daily-expense";
import SalaryMonth from "./components/expense-history/salary/monthlyexpense";
import Salaries from "./components/expense-history/salary/monthlyexpenseByMonth";
import Refunds from "./components/expense-history/refund/monthlyexpenseByMonth";
import RefundsMonth from "./components/expense-history/refund/monthlyexpense";
import CommisionMonth from "./components/expense-history/agent-commision/monthlyexpense";
import Commisions from "./components/expense-history/agent-commision/monthlyexpenseByMonth";
import LotTransportMonth from "./components/expense-history/lot-transport/monthlyexpense";
import OfficeCostsLotTransport from "./components/expense-history/lot-transport/monthlyexpenseByMonth";
import Loans from "./components/expense-history/loan/monthlyexpense";
import Customers from "./components/expense-history/loan/customer";
import Customers2 from "./components/expense-history/customer-due/customer.js";
import OnlyInvoiceToPrint2 from "./components/expense-history/customer-due/invoice-by-order.js";
import SingleCustomer from "./components/expense-history/loan/singleCustomer";
import Office from "./components/expense-history/office/office";
import OfficeMonth from "./components/expense-history/office/monthlyexpense";
import OfficeExpenses from "./components/expense-history/office/monthlyexpenseByMonth";
import PromotionExpenses from "./components/expense-history/promotion/monthlyexpenseByMonth";
import CustomersInstallments from "./components/expense-history/monthly-installment/customer";
import SingleCustomerInstallments from "./components/expense-history/monthly-installment/singleCustomer";
import ApproveExpense from "./components/expense-history/approve-expense/approveExpense";
import ExpenseByDay from "./components/expense-history/approve-expense/daily-expense";
import Cnf from "./components/expense-history/cnf/cnf";
import Partner from "./components/expense-history/partner/partner.js";
import PartnerPayment from "./components/expense-history/partner/monthlyexpense.js";
import CnfExpenses from "./components/expense-history/cnf/monthlyexpenseByMonth";
import CnfMonth from "./components/expense-history/cnf/monthlyexpense";
import InvestMonth from "./components/expense-history/invest/monthlyexpense";
import Invests from "./components/expense-history/invest/monthlyexpenseByMonth";
import OfficeCostMonth from "./components/expense-history/daily-cost/monthlyexpense";
import OfficeCosts from "./components/expense-history/daily-cost/monthlyexpenseByMonth";
import Employee from "./components/expense-history/employee/employee";
import EmployeeMonth from "./components/expense-history/employee/monthlyexpense";
import EmployeeExpenses from "./components/expense-history/employee/monthlyexpenseByMonth";
import Fund from "./components/expense-history/fund/fund.js";
import CashSummary from "./components/expense-history/cash-summary/monthlyexpense";
import CashSummaryByMonth from "./components/expense-history/cash-summary/monthlyexpenseByMonth";
import CashSummaryByDate from "./components/expense-history/cash-summary/daily-expense";
import MonthlyExpenseByMonth from "./components/expense-history/monthly-expense/monthlyexpenseByMonth";
import LoanMonthly from "./components/expense-history/loan/monthlyexpenseByMonth";
import List_admin from "./components/admins/list-admin";
import AgentsSourcing2 from "./components/business-consultancy/sourcing2.0/sourcing-agents/agents";
import AgentsSourcing2Months from "./components/business-consultancy/sourcing2.0/sourcing-agents/month";
import AgentsSourcing2Monthly from "./components/business-consultancy/sourcing2.0/sourcing-agents/monthly-invoices";
import Receive_Product from "./components/products/physical/receive-products.js";
import Booking from "./components/products/physical/booking.js";
import Receive_Product_BD from "./components/products/physical/receive-products-bd.js";
import { ToastContainer } from "react-toastify";
import PackingList from "./components/products/physical/packingList.js";
import PackingList_BD from "./components/products/physical/packingList-bd.js";
import Promotion from "./components/expense-history/promotion/promotion.js";
import PromotionMonth from "./components/expense-history/promotion/monthlyexpense";
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

              <AuthGate>
                <App>
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/dashboard`}
                  component={Dashboard}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/notices`}
                  component={Notices}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/complain`}
                  component={Complain}
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
                  path={`${process.env.PUBLIC_URL}/1688-orders/partial-payment`}
                  component={PartialPayment}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/1688-orders/site-discount`}
                  component={SiteDiscount}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/1688-orders/payment-link`}
                  component={PaymentLink}
                />

                {/* Deliberately NOT /product-request/payment: that would be
                    swallowed by the /product-request/:orderStatus wildcard,
                    and silently — the list page renders empty for an unknown
                    slug rather than erroring. */}
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/product-request-payment`}
                  component={ProductRequestPayments}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/category`}
                  component={(props) => <Category history={props.history} />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/sub-category`}
                  component={Sub_category}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/product-list`}
                  component={Product_list}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/product-detail`}
                  component={Product_detail}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/add-product`}
                  component={Add_product}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/add-aliexpress-product`}
                  component={() => <Add_Aliexpress_product />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products-physical/receive-products`}
                  component={Receive_Product}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products-physical/recently-booked-cartons`}
                  component={Booking}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products-physical/receive-products-bd`}
                  component={Receive_Product_BD}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products-physical/receive-products/:cartonId`}
                  component={PackingList}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products-physical/receive-products-bd/:cartonId`}
                  component={PackingList_BD}
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
                  component={Create_page}
                />

                {/* <Route exact epath={`${process.env.PUBLIC_URL}/media`} component={Media} /> */}

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/menus/list-menu`}
                  component={List_menu}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/expense-history`}
                  component={MonthlyExpense}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/expense-history/:month`}
                  component={MonthlyExpenseByMonth}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/salary`}
                  component={SalaryMonth}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/business-consultancy/sourcing-invoice-agents`}
                  component={AgentsSourcing2}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/salary/:month`}
                  component={Salaries}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/menus/create-menu`}
                  component={Create_menu}
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
                  component={Create_user}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/suppliers/list_suppliers`}
                  component={() => <ListSuppliers />}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/refunds`}
                  component={RefundsMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/refunds/:month`}
                  component={Refunds}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/agent-commision`}
                  component={CommisionMonth}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/agent-commision/:month`}
                  component={Commisions}
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
                  path={`${process.env.PUBLIC_URL}/product-request/:orderStatus`}
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
                  path={`${process.env.PUBLIC_URL}/ship-for-me-2/:country`}
                  component={D2DRates2}
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
                  path={`${process.env.PUBLIC_URL}/products/physical/intro-modal`}
                  component={IntroModal}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/admins/list-admin`}
                  component={List_admin}
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
                  path={`${process.env.PUBLIC_URL}/refund-request-order/pending`}
                  component={RefundRequestOrder}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/daily-expense`}
                  component={DailyExpense}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/lot-transport`}
                  component={LotTransportMonth}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/lot-transport/:month`}
                  component={OfficeCostsLotTransport}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/after-sale-service/pending`}
                  component={AfterSale}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/cargo-collection`}
                  component={CargoCollection}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/products/physical/banners`}
                  component={Banners}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/data-table`}
                  component={Datatable}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans`}
                  component={Loans}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans/:month`}
                  component={LoanMonthly}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans-by-customers`}
                  component={Customers}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans-by-customers2/pdf`}
                  component={OnlyInvoiceToPrint2}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans-by-customers2`}
                  component={Customers2}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/loans-by-customers/:customer`}
                  component={SingleCustomer}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/office`}
                  component={Office}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/office/:name`}
                  component={OfficeMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/promotion`}
                  component={Promotion}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/promotion/:name`}
                  component={PromotionMonth}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/singleOffice/office/:month`}
                  component={OfficeExpenses}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/singlePromotion/promotion/:month`}
                  component={PromotionExpenses}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/monthly-installment`}
                  component={CustomersInstallments}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/installments-by-customers/:customer`}
                  component={SingleCustomerInstallments}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/approve-expense`}
                  component={ApproveExpense}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/approve-expense/:date`}
                  component={ExpenseByDay}
                />

                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/cnf`}
                  component={Cnf}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/partner`}
                  component={Partner}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/partner/:id`}
                  component={PartnerPayment}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/cnf/:name`}
                  component={CnfExpenses}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expenses/cnf/:month`}
                  component={CnfMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/invest`}
                  component={InvestMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/invest/:month`}
                  component={Invests}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/daily-cost`}
                  component={OfficeCostMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/daily-cost/:month`}
                  component={OfficeCosts}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/employee`}
                  component={Employee}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/employee/:name`}
                  component={EmployeeMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/employees/:month`}
                  component={EmployeeExpenses}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/expense/fund`}
                  component={Fund}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/cash-summary`}
                  component={CashSummary}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/cash-summary/:month`}
                  component={CashSummaryByMonth}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/cash-summary-by-day/:date`}
                  component={CashSummaryByDate}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/business-consultancy/sourcing2/agents/:agent`}
                  component={AgentsSourcing2Months}
                />
                <Route
                  exact
                  path={`${process.env.PUBLIC_URL}/business-consultancy/sourcing2/agents/:agent/:month`}
                  component={AgentsSourcing2Monthly}
                />
                </App>
              </AuthGate>
            </Switch>
          </ScrollContext>
        </BrowserRouter>
      </Provider>
    );
  }
}

ReactDOM.render(<Root />, document.getElementById("root"));
