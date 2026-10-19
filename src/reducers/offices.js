const INITIAL_STATE = { offices: [], bookingOffices: [] };

const officesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_OFFICES":
      return { ...state, offices: [...action.payload] };
    case "UPLOAD_OFFICE":
      return {
        ...state,
        offices: [action.payload, ...state.offices],
      };
    case "UPDATE_OFFICE":
      const filteredOfficeArray = state.offices.filter(
        (office) => office.officeId !== action.payload.officeId
      );

      return {
        ...state,
        offices: [...filteredOfficeArray, action.payload],
      };
    case "DELETE_OFFICE":
      const updatedofficeArray = state.offices.filter(
        (office) => office.officeId !== action.payload
      );
      return {
        ...state,
        offices: [...updatedofficeArray],
      };
    case "GET_ALL_BOOKING_OFFICES":
      return { ...state, bookingOffices: [...action.payload] };
    case "UPLOAD_BOOKING_OFFICE":
      return {
        ...state,
        bookingOffices: [action.payload, ...state.bookingOffices],
      };
    case "UPDATE_BOOKING_OFFICE":
      const filteredOfficeArray2 = state.bookingOffices.filter(
        (office) => office.officeId !== action.payload.officeId
      );

      return {
        ...state,
        bookingOffices: [...filteredOfficeArray2, action.payload],
      };
    case "DELETE_BOOKING_OFFICE":
      const updatedofficeArray2 = state.bookingOffices.filter(
        (office) => office.officeId !== action.payload
      );
      return {
        ...state,
        bookingOffices: [...updatedofficeArray2],
      };
    default:
      return { ...state };
  }
};
export default officesReducer;
