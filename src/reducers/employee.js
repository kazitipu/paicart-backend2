const INITIAL_STATE = { employees: [], transactions: [] };

const employeesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_EMPLOYEES":
      return { ...state, employees: [...action.payload] };
    case "UPLOAD_EMPLOYEE":
      return {
        ...state,
        employees: [action.payload, ...state.employees],
      };
    case "GET_ALL_TRANSACTIONS":
      return { ...state, transactions: [...action.payload] };
    case "UPLOAD_TRANSACTION":
      return {
        ...state,
        transactions: [action.payload, ...state.transactions],
      };
    case "UPDATE_EMPLOYEE":
      const filteredEmployeeArray = state.employees.filter(
        (employee) => employee.employeeId !== action.payload.employeeId
      );

      return {
        ...state,
        employees: [action.payload, ...filteredEmployeeArray],
      };
    case "DELETE_EMPLOYEE":
      const updatedEmployeeArray = state.employees.filter(
        (employee) => employee.employeeId !== action.payload
      );
      return {
        ...state,
        employees: [...updatedEmployeeArray],
      };
    default:
      return { ...state };
  }
};
export default employeesReducer;
