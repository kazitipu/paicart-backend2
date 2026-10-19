const INITIAL_STATE = {
  expenses: [],
  pendingExpenses: [],
  monthlyExpenses: [],
  monthlyCashSummary: [],
  singleMonthExpense: [],
  singleMonthCashSummary: [],
  monthly: [],
  singleMonth: [],
  todaysCash: null,
  funds: [],
};

const expensesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_EXPENSES":
      return { ...state, expenses: [...action.payload] };
    case "GET_ALL_FUNDS":
      return { ...state, funds: [...action.payload] };

    case "GET_ALL_PENDING_EXPENSES":
      return { ...state, pendingExpenses: [...action.payload] };
    case "GET_ALL_MONTHLY_EXPENSES":
      return { ...state, monthlyExpenses: [...action.payload] };
    case "GET_ALL_MONTHLY_CASH_SUMMARY":
      return { ...state, monthlyCashSummary: [...action.payload] };
    case "GET_SINGLE_MONTHLY_EXPENSES":
      return { ...state, singleMonthExpense: [...action.payload] };
    case "GET_SINGLE_MONTHLY_CASH_SUMMARY":
      return { ...state, singleMonthCashSummary: [...action.payload] };
    case "GET_SINGLE_CASH_SUMMARY":
      return { ...state, todaysCash: action.payload };
    case "GET_ALL_MONTHLY":
      return { ...state, monthly: [...action.payload] };

    case "UPDATE_SALARY":
      const newMonthly = state.monthly.map((month) => {
        if (month.id == action.payload.id) {
          return action.payload;
        } else {
          return month;
        }
      });
      return { ...state, monthly: newMonthly };
    case "GET_SINGLE_MONTHLY":
      return { ...state, singleMonth: [...action.payload] };
    case "CLEAR_SINGLE_MONTHLY":
      return { ...state, singleMonth: [] };
    case "UPLOAD_EXPENSE":
      return {
        ...state,
        expenses: [...state.expenses, action.payload],
      };
    case "UPDATE_EXPENSE":
      const filteredExpenseArray = state.expenses.filter(
        (expense) => expense.id !== action.payload.id
      );

      return {
        ...state,
        expenses: [...filteredExpenseArray, action.payload],
      };
    case "DELETE_EXPENSE":
      const updatedExpenseArray = state.expenses.filter(
        (expense) => expense.id !== action.payload
      );
      return {
        ...state,
        expenses: [...updatedExpenseArray],
      };
    default:
      return { ...state };
  }
};
export default expensesReducer;
