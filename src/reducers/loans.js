const INITIAL_STATE = {
  monthlyCashIns: [],
  monthlyCashOuts: [],
  allCashIns: [],
  allCashOuts: [],
  allCustomers: [],
  singleCustomerCashIns: [],
  singleCustomerCashOuts: [],
};

const loansReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_LOANS_CASH_OUTS":
      return { ...state, allCashOuts: [...action.payload] };
    case "GET_ALL_LOANS_CASH_OUTS_CUSTOMER":
      return { ...state, singleCustomerCashOuts: [...action.payload] };
    case "GET_ALL_LOANS_CASH_INS":
      return { ...state, allCashIns: [...action.payload] };
    case "GET_ALL_LOANS_CASH_INS_CUSTOMER":
      return { ...state, singleCustomerCashIns: [...action.payload] };
    case "GET_ALL_CUSTOMERS":
      return { ...state, allCustomers: [...action.payload] };
    case "GET_SINGLE_MONTHLY_LOANS_CASHIN":
      return { ...state, monthlyCashIns: [...action.payload] };
    case "GET_SINGLE_MONTHLY_LOANS_CASHOUT":
      return { ...state, monthlyCashOuts: [...action.payload] };

    default:
      return { ...state };
  }
};
export default loansReducer;
