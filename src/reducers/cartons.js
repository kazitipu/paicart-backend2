const INITIAL_STATE = { cartons: [] };

const cartonsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_CARTONS":
      return { ...state, cartons: [...action.payload] };
    case "UPLOAD_CARTON":
      return {
        ...state,
        cartons: [action.payload, ...state.cartons],
      };

    case "UPDATE_CARTON":
      const filteredCartonArray = state.cartons.filter(
        (carton) => carton.cartonId !== action.payload.cartonId
      );

      return {
        ...state,
        cartons: [...filteredCartonArray, action.payload],
      };

    case "DELETE_CARTON":
      const updatedCartonArray = state.cartons.filter(
        (carton) => carton.cartonId !== action.payload
      );
      return {
        ...state,
        cartons: [...updatedCartonArray],
      };
    default:
      return { ...state };
  }
};
export default cartonsReducer;
