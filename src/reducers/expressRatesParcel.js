const INITIAL_STATE = { expressRatesParcel: [] };

const setExpressRatesParcelReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_EXPRESS_RATES_PARCEL":
      return { ...state, expressRatesParcel: [...action.payload] };
    case "UPLOAD_EXPRESS_RATES_PARCEL":
      return {
        ...state,
        expressRatesParcel: [...state.expressRatesParcel, action.payload],
      };
    case "UPDATE_EXPRESS_RATES_PARCEL":
      const filteredExpressRatesParcelArray = state.expressRatesParcel.filter(
        (country) => country.country !== action.payload.country
      );

      return {
        ...state,
        expressRatesParcel: [
          ...filteredExpressRatesParcelArray,
          action.payload,
        ],
      };
    case "DELETE_EXPRESS_RATES_PARCEL":
      const updatedExpressRatesParcelArray = state.expressRatesParcel.filter(
        (country) => country.country !== action.payload
      );
      return {
        ...state,
        expressRatesParcel: [...updatedExpressRatesParcelArray],
      };
    default:
      return { ...state };
  }
};
export default setExpressRatesParcelReducer;
