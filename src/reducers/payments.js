const INITIAL_STATE = {
  payments: [],
  paymentRequestArray: [],
  approvedPaymentRequestArray: [],
  paymentRequestOrderArray: [],
  approvedPaymentRequestOrderArray: [],
  quickRefundRequest: [],
  approvedQuickRefundRequest: [],
  afterSale: [],
  approvedAfterSale: [],
};

const setPaymentsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_ALL_PAYMENTS":
      return { ...state, payments: [...action.payload] };
    case "GET_ALL_PAYMENT_REQUEST":
      return { ...state, paymentRequestArray: [...action.payload] };
    case "GET_APPROVED_PAYMENT_REQUEST":
      return { ...state, approvedPaymentRequestArray: [...action.payload] };
    case "GET_ALL_PAYMENT_REQUEST_ORDER":
      return { ...state, paymentRequestOrderArray: [...action.payload] };
    case "GET_APPROVED_PAYMENT_REQUEST_ORDER":
      return {
        ...state,
        approvedPaymentRequestOrderArray: [...action.payload],
      };
    case "GET_ALL_QUICK_REFUND_REQUEST":
      return { ...state, quickRefundRequest: [...action.payload] };
    case "GET_APPROVED_QUICK_REFUND_REQUEST":
      return { ...state, approvedQuickRefundRequest: [...action.payload] };
    case "GET_ALL_AFTER_SALE":
      return { ...state, afterSale: [...action.payload] };
    case "GET_APPROVED_AFTER_SALE":
      return { ...state, approvedAfterSale: [...action.payload] };
    case "UPDATE_PAYMENT_REQUEST_STATUS":
      const newRequestArray = state.paymentRequestArray.map(
        (paymentRequest) => {
          if (paymentRequest.paymentId == action.payload.paymentId) {
            return action.payload;
          } else {
            return paymentRequest;
          }
        }
      );
      return { ...state, paymentRequestArray: [...newRequestArray] };
    case "UPDATE_PAYMENT_REQUEST_ORDER_STATUS":
      const newRequestArray1 = state.paymentRequestOrderArray.map(
        (paymentRequest) => {
          if (paymentRequest.paymentId == action.payload.paymentId) {
            return action.payload;
          } else {
            return paymentRequest;
          }
        }
      );
      return { ...state, paymentRequestOrderArray: [...newRequestArray1] };
    case "UPDATE_REFUND_REQUEST_ORDER_STATUS":
      const refundRequestArray = state.quickRefundRequest.map(
        (refundRequest) => {
          if (refundRequest.refundId == action.payload.refundId) {
            return action.payload;
          } else {
            return refundRequest;
          }
        }
      );
      return { ...state, quickRefundRequest: [...refundRequestArray] };
    case "UPDATE_AFTER_SALE_STATUS":
      const refundRequestArray2 = state.afterSale.map((refundRequest) => {
        if (refundRequest.refundId == action.payload.refundId) {
          return action.payload;
        } else {
          return refundRequest;
        }
      });
      return { ...state, afterSale: [...refundRequestArray2] };
    default:
      return { ...state };
  }
};
export default setPaymentsReducer;
