const INITIAL_STATE = { expressRatesDocuments: [] };

const setExpressRatesDocumentsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_DOCUMENT_EXPRESS_RATES":
      return { ...state, expressRatesDocuments: [...action.payload] };
    case "UPLOAD_EXPRESS_RATES_DOCUMENTS":
      return {
        ...state,
        expressRatesDocuments: [...state.expressRatesDocuments, action.payload],
      };
    case "UPDATE_EXPRESS_RATES_DOCUMENTS":
      const filteredExpressRatesDocumentsArray = state.expressRatesDocuments.filter(
        (country) => country.country !== action.payload.country
      );

      return {
        ...state,
        expressRatesDocuments: [
          ...filteredExpressRatesDocumentsArray,
          action.payload,
        ],
      };
    case "DELETE_EXPRESS_RATES_DOCUMENTS":
      const updatedExpressRatesDocumentsArray = state.expressRatesDocuments.filter(
        (country) => country.country !== action.payload
      );
      return {
        ...state,
        expressRatesDocuments: [...updatedExpressRatesDocumentsArray],
      };
    default:
      return { ...state };
  }
};
export default setExpressRatesDocumentsReducer;
