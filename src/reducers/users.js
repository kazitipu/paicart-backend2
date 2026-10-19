const INITIAL_STATE = {
  users: [],
  payments: [],
  shipForMe: [],
  orders: [],
  productRequest: [],
  payments: [],
  currency: null,
};

const setUsersReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_USERS":
      return { ...state, users: [...action.payload] };
    case "GET_SINGLE_USER":
      return { ...state, users: [...state.users, action.payload] };
    case "GET_ALL_SHIP_FOR_ME_OF_SINGLE_USER":
      return { ...state, shipForMe: action.payload };
    case "GET_ALL_ORDER_OF_SINGLE_USER":
      return { ...state, orders: action.payload };
    case "GET_ALL_PRODUCT_REQUEST_OF_SINGLE_USER":
      return { ...state, productRequest: action.payload };
    case "GET_ALL_PAYMENT_OF_SINGLE_USER":
      return { ...state, payments: action.payload };
    case "UPDATE_USER_STATUS":
      return {
        ...state,
        users: state.users.map((user) => {
          if (user.uid == action.payload.uid) {
            return action.payload;
          } else {
            return user;
          }
        }),
      };
    case "GET_CURRENCY_REDUX":
      return { ...state, currency: action.payload };
    default:
      return { ...state };
  }
};
export default setUsersReducer;
