const INITIAL_STATE = { admins: [], months: [] };

const setAdminsReducer = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case "SET_ALL_ADMINS":
      return { ...state, admins: [...action.payload] };
    case "RECHARGE_ADMIN":
      const rechargedAdminArray = [];
      action.payload.adminIdArray.forEach((adminId) => {
        var admin = state.admins.find((admin) => admin.adminId === adminId);
        admin.balance =
          parseInt(admin.balance) + parseInt(action.payload.balance);
        rechargedAdminArray.push(admin);
      });

      return {
        ...state,
        admins: [
          ...state.admins.filter(
            (admin) => !action.payload.adminIdArray.includes(admin.adminId)
          ),
          ...rechargedAdminArray,
        ],
      };
    case "SET_CURRENT_ADMIN":
      return { ...state, currentAdmin: action.payload };
    case "UPDATE_ADMIN_STATUS":
      const updatedAdminsArray = state.admins.map((admin) => {
        if (admin.adminId === action.payload.adminId) {
          return action.payload;
        } else {
          return admin;
        }
      });
      return { ...state, admins: updatedAdminsArray };

    case "UPDATE_PROFILE_IMAGE":
      return { ...state, image: action.payload };
    case "GET_ALL_MONTHS":
      return { ...state, months: [...action.payload] };
    default:
      return { ...state };
  }
};
export default setAdminsReducer;
