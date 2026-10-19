const INITIAL_STATE = {
  cnfs: [],
  cnfMonths: [],
  cnfBills: [],
  cnfExpenses: [],
  cnfBillsAllMonths: [],
  cnfExpensesAllMonths: [],
};

const cnfsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_CNFS":
      return { ...state, cnfs: [...action.payload] };
    case "GET_ALL_CNF_BILLS":
      return { ...state, cnfBills: [...action.payload] };
    case "GET_ALL_CNF_EXPENSES":
      return { ...state, cnfExpenses: [...action.payload] };
    case "GET_ALL_CNF_BILLS_ALL_MONTHS":
      return { ...state, cnfBillsAllMonths: [...action.payload] };
    case "GET_ALL_CNF_EXPENSES_ALL_MONTHS":
      return { ...state, cnfExpensesAllMonths: [...action.payload] };
    case "ALL_MONTHS_CNF_BILL":
      return { ...state, cnfMonths: [...action.payload] };
    case "UPLOAD_CNF":
      return {
        ...state,
        cnfs: [action.payload, ...state.cnfs],
      };
    case "UPLOAD_CNF_BILL":
      return {
        ...state,
        cnfBills: [action.payload, ...state.cnfBills],
      };
    case "UPDATE_CNF":
      const filteredCnfArray = state.cnfs.filter(
        (cnf) => cnf.cnfId !== action.payload.cnfId
      );

      return {
        ...state,
        cnfs: [...filteredCnfArray, action.payload],
      };
    case "DELETE_CNF":
      const updatedcnfArray = state.cnfs.filter(
        (cnf) => cnf.cnfId !== action.payload
      );
      return {
        ...state,
        cnfs: [...updatedcnfArray],
      };
    default:
      return { ...state };
  }
};
export default cnfsReducer;
