const INITIAL_STATE = {
  cashIns: [],
  pendingCashIns: [],
  monthlyCashIns: [],
  singleMonthCashIn: [],
  monthly: [],
  singleMonth: [],
};

const cashInReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_CASH_INS":
      return { ...state, cashIns: [...action.payload] };

    case "GET_ALL_PENDING_CASH_INS":
      return { ...state, pendingCashIns: [...action.payload] };
    case "GET_ALL_MONTHLY_CASH_INS":
      return { ...state, monthlyCashIns: [...action.payload] };
    case "GET_SINGLE_MONTHLY_CASH_INS":
      return { ...state, singleMonthCashIn: [...action.payload] };
    case "GET_ALL_MONTHLY":
      return { ...state, monthly: [...action.payload] };

    case "GET_SINGLE_MONTHLY":
      return { ...state, singleMonth: [...action.payload] };
    case "CLEAR_SINGLE_MONTHLY":
      return { ...state, singleMonth: [] };
    case "UPLOAD_CASH_IN":
      return {
        ...state,
        cashIns: [...state.cashIns, action.payload],
      };
    case "UPDATE_CASH_IN":
      const filteredCashInsArray = state.cashIns.filter(
        (cashIn) => cashIn.id !== action.payload.id
      );

      return {
        ...state,
        cashIns: [...filteredCashInsArray, action.payload],
      };
    case "DELETE_CASH_IN":
      const updatedCashInsArray = state.cashIns.filter(
        (cashIn) => cashIn.id !== action.payload
      );
      return {
        ...state,
        cashIns: [...updatedCashInsArray],
      };
    default:
      return { ...state };
  }
};
export default cashInReducer;
