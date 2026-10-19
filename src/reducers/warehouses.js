const INITIAL_STATE = {
  warehouses: [],
};

const warehouseReducers = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_WAREHOUSES":
      return { ...state, warehouses: [...action.payload] };

    case "UPLOAD_WAREHOUSE":
      return {
        ...state,
        warehouses: [action.payload, ...state.warehouses],
      };
    case "UPDATE_WAREHOUSE":
      const filteredProductsArray = state.warehouses.filter(
        (warehouse) => warehouse.id !== action.payload.id
      );

      return {
        ...state,
        warehouses: [action.payload, ...filteredProductsArray],
      };
    case "DELETE_WAREHOUSE":
      const updatedProductsArray = state.warehouses.filter(
        (warehouse) => warehouse.id !== action.payload
      );
      return {
        ...state,
        warehouses: [...updatedProductsArray],
      };
    default:
      return { ...state };
  }
};
export default warehouseReducers;
