const INITIAL_STATE = {
  siteDiscounts: [],
};

const siteDiscountsReducers = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_SITE_DISCOUNTS":
      return { ...state, siteDiscounts: [...action.payload] };

    case "UPLOAD_SITE_DISCOUNT":
      return {
        ...state,
        siteDiscounts: [action.payload],
      };
    case "UPDATE_SITE_DISCOUNT":
      const filteredDiscountsArray = state.siteDiscounts.filter(
        (discount) => discount.id !== action.payload.id
      );

      return {
        ...state,
        siteDiscounts: [action.payload, ...filteredDiscountsArray],
      };
    case "DELETE_SITE_DISCOUNT":
      const updatedDiscountsArray = state.siteDiscounts.filter(
        (discount) => discount.id !== action.payload
      );
      return {
        ...state,
        siteDiscounts: [...updatedDiscountsArray],
      };
    default:
      return { ...state };
  }
};
export default siteDiscountsReducers;
