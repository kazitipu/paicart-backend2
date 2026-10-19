const INITIAL_STATE = { products: [], intro: [] };

const setProductsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_ALL_PRODUCTS":
      return { ...state, products: [...action.payload] };
    case "UPDATE_PRODUCT":
      const updatedProductsArray = state.products.map((product) => {
        if (product.id == action.payload.id) {
          return action.payload;
        } else {
          return product;
        }
      });
      return { ...state, products: [...updatedProductsArray] };
    case "DELETE_PRODUCT":
      const filteredProductsArray = state.products.filter(
        (product) => product.id !== action.payload
      );
      return { ...state, products: [...filteredProductsArray] };
    case "GET_ALL_INTROS":
      return { ...state, intro: [...action.payload] };

    case "CREATE_INTRO":
      return { ...state, intro: [action.payload, ...state.intro] };
    default:
      return { ...state };
  }
};
export default setProductsReducer;
