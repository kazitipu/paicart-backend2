const INITIAL_STATE = { d2dRates: [], rates1688: [], categories1688: [] };

const setD2DRatesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_D2D_RATES":
      return { ...state, d2dRates: [...action.payload] };
    case "GET_ALL_1688_RATES":
      return { ...state, rates1688: [...action.payload] };
    case "UPLOAD_D2D_RATES":
      let newD2dRates = [action.payload, ...state.d2dRates];
      if (
        state.d2dRates.findIndex((value) => value.id == action.payload.id) > -1
      ) {
        newD2dRates = state.d2dRates.map((rate) => {
          if (rate.id == action.payload.id) {
            return action.payload;
          } else {
            return rate;
          }
        });
      }
      return {
        ...state,
        d2dRates: newD2dRates,
      };
    case "UPDATE_D2D_RATES":
      const filteredD2DRatesArray = state.d2dRates.filter(
        (productType) => productType.id !== action.payload.id
      );

      return {
        ...state,
        d2dRates: [action.payload, ...filteredD2DRatesArray],
      };
    case "GET_ALL_1688_CATEGORIES":
      return { ...state, categories1688: [...action.payload] };

    // A price change cascades in Firestore; mirror the same move locally so the
    // explorer updates without refetching ten thousand documents.
    case "SET_1688_CATEGORY_RATES": {
      const { categoryId, rates, updatedIds, keys } = action.payload;
      const followers = new Set(updatedIds.map(String));

      return {
        ...state,
        categories1688: state.categories1688.map((category) => {
          const id = String(category.categoryId);
          if (id === String(categoryId)) {
            return {
              ...category,
              ...rates,
              [keys.own]: rates,
              [keys.source]: "own",
              [keys.from]: null,
            };
          }
          if (followers.has(id)) {
            return {
              ...category,
              ...rates,
              [keys.source]: "inherited",
              [keys.from]: Number(categoryId),
            };
          }
          return category;
        }),
      };
    }

    case "CLEAR_1688_CATEGORY_RATES": {
      const { categoryId, rates, updatedIds, keys, source, inheritedFrom } =
        action.payload;
      const followers = new Set(updatedIds.map(String));

      return {
        ...state,
        categories1688: state.categories1688.map((category) => {
          const id = String(category.categoryId);
          if (id !== String(categoryId) && !followers.has(id)) return category;

          const next = {
            ...category,
            ...rates,
            [keys.source]: source,
            [keys.from]: inheritedFrom,
          };
          if (id === String(categoryId)) delete next[keys.own];
          return next;
        }),
      };
    }

    case "UPDATE_1688_RATES":
      const filtered1688RatesArray = state.rates1688.filter(
        (productType) => productType.categoryId !== action.payload.id
      );

      return {
        ...state,
        rates1688: [action.payload, ...filtered1688RatesArray],
      };
    case "DELETE_D2D_RATES":
      const updatedD2DRatesArray = state.d2dRates.filter(
        (productType) => productType.id !== action.payload.id
      );
      return {
        ...state,
        d2dRates: [...updatedD2DRatesArray],
      };
    default:
      return { ...state };
  }
};
export default setD2DRatesReducer;
