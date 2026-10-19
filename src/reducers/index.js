import { combineReducers } from "redux";
import setAdminsReducer from "./admins";
import setOrdersReducer from "./orders";
import setPaymentsReducer from "./payments";
import setProductsReducer from "./products";
import setProductRequestsReducer from "./bookings";
import setUsersReducer from "./users";
import chatsReducer from "./chats";
import setD2DRatesReducer from "./d2dRates";
import couponsReducers from "./coupons";
import warehouseReducers from "./warehouses";
import campaignsReducers from "./campaigns";
import categoriesReducer from "./categories";
import setNoticesReducer from "./notices";
import partialsReducers from "./partials";
import siteDiscountsReducers from "./siteDiscounts";
import officesReducer from "./offices";
import cnfsReducer from "./cnfs";
import employeesReducer from "./employee";
import expensesReducer from "./expenses";
import cashInsReducer from "./cashIn";
import setExpressRatesDocumentsReducer from "./expressRatesDocuments";
import setExpressRatesParcelReducer from "./expressRatesParcel";
import loansReducer from "./loans";
import installmentsReducer from "./installments";
import sourcingsReducer from "./sourcing";
import cartonsReducer from "./cartons";
import promotionsReducer from "./promotions";
const rootReducer = combineReducers({
  orders: setOrdersReducer,
  payments: setPaymentsReducer,
  admins: setAdminsReducer,
  products: setProductsReducer,
  categories: categoriesReducer,
  productRequests: setProductRequestsReducer,
  users: setUsersReducer,
  chats: chatsReducer,
  d2dRates: setD2DRatesReducer,
  coupons: couponsReducers,
  partials: partialsReducers,
  siteDiscounts: siteDiscountsReducers,
  warehouses: warehouseReducers,
  campaigns: campaignsReducers,
  notices: setNoticesReducer,
  offices: officesReducer,
  promotions: promotionsReducer,
  cnfs: cnfsReducer,
  employees: employeesReducer,
  expenses: expensesReducer,
  cashIns: cashInsReducer,
  expressRatesDocuments: setExpressRatesDocumentsReducer,
  expressRatesParcel: setExpressRatesParcelReducer,
  loans: loansReducer,
  installments: installmentsReducer,
  sourcings: sourcingsReducer,
  cartons: cartonsReducer,
});

export default rootReducer;
