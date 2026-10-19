const INITIAL_STATE = {
  partials: [],
};

const partialsReducers = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_PARTIALS":
      return { ...state, partials: [...action.payload] };

    case "UPLOAD_PARTIAL":
      return {
        ...state,
        partials: [action.payload],
      };
    case "UPDATE_PARTIAL":
      const filteredProductsArray = state.partials.filter(
        (partial) => partial.id !== action.payload.id
      );

      return {
        ...state,
        partials: [action.payload, ...filteredProductsArray],
      };
    case "DELETE_PARTIAL":
      const updatedProductsArray = state.partials.filter(
        (product) => product.id !== action.payload
      );
      return {
        ...state,
        partials: [...updatedProductsArray],
      };
    default:
      return { ...state };
  }
};
export default partialsReducers;
