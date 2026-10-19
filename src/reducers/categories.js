const INITIAL_STATE = {
  categories: [],
  banners: [],
  homeCategories: [],
};

const categoriesReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "GET_ALL_CATEGORIES":
      return { ...state, categories: [...action.payload] };
    case "GET_ALL_HOMESCREEN_CATEGORIES":
      return { ...state, homeCategories: [...action.payload] };

    case "UPLOAD_CATEGORY":
      return {
        ...state,
        categories: [action.payload, ...state.categories],
      };
    case "UPDATE_CATEGORY":
      const filteredProductsArray = state.categories.filter(
        (category) => category.id !== action.payload.id
      );

      return {
        ...state,
        categories: [action.payload, ...filteredProductsArray],
      };
    case "DELETE_CATEGORY":
      const updatedProductsArray = state.categories.filter(
        (product) => product.id !== action.payload.id
      );
      let categoriesArray = updatedProductsArray.map((category) => {
        if (category.parentCategory == action.payload.id) {
          return { ...category, parentCategory: action.payload.parentId };
        } else {
          return category;
        }
      });
      return {
        ...state,
        categories: [...categoriesArray],
      };
    case "GET_ALL_BANNERS":
      return { ...state, banners: [...action.payload] };

    case "UPLOAD_BANNER":
      return {
        ...state,
        banners: [action.payload, ...state.banners],
      };
    case "UPDATE_BANNER":
      const filteredBannersArray = state.banners.map((banner) => {
        if (banner.id == action.payload.id) {
          return action.payload;
        } else {
          return banner;
        }
      });

      return {
        ...state,
        banners: filteredBannersArray,
      };
    case "DELETE_BANNER":
      const updatedBannersArray = state.banners.filter(
        (product) => product.id !== action.payload.id
      );

      return {
        ...state,
        banners: [...updatedBannersArray],
      };
    default:
      return { ...state };
  }
};
export default categoriesReducer;
