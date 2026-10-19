const INITIAL_STATE = {
  sourcings: [],
  sourcingRequests: [],
  sourcingObj: null,
};

const sourcingsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_SOURCINGS":
      return { ...state, sourcings: [...action.payload] };
    case "GET_SINGLE_SOURCING":
      let sourcings = [];
      if (state.sourcings.length == 0) {
        sourcings.push(action.payload);
      } else {
        sourcings = state.sourcings.map((sourcing) => {
          if (sourcing.id == action.payload.id) {
            return action.payload;
          } else {
            return sourcing;
          }
        });
      }
      return { ...state, sourcings: sourcings };

    case "UPLOAD_SOURCING":
      return {
        ...state,
        sourcings: [...state.sourcings, action.payload],
      };
    case "UPDATE_SOURCING":
      const filteredSourcingsArray = state.sourcings.filter(
        (sourcing) => sourcing.id !== action.payload.id
      );

      return {
        ...state,
        sourcings: [...filteredSourcingsArray, action.payload],
      };
    case "DELETE_SOURCING":
      const updatedSourcingsArray = state.sourcings.filter(
        (sourcing) => sourcing.id !== action.payload
      );
      return {
        ...state,
        sourcings: [...updatedSourcingsArray],
      };
    case "GET_ALL_SOURCING_REQUEST":
      return { ...state, sourcingRequests: [...action.payload] };

    case "UPDATE_SOURCING_REQUEST":
      const filteredSourcingRequestsArray = state.sourcingRequests.filter(
        (sourcing) => sourcing.id !== action.payload.id
      );

      return {
        ...state,
        sourcingRequests: [...filteredSourcingRequestsArray, action.payload],
      };
    case "DELETE_SOURCING_REQUEST":
      const updatedSourcingRequestsArray = state.sourcingRequests.filter(
        (sourcing) => sourcing.id !== action.payload
      );
      return {
        ...state,
        sourcingRequests: [...updatedSourcingRequestsArray],
      };
    default:
      return { ...state };
  }
};
export default sourcingsReducer;
