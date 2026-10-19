const INITIAL_STATE = {
  coupons: [],
};

const couponsReducers = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_COUPONS":
      return { ...state, coupons: [...action.payload] };

    case "UPLOAD_COUPON":
      return {
        ...state,
        coupons: [action.payload, ...state.coupons],
      };
    case "UPDATE_COUPON":
      const filteredProductsArray = state.coupons.filter(
        (coupon) => coupon.id !== action.payload.id
      );

      return {
        ...state,
        coupons: [action.payload, ...filteredProductsArray],
      };
    case "DELETE_COUPON":
      const updatedProductsArray = state.coupons.filter(
        (product) => product.id !== action.payload
      );
      return {
        ...state,
        coupons: [...updatedProductsArray],
      };
    default:
      return { ...state };
  }
};
export default couponsReducers;
