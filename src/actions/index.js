import {
  getAllProductRequests,
  getAllShipmentRequests,
  getAllUsers,
  updateProductRequest,
  createProductRequestPayment,
  updateShipmentRequest,
  deleteShipmentRequest,
  getAllPaymentRequest,
  getApprovedPaymentRequests,
  getAllPaymentRequestOrder,
  getApprovedPaymentRequestOrders,
  getAllQuickRefundRequest,
  getApprovedQuickRefundRequest,
  getAllAfterSale,
  getApprovedAfterSale,
  updatePaymentRequestStatus,
  updatePaymentRequestOrderStatus,
  updateRefundRequestOrderStatus,
  updateAfterSaleStatus,
  makePayment,
  getCurrency,
  getAllOrdersApi,
  getAllRooms,
  updateOrderApi,
  updateOrdersWithPaymentLink,
  updateOrdersWithTrackingNo,
  updateOrdersFrom1688,
  deleteOrderApi,
  updateProduct,
  deleteOrder,
  createIntro,
  getAllIntros,
  deleteProduct,
  readAllMessage,
  getAllD2DRates,
  getAll1688Rates,
  updateD2DRates,
  update1688Rates,
  getAll1688Categories,
  set1688CategoryRates,
  clear1688CategoryRates,
  uploadD2DRates,
  deleteD2DRates,
  getAllCoupons,
  uploadCoupon,
  updateCoupon,
  deleteCoupon,
  getAllPartials,
  uploadPartial,
  updatePartial,
  deletePartial,
  getAllSiteDiscounts,
  uploadSiteDiscount,
  updateSiteDiscount,
  deleteSiteDiscount,
  getAllWarehouses,
  uploadWarehouse,
  updateWarehouse,
  deleteWarehouse,
  getAllBanners,
  uploadBanner,
  updateBanner,
  deleteBanner,
  getAllCampaigns,
  uploadCampaign,
  updateCampaign,
  deleteCampaign,
  getAllHomeCategory,
  uploadHomeCategory,
  updateHomeCategory,
  deleteHomeCategory,
  setShipForMe,
  getSingleShipForMe,
  getSingleOrderApi,
  updateUserStatus,
  getSingleUser,
  getAllShipForMeOfSingleUser,
  getAllOrderOfSingleUser,
  getAllProductRequestOfSingleUser,
  getAllPaymentOfSingleUser,
  createNotice,
  updateNotice,
  getAllNotices,
  deleteProductRequest,
  getSingleProductRequest,
  setProductRequest,
  getSingleMonthlyExpense,
  getAllMonthlyExpense,
  getAllPendingExpensesByDay,
  approveExpense,
  getAllPendingExpenses,
  deleteExpense,
  updateExpense,
  uploadExpense,
  getAllExpenses,
  getAllOffices,
  uploadOffice,
  updateOffice,
  deleteOffice,
  getAllPromotions,
  uploadPromotion,
  updatePromotion,
  deletePromotion,
  getSingleCashSummary,
  uploadCashIn,
  updateCashIn,
  getAllDocumentExpressRates,
  getAllEmployees,
  getAllMonthlyCashSummary,
  getAllMonthlyCashIn,
  getAllMonthly,
  getAllMonthlySalary,
  getSingleMonthlyCashSummary,
  getSingleMonthlyCashIn,
  getSingleMonthly,
  getSingleMonthlySalary,
  getSingleMonthlyLoanCashIn,
  getSingleMonthlyLoanCashOut,
  getAllPendingCashInByDay,
  getAllPendingCashIns,
  getAllLoansCashOuts,
  getAllLoansCashIns,
  getAllLoansCashOutCustomer,
  getSingleCustomerLoan,
  getAllInstallmentsCashOutCustomer,
  getAllLoansCashInCustomer,
  deleteCashIn,
  deleteEmployee,
  getAllCustomerLoans,
  getAllCustomerInstallments,
  getAllCnfs,
  uploadCnf,
  updateCnf,
  deleteCnf,
  uploadCnfBill,
  getAllMonthsCnfBill,
  getAllCnfBills,
  getAllCnfExpenses,
  getAllCnfBillsAllMonths,
  getAllCnfExpensesAllMonths,
  updateEmployee,
  updateSalary,
  uploadEmployee,
  getAllFunds,
  getAllCashIns,
  createMonth,
  updateAdminStatus,
  getAllSourcingsAgent,
  getAllSourcings,
  getAllTransactions,
  handleSourcingAgentPay,
  uploadTransaction,
  uploadCarton,
  updateCarton,
  deleteCarton,
  getAllCartons,
  getAllCnCartons,
} from "../firebase/firebase.utils";
import Axios from "axios";
export const setAllOrders = (ordersArray) => ({
  type: "SET_ALL_ORDERS",
  payload: ordersArray,
});

export const appendMessagesRedux = (messages) => ({
  type: "APPEND_MESSAGES",
  payload: messages,
});
export const getAllCashInsRedux = (day) => async (dispatch) => {
  const cashIns = await getAllCashIns(day);
  dispatch({
    type: "GET_ALL_CASH_INS",
    payload: cashIns,
  });
};
export const uploadEmployeeRedux = (employeeObj) => async (dispatch) => {
  const uploadedEmployeeObj = await uploadEmployee(employeeObj);
  dispatch({
    type: "UPLOAD_EMPLOYEE",
    payload: uploadedEmployeeObj,
  });
};
export const setAllPayments = (paymentsArray) => ({
  type: "SET_ALL_PAYMENTS",
  payload: paymentsArray,
});
export const setAllAdmins = (adminsArray) => ({
  type: "SET_ALL_ADMINS",
  payload: adminsArray,
});
export const setCurrentAdmin = (adminObj) => ({
  type: "SET_CURRENT_ADMIN",
  payload: adminObj,
});

export const deleteEmployeeRedux = (employeeId) => async (dispatch) => {
  await deleteEmployee(employeeId);
  dispatch({
    type: "DELETE_EMPLOYEE",
    payload: employeeId,
  });
};

// notice
export const createNoticeRedux = (noticeObj) => async (dispatch) => {
  const createdNoticeObj = await createNotice(noticeObj);
  dispatch({ type: "CREATE_NOTICE", payload: createdNoticeObj });
};
export const getAllNoticesRedux = () => async (dispatch) => {
  const noticesArray = await getAllNotices();
  dispatch({ type: "GET_ALL_NOTICES", payload: noticesArray });
};

export const updateNoticeRedux = (noticeObj) => async (dispatch) => {
  const updatedNoticeObj = await updateNotice(noticeObj);
  dispatch({ type: "UPDATE_NOTICE", payload: updatedNoticeObj });
};

export const setAllProducts = (productsArray) => ({
  type: "SET_ALL_PRODUCTS",
  payload: productsArray,
});
export const uploadTransactionRedux = (transactionObj) => async (dispatch) => {
  const uploadedTransactionObj = await uploadTransaction(transactionObj);
  dispatch({
    type: "UPLOAD_TRANSACTION",
    payload: uploadedTransactionObj,
  });
};

export const rechargeAdminredux = (adminIdArray, balance) => {
  return {
    type: "RECHARGE_ADMIN",
    payload: {
      adminIdArray,
      balance,
    },
  };
};

export const updateProfileImageRedux = (imgUrl) => {
  return {
    type: "UPDATE_PROFILE_IMAGE",
    payload: imgUrl,
  };
};
export const updateSalaryRedux = (employeeObj) => async (dispatch) => {
  const updatedEmployeeObj = await updateSalary(employeeObj);
  dispatch({
    type: "UPDATE_SALARY",
    payload: updatedEmployeeObj,
  });
};
export const getAllCustomerLoansRedux = () => async (dispatch) => {
  const allCustomers = await getAllCustomerLoans();
  dispatch({
    type: "GET_ALL_CUSTOMERS",
    payload: allCustomers,
  });
};

export const getAllUsersRedux = () => async (dispatch) => {
  const allUsers = await getAllUsers();
  dispatch({ type: "GET_ALL_USERS", payload: allUsers });
};

export const updateUserStatusRedux = (userObj) => async (dispatch) => {
  const updatedUserObj = await updateUserStatus(userObj);
  dispatch({
    type: "UPDATE_USER_STATUS",
    payload: updatedUserObj,
  });
};
export const getSingleUserRedux = (userId) => async (dispatch) => {
  const updatedUserObj = await getSingleUser(userId);
  dispatch({
    type: "GET_SINGLE_USER",
    payload: updatedUserObj,
  });
};
export const selectRoomRedux = (roomId) => async (dispatch) => {
  await readAllMessage(roomId);
  dispatch({
    type: "SELECT_ROOM",
    payload: roomId,
  });
};

export const setShipForMeRedux = (bookingObj) => async (dispatch) => {
  const uploadedBookingObj = await setShipForMe(bookingObj);
  dispatch({
    type: "SET_SHIP_FOR_ME",
    payload: uploadedBookingObj,
  });
};

export const getAllProductRequestsRedux = (status) => async (dispatch) => {
  const requestsArray = await getAllProductRequests(status);
  dispatch({ type: "GET_ALL_PRODUCT_REQUESTS", payload: requestsArray });
};

export const getAllShipmentRequestsRedux = (status) => async (dispatch) => {
  const requestsArray = await getAllShipmentRequests(status);
  dispatch({ type: "GET_ALL_SHIPMENT_REQUESTS", payload: requestsArray });
};
export const getAllShipForMeOfSingleUserRedux =
  (userId) => async (dispatch) => {
    const requestsArray = await getAllShipForMeOfSingleUser(userId);
    dispatch({
      type: "GET_ALL_SHIP_FOR_ME_OF_SINGLE_USER",
      payload: requestsArray,
    });
  };

export const getAllFundsRedux = () => async (dispatch) => {
  const funds = await getAllFunds();
  dispatch({
    type: "GET_ALL_FUNDS",
    payload: funds,
  });
};

export const getAllTransactionRedux =
  (employeeId, month) => async (dispatch) => {
    const transactions = await getAllTransactions(employeeId, month);
    dispatch({
      type: "GET_ALL_TRANSACTIONS",
      payload: transactions,
    });
  };

export const getAllOrderOfSingleUserRedux = (userId) => async (dispatch) => {
  const ordersArray = await getAllOrderOfSingleUser(userId);
  dispatch({ type: "GET_ALL_ORDER_OF_SINGLE_USER", payload: ordersArray });
};
export const getAllProductRequestOfSingleUserRedux =
  (userId) => async (dispatch) => {
    const ordersArray = await getAllProductRequestOfSingleUser(userId);
    dispatch({
      type: "GET_ALL_PRODUCT_REQUEST_OF_SINGLE_USER",
      payload: ordersArray,
    });
  };
export const getAllPaymentOfSingleUserRedux = (userId) => async (dispatch) => {
  const ordersArray = await getAllPaymentOfSingleUser(userId);
  dispatch({ type: "GET_ALL_PAYMENT_OF_SINGLE_USER", payload: ordersArray });
};

/* Returns the raw result (redux-thunk passes it through) so the modal can read
   `skipped` and report a partial success. */
export const createProductRequestPaymentRedux =
  (requests, createdBy) => async (dispatch) => {
    const result = await createProductRequestPayment(requests, createdBy);
    if (result && result.ok) {
      dispatch({
        type: "UPDATE_MULTIPLE_PRODUCT_REQUESTS",
        payload: result.acceptedRequests,
      });
    }
    return result;
  };

export const updateProductRequestRedux = (requestObj) => async (dispatch) => {
  const updatedRequest = await updateProductRequest(requestObj);
  dispatch({ type: "UPDATE_PRODUCT_REQUEST", payload: updatedRequest });
};
export const updateProductRedux = (productObj) => async (dispatch) => {
  const updatedProduct = await updateProduct(productObj);
  dispatch({ type: "UPDATE_PRODUCT", payload: updatedProduct });
};
export const deleteProductRedux = (id) => async (dispatch) => {
  await deleteProduct(id);
  dispatch({ type: "DELETE_PRODUCT", payload: id });
};
export const updateAdminStatusRedux = (adminObj) => async (dispatch) => {
  const updatedAdminObj = await updateAdminStatus(adminObj);
  dispatch({
    type: "UPDATE_ADMIN_STATUS",
    payload: updatedAdminObj,
  });
};

export const updateShipmentRequestRedux = (requestObj) => async (dispatch) => {
  const updatedRequest = await updateShipmentRequest(requestObj);
  dispatch({ type: "UPDATE_SHIPMENT_REQUEST", payload: updatedRequest });
};
export const deleteShipmentRequestRedux = (requestObj) => async (dispatch) => {
  await deleteShipmentRequest(requestObj);
  dispatch({ type: "DELETE_SHIPMENT_REQUEST", payload: requestObj });
};

export const getSingleShipForMeRedux = (bookingId) => async (dispatch) => {
  const shipForMeObj = await getSingleShipForMe(bookingId);
  dispatch({
    type: "GET_SINGLE_SHIP_FOR_ME",
    payload: shipForMeObj,
  });
};
export const getSingleOrderApiRedux = (bookingId) => async (dispatch) => {
  const orderObj = await getSingleOrderApi(bookingId);
  dispatch({
    type: "GET_SINGLE_ORDER_API",
    payload: orderObj,
  });
};
export const getSingleProductRequestRedux = (bookingId) => async (dispatch) => {
  const orderObj = await getSingleProductRequest(bookingId);
  dispatch({
    type: "GET_SINGLE_PRODUCT_REQUEST",
    payload: orderObj,
  });
};

export const getAllPaymentRequestRedux = () => async (dispatch) => {
  const paymentRequestArray = await getAllPaymentRequest();
  dispatch({ type: "GET_ALL_PAYMENT_REQUEST", payload: paymentRequestArray });
};
export const getAllPaymentRequestOrderRedux = () => async (dispatch) => {
  const paymentRequestOrderArray = await getAllPaymentRequestOrder();
  dispatch({
    type: "GET_ALL_PAYMENT_REQUEST_ORDER",
    payload: paymentRequestOrderArray,
  });
};
export const getApprovedPaymentRequestsRedux = () => async (dispatch) => {
  const approvedPaymentRequestArray = await getApprovedPaymentRequests();
  dispatch({
    type: "GET_APPROVED_PAYMENT_REQUEST",
    payload: approvedPaymentRequestArray,
  });
};
export const getApprovedPaymentRequestOrdersRedux = () => async (dispatch) => {
  const approvedPaymentRequestOrderArray = await getApprovedPaymentRequestOrders();
  dispatch({
    type: "GET_APPROVED_PAYMENT_REQUEST_ORDER",
    payload: approvedPaymentRequestOrderArray,
  });
};
export const getAllQuickRefundRequstRedux = () => async (dispatch) => {
  const quickRefundRequest = await getAllQuickRefundRequest();
  dispatch({
    type: "GET_ALL_QUICK_REFUND_REQUEST",
    payload: quickRefundRequest,
  });
};
export const getApprovedQuickRefundRequestRedux = () => async (dispatch) => {
  const approvedQuickRefundRequest = await getApprovedQuickRefundRequest();
  dispatch({
    type: "GET_APPROVED_QUICK_REFUND_REQUEST",
    payload: approvedQuickRefundRequest,
  });
};
export const getAllAfterSaleRedux = () => async (dispatch) => {
  const quickRefundRequest = await getAllAfterSale();
  dispatch({
    type: "GET_ALL_AFTER_SALE",
    payload: quickRefundRequest,
  });
};
export const getApprovedAfterSaleRedux = () => async (dispatch) => {
  const approvedAfterSale = await getApprovedAfterSale();
  dispatch({
    type: "GET_APPROVED_AFTER_SALE",
    payload: approvedAfterSale,
  });
};
export const getAllCustomerInstallmentRedux = () => async (dispatch) => {
  const allCustomers = await getAllCustomerInstallments();
  dispatch({
    type: "GET_ALL_CUSTOMERS_INSTALLMENT",
    payload: allCustomers,
  });
};

export const updatePaymentRequestStatusRedux =
  (paymentRequestObj) => async (dispatch) => {
    const updatedPaymentRequestObj = await updatePaymentRequestStatus(
      paymentRequestObj
    );
    dispatch({
      type: "UPDATE_PAYMENT_REQUEST_STATUS",
      payload: updatedPaymentRequestObj,
    });
  };
export const updatePaymentRequestOrderStatusRedux =
  (paymentRequestObj) => async (dispatch) => {
    const updatedPaymentRequestObj = await updatePaymentRequestOrderStatus(
      paymentRequestObj
    );
    dispatch({
      type: "UPDATE_PAYMENT_REQUEST_ORDER_STATUS",
      payload: updatedPaymentRequestObj,
    });
  };
export const updateRefundRequestOrderStatusRedux =
  (refundRequestObj) => async (dispatch) => {
    const updatedRefundRequestObj = await updateRefundRequestOrderStatus(
      refundRequestObj
    );
    dispatch({
      type: "UPDATE_REFUND_REQUEST_ORDER_STATUS",
      payload: updatedRefundRequestObj,
    });
  };
export const updateAfterSaleStatusRedux =
  (refundRequestObj) => async (dispatch) => {
    const updatedRefundRequestObj = await updateAfterSaleStatus(
      refundRequestObj
    );
    dispatch({
      type: "UPDATE_AFTER_SALE_STATUS",
      payload: updatedRefundRequestObj,
    });
  };

export const getAllIntrosRedux = () => async (dispatch) => {
  const introsArray = await getAllIntros();
  dispatch({ type: "GET_ALL_INTROS", payload: introsArray });
};

export const createIntroRedux = (introObj) => async (dispatch) => {
  const createdIntroObj = await createIntro(introObj);
  dispatch({ type: "CREATE_INTRO", payload: createdIntroObj });
};

export const createMonthRedux = () => async (dispatch) => {
  const months = await createMonth();
  dispatch({
    type: "GET_ALL_MONTHS",
    payload: months,
  });
};

export const makePaymentRedux =
  (total, invoicesToPay, currentUser, admin, parcelsArray, paymentMethod) =>
  async (dispatch) => {
    const updatedOrdersArray = await makePayment(
      total,
      invoicesToPay,
      currentUser,
      admin,
      parcelsArray,
      paymentMethod
    );
    dispatch({
      type: "UPDATE_MULTIPLE_ORDERS",
      payload: updatedOrdersArray,
    });
  };

export const getCurrencyRedux = () => async (dispatch) => {
  const currency = await getCurrency();
  dispatch({ type: "GET_CURRENCY_REDUX", payload: currency });
};

export const getAllOrdersApiRedux =
  (orderStatus, startDate, endDate) => async (dispatch) => {
    const ordersApiArray = await getAllOrdersApi(
      orderStatus,
      startDate,
      endDate
    );
    dispatch({
      type: "GET_ALL_ORDERS_API_OF_SINGLE_STATUS",
      payload: ordersApiArray,
    });
  };
export const getAllRoomsRedux = (rooms) => async (dispatch) => {
  // const rooms = await getAllRooms();
  dispatch({
    type: "GET_ALL_ROOMS",
    payload: rooms,
  });
};
export const getAllSourcingsRedux = (month) => async (dispatch) => {
  const allSourcings = await getAllSourcings(month);
  dispatch({
    type: "GET_ALL_SOURCINGS",
    payload: allSourcings,
  });
};
export const getAllSourcingsAgentRedux = (agent, month) => async (dispatch) => {
  const allSourcings = await getAllSourcingsAgent(agent, month);
  dispatch({
    type: "GET_ALL_SOURCINGS",
    payload: allSourcings,
  });
};
export const getAllCnfRedux = () => async (dispatch) => {
  const cnfs = await getAllCnfs();
  dispatch({
    type: "GET_ALL_CNFS",
    payload: cnfs,
  });
};

// OFFICE CRUD
export const getAllOfficeRedux = () => async (dispatch) => {
  const offices = await getAllOffices();
  dispatch({
    type: "GET_ALL_OFFICES",
    payload: offices,
  });
};

export const uploadOfficeRedux = (officeObj) => async (dispatch) => {
  const uploadedOfficeObj = await uploadOffice(officeObj);
  dispatch({
    type: "UPLOAD_OFFICE",
    payload: uploadedOfficeObj,
  });
};

export const updateOfficeRedux = (officeObj) => async (dispatch) => {
  const updatedOfficeObj = await updateOffice(officeObj);
  dispatch({
    type: "UPDATE_OFFICE",
    payload: updatedOfficeObj,
  });
};
export const deleteOfficeRedux = (officeId) => async (dispatch) => {
  await deleteOffice(officeId);
  dispatch({
    type: "DELETE_OFFICE",
    payload: officeId,
  });
};
// PROMOTION CRUD
export const getAllPromotionRedux = () => async (dispatch) => {
  const offices = await getAllPromotions();
  dispatch({
    type: "GET_ALL_PROMOTIONS",
    payload: offices,
  });
};
export const uploadPromotionRedux = (officeObj) => async (dispatch) => {
  const uploadedOfficeObj = await uploadPromotion(officeObj);
  dispatch({
    type: "UPLOAD_PROMOTION",
    payload: uploadedOfficeObj,
  });
};
export const updatePromotionRedux = (officeObj) => async (dispatch) => {
  const updatedOfficeObj = await updatePromotion(officeObj);
  dispatch({
    type: "UPDATE_PROMOTION",
    payload: updatedOfficeObj,
  });
};
export const deletePromotionRedux = (officeId) => async (dispatch) => {
  await deletePromotion(officeId);
  dispatch({
    type: "DELETE_PROMOTION",
    payload: officeId,
  });
};

// CARTONS CRUD
export const getAllCartonsRedux = (country) => async (dispatch) => {
  const cartons = await getAllCartons(country);
  dispatch({
    type: "GET_ALL_CARTONS",
    payload: cartons,
  });
};
export const getAllCnCartonsRedux = () => async (dispatch) => {
  const cartons = await getAllCnCartons();
  dispatch({
    type: "GET_ALL_CARTONS",
    payload: cartons,
  });
};

export const uploadCartonRedux = (cartonObj) => async (dispatch) => {
  const uploadedCartonObj = await uploadCarton(cartonObj);
  dispatch({
    type: "UPLOAD_CARTON",
    payload: uploadedCartonObj,
  });
};
export const updateCartonRedux = (cartonObj) => async (dispatch) => {
  const updatedCartonObj = await updateCarton(cartonObj);
  dispatch({
    type: "UPDATE_CARTON",
    payload: updatedCartonObj,
  });
};

export const deleteCartonRedux = (cartonId) => async (dispatch) => {
  await deleteCarton(cartonId);
  dispatch({
    type: "DELETE_CARTON",
    payload: cartonId,
  });
};

export const getSingleCashSummaryRedux = () => async (dispatch) => {
  const cashObj = await getSingleCashSummary();
  dispatch({
    type: "GET_SINGLE_CASH_SUMMARY",
    payload: cashObj,
  });
};

export const uploadCashInRedux = (cashInObj) => async (dispatch) => {
  const uploadedCashInObj = await uploadCashIn(cashInObj);
  dispatch({
    type: "UPLOAD_CASH_IN",
    payload: uploadedCashInObj,
  });
};

export const deleteCnfRedux = (cnfId) => async (dispatch) => {
  await deleteCnf(cnfId);
  dispatch({
    type: "DELETE_CNF",
    payload: cnfId,
  });
};
export const getAllCnfBillAllMonthsRedux = (name) => async (dispatch) => {
  const cnfs = await getAllCnfBillsAllMonths(name);
  dispatch({
    type: "GET_ALL_CNF_BILLS_ALL_MONTHS",
    payload: cnfs,
  });
};
export const getAllCnfBillRedux = (month, name) => async (dispatch) => {
  const cnfs = await getAllCnfBills(month, name);
  dispatch({
    type: "GET_ALL_CNF_BILLS",
    payload: cnfs,
  });
};

export const getAllCnfBillMonthsRedux = (month) => async (dispatch) => {
  const allMonths = await getAllMonthsCnfBill(month);
  dispatch({
    type: "ALL_MONTHS_CNF_BILL",
    payload: allMonths,
  });
};
export const updateCnfRedux = (cnfObj) => async (dispatch) => {
  const updatedCnfObj = await updateCnf(cnfObj);
  dispatch({
    type: "UPDATE_CNF",
    payload: updatedCnfObj,
  });
};
export const uploadCnfBillRedux = (billObj) => async (dispatch) => {
  await uploadCnfBill(billObj);
  dispatch({
    type: "UPLOAD_CNF_BILL",
    payload: billObj,
  });
};
export const uploadCnfRedux = (cnfObj) => async (dispatch) => {
  const uploadedCnfObj = await uploadCnf(cnfObj);
  dispatch({
    type: "UPLOAD_CNF",
    payload: uploadedCnfObj,
  });
};
export const updateCashInRedux = (cashInObj) => async (dispatch) => {
  const updatedCashInObj = await updateCashIn(cashInObj);
  dispatch({
    type: "UPDATE_CASH_IN",
    payload: updatedCashInObj,
  });
};

export const getAllDocumentExpressRatesRedux = () => async (dispatch) => {
  const documentExpressRatesArray = await getAllDocumentExpressRates();
  dispatch({
    type: "GET_ALL_DOCUMENT_EXPRESS_RATES",
    payload: documentExpressRatesArray,
  });
};

export const getAllEmployeeRedux = () => async (dispatch) => {
  const employees = await getAllEmployees();
  dispatch({
    type: "GET_ALL_EMPLOYEES",
    payload: employees,
  });
};

export const updateOrderApiRedux = (order) => async (dispatch) => {
  const orderObj = await updateOrderApi(order);
  dispatch({
    type: "UPDATE_ORDER_API",
    payload: orderObj,
  });
};
export const updateOrdersWithPaymentLinkRedux =
  (total, ordersArray, paymentLink) => async (dispatch) => {
    const orders = await updateOrdersWithPaymentLink(
      total,
      ordersArray,
      paymentLink
    );
    dispatch({
      type: "UPDATE_MULTIPLE_ORDER_API",
      payload: { orders: orders, paymentLink },
    });
  };
export const updateOrdersFrom1688Redux = (updates) => async (dispatch) => {
  const applied = await updateOrdersFrom1688(updates);
  dispatch({
    type: "UPDATE_ORDERS_FROM_1688",
    payload: applied,
  });
};
export const updateOrdersWithTrackingNoRedux =
  (ordersArray) => async (dispatch) => {
    const orders = await updateOrdersWithTrackingNo(ordersArray);
    dispatch({
      type: "UPDATE_MULTIPLE_ORDER_API",
      payload: { orders: orders, paymentLink: "" },
    });
  };
export const deleteOrderApiRedux = (order) => async (dispatch) => {
  await deleteOrderApi(order);
  dispatch({
    type: "DELETE_ORDER_API",
    payload: order,
  });
};
export const deleteProductRequestRedux = (order) => async (dispatch) => {
  await deleteProductRequest(order);
  dispatch({
    type: "DELETE_PRODUCT_REQUEST",
    payload: order,
  });
};

// D2D Rates
export const getAllD2DRatesRedux =
  (freightType, country) => async (dispatch) => {
    const allD2DRatesAirArray = await getAllD2DRates(freightType, country);
    dispatch({
      type: "GET_ALL_D2D_RATES",
      payload: allD2DRatesAirArray,
    });
  };
export const getAll1688RatesRedux =
  (freightType, country) => async (dispatch) => {
    const allD2DRatesAirArray = await getAll1688Rates(freightType, country);
    dispatch({
      type: "GET_ALL_1688_RATES",
      payload: allD2DRatesAirArray,
    });
  };

export const setProductRequestRedux = (bookingObj) => async (dispatch) => {
  const uploadedBookingObj = await setProductRequest(bookingObj);
  dispatch({
    type: "SET_PRODUCT_REQUEST",
    payload: uploadedBookingObj,
  });
};

export const uploadD2DRatesRedux =
  (freightType, country, productTypeObj) => async (dispatch) => {
    const uploadedD2DRatesObj = await uploadD2DRates(
      freightType,
      country,
      productTypeObj
    );
    dispatch({
      type: "UPLOAD_D2D_RATES",
      payload: uploadedD2DRatesObj,
    });
  };

export const updateD2DRatesRedux =
  (freightType, country, productTypeObj) => async (dispatch) => {
    const updatedD2DRatesObj = await updateD2DRates(
      freightType,
      country,
      productTypeObj
    );
    dispatch({
      type: "UPDATE_D2D_RATES",
      payload: updatedD2DRatesObj,
    });
  };
export const getAll1688CategoriesRedux = () => async (dispatch) => {
  const categories = await getAll1688Categories();
  dispatch({
    type: "GET_ALL_1688_CATEGORIES",
    payload: categories,
  });
};

export const set1688CategoryRatesRedux =
  (categoryId, freightType, rates) => async (dispatch) => {
    const result = await set1688CategoryRates(categoryId, freightType, rates);
    dispatch({
      type: "SET_1688_CATEGORY_RATES",
      payload: { categoryId, freightType, ...result },
    });
    return result;
  };

export const clear1688CategoryRatesRedux =
  (categoryId, freightType) => async (dispatch) => {
    const result = await clear1688CategoryRates(categoryId, freightType);
    dispatch({
      type: "CLEAR_1688_CATEGORY_RATES",
      payload: { categoryId, freightType, ...result },
    });
    return result;
  };

export const update1688RatesRedux = (productTypeObj) => async (dispatch) => {
  const updatedD2DRatesObj = await update1688Rates(productTypeObj);
  dispatch({
    type: "UPDATE_1688_RATES",
    payload: updatedD2DRatesObj,
  });
};
export const deleteD2DRatesRedux =
  (freightType, country, productTypeId) => async (dispatch) => {
    await deleteD2DRates(freightType, country, productTypeId);
    dispatch({
      type: "DELETE_D2D_RATES",
      payload: { freightType, country, productTypeId },
    });
  };

export const getAllCouponsRedux = () => async (dispatch) => {
  const allCoupons = await getAllCoupons();
  dispatch({
    type: "GET_ALL_COUPONS",
    payload: allCoupons,
  });
};

export const uploadCouponRedux = (couponObj) => async (dispatch) => {
  const uploadedCouponObj = await uploadCoupon(couponObj);
  dispatch({
    type: "UPLOAD_COUPON",
    payload: uploadedCouponObj,
  });
};

export const updateCouponRedux = (couponObj) => async (dispatch) => {
  const updatedCouponObj = await updateCoupon(couponObj);
  dispatch({
    type: "UPDATE_COUPON",
    payload: updatedCouponObj,
  });
};

export const deleteCouponRedux = (id) => async (dispatch) => {
  await deleteCoupon(id);
  dispatch({
    type: "DELETE_COUPON",
    payload: id,
  });
};
export const getAllPartialsRedux = () => async (dispatch) => {
  const allCoupons = await getAllPartials();
  dispatch({
    type: "GET_ALL_PARTIALS",
    payload: allCoupons,
  });
};

export const uploadPartialRedux = (couponObj) => async (dispatch) => {
  const uploadedCouponObj = await uploadPartial(couponObj);
  dispatch({
    type: "UPLOAD_PARTIAL",
    payload: uploadedCouponObj,
  });
};

export const updatePartialRedux = (couponObj) => async (dispatch) => {
  const updatedCouponObj = await updatePartial(couponObj);
  dispatch({
    type: "UPDATE_PARTIAL",
    payload: updatedCouponObj,
  });
};

export const deletePartialRedux = (id) => async (dispatch) => {
  await deletePartial(id);
  dispatch({
    type: "DELETE_PARTIAL",
    payload: id,
  });
};

export const getAllSiteDiscountsRedux = () => async (dispatch) => {
  const allSiteDiscounts = await getAllSiteDiscounts();
  dispatch({
    type: "GET_ALL_SITE_DISCOUNTS",
    payload: allSiteDiscounts,
  });
};

export const uploadSiteDiscountRedux = (discountObj) => async (dispatch) => {
  const uploadedDiscountObj = await uploadSiteDiscount(discountObj);
  dispatch({
    type: "UPLOAD_SITE_DISCOUNT",
    payload: uploadedDiscountObj,
  });
};

export const updateSiteDiscountRedux = (discountObj) => async (dispatch) => {
  const updatedDiscountObj = await updateSiteDiscount(discountObj);
  dispatch({
    type: "UPDATE_SITE_DISCOUNT",
    payload: updatedDiscountObj,
  });
};

export const deleteSiteDiscountRedux = (id) => async (dispatch) => {
  await deleteSiteDiscount(id);
  dispatch({
    type: "DELETE_SITE_DISCOUNT",
    payload: id,
  });
};

export const getAllWarehousesRedux = () => async (dispatch) => {
  const allCoupons = await getAllWarehouses();
  dispatch({
    type: "GET_ALL_WAREHOUSES",
    payload: allCoupons,
  });
};

export const uploadWarehouseRedux = (warehouseObj) => async (dispatch) => {
  const uploadedWarehouseObj = await uploadWarehouse(warehouseObj);
  dispatch({
    type: "UPLOAD_WAREHOUSE",
    payload: uploadedWarehouseObj,
  });
};

export const updateWarehouseRedux = (warehouseObj) => async (dispatch) => {
  const updatedWarehouseObj = await updateWarehouse(warehouseObj);
  dispatch({
    type: "UPDATE_WAREHOUSE",
    payload: updatedWarehouseObj,
  });
};

export const getOrderTrackingResultRedux = (trackingNo) => async (dispatch) => {
  let resultObj = null;
  if (trackingNo) {
    resultObj = await Axios.get(
      `https://alglimited.com/api/v1/orderTracking-alg/${trackingNo}`
    );
  }

  dispatch({
    type: "GET_ORDER_TRACKING_RESULT",
    payload: resultObj && resultObj.data ? resultObj.data : null,
  });
  return resultObj && resultObj.data ? resultObj.data : null;
};

export const deleteWarehouseRedux = (id) => async (dispatch) => {
  await deleteWarehouse(id);
  dispatch({
    type: "DELETE_WAREHOUSE",
    payload: id,
  });
};
export const getAllCampaignsRedux = () => async (dispatch) => {
  const allCampaigns = await getAllCampaigns();
  dispatch({
    type: "GET_ALL_CAMPAIGNS",
    payload: allCampaigns,
  });
};

export const uploadCampaignRedux = (campaignObj) => async (dispatch) => {
  const uploadedCampaignObj = await uploadCampaign(campaignObj);
  dispatch({
    type: "UPLOAD_CAMPAIGN",
    payload: uploadedCampaignObj,
  });
};

export const updateCampaignRedux = (campaignObj) => async (dispatch) => {
  const updatedCampaignObj = await updateCampaign(campaignObj);
  dispatch({
    type: "UPDATE_CAMPAIGN",
    payload: updatedCampaignObj,
  });
};

export const deleteCampaignRedux = (id) => async (dispatch) => {
  await deleteCampaign(id);
  dispatch({
    type: "DELETE_CAMPAIGN",
    payload: id,
  });
};
export const getAllHomeCategoryRedux = () => async (dispatch) => {
  const allCampaigns = await getAllHomeCategory();
  dispatch({
    type: "GET_ALL_HOME_CATEGORIES",
    payload: allCampaigns,
  });
};

export const uploadHomeCategoryRedux = (catObj) => async (dispatch) => {
  const uploadedCatObj = await uploadHomeCategory(catObj);
  dispatch({
    type: "UPLOAD_HOME_CATEGORY",
    payload: uploadedCatObj,
  });
};

export const updateHomeCategoryRedux = (catObj) => async (dispatch) => {
  const updatedCatObj = await updateHomeCategory(catObj);
  dispatch({
    type: "UPDATE_HOME_CATEGORY",
    payload: updatedCatObj,
  });
};

export const deleteHomeCategoryRedux = (id) => async (dispatch) => {
  await deleteHomeCategory(id);
  dispatch({
    type: "DELETE_HOME_CATEGORY",
    payload: id,
  });
};

export const getAllBannersRedux = () => async (dispatch) => {
  const allCats = await getAllBanners();
  dispatch({
    type: "GET_ALL_BANNERS",
    payload: allCats,
  });
};

export const uploadBannerRedux = (bannerObj) => async (dispatch) => {
  const uploadedBannerObj = await uploadBanner(bannerObj);
  dispatch({
    type: "UPLOAD_BANNER",
    payload: uploadedBannerObj,
  });
};

export const updateBannerRedux = (bannerObj) => async (dispatch) => {
  const updatedBannerObj = await updateBanner(bannerObj);
  dispatch({
    type: "UPDATE_BANNER",
    payload: updatedBannerObj,
  });
};

export const handleSourcingAgentPayRedux =
  (sourcingObj) => async (dispatch) => {
    const updatedSourcingObj = await handleSourcingAgentPay(sourcingObj);
    dispatch({
      type: "UPDATE_SOURCING",
      payload: updatedSourcingObj,
    });
  };

export const deleteBannerRedux = (bannerId) => async (dispatch) => {
  await deleteBanner(bannerId);
  dispatch({
    type: "DELETE_BANNER",
    payload: { id: bannerId },
  });
};
export const getAllCnfExpenseAllMonthsRedux = (name) => async (dispatch) => {
  const cnfs = await getAllCnfExpensesAllMonths(name);
  dispatch({
    type: "GET_ALL_CNF_EXPENSES_ALL_MONTHS",
    payload: cnfs,
  });
};
export const getAllCnfExpenseRedux = (month, name) => async (dispatch) => {
  const cnfs = await getAllCnfExpenses(month, name);
  dispatch({
    type: "GET_ALL_CNF_EXPENSES",
    payload: cnfs,
  });
};

export const getAllExpenseRedux = (day) => async (dispatch) => {
  const expenses = await getAllExpenses(day);
  dispatch({
    type: "GET_ALL_EXPENSES",
    payload: expenses,
  });
};

export const getAllMonthlyExpenseRedux = () => async (dispatch) => {
  const expenses = await getAllMonthlyExpense();
  dispatch({
    type: "GET_ALL_MONTHLY_EXPENSES",
    payload: expenses,
  });
};

export const getAllMonthlyCashSummaryRedux = () => async (dispatch) => {
  const months = await getAllMonthlyCashSummary();
  dispatch({
    type: "GET_ALL_MONTHLY_CASH_SUMMARY",
    payload: months,
  });
};

export const getAllMonthlyCashInRedux = () => async (dispatch) => {
  const expenses = await getAllMonthlyCashIn();
  dispatch({
    type: "GET_ALL_MONTHLY_CASH_INS",
    payload: expenses,
  });
};
export const getAllMonthlyRedux =
  (category, subCategory) => async (dispatch) => {
    const expenses = await getAllMonthly(category, subCategory);
    dispatch({
      type: "GET_ALL_MONTHLY",
      payload: expenses,
    });
  };

export const getAllMonthlySalaryRedux = () => async (dispatch) => {
  const expenses = await getAllMonthlySalary();
  dispatch({
    type: "GET_ALL_MONTHLY",
    payload: expenses,
  });
};

export const getSingleMonthlyExpenseRedux = (month) => async (dispatch) => {
  const expenses = await getSingleMonthlyExpense(month);
  dispatch({
    type: "GET_SINGLE_MONTHLY_EXPENSES",
    payload: expenses,
  });
};
export const getSingleMonthlyCashSummaryRedux = (month) => async (dispatch) => {
  const expenses = await getSingleMonthlyCashSummary(month);
  dispatch({
    type: "GET_SINGLE_MONTHLY_CASH_SUMMARY",
    payload: expenses,
  });
};

export const getSingleMonthlyCashInRedux = (month) => async (dispatch) => {
  const expenses = await getSingleMonthlyCashIn(month);
  dispatch({
    type: "GET_SINGLE_MONTHLY_CASH_INS",
    payload: expenses,
  });
};

export const getSingleMonthlyRedux =
  (month, category, subCategory) => async (dispatch) => {
    const expenses = await getSingleMonthly(month, category, subCategory);
    dispatch({
      type: "GET_SINGLE_MONTHLY",
      payload: expenses,
    });
  };
export const getSingleMonthlySalaryRedux =
  (month, category) => async (dispatch) => {
    const expenses = await getSingleMonthlySalary(month, category);
    dispatch({
      type: "GET_SINGLE_MONTHLY",
      payload: expenses,
    });
  };

export const getSingleMonthlyLoanCashInRedux =
  (month, category) => async (dispatch) => {
    const cashIns = await getSingleMonthlyLoanCashIn(month, category);
    dispatch({
      type: "GET_SINGLE_MONTHLY_LOANS_CASHIN",
      payload: cashIns,
    });
  };
export const getSingleMonthlyLoanCashOutRedux =
  (month, category) => async (dispatch) => {
    const expenses = await getSingleMonthlyLoanCashOut(month, category);
    dispatch({
      type: "GET_SINGLE_MONTHLY_LOANS_CASHOUT",
      payload: expenses,
    });
  };
export const clearSingleMonthRedux = () => async (dispatch) => {
  dispatch({
    type: "CLEAR_SINGLE_MONTHLY",
  });
};

export const getAllPendingExpenseByDayRedux = (day) => async (dispatch) => {
  const expenses = await getAllPendingExpensesByDay(day);
  dispatch({
    type: "GET_ALL_EXPENSES",
    payload: expenses,
  });
};
export const getAllPendingCashInByDayRedux = (day) => async (dispatch) => {
  const cashIns = await getAllPendingCashInByDay(day);
  dispatch({
    type: "GET_ALL_CASH_INS",
    payload: cashIns,
  });
};
export const getAllPendingExpensesRedux = () => async (dispatch) => {
  const expenses = await getAllPendingExpenses();
  dispatch({
    type: "GET_ALL_PENDING_EXPENSES",
    payload: expenses,
  });
};
export const getAllPendingCashInsRedux = () => async (dispatch) => {
  const cashIns = await getAllPendingCashIns();
  dispatch({
    type: "GET_ALL_PENDING_CASH_INS",
    payload: cashIns,
  });
};
export const getAllLoansCashOutsRedux = () => async (dispatch) => {
  const expenses = await getAllLoansCashOuts();
  dispatch({
    type: "GET_ALL_LOANS_CASH_OUTS",
    payload: expenses,
  });
};
export const getAllLoansCashInsRedux = () => async (dispatch) => {
  const cashIns = await getAllLoansCashIns();
  dispatch({
    type: "GET_ALL_LOANS_CASH_INS",
    payload: cashIns,
  });
};
export const getAllLoansCashOutCustomerRedux =
  (customer) => async (dispatch) => {
    const expenses = await getAllLoansCashOutCustomer(customer);
    dispatch({
      type: "GET_ALL_LOANS_CASH_OUTS_CUSTOMER",
      payload: expenses,
    });
  };
export const getSingleCustomerLoanRedux = (customer) => async (dispatch) => {
  const loan = await getSingleCustomerLoan(customer);
  dispatch({
    type: "GET_SINGLE_CUSTOMER_LOAN",
    payload: loan,
  });
};
export const getAllInstallmentsCashOutCustomerRedux =
  (customer) => async (dispatch) => {
    const expenses = await getAllInstallmentsCashOutCustomer(customer);
    dispatch({
      type: "GET_ALL_INSTALLMENTS_CASH_OUTS_CUSTOMER",
      payload: expenses,
    });
  };
export const getAllLoansCashInCustomerRedux =
  (customer) => async (dispatch) => {
    const cashIns = await getAllLoansCashInCustomer(customer);
    dispatch({
      type: "GET_ALL_LOANS_CASH_INS_CUSTOMER",
      payload: cashIns,
    });
  };

export const uploadExpenseRedux = (expenseObj) => async (dispatch) => {
  const uploadedExpenseObj = await uploadExpense(expenseObj);
  dispatch({
    type: "UPLOAD_EXPENSE",
    payload: uploadedExpenseObj,
  });
};

export const updateExpenseRedux = (expenseObj) => async (dispatch) => {
  const updatedExpenseObj = await updateExpense(expenseObj);
  dispatch({
    type: "UPDATE_EXPENSE",
    payload: updatedExpenseObj,
  });
};

export const deleteExpenseRedux = (expenseId) => async (dispatch) => {
  await deleteExpense(expenseId);
  dispatch({
    type: "DELETE_EXPENSE",
    payload: expenseId,
  });
};

export const approveExpenseRedux = (date) => async (dispatch) => {
  await approveExpense(date);

  dispatch({
    type: "APPROVE_EXPENSE",
    payload: date,
  });
};
export const deleteCashInRedux = (cashInId) => async (dispatch) => {
  await deleteCashIn(cashInId);
  dispatch({
    type: "DELETE_CASH_IN",
    payload: cashInId,
  });
};

export const updateEmployeeRedux = (employeeObj) => async (dispatch) => {
  const updatedEmployeeObj = await updateEmployee(employeeObj);
  dispatch({
    type: "UPDATE_EMPLOYEE",
    payload: updatedEmployeeObj,
  });
};
