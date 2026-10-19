const INITIAL_STATE = {
  orders: [],
  ordersApi: [],
  orderTracking: null,
  orderObj: null,
  cartons: [],
};

const setOrdersReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_ALL_ORDERS":
      return { ...state, orders: [...action.payload] };
    case "GET_ALL_ORDERS_API_OF_SINGLE_STATUS":
      return { ...state, ordersApi: action.payload };
    case "GET_ORDER_TRACKING_RESULT":
      return { ...state, orderTracking: action.payload };
    case "GET_SINGLE_ORDER_API":
      return { ...state, orderObj: action.payload };
    case "UPDATE_ORDER_API":
      return {
        ...state,
        ordersApi: state.ordersApi.map((order) => {
          if (order.orderId == action.payload.orderId) {
            return action.payload;
          } else {
            return order;
          }
        }),
      };
    case "UPDATE_ORDERS_FROM_1688":
      return {
        ...state,
        ordersApi: state.ordersApi.map((order) => {
          const update = action.payload.find(
            (o) => o.orderId === order.orderId
          );
          // The payload rows carry only the whitelisted diff that was just
          // written, so merging them straight on is safe. An order whose
          // status moved stays visible until the tab is reloaded - that is
          // deliberate, it shows the admin what the sync did.
          return update ? { ...order, ...update } : order;
        }),
      };
    case "UPDATE_MULTIPLE_ORDER_API":
      return {
        ...state,
        ordersApi: state.ordersApi.map((order) => {
          // Find if this order exists in the payload array
          const updatedOrder = action.payload.orders.find(
            (o) => o.orderId === order.orderId
          );

          // If found, merge the updated fields, otherwise keep the existing order
          return updatedOrder
            ? {
                ...updatedOrder,
                paymentLink1688: action.payload.paymentLink,
              }
            : order;
        }),
      };
    case "DELETE_ORDER_API":
      return {
        ...state,
        ordersApi: state.ordersApi.filter(
          (order) => order.orderId !== action.payload.orderId
        ),
      };
    default:
      return { ...state };
  }
};
export default setOrdersReducer;
