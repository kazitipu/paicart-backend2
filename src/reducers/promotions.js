const INITIAL_STATE = { promotions: [] };

const promotionsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_PROMOTIONS":
      return { ...state, promotions: [...action.payload] };
    case "UPLOAD_PROMOTION":
      return {
        ...state,
        promotions: [action.payload, ...state.promotions],
      };
    case "UPDATE_PROMOTION":
      const filteredOfficeArray = state.promotions.filter(
        (office) => office.officeId !== action.payload.officeId
      );

      return {
        ...state,
        promotions: [...filteredOfficeArray, action.payload],
      };
    case "DELETE_PROMOTION":
      const updatedofficeArray = state.promotions.filter(
        (office) => office.officeId !== action.payload
      );
      return {
        ...state,
        promotions: [...updatedofficeArray],
      };

    default:
      return { ...state };
  }
};
export default promotionsReducer;
