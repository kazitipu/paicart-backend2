const INITIAL_STATE = {
  productRequests: [],
  productRequestObj: null,
  shipmentRequests: [],
  shipForMeObj: null,
};

const setProductRequestsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_PRODUCT_REQUESTS":
      return { ...state, productRequests: [...action.payload] };
    case "SET_PRODUCT_REQUEST":
      return {
        ...state,
        productRequests: [action.payload, ...state.productRequests],
      };
    case "GET_SINGLE_PRODUCT_REQUEST":
      return { ...state, productRequestObj: action.payload };
    case "DELETE_PRODUCT_REQUEST":
      return {
        ...state,
        productRequests: state.productRequests.filter(
          (booking) => booking.bookingId !== action.payload.bookingId
        ),
      };
    case "GET_ALL_SHIPMENT_REQUESTS":
      return { ...state, shipmentRequests: [...action.payload] };
    case "SET_SHIP_FOR_ME":
      return {
        ...state,
        shipmentRequests: [action.payload, ...state.shipmentRequests],
      };
    case "GET_SINGLE_BOOKING":
      return { ...state, bookingObj: action.payload };
    case "GET_SINGLE_SHIP_FOR_ME":
      return { ...state, shipForMeObj: action.payload };
    // case "UPLOAD_LOT":
    //   return { ...state, lots: [...state.lots, action.payload] };
    case "UPDATE_MULTIPLE_PRODUCT_REQUESTS": {
      // Merge, don't replace: the payload carries only the fields the batch
      // write touched, and replacing would drop anything it didn't round-trip.
      const updatedById = new Map(
        (action.payload || []).map((request) => [request.bookingId, request])
      );
      return {
        ...state,
        productRequests: state.productRequests.map((booking) =>
          updatedById.has(booking.bookingId)
            ? { ...booking, ...updatedById.get(booking.bookingId) }
            : booking
        ),
      };
    }
    case "UPDATE_PRODUCT_REQUEST":
      const filteredBooking = state.productRequests.map((booking) => {
        if (booking.bookingId === action.payload.bookingId) {
          return action.payload;
        } else {
          return booking;
        }
      });

      return { ...state, productRequests: [...filteredBooking] };
    case "UPDATE_SHIPMENT_REQUEST":
      const filteredBooking2 = state.shipmentRequests.map((booking) => {
        if (booking.bookingId === action.payload.bookingId) {
          return action.payload;
        } else {
          return booking;
        }
      });

      return { ...state, shipmentRequests: [...filteredBooking2] };
    case "DELETE_SHIPMENT_REQUEST":
      const filteredBooking3 = state.shipmentRequests.filter(
        (booking) => booking.bookingId !== action.payload.bookingId
      );

      return { ...state, shipmentRequests: filteredBooking3 };
    default:
      return { ...state };
  }
};
export default setProductRequestsReducer;
