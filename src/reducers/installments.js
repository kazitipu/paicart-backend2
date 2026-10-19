const INITIAL_STATE = {
  allCustomers: [],
  singleCustomerCashOuts: [],
  loan: null,
};

const installmentsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_INSTALLMENTS_CASH_OUTS_CUSTOMER":
      return { ...state, singleCustomerCashOuts: [...action.payload] };

    case "GET_ALL_CUSTOMERS_INSTALLMENT":
      return { ...state, allCustomers: [...action.payload] };

    case "GET_SINGLE_CUSTOMER_LOAN":
      return { ...state, loan: action.payload };

    default:
      return { ...state };
  }
};
export default installmentsReducer;
